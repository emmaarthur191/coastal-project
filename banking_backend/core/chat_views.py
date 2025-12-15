"""
REST API views for Simple Chat functionality.
Handles room creation, listing, and message history.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404

from .models import ChatRoom, ChatMessage


# =============================================================================
# Serializers
# =============================================================================

class UserMiniSerializer(serializers.Serializer):
    """Minimal user info for chat."""
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    
    class Meta:
        fields = ['id', 'email', 'first_name', 'last_name']


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'sender_name', 'created_at']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.email


class ChatRoomSerializer(serializers.ModelSerializer):
    members = UserMiniSerializer(many=True, read_only=True)
    display_name = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'is_group', 'members', 'display_name', 
                  'last_message', 'unread_count', 'created_at', 'updated_at']

    def get_display_name(self, obj):
        request = self.context.get('request')
        if request:
            return obj.get_display_name(for_user=request.user)
        return obj.get_display_name()

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {
                'content': last.content[:50],
                'sender_name': f"{last.sender.first_name}".strip() or 'User',
                'timestamp': last.created_at.isoformat(),
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class CreateRoomSerializer(serializers.Serializer):
    """Serializer for creating a new chat room."""
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of user IDs to add to room"
    )
    name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    is_group = serializers.BooleanField(default=False)


# =============================================================================
# Views
# =============================================================================

class ChatRoomListView(generics.ListAPIView):
    """
    GET /api/chat/rooms/
    List all chat rooms for authenticated user.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(
            members=self.request.user
        ).annotate(
            last_activity=Max('messages__created_at')
        ).order_by('-last_activity', '-updated_at')


class ChatRoomCreateView(APIView):
    """
    POST /api/chat/rooms/
    Create a new chat room (direct or group).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member_ids = serializer.validated_data['member_ids']
        name = serializer.validated_data.get('name', '')
        is_group = serializer.validated_data.get('is_group', False)

        # Import User model
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Validate members exist
        members = User.objects.filter(id__in=member_ids)
        if members.count() != len(member_ids):
            return Response(
                {'error': 'One or more users not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # For direct messages (non-group), check if room already exists
        if not is_group and len(member_ids) == 1:
            other_user = members.first()
            existing = ChatRoom.objects.filter(
                is_group=False,
                members=request.user
            ).filter(
                members=other_user
            ).first()

            if existing:
                return Response(
                    ChatRoomSerializer(existing, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )

        # Create room
        room = ChatRoom.objects.create(
            name=name if is_group else None,
            is_group=is_group,
            created_by=request.user
        )

        # Add members including creator
        room.members.add(request.user)
        room.members.add(*members)

        return Response(
            ChatRoomSerializer(room, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ChatRoomDetailView(generics.RetrieveAPIView):
    """
    GET /api/chat/rooms/<id>/
    Get details of a specific chat room.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(members=self.request.user)


class ChatMessageListView(generics.ListAPIView):
    """
    GET /api/chat/rooms/<room_id>/messages/
    Get message history for a room.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        room = get_object_or_404(
            ChatRoom.objects.filter(members=self.request.user),
            id=room_id
        )
        return room.messages.select_related('sender').order_by('-created_at')[:100]


class ChatMessageCreateView(APIView):
    """
    POST /api/chat/rooms/<room_id>/messages/
    Send a message via REST (fallback for WebSocket issues).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(
            ChatRoom.objects.filter(members=request.user),
            id=room_id
        )

        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = ChatMessage.objects.create(
            room=room,
            sender=request.user,
            content=content
        )

        # Update room timestamp
        room.save()

        return Response(
            ChatMessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )


class MarkMessagesReadView(APIView):
    """
    POST /api/chat/rooms/<room_id>/read/
    Mark all messages in room as read for current user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(
            ChatRoom.objects.filter(members=request.user),
            id=room_id
        )

        updated = room.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(is_read=True)

        return Response({'marked_read': updated})
