"""Messaging-related serializers for Coastal Banking."""

from django.utils import timezone
from rest_framework import serializers

from core.models.messaging import (
    BankingMessage,
    BlockedUser,
    Message,
    MessageThread,
    UserMessagePreference,
)


class BankingMessageSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BankingMessage
        fields = [
            "id",
            "user",
            "subject",
            "body",
            "is_read",
            "read_at",
            "thread_id",
            "parent_message",
            "replies",
            "created_at",
        ]
        read_only_fields = ["id", "read_at", "created_at", "thread_id"]

    def get_replies(self, obj):
        if obj.replies.exists():
            return BankingMessageSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def to_representation(self, instance):
        """Apply PII masking based on roles."""
        from core.utils import mask_generic

        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Standard staff see masked bodies
        is_manager = user and (user.role in ["manager", "operations_manager", "admin"] or user.is_superuser)
        if not is_manager:
            data["body"] = mask_generic(data.get("body"), length=20)

        return data

    def update(self, instance, validated_data):
        if validated_data.get("is_read") and not instance.is_read:
            validated_data["read_at"] = timezone.now()
        return super().update(instance, validated_data)


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages."""

    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()
    is_read_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "thread",
            "sender",
            "sender_name",
            "sender_email",
            "content",
            "encrypted_content",
            "iv",
            "auth_tag",
            "message_type",
            "is_system_message",
            "attachment_url",
            "attachment_name",
            "created_at",
            "edited_at",
            "is_read_by_me",
        ]
        read_only_fields = ["id", "sender", "created_at", "edited_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else "System"

    def get_sender_email(self, obj):
        return obj.sender.email if obj.sender else None

    def to_representation(self, instance):
        """Apply PII masking based on roles."""
        from core.utils import mask_generic

        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Standard staff see masked content
        is_manager = user and (user.role in ["manager", "operations_manager", "admin"] or user.is_superuser)
        if not is_manager:
            # We also mask the sender name if it's there
            data["sender_name"] = mask_generic(data.get("sender_name"))
            data["content"] = mask_generic(data.get("content"), length=20)

        return data

    def get_is_read_by_me(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return request.user in obj.read_by.all()
        return False


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for message threads."""

    messages = serializers.SerializerMethodField()
    participant_list = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    participant_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = MessageThread
        fields = [
            "id",
            "subject",
            "thread_type",
            "participants",
            "participant_list",
            "participant_ids",
            "created_by",
            "created_by_name",
            "is_archived",
            "is_pinned",
            "last_message_at",
            "created_at",
            "updated_at",
            "messages",
            "unread_count",
            "last_message_preview",
        ]
        read_only_fields = ["id", "created_by", "last_message_at", "created_at", "updated_at"]

    def get_messages(self, obj):
        # Return last 50 messages
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_manager = user and (user.role in ["manager", "operations_manager", "admin"] or user.is_superuser)

        from core.utils import mask_generic

        messages = obj.messages.order_by("-created_at")[:50][::-1]
        result = []
        for m in messages:
            sender_name = m.sender.get_full_name() if m.sender else "System"
            content = m.content or ""  # uses property

            if not is_manager:
                sender_name = mask_generic(sender_name)
                content = mask_generic(content, length=20)

            result.append(
                {
                    "id": m.id,
                    "sender": m.sender.id if m.sender else None,
                    "sender_name": sender_name,
                    "content": content,
                    "encrypted_content": m.content_encrypted,  # naming mismatch in model ChatMessage has content_encrypted
                    "message_type": m.message_type if hasattr(m, "message_type") else "text",
                    "created_at": m.created_at.isoformat(),
                    "is_system_message": getattr(m, "is_system_message", False),
                }
            )
        return result

    def get_participant_list(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_manager = user and (user.role in ["manager", "operations_manager", "admin"] or user.is_superuser)

        from core.utils import mask_generic

        result = []
        for p in obj.participants.all():
            first_name = p.first_name
            last_name = p.last_name
            email = p.email

            if not is_manager:
                name = f"{mask_generic(first_name)} {mask_generic(last_name)}"
                email = mask_generic(email)
            else:
                name = f"{first_name} {last_name}"

            result.append({"id": p.id, "name": name, "email": email, "role": p.role})
        return result

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return obj.messages.exclude(read_by=request.user).count()
        return 0

    def get_last_message_preview(self, obj):
        last = obj.last_message
        if last:
            # SECURITY FIX: Only preview encrypted content, never plain content
            content_preview = (last.encrypted_content or "[Encrypted]")[:100]
            # Ensure we return a string prefix if needed, or stick to object but ensure Swagger docs are clear
            return f"{last.sender.get_full_name() if last.sender else 'System'}: {content_preview}"
        return ""

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class UserMessagePreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user message preferences."""

    class Meta:
        model = UserMessagePreference
        fields = [
            "id",
            "user",
            "sound_enabled",
            "notification_sound",
            "read_receipts_enabled",
            "typing_indicators_enabled",
            "last_seen_visible",
            "auto_delete_enabled",
            "auto_delete_days",
            "markdown_enabled",
            "emoji_shortcuts_enabled",
            "font_size",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class BlockedUserSerializer(serializers.ModelSerializer):
    """Serializer for blocked users."""

    blocker_username = serializers.CharField(source="blocker.username", read_only=True)
    blocked_username = serializers.CharField(source="blocked.username", read_only=True)
    blocked_full_name = serializers.SerializerMethodField()

    class Meta:
        model = BlockedUser
        fields = [
            "id",
            "blocker",
            "blocked",
            "blocker_username",
            "blocked_username",
            "blocked_full_name",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "blocker", "created_at"]

    def get_blocked_full_name(self, obj):
        return obj.blocked.get_full_name() if obj.blocked else None
