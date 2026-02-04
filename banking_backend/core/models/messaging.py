"""Messaging models for Coastal Banking.

Includes message threads, individual messages, and related models.
"""

import uuid

from django.conf import settings
from django.db import models


class BankingMessage(models.Model):
    """Internal notifications and messages sent to users."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="banking_messages")
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    thread_id = models.CharField(max_length=100, blank=True, null=True)
    parent_message = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_bankingmessage"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message to {self.user.username}: {self.subject}"

    def save(self, *args, **kwargs):
        # Auto-generate thread_id if not provided
        if not self.thread_id:
            if self.parent_message:
                self.thread_id = self.parent_message.thread_id
            else:
                self.thread_id = str(uuid.uuid4())[:8]
        super().save(*args, **kwargs)


class MessageThread(models.Model):
    """Model for message threads/conversations."""

    THREAD_TYPES = [
        ("staff_to_staff", "Staff to Staff"),
        ("staff_to_customer", "Staff to Customer"),
        ("broadcast", "Broadcast"),
        ("system", "System Notification"),
    ]

    subject = models.CharField(max_length=255)
    thread_type = models.CharField(max_length=20, choices=THREAD_TYPES, default="staff_to_staff")
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="message_threads")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_threads"
    )
    is_archived = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_messagethread"
        ordering = ["-last_message_at", "-created_at"]
        verbose_name = "Message Thread"
        verbose_name_plural = "Message Threads"

    def __str__(self):
        return f"Thread: {self.subject[:50]}"

    @property
    def message_count(self):
        return self.messages.count()

    @property
    def last_message(self):
        return self.messages.order_by("-created_at").first()


class Message(models.Model):
    """Model for individual messages within a thread."""

    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sent_messages"
    )
    content = models.TextField(blank=True, null=True)
    encrypted_content = models.TextField(blank=True, null=True)
    iv = models.CharField(max_length=255, blank=True, null=True)
    auth_tag = models.CharField(max_length=255, blank=True, null=True)
    message_type = models.CharField(max_length=50, default="text")
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="read_messages", blank=True)
    is_system_message = models.BooleanField(default=False)
    attachment_url = models.URLField(blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    reactions = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "core_message"
        ordering = ["created_at"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        sender_name = self.sender.get_full_name() if self.sender else "System"
        return f"Message from {sender_name}: {(self.content or '')[:50]}..."

    def mark_as_read(self, user):
        """Mark message as read by user."""
        if user not in self.read_by.all():
            self.read_by.add(user)

    @property
    def is_read(self):
        """Check if message has been read by at least one person."""
        return self.read_by.exists()


class UserMessagePreference(models.Model):
    """User preferences for messaging features."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_preferences")

    # Sound & Notifications
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    show_previews = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=True)
    notification_sound = models.CharField(
        max_length=50,
        default="default",
        choices=[("default", "Default"), ("chime", "Chime"), ("ding", "Ding"), ("bell", "Bell"), ("none", "Silent")],
    )

    # Privacy Settings
    read_receipts_enabled = models.BooleanField(default=True)
    typing_indicators_enabled = models.BooleanField(default=True)
    last_seen_visible = models.BooleanField(default=True)

    # Auto-delete
    auto_delete_enabled = models.BooleanField(default=False)
    auto_delete_days = models.IntegerField(
        default=30, choices=[(1, "24 Hours"), (7, "7 Days"), (30, "30 Days"), (90, "90 Days"), (365, "Never")]
    )

    # Message Formatting
    markdown_enabled = models.BooleanField(default=True)
    emoji_shortcuts_enabled = models.BooleanField(default=True)
    font_size = models.CharField(
        max_length=10, default="medium", choices=[("small", "Small"), ("medium", "Medium"), ("large", "Large")]
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_message_preference"
        verbose_name = "User Message Preference"
        verbose_name_plural = "User Message Preferences"

    def __str__(self):
        return f"Preferences for {self.user.username}"


class BlockedUser(models.Model):
    """Blocked users in messaging system."""

    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="blocked_users", on_delete=models.CASCADE)
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="blocked_by", on_delete=models.CASCADE)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_blockeduser"
        unique_together = ("blocker", "blocked")
        ordering = ["-created_at"]
        verbose_name = "Blocked User"
        verbose_name_plural = "Blocked Users"

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"


class OperationsMessage(models.Model):
    """Model for messages between operations and staff."""

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="sent_ops_messages", on_delete=models.CASCADE)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="received_ops_messages", on_delete=models.CASCADE, null=True, blank=True
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.priority}"

    class Meta:
        db_table = "operations_message"
        ordering = ["-created_at"]


class ChatRoom(models.Model):
    """Represents a chat room - can be direct (2 users) or group (multiple users)."""

    name = models.CharField(max_length=100, blank=True, null=True)  # Only for groups
    is_group = models.BooleanField(default=False)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="chat_rooms")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_rooms"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_chatroom"
        ordering = ["-updated_at"]

    def __str__(self):
        if self.is_group:
            return f"Group: {self.name or self.id}"
        return f"Chat Room {self.id}"

    def get_display_name(self, for_user=None):
        """Get a friendly display name for the room.
        For 1-on-1, it's the other person's name.
        For groups, it's the group name.
        """
        if self.is_group:
            return self.name or f"Group {self.id}"

        if not for_user:
            return "Direct Chat"

        # Find the other member
        other_members = self.members.exclude(id=for_user.id)
        if other_members.exists():
            other = other_members.first()
            return other.get_full_name() or other.email
        return "Empty Chat"


class ChatMessage(models.Model):
    """A single message in a chat room."""

    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_chat_messages")
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_chatmessage"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"
