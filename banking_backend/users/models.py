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
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    staff_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

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
