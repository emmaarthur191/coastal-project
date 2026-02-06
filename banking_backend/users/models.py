from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("customer", "Customer"),
        ("cashier", "Cashier"),
        ("mobile_banker", "Mobile Banker"),
        ("manager", "Manager"),
        ("operations_manager", "Operations Manager"),
        ("admin", "Administrator"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    email = models.EmailField(unique=True, blank=False)

    # SECURITY: Encrypted storage for PII/Internal IDs (Zero-Plaintext compliance)
    id_number_encrypted = models.TextField(blank=True, default="")
    phone_number_encrypted = models.TextField(blank=True, default="")
    ssnit_number_encrypted = models.TextField(blank=True, default="")
    staff_id_encrypted = models.TextField(blank=True, default="")
    first_name_encrypted = models.TextField(blank=True, default="")
    last_name_encrypted = models.TextField(blank=True, default="")

    # SECURITY: Searchable hashes for PII (Zero-Plaintext compliance)
    # HMAC-SHA256 hex digests are 64 characters
    id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    phone_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    ssnit_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    staff_id_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    first_name_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    last_name_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)

    id_type = models.CharField(max_length=50, null=True, blank=True)

    @property
    def id_number(self):
        """Decrypt and return the ID number."""
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.id_number_encrypted)

    @id_number.setter
    def id_number(self, value):
        """Encrypt and set the ID number + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field
        self.id_number_encrypted = encrypt_field(value) if value else ""
        self.id_number_hash = hash_field(value) if value else ""

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

    @property
    def ssnit_number(self):
        """Decrypt and return the SSNIT number."""
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.ssnit_number_encrypted)

    @ssnit_number.setter
    def ssnit_number(self, value):
        """Encrypt and set the SSNIT number + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field
        self.ssnit_number_encrypted = encrypt_field(value) if value else ""
        self.ssnit_number_hash = hash_field(value) if value else ""

    @property
    def staff_id(self):
        """Decrypt and return the Staff ID."""
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.staff_id_encrypted)

    @staff_id.setter
    def staff_id(self, value):
        """Encrypt and set the Staff ID + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field
        self.staff_id_encrypted = encrypt_field(value) if value else ""
        self.staff_id_hash = hash_field(value) if value else ""

    @property
    def first_name(self):
        """Decrypt and return the first name."""
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.first_name_encrypted)

    @first_name.setter
    def first_name(self, value):
        """Encrypt and set the first name + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field
        self.first_name_encrypted = encrypt_field(value) if value else ""
        self.first_name_hash = hash_field(value) if value else ""

    @property
    def last_name(self):
        """Decrypt and return the last name."""
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.last_name_encrypted)

    @last_name.setter
    def last_name(self, value):
        """Encrypt and set the last name + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field
        self.last_name_encrypted = encrypt_field(value) if value else ""
        self.last_name_hash = hash_field(value) if value else ""

    # Security: Account lockout fields
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_failed_login = models.DateTimeField(null=True, blank=True)

    # Security: Transaction limits (daily, in currency units)
    daily_transaction_limit = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00)
    daily_transaction_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    daily_limit_reset_date = models.DateField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    # Security constants
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 30

    def __str__(self):
        return self.email

    def is_locked(self):
        """Check if account is currently locked."""
        from django.utils import timezone

        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def save(self, *args, **kwargs):
        """Override save to ensure PII is handled correctly."""
        super().save(*args, **kwargs)

    def reset_failed_attempts(self):
        """Reset failed login attempts after successful login."""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.last_failed_login = None
        self.save(update_fields=["failed_login_attempts", "locked_until", "last_failed_login"])

    def record_failed_attempt(self):
        """Record a failed login attempt and lock if threshold exceeded."""
        from datetime import timedelta

        from django.utils import timezone

        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()

        if self.failed_login_attempts >= self.MAX_FAILED_ATTEMPTS:
            self.locked_until = timezone.now() + timedelta(minutes=self.LOCKOUT_DURATION_MINUTES)

        self.save(update_fields=["failed_login_attempts", "last_failed_login", "locked_until"])
        return self.is_locked()


class UserActivity(models.Model):
    """Track user activities like login, logout, and key actions."""

    ACTION_TYPES = [
        ("login", "Login"),
        ("logout", "Logout"),
        ("password_change", "Password Change"),
        ("password_reset", "Password Reset"),
        ("profile_update", "Profile Update"),
        ("failed_login", "Failed Login"),
        ("account_locked", "Account Locked"),
        ("account_unlocked", "Account Unlocked"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"

    def __str__(self):
        return f"{self.user.email} - {self.action} at {self.created_at}"


class AuditLog(models.Model):
    """System-wide audit log for tracking all model changes."""

    ACTION_TYPES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    object_repr = models.CharField(max_length=255)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        return f"{self.action} {self.model_name} ({self.object_id}) by {self.user}"


class AdminNotification(models.Model):
    """Notifications for admin users."""

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    NOTIFICATION_TYPES = [
        ("system", "System Alert"),
        ("security", "Security Alert"),
        ("user", "User Action"),
        ("transaction", "Transaction Alert"),
        ("maintenance", "Maintenance"),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default="system")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    target_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="admin_notifications", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Admin Notification"
        verbose_name_plural = "Admin Notifications"

    def __str__(self):
        return f"[{self.priority.upper()}] {self.title}"


class PasswordResetToken(models.Model):
    """Secure password reset token model.

    Security features:
    - Cryptographically secure token (32 bytes)
    - 15-minute expiration (NIST 800-63B)
    - One-time use (invalidated after use)
    - Rate limited at view level
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"

    def __str__(self):
        return f"Reset token for {self.user.email} (expires {self.expires_at})"

    @classmethod
    def generate_token(cls):
        """Generate a cryptographically secure token."""
        import secrets

        return secrets.token_urlsafe(32)

    @classmethod
    def create_for_user(cls, user, request=None):
        """Create a new password reset token for a user."""
        from datetime import timedelta

        from django.utils import timezone

        # Invalidate any existing tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)

        # Create new token with 15-minute expiration
        token = cls.generate_token()
        expires_at = timezone.now() + timedelta(minutes=15)

        ip_address = None
        if request:
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0].strip()
            else:
                ip_address = request.META.get("REMOTE_ADDR")

        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address,
        )

    def is_valid(self):
        """Check if token is still valid (not expired and not used)."""
        from django.utils import timezone

        return not self.is_used and self.expires_at > timezone.now()

    def mark_used(self):
        """Mark token as used."""
        from django.utils import timezone

        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=["is_used", "used_at"])
