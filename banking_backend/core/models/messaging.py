"""Messaging models for Coastal Banking.

Includes message threads, individual messages, and related models.
"""

import uuid

from django.conf import settings
from django.db import models


class BankingMessage(models.Model):
    """Legacy messaging model for backward compatibility."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="banking_messages")
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    thread_id = models.CharField(max_length=100, blank=True, null=True)
    parent_message = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message to {self.user.username}: {self.subject}"

    def save(self, *args, **kwargs):
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
        ordering = ["-last_message_at", "-created_at"]
        verbose_name = "Message Thread"
        verbose_name_plural = "Message Threads"

    def __str__(self):
        return f"Thread: {self.subject}"

    def message_count(self):
        return self.messages.count()

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
        ordering = ["created_at"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        sender_name = self.sender.get_full_name() if self.sender else "System"
        content_preview = (self.content or "")[:50]
        return f"Message from {sender_name}: {content_preview}..."

    def mark_as_read(self, user):
        """Mark message as read by user."""
        if user not in self.read_by.all():
            self.read_by.add(user)

    @property
    def is_read(self):
        """Check if message has been read by at least one person."""
        return self.read_by.exists()


class UserMessagePreferences(models.Model):
    """User preferences for messaging notifications."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_preferences")
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=True)
    show_previews = models.BooleanField(default=True)

    class Meta:
        verbose_name = "User Message Preferences"
        verbose_name_plural = "User Message Preferences"

    def __str__(self):
        return f"Message preferences for {self.user.email}"


class BlockedUser(models.Model):
    """Users blocked from sending messages."""

    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocked_users")
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocked_by")
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["blocker", "blocked"]
        verbose_name = "Blocked User"
        verbose_name_plural = "Blocked Users"

    def __str__(self):
        return f"{self.blocker.email} blocked {self.blocked.email}"
