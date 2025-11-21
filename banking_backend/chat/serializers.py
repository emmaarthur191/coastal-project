from rest_framework import serializers
from django.utils import timezone
from .models import (
    ChatSession, ChatMessage, SupportTicket,
    ChatSessionAudit, SupportTicketAudit, ChatAnalytics
)


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for ChatSession model."""

    customer_name = serializers.CharField(read_only=True)
    assigned_cashier_name = serializers.CharField(source='assigned_cashier.get_full_name', read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            'id', 'customer', 'customer_name', 'customer_email', 'customer_phone',
            'assigned_cashier', 'assigned_cashier_name', 'status', 'priority',
            'started_at', 'assigned_at', 'last_message_at', 'closed_at',
            'subject', 'department', 'tags', 'queue_position',
            'estimated_wait_time', 'message_count', 'last_message_preview'
        ]
        read_only_fields = ['id', 'started_at', 'assigned_at', 'closed_at', 'message_count']

    def get_last_message_preview(self, obj):
        """Get preview of the last message."""
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            preview = last_message.content[:50]
            if len(last_message.content) > 50:
                preview += '...'
            return preview
        return None


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for ChatMessage model."""

    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    is_own_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'session', 'sender', 'sender_name', 'sender_role',
            'message_type', 'content', 'file_url', 'file_name', 'file_size',
            'timestamp', 'is_read', 'read_at', 'edited', 'edited_at',
            'is_own_message'
        ]
        read_only_fields = ['id', 'timestamp', 'is_read', 'read_at', 'edited', 'edited_at']

    def get_is_own_message(self, obj):
        """Check if the message is from the current user."""
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False


class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat sessions."""

    class Meta:
        model = ChatSession
        fields = [
            'customer_name', 'customer_email', 'customer_phone',
            'subject', 'department', 'priority'
        ]

    def create(self, validated_data):
        """Create a new chat session."""
        user = self.context['request'].user

        # Set customer to current user if they're not staff
        if user.role == 'customer':
            validated_data['customer'] = user
        elif 'customer' not in validated_data:
            # For staff creating sessions on behalf of customers
            # This would need additional logic to find/create customer
            pass

        return super().create(validated_data)


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat messages."""

    class Meta:
        model = ChatMessage
        fields = ['content', 'message_type', 'metadata']

    def create(self, validated_data):
        """Create a new chat message."""
        session_id = self.context['session_id']
        user = self.context['request'].user

        session = ChatSession.objects.get(id=session_id)

        # Validate that user can send messages to this session
        if not self._can_send_message(user, session):
            raise serializers.ValidationError("You cannot send messages to this session.")

        validated_data['session'] = session
        validated_data['sender'] = user

        return super().create(validated_data)

    def _can_send_message(self, user, session):
        """Check if user can send messages to the session."""
        if user == session.customer:
            return True
        if user == session.assigned_cashier:
            return True
        if user.has_role_permission('manager'):
            return True
        return False


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for SupportTicket model."""

    chat_session_details = ChatSessionSerializer(source='chat_session', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'chat_session', 'chat_session_details', 'title', 'description',
            'status', 'priority', 'category', 'assigned_to', 'assigned_to_name',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'resolved_at', 'closed_at', 'resolution', 'resolution_time',
            'customer_satisfaction', 'customer_feedback', 'tags', 'internal_notes'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'resolved_at', 'closed_at',
            'resolution_time', 'chat_session_details', 'assigned_to_name', 'created_by_name'
        ]


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating support tickets from chat sessions."""

    class Meta:
        model = SupportTicket
        fields = [
            'title', 'description', 'priority', 'category', 'tags'
        ]

    def create(self, validated_data):
        """Create a support ticket from a chat session."""
        session_id = self.context['session_id']
        user = self.context['request'].user

        session = ChatSession.objects.get(id=session_id)

        # Validate that user can create ticket for this session
        if not self._can_create_ticket(user, session):
            raise serializers.ValidationError("You cannot create tickets for this session.")

        validated_data['chat_session'] = session
        validated_data['created_by'] = user

        # Auto-assign based on priority and availability
        # This would be implemented in a service layer
        assigned_user = self._auto_assign_ticket(validated_data.get('priority', 'medium'))
        if assigned_user:
            validated_data['assigned_to'] = assigned_user

        return super().create(validated_data)

    def _can_create_ticket(self, user, session):
        """Check if user can create tickets for this session."""
        return user == session.assigned_cashier or user.has_role_permission('manager')

    def _auto_assign_ticket(self, priority):
        """Auto-assign ticket based on priority and cashier availability."""
        # This is a simplified version - in production, this would be more sophisticated
        from users.models import User

        # Find available cashiers
        available_cashiers = User.objects.filter(
            role='cashier',
            # Add logic to check availability
        ).order_by('?')  # Random order for load balancing

        return available_cashiers.first() if available_cashiers.exists() else None


class ChatSessionAuditSerializer(serializers.ModelSerializer):
    """Serializer for ChatSessionAudit model."""

    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = ChatSessionAudit
        fields = [
            'id', 'session', 'action', 'performed_by', 'performed_by_name',
            'performed_at', 'details', 'ip_address'
        ]
        read_only_fields = ['id', 'performed_at']


class SupportTicketAuditSerializer(serializers.ModelSerializer):
    """Serializer for SupportTicketAudit model."""

    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = SupportTicketAudit
        fields = [
            'id', 'ticket', 'action', 'performed_by', 'performed_by_name',
            'performed_at', 'details', 'ip_address'
        ]
        read_only_fields = ['id', 'performed_at']


class ChatAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for ChatAnalytics model."""

    class Meta:
        model = ChatAnalytics
        fields = [
            'id', 'date', 'total_sessions', 'active_sessions', 'closed_sessions',
            'average_session_duration', 'average_response_time', 'average_first_response_time',
            'average_queue_time', 'max_queue_time', 'abandoned_sessions',
            'total_messages', 'average_messages_per_session',
            'average_satisfaction', 'satisfaction_responses',
            'total_agents_online', 'average_sessions_per_agent'
        ]
        read_only_fields = ['id']


class ChatAssignmentSerializer(serializers.Serializer):
    """Serializer for chat assignment operations."""

    cashier_id = serializers.UUIDField()
    notes = serializers.CharField(required=False, allow_blank=True)


class ChatStatusUpdateSerializer(serializers.Serializer):
    """Serializer for chat status updates."""

    status = serializers.ChoiceField(choices=ChatSession.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class TypingIndicatorSerializer(serializers.Serializer):
    """Serializer for typing indicators."""

    typing = serializers.BooleanField()


class ReadReceiptSerializer(serializers.Serializer):
    """Serializer for read receipts."""

    message_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )