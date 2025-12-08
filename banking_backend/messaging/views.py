from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from PIL import Image
from .models import MessageThread, Message, EncryptionKey, CallLog, MessageReaction, Device, MessageReadStatus, SyncCheckpoint, MessageBackup
from .serializers import (
    MessagingMessageThreadSerializer, MessagingMessageSerializer, EncryptionKeySerializer,
    CreateMessageThreadSerializer, CallLogSerializer, CreateCallLogSerializer,
    UserSerializer, MessageReactionSerializer, DeviceSerializer, MessageReadStatusSerializer,
    SyncCheckpointSerializer, MessageBackupSerializer
)

User = get_user_model()

class MessageThreadViewSet(viewsets.ModelViewSet):
    serializer_class = MessagingMessageThreadSerializer
    permission_classes = [IsAuthenticated]
    queryset = MessageThread.objects.all()

    def get_queryset(self):
        return MessageThread.objects.filter(
            participants=self.request.user,
            is_active=True
        ).prefetch_related('participants', 'messages', 'admins')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateMessageThreadSerializer
        return MessagingMessageThreadSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        thread = self.get_object()
        messages = thread.messages.all()
        serializer = MessagingMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        """Add a participant to a group chat"""
        thread = self.get_object()

        # Check permissions
        if not thread.can_user_manage(request.user):
            return Response({'error': 'You do not have permission to manage this group'}, status=403)

        if not thread.is_group():
            return Response({'error': 'Cannot add participants to direct messages'}, status=400)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Check if user is already a participant
        if thread.participants.filter(id=user_id).exists():
            return Response({'error': 'User is already a participant'}, status=400)

        # Add participant
        thread.add_participant(user, request.user)

        return Response({'message': 'Participant added successfully'})

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove a participant from a group chat"""
        thread = self.get_object()

        # Check permissions
        if not thread.can_user_manage(request.user):
            return Response({'error': 'You do not have permission to manage this group'}, status=403)

        if not thread.is_group():
            return Response({'error': 'Cannot remove participants from direct messages'}, status=400)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Cannot remove the group creator
        if user == thread.created_by:
            return Response({'error': 'Cannot remove the group creator'}, status=400)

        # Remove participant
        thread.remove_participant(user, request.user)

        return Response({'message': 'Participant removed successfully'})

    @action(detail=True, methods=['post'])
    def promote_admin(self, request, pk=None):
        """Promote a participant to admin"""
        thread = self.get_object()

        # Only creator can promote admins
        if request.user != thread.created_by:
            return Response({'error': 'Only the group creator can promote admins'}, status=403)

        if not thread.is_group():
            return Response({'error': 'Cannot manage admins in direct messages'}, status=400)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Check if user is a participant
        if not thread.participants.filter(id=user_id).exists():
            return Response({'error': 'User is not a participant'}, status=400)

        # Add to admins
        thread.admins.add(user)

        return Response({'message': 'User promoted to admin successfully'})

    @action(detail=True, methods=['post'])
    def demote_admin(self, request, pk=None):
        """Demote an admin to regular participant"""
        thread = self.get_object()

        # Only creator can demote admins
        if request.user != thread.created_by:
            return Response({'error': 'Only the group creator can demote admins'}, status=403)

        if not thread.is_group():
            return Response({'error': 'Cannot manage admins in direct messages'}, status=400)

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Remove from admins
        thread.admins.remove(user)

        return Response({'message': 'Admin demoted successfully'})

    @action(detail=True, methods=['patch'])
    def update_group(self, request, pk=None):
        """Update group information (name, description)"""
        thread = self.get_object()

        # Check permissions
        if not thread.can_user_manage(request.user):
            return Response({'error': 'You do not have permission to manage this group'}, status=403)

        if not thread.is_group():
            return Response({'error': 'Cannot update direct messages'}, status=400)

        # Only allow updating subject and description
        allowed_fields = ['subject', 'description']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if not update_data:
            return Response({'error': 'No valid fields to update'}, status=400)

        for field, value in update_data.items():
            setattr(thread, field, value)
        thread.save()

        serializer = self.get_serializer(thread)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessagingMessageSerializer
    permission_classes = [IsAuthenticated]
    queryset = Message.objects.all()

    def get_queryset(self):
        return Message.objects.filter(
            thread__participants=self.request.user
        ).select_related('sender', 'thread', 'reply_to', 'forwarded_from').prefetch_related('reactions')

    def perform_create(self, serializer):
        thread_id = self.request.data.get('thread')
        thread = get_object_or_404(MessageThread, id=thread_id, participants=self.request.user)
        serializer.save(sender=self.request.user, thread=thread)

    @action(detail=True, methods=['post'])
    def add_reaction(self, request, pk=None):
        """Add a reaction to a message"""
        message = self.get_object()
        emoji = request.data.get('emoji')

        if not emoji:
            return Response({'error': 'emoji is required'}, status=400)

        # Check if user already reacted with this emoji
        existing_reaction = MessageReaction.objects.filter(
            message=message,
            user=request.user,
            emoji=emoji
        ).first()

        if existing_reaction:
            return Response({'error': 'You have already reacted with this emoji'}, status=400)

        # Create the reaction
        reaction = MessageReaction.objects.create(
            message=message,
            user=request.user,
            emoji=emoji
        )

        serializer = MessageReactionSerializer(reaction)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_reaction(self, request, pk=None):
        """Remove a reaction from a message"""
        message = self.get_object()
        emoji = request.data.get('emoji')

        if not emoji:
            return Response({'error': 'emoji is required'}, status=400)

        # Find and delete the reaction
        reaction = MessageReaction.objects.filter(
            message=message,
            user=request.user,
            emoji=emoji
        ).first()

        if not reaction:
            return Response({'error': 'Reaction not found'}, status=404)

        reaction.delete()
        return Response({'message': 'Reaction removed successfully'})

    @action(detail=True, methods=['post'])
    def star_message(self, request, pk=None):
        """Star/favorite a message"""
        message = self.get_object()

        # Toggle star status
        message.is_starred = not message.is_starred
        message.save()

        return Response({
            'message': 'Message star status updated',
            'is_starred': message.is_starred
        })

    @action(detail=True, methods=['post'])
    def forward_message(self, request, pk=None):
        """Forward a message to another thread"""
        message = self.get_object()
        target_thread_id = request.data.get('thread_id')

        if not target_thread_id:
            return Response({'error': 'thread_id is required'}, status=400)

        try:
            target_thread = MessageThread.objects.get(
                id=target_thread_id,
                participants=request.user
            )
        except MessageThread.DoesNotExist:
            return Response({'error': 'Target thread not found or access denied'}, status=404)

        # Create forwarded message
        forwarded_message = Message.objects.create(
            thread=target_thread,
            sender=request.user,
            content=message.content,
            encrypted_content=message.encrypted_content,
            iv=message.iv,
            auth_tag=message.auth_tag,
            message_type=message.message_type,
            forwarded_from=message
        )

        serializer = self.get_serializer(forwarded_message)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def upload_media(self, request):
        """Upload media files for messages (photos, videos, documents, voice notes)"""
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type and size
        allowed_types = {
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'video': ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'],
            'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
            'document': [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ]
        }

        max_sizes = {
            'image': 10 * 1024 * 1024,  # 10MB
            'video': 100 * 1024 * 1024,  # 100MB
            'audio': 50 * 1024 * 1024,   # 50MB
            'document': 25 * 1024 * 1024  # 25MB
        }

        file_type = uploaded_file.content_type
        file_size = uploaded_file.size

        # Determine media type
        media_type = None
        for type_name, mime_types in allowed_types.items():
            if file_type in mime_types:
                media_type = type_name
                break

        if not media_type:
            return Response({'error': 'Unsupported file type'}, status=status.HTTP_400_BAD_REQUEST)

        if file_size > max_sizes[media_type]:
            return Response({'error': f'File too large. Maximum size for {media_type}s is {max_sizes[media_type] // (1024*1024)}MB'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique filename
        file_extension = os.path.splitext(uploaded_file.name)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        # Create media directory if it doesn't exist
        media_dir = os.path.join('media', 'messaging')
        os.makedirs(media_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(media_dir, unique_filename)
        with default_storage.open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Generate file URL
        file_url = f"{settings.MEDIA_URL}messaging/{unique_filename}"

        # Process image thumbnails if it's an image
        thumbnail_url = None
        if media_type == 'image':
            try:
                with Image.open(uploaded_file) as img:
                    # Create thumbnail
                    img.thumbnail((300, 300))
                    thumbnail_filename = f"thumb_{unique_filename}"
                    thumbnail_path = os.path.join(media_dir, thumbnail_filename)
                    img.save(thumbnail_path, 'JPEG', quality=85)
                    thumbnail_url = f"{settings.MEDIA_URL}messaging/{thumbnail_filename}"
            except Exception as e:
                # Thumbnail creation failed, continue without it
                pass

        return Response({
            'file_url': file_url,
            'thumbnail_url': thumbnail_url,
            'file_name': uploaded_file.name,
            'file_size': file_size,
            'file_type': file_type,
            'media_type': media_type
        })

class EncryptionKeyViewSet(viewsets.ModelViewSet):
    serializer_class = EncryptionKeySerializer
    permission_classes = [IsAuthenticated]
    queryset = EncryptionKey.objects.all()

    def get_queryset(self):
        return EncryptionKey.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def user_key(self, request, user_id=None):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id parameter required'}, status=400)

        try:
            key = EncryptionKey.objects.get(user_id=user_id)
            serializer = self.get_serializer(key)
            return Response(serializer.data)
        except EncryptionKey.DoesNotExist:
            return Response({'error': 'Encryption key not found'}, status=404)

class CallLogViewSet(viewsets.ModelViewSet):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]
    queryset = CallLog.objects.all()

    def get_queryset(self):
        return CallLog.objects.filter(
            participants=self.request.user
        ).select_related('initiator', 'thread').prefetch_related('participants')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateCallLogSerializer
        return CallLogSerializer

    def perform_create(self, serializer):
        serializer.save(initiator=self.request.user)

    @action(detail=True, methods=['post'])
    def start_call(self, request, pk=None):
        call_log = self.get_object()
        if call_log.status != 'initiated':
            return Response({'error': 'Call already started'}, status=400)

        call_log.status = 'connected'
        call_log.started_at = timezone.now()
        call_log.save()
        return Response({'status': 'Call started'})

    @action(detail=True, methods=['post'])
    def end_call(self, request, pk=None):
        call_log = self.get_object()
        if call_log.status not in ['connected', 'initiated']:
            return Response({'error': 'Call not active'}, status=400)

        call_log.status = 'ended'
        call_log.ended_at = timezone.now()
        if call_log.started_at:
            call_log.duration = call_log.ended_at - call_log.started_at
        call_log.save()
        return Response({'status': 'Call ended'})

class DeviceViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]
    queryset = Device.objects.all()

    def get_queryset(self):
        return Device.objects.filter(user=self.request.user, is_active=True)

    def create(self, request, *args, **kwargs):
        # Check if device already exists for this user
        device_id = request.data.get('device_id')
        if device_id:
            existing_device = Device.objects.filter(user=request.user, device_id=device_id).first()
            if existing_device:
                serializer = self.get_serializer(existing_device)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Get device info from request
        user_agent = self.request.META.get('HTTP_USER_AGENT', '')
        ip_address = self.get_client_ip()

        serializer.save(
            user=self.request.user,
            user_agent=user_agent,
            ip_address=ip_address
        )

    def get_client_ip(self):
        """Get client IP address from request"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip

    @action(detail=True, methods=['post'])
    def update_last_seen(self, request, pk=None):
        """Update device's last seen timestamp"""
        device = self.get_object()
        device.update_last_seen()
        return Response({'status': 'Last seen updated'})

    @action(detail=False, methods=['get'])
    def sync_data(self, request):
        """Get synchronization data for the current device"""
        device_id = request.query_params.get('device_id')
        if not device_id:
            return Response({'error': 'device_id parameter required'}, status=400)

        try:
            device = Device.objects.get(device_id=device_id, user=request.user)
        except Device.DoesNotExist:
            return Response({'error': 'Device not found'}, status=404)

        # Get sync checkpoint
        checkpoint, created = SyncCheckpoint.objects.get_or_create(device=device)

        # Get new messages since last sync
        new_messages = []
        if checkpoint.last_message_id:
            new_messages = Message.objects.filter(
                thread__participants=request.user,
                id__gt=checkpoint.last_message_id
            ).select_related('sender', 'thread').order_by('id')
        else:
            # First sync - get recent messages
            new_messages = Message.objects.filter(
                thread__participants=request.user,
                timestamp__gte=checkpoint.last_sync_timestamp
            ).select_related('sender', 'thread').order_by('id')

        # Update checkpoint
        if new_messages:
            checkpoint.last_message_id = new_messages.last().id
        checkpoint.last_sync_timestamp = timezone.now()
        checkpoint.save()

        serializer = MessagingMessageSerializer(new_messages, many=True, context={'request': request})
        return Response({
            'messages': serializer.data,
            'checkpoint': SyncCheckpointSerializer(checkpoint).data
        })


class MessageReadStatusViewSet(viewsets.ModelViewSet):
    serializer_class = MessageReadStatusSerializer
    permission_classes = [IsAuthenticated]
    queryset = MessageReadStatus.objects.all()

    def get_queryset(self):
        return MessageReadStatus.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Get or create device
        device_id = self.request.data.get('device_id')
        device, created = Device.objects.get_or_create(
            device_id=device_id,
            user=self.request.user,
            defaults={
                'device_name': f'Device {device_id[:8]}',
                'device_type': 'web'
            }
        )

        serializer.save(user=self.request.user, device=device)


class MessageBackupViewSet(viewsets.ModelViewSet):
    serializer_class = MessageBackupSerializer
    permission_classes = [IsAuthenticated]
    queryset = MessageBackup.objects.all()

    def get_queryset(self):
        return MessageBackup.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        backup = serializer.save(user=self.request.user, status='pending')

        # Start backup process asynchronously
        from django.core.management import call_command
        from threading import Thread

        def run_backup():
            try:
                call_command('create_message_backup', backup.id)
            except Exception as e:
                backup.mark_failed()
                print(f"Backup failed: {e}")

        thread = Thread(target=run_backup)
        thread.daemon = True
        thread.start()

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore messages from backup"""
        backup = self.get_object()

        if backup.status != 'completed':
            return Response({'error': 'Backup is not ready for restore'}, status=400)

        # Start restore process asynchronously
        from django.core.management import call_command
        from threading import Thread

        def run_restore():
            try:
                call_command('restore_message_backup', backup.id, request.user.id)
            except Exception as e:
                print(f"Restore failed: {e}")

        thread = Thread(target=run_restore)
        thread.daemon = True
        thread.start()

        return Response({'status': 'Restore initiated'})


# Staff users view for messaging
class StaffUsersView(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_queryset(self):
        staff_roles = ['manager', 'operations_manager', 'cashier', 'mobile_banker']
        return User.objects.filter(role__in=staff_roles).exclude(id=self.request.user.id)
