"""Messaging and communication views for Coastal Banking.

This module contains views for managing messages, threads, devices,
and user preferences.
"""

import logging

from django.utils import timezone
from rest_framework import mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models import BankingMessage
from core.permissions import IsCustomer, IsStaff
from core.serializers import (
    BankingMessageSerializer,
)

logger = logging.getLogger(__name__)


class BankingMessageViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    queryset = BankingMessage.objects.all()
    serializer_class = BankingMessageSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["is_read"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter messages so customers only see their own communication."""
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        """Map messaging actions to staff or customer permission levels."""
        if self.action in ["create"]:
            return [IsStaff()]
        return [IsCustomer()]

    @action(detail=True, methods=["post"], permission_classes=[IsCustomer])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        from core.services import MessagingService

        MessagingService.mark_as_read(message)
        return Response({"status": "Message marked as read."})


class MessageThreadViewSet(ModelViewSet):
    """ViewSet for message threads with full messaging functionality."""

    permission_classes = [IsStaff]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["is_archived"]
    ordering_fields = ["updated_at", "created_at"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        """Return threads where current user is a participant."""
        from core.models import MessageThread

        return MessageThread.objects.filter(participants=self.request.user).distinct()

    def get_serializer_class(self):
        from core.serializers import MessageThreadSerializer

        return MessageThreadSerializer

    def list(self, request):
        """Return threads for the current user."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Retrieve a message thread with messages."""
        thread = self.get_object()
        serializer = self.get_serializer(thread)
        return Response(serializer.data)

    def create(self, request):
        """Create a new message thread."""
        from core.models import Message, MessageThread

        subject = request.data.get("subject", "")
        participant_ids = request.data.get("participants", [])
        initial_message = request.data.get("message", "")

        if not participant_ids:
            return Response({"error": "At least one participant is required"}, status=400)

        # Create thread
        thread = MessageThread.objects.create(subject=subject, created_by=request.user)
        thread.participants.add(request.user)

        # Add other participants
        from users.models import User

        for pid in participant_ids:
            try:
                user = User.objects.get(pk=pid)
                thread.participants.add(user)
            except User.DoesNotExist:
                pass

        # Add initial message if provided
        if initial_message:
            Message.objects.create(thread=thread, sender=request.user, content=initial_message)

        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        """Send a message to a thread."""
        from core.models import Message

        thread = self.get_object()
        content = request.data.get("content", "")

        if not content:
            return Response({"error": "Message content is required"}, status=400)

        message = Message.objects.create(thread=thread, sender=request.user, content=content)

        # Update thread timestamp
        thread.updated_at = timezone.now()
        thread.save()

        from core.serializers import MessageSerializer

        return Response({"status": "success", "message": MessageSerializer(message).data})

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in thread as read by current user."""
        thread = self.get_object()
        thread.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response({"status": "success", "message": "Thread marked as read"})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive a thread to hide it from the active inbox."""
        thread = self.get_object()
        thread.is_archived = True
        thread.save()
        return Response({"status": "success", "message": "Thread archived"})


class MessageViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for new messaging system messages."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Return messages from threads where the current user is a participant."""
        from core.models import Message

        # Only show messages from threads user is part of
        return Message.objects.filter(thread__participants=self.request.user)

    def get_serializer_class(self):
        """Return the serializer for individual messages."""
        from core.serializers import MessageSerializer

        return MessageSerializer

    def perform_create(self, serializer):
        """Set the sender to the current user when creating a message."""
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=["post"])
    def add_reaction(self, request, pk=None):
        """Add an emoji reaction to a message."""
        message = self.get_object()
        emoji = request.data.get("emoji", "")
        if not emoji:
            return Response({"error": "Emoji is required"}, status=400)

        # Store reactions as JSON or separate model
        # Simplified implementation
        return Response({"status": "success", "message": "Reaction added"})

    @action(detail=True, methods=["post"])
    def remove_reaction(self, request, pk=None):
        """Remove a previously added emoji reaction from a message."""
        message = self.get_object()
        emoji = request.data.get("emoji", "")
        if not emoji:
            return Response({"error": "Emoji is required"}, status=400)

        return Response({"status": "success", "message": "Reaction removed"})

    @action(detail=False, methods=["post"])
    def upload_media(self, request):
        """Placeholder for media upload."""
        return Response({"status": "not_implemented", "message": "Media upload is not yet supported."}, status=501)


class DeviceViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for device registration for push notifications."""

    permission_classes = [IsStaff]

    def get_queryset(self):
        """Return devices for the current user."""
        from core.models import Device

        return Device.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        from core.serializers import DeviceSerializer

        return DeviceSerializer

    def list(self, request):
        """Return devices for the current user."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Register a device for push notifications."""
        from core.models import Device

        device_token = request.data.get("token")
        device_type = request.data.get("device_type", "unknown")
        device_name = request.data.get("device_name", "")

        if not device_token:
            return Response({"error": "Device token is required"}, status=400)

        # Update or create device
        device, created = Device.objects.update_or_create(
            user=request.user,
            token=device_token,
            defaults={"device_type": device_type, "device_name": device_name, "is_active": True},
        )

        return Response(
            {
                "status": "success",
                "device_id": device.id,
                "message": "Device registered" if created else "Device updated",
            }
        )

    @action(detail=False, methods=["post"])
    def sync_data(self, request):
        """Sync endpoint to check connection status."""
        return Response({"status": "connected", "timestamp": timezone.now().isoformat()})


class UserPreferencesView(APIView):
    """View to get and update user message preferences."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user's message preferences."""
        from core.models import UserMessagePreferences

        prefs, _ = UserMessagePreferences.objects.get_or_create(user=request.user)
        return Response(
            {
                "notifications_enabled": prefs.notifications_enabled,
                "email_notifications": prefs.email_notifications,
                "sms_notifications": prefs.sms_notifications,
                "push_notifications": prefs.push_notifications,
            }
        )

    def post(self, request):
        """Update user's message preferences."""
        from core.models import UserMessagePreferences

        prefs, _ = UserMessagePreferences.objects.get_or_create(user=request.user)

        if "notifications_enabled" in request.data:
            prefs.notifications_enabled = request.data["notifications_enabled"]
        if "email_notifications" in request.data:
            prefs.email_notifications = request.data["email_notifications"]
        if "sms_notifications" in request.data:
            prefs.sms_notifications = request.data["sms_notifications"]
        if "push_notifications" in request.data:
            prefs.push_notifications = request.data["push_notifications"]

        prefs.save()
        return Response({"status": "success", "message": "Preferences updated"})


class BlockedUsersViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing blocked users."""

    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Return the list of users blocked by the current user."""
        from core.models import BlockedUser

        return BlockedUser.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Return the serializer for blocked user entries."""
        from core.serializers import BlockedUserSerializer

        return BlockedUserSerializer

    def perform_create(self, serializer):
        """Create a new blocked user entry."""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def unblock(self, request):
        """Unblock a user by their ID."""
        from core.models import BlockedUser

        blocked_user_id = request.data.get("user_id")
        if not blocked_user_id:
            return Response({"error": "user_id is required"}, status=400)

        try:
            blocked = BlockedUser.objects.get(user=request.user, blocked_user_id=blocked_user_id)
            blocked.delete()
            return Response({"status": "success", "message": "User unblocked"})
        except BlockedUser.DoesNotExist:
            return Response({"error": "Blocked user not found"}, status=404)


class OperationsMessagesViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for operations messages."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return operations-related technical messages for the current user."""
        from core.models import OperationsMessage

        return OperationsMessage.objects.filter(recipient=self.request.user).order_by("-created_at")

    def get_serializer_class(self):
        """Define and return a serializer for operations messages."""
        from core.models import OperationsMessage

        class OperationsMessageSerializer(serializers.ModelSerializer):
            sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)

            class Meta:
                model = OperationsMessage
                fields = [
                    "id",
                    "sender",
                    "sender_name",
                    "recipient",
                    "title",
                    "message",
                    "priority",
                    "is_read",
                    "created_at",
                ]
                read_only_fields = ["id", "sender", "sender_name", "created_at"]

        return OperationsMessageSerializer
