"""Messaging-related services for Coastal Banking.

Handles banking message creation, reading, and WebSocket broadcast.
"""

import logging

from django.utils import timezone

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from core.models.messaging import BankingMessage
from core.serializers.messaging import BankingMessageSerializer

logger = logging.getLogger(__name__)


class BankingMessageService:
    """Service class for banking message operations."""

    @staticmethod
    def create_message(user, subject: str, body: str, parent_message=None) -> BankingMessage:
        """Create a new banking message and broadcast it via WebSocket."""
        message = BankingMessage.objects.create(user=user, subject=subject, body=body, parent_message=parent_message)
        # Broadcast the new message via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"messages_{user.id}", {"type": "message_update", "message": BankingMessageSerializer(message).data}
        )
        return message

    @staticmethod
    def mark_as_read(message: BankingMessage) -> BankingMessage:
        """Mark a banking message as read."""
        message.is_read = True
        message.read_at = timezone.now()
        message.save(update_fields=["is_read", "read_at"])
        return message

    @staticmethod
    def get_unread_count(user) -> int:
        """Get the count of unread messages for a user."""
        return BankingMessage.objects.filter(user=user, is_read=False).count()
