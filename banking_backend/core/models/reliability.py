from django.conf import settings
from django.db import models
from django.utils import timezone


class SmsOutbox(models.Model):
    """Reliability model for tracking and retrying SMS dispatches."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]

    # SECURITY: Encrypted storage for PII (Zero-Plaintext compliance)
    phone_number_encrypted = models.TextField(blank=True, default="")
    phone_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)

    @property
    def phone_number(self):
        """Decrypt and return the phone number."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.phone_number_encrypted)

    @phone_number.setter
    def phone_number(self, value):
        """Encrypt and set the phone number + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field

        self.phone_number_encrypted = encrypt_field(value) if value else ""
        self.phone_number_hash = hash_field(value) if value else ""

    # SECURITY FIX (CVE-COASTAL-008): Encrypted storage for SMS content
    # SMS messages may contain OTPs, temporary passwords, and account numbers.
    # Storing them in plaintext violates the Zero-Plaintext policy.
    message_encrypted = models.TextField(blank=True, default="")

    @property
    def message(self):
        """Decrypt and return the SMS message content."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.message_encrypted)

    @message.setter
    def message(self, value):
        """Encrypt and store the SMS message content."""
        from core.utils.field_encryption import encrypt_field

        self.message_encrypted = encrypt_field(value) if value else ""

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "sms_outbox"
        verbose_name = "SMS Outbox"
        verbose_name_plural = "SMS Outboxes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"SMS to {self.phone_number} - {self.status}"


class IdempotencyKey(models.Model):
    """Model to prevent duplicate processing of the same request."""

    key = models.UUIDField(unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    response_data = models.JSONField(null=True)
    status_code = models.PositiveIntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "idempotency_key"
        verbose_name = "Idempotency Key"
        verbose_name_plural = "Idempotency Keys"
        indexes = [
            models.Index(fields=["key", "user"]),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"IdempotencyKey {self.key} for User {self.user}"


class GlobalSequence(models.Model):
    """Reliability model for generating atomic sequential numbers.

    Used to prevent race conditions during generation of sequential IDs
    like Staff IDs, membership numbers, or internal reference codes.
    """

    name = models.CharField(
        max_length=64, unique=True, help_text="Unique identifier for the sequence (e.g., 'staff_id')"
    )
    last_value = models.PositiveBigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "global_sequence"
        verbose_name = "Global Sequence"
        verbose_name_plural = "Global Sequences"

    def __str__(self):
        return f"Sequence {self.name}: {self.last_value}"

    @classmethod
    def get_next_value(cls, name: str, initial_value: int = 1) -> int:
        """Atomically increment and return the next value for a named sequence."""
        from django.db import transaction

        with transaction.atomic():
            seq, created = cls.objects.select_for_update().get_or_create(
                name=name, defaults={"last_value": initial_value - 1}
            )
            seq.last_value += 1
            seq.save(update_fields=["last_value", "updated_at"])
            return seq.last_value
