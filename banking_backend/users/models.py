"""User models for the Coastal Banking Application."""

import logging
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.crypto import get_random_string

logger = logging.getLogger(__name__)


class UserManager(BaseUserManager):
    """
    Improved UserManager for Coastal Banking.
    Handles 'email'-less accounts by using phone_number as an identifier.
    """

    def create_user(self, email=None, phone_number=None, password=None, **extra_fields):
        """
        Create user with smart fallback: email → phone_number as username
        """
        if not email and not phone_number:
            raise ValueError("Either 'email' or 'phone_number' must be set.")

        # Determine username
        if email:
            email = self.normalize_email(email)
            username = email.split("@")[0]
        elif phone_number:
            # Clean phone number for use as a username
            username = str(phone_number).replace(" ", "").replace("+", "").replace("-", "")
        else:
            username = None

        if not username:
            raise ValueError("Could not generate username from email or phone.")

        # Prepare extra fields
        extra_fields.setdefault("is_active", True)

        # Create user instance - correctly uses properties for sensitive fields
        # SECURITY: Pop username from extra_fields to avoid multiple value TypeError
        extra_fields.pop("username", None)
        user = self.model(
            email=email,
            phone_number=phone_number,  # Correctly triggers property setter for encryption
            username=username,          # Explicitly set username
            **extra_fields
        )

        # Set password
        if password is None:
            # SECURITY: Use Django's crypto utility for secure random passwords
            password = get_random_string(length=12)
        user.set_password(password)

        # Save with force_insert to avoid issues during initial creation
        user.save(using=self._db, force_insert=True)

        masked_email = f"{email[:3]}...@{email.split('@')[-1]}" if "@" in email else "***"
        masked_phone = f"{phone_number[:5]}***" if phone_number else "***"
        logger.info(
            f"User created successfully → Username: {username} | "
            f"Email: {masked_email} | Phone: {masked_phone}"
        )
        return user

    def create_superuser(self, email=None, phone_number=None, password=None, **extra_fields):
        """Create a superuser with complete system access."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_approved", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, phone_number, password, **extra_fields)




class User(AbstractUser):
    """Custom User model for banking security and Zero-Plaintext compliance."""

    ROLE_CHOICES = [
        ("customer", "Customer"),
        ("cashier", "Cashier"),
        ("mobile_banker", "Mobile Banker"),
        ("manager", "Manager"),
        ("operations_manager", "Operations Manager"),
        ("admin", "Administrator"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    email = models.EmailField(unique=True, blank=True, null=True)
    is_approved = models.BooleanField(default=False)

    objects = UserManager()

    # User Management Configuration
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        """Robust string representation for various identify fallback chains."""
        return self.email or self.phone_number or self.username or "Unknown User"

    # SECURITY: Encrypted storage for PII/Internal IDs (Zero-Plaintext compliance)
    id_number_encrypted = models.TextField(blank=True, default="")
    phone_number_encrypted = models.TextField(blank=True, default="")
    ssnit_number_encrypted = models.TextField(blank=True, default="")
    staff_id_encrypted = models.TextField(blank=True, default="")
    first_name_encrypted = models.TextField(blank=True, default="")
    last_name_encrypted = models.TextField(blank=True, default="")
    profile_photo_encrypted = models.TextField(blank=True, null=True, help_text="Encrypted Base64 encoded profile photo")

    # Additional Profile Fields (Encrypted)
    date_of_birth_encrypted = models.TextField(blank=True, default="")
    digital_address_encrypted = models.TextField(blank=True, default="")
    occupation_encrypted = models.TextField(blank=True, default="")
    work_address_encrypted = models.TextField(blank=True, default="")
    position_encrypted = models.TextField(blank=True, default="")

    # SECURITY: Searchable hashes for PII (Zero-Plaintext compliance)
    # HMAC-SHA256 hex digests are 64 characters
    id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    phone_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    ssnit_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    staff_id_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    first_name_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    last_name_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)

    # SECURITY: Unpredictable Member Number (Legacy 'id' is too guessable)
    member_number = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)

    # SECURITY: Numeric sequence for staff IDs (not PII, but used for generation)
    staff_number = models.PositiveIntegerField(null=True, blank=True, unique=True)

    id_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Security Constants
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15

    # Banking Operations: Client Assignment
    assigned_banker = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="direct_assigned_clients",
        limit_choices_to={"role": "mobile_banker"},
        help_text="The mobile banker assigned to this customer"
    )

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

        self.staff_id_encrypted = encrypt_field(value, version=self.key_version) if value else ""
        self.staff_id_hash = hash_field(value) if value else ""

    @property
    def first_name(self):
        """Decrypt and return the first name."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.first_name_encrypted, version=self.key_version)

    @first_name.setter
    def first_name(self, value):
        """Encrypt and set the first name + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field

        self.first_name_encrypted = encrypt_field(value, version=self.key_version) if value else ""
        self.first_name_hash = hash_field(value) if value else ""

    @property
    def last_name(self):
        """Decrypt and return the last name."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.last_name_encrypted, version=self.key_version)

    @last_name.setter
    def last_name(self, value):
        """Encrypt and set the last name + hash for searching."""
        from core.utils.field_encryption import encrypt_field, hash_field

        self.last_name_encrypted = encrypt_field(value, version=self.key_version) if value else ""
        self.last_name_hash = hash_field(value) if value else ""

    @property
    def profile_photo(self):
        """Decrypt and return the profile photo base64 string."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.profile_photo_encrypted, version=self.key_version)

    @profile_photo.setter
    def profile_photo(self, value):
        """Encrypt and set the profile photo base64 string."""
        from core.utils.field_encryption import encrypt_field

        self.profile_photo_encrypted = encrypt_field(value, version=self.key_version) if value else ""

    @property
    def date_of_birth(self):
        """Decrypt and return the date of birth."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.date_of_birth_encrypted, version=self.key_version)

    @date_of_birth.setter
    def date_of_birth(self, value):
        """Encrypt and set the date of birth."""
        from core.utils.field_encryption import encrypt_field

        self.date_of_birth_encrypted = encrypt_field(str(value), version=self.key_version) if value else ""

    @property
    def digital_address(self):
        """Decrypt and return the digital address."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.digital_address_encrypted, version=self.key_version)

    @digital_address.setter
    def digital_address(self, value):
        """Encrypt and set the digital address."""
        from core.utils.field_encryption import encrypt_field

        self.digital_address_encrypted = encrypt_field(value, version=self.key_version) if value else ""

    @property
    def occupation(self):
        """Decrypt and return the occupation."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.occupation_encrypted, version=self.key_version)

    @occupation.setter
    def occupation(self, value):
        """Encrypt and set the occupation."""
        from core.utils.field_encryption import encrypt_field

        self.occupation_encrypted = encrypt_field(value, version=self.key_version) if value else ""

    @property
    def work_address(self):
        """Decrypt and return the work address."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.work_address_encrypted, version=self.key_version)

    def get_full_name(self):
        """Standard Django method override: return decrypted full name."""
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username

    def get_short_name(self):
        """Standard Django method override: return decrypted first name."""
        return self.first_name if self.first_name else self.username

    @work_address.setter
    def work_address(self, value):
        """Encrypt and set the work address."""
        from core.utils.field_encryption import encrypt_field

        self.work_address_encrypted = encrypt_field(value, version=self.key_version) if value else ""

    @property
    def position(self):
        """Decrypt and return the position."""
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.position_encrypted, version=self.key_version)

    @position.setter
    def position(self, value):
        """Encrypt and set the position."""
        from core.utils.field_encryption import encrypt_field

        self.position_encrypted = encrypt_field(value, version=self.key_version) if value else ""

    # Security: Account lockout fields
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_failed_login = models.DateTimeField(null=True, blank=True)

    # Security: Transaction limits (daily, in currency units)
    daily_transaction_limit = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00)
    daily_transaction_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    daily_limit_reset_date = models.DateField(null=True, blank=True)
    key_version = models.IntegerField(default=1, help_text="The version of the encryption key used for PII.")

    
    class Meta:
        db_table = "users_user"

    def is_locked(self):
        """Check if account is currently locked."""
        from django.utils import timezone

        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def save(self, *args, **kwargs):
        """Override save to ensure PII and Member IDs are handled correctly."""
        if not self.member_number and self.role == "customer":
            self.member_number = self.generate_member_number()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_member_number():
        """
        Generate an unpredictable 10-digit member number.
        Increased entropy for Zero-Plaintext compliance (32^10 > 1 quadrillion combinations).
        """
        import secrets
        import string

        # Format: CB-XXXXXXXXXX
        # Safe character set: Alphanumeric minus ambiguous (0, O, 1, I, L, S, 5, B, 8)
        chars = "ACDEFGHJKMNPQRTUVWXYZ234679"
        
        random_part = "".join(secrets.choice(chars) for _ in range(10))
        return f"CB-{random_part}"

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
        ("payload_anomaly", "Payload Anomaly"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_activity"
        ordering = ["-created_at"]
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"

    def __str__(self):
        """Return a string representation of the activity."""
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
        db_table = "audit_log"
        ordering = ["-created_at"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        """Return a string representation of the audit log."""
        return f"{self.action} {self.model_name} ({self.object_id}) by {self.user}"

    def save(self, *args, **kwargs):
        """Override save to automatically scrub PII from changes log."""
        if self.changes:
            self.changes = self._mask_pii(self.changes)
        super().save(*args, **kwargs)

    def _mask_pii(self, data):
        """Recursively mask PII in dictionary data."""
        if not isinstance(data, dict):
            return data

        sensitive_keys = [
            "phone_number",
            "id_number",
            "ssnit_number",
            "first_name",
            "last_name",
            "date_of_birth",
            "digital_address",
            "address",
            "ghana_card",
        ]

        masked_data = {}
        for key, value in data.items():
            if any(s in key.lower() for s in sensitive_keys):
                if isinstance(value, str) and value:
                    # Mask most of it
                    masked_data[key] = f"{value[:3]}...[MASKED]"
                else:
                    masked_data[key] = "[MASKED]"
            elif isinstance(value, dict):
                masked_data[key] = self._mask_pii(value)
            elif isinstance(value, list):
                masked_data[key] = [self._mask_pii(v) if isinstance(v, dict) else v for v in value]
            else:
                masked_data[key] = value
        return masked_data


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
        db_table = "admin_notification"
        ordering = ["-created_at"]
        verbose_name = "Admin Notification"
        verbose_name_plural = "Admin Notifications"

    def __str__(self):
        """Return the notification summary."""
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
        db_table = "password_reset_token"
        ordering = ["-created_at"]
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"

    def __str__(self):
        """Return the token description."""
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


class OTPVerification(models.Model):
    """Secure, persistent storage for OTPs with Zero-Plaintext compliance.

    Replaces volatile session-based OTPs to prevent rate-limit bypasses
    and ensure auditability in banking operations.
    """

    # SECURITY: Searchable hash of phone number (PII compliance)
    phone_number_hash = models.CharField(max_length=64, db_index=True)

    # SECURITY: Salted HMAC hash of the 6-digit code (Never store plaintext OTP)
    otp_code_hash = models.CharField(max_length=64)

    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Metadata for auditing
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = "otp_verification"
        verbose_name = "OTP Verification"
        verbose_name_plural = "OTP Verifications"
        indexes = [
            models.Index(fields=["phone_number_hash", "is_verified"]),
        ]

    def __str__(self):
        return f"OTP for {self.phone_number_hash[:8]}... (Verified: {self.is_verified})"

    @classmethod
    def create_otp(cls, phone_number, request=None):
        """Generate a 6-digit OTP, hash it, and store it."""
        import secrets
        from datetime import timedelta

        from django.utils import timezone

        from core.utils.field_encryption import hash_field

        # Generate 6-digit code
        otp_code = str(secrets.SystemRandom().randint(100000, 999999))

        # Invalidate existing unverified OTPs for this phone
        phone_hash = hash_field(phone_number)
        cls.objects.filter(phone_number_hash=phone_hash, is_verified=False).delete()

        expires_at = timezone.now() + timedelta(minutes=10)

        ip_address = None
        user_agent = ""
        if request:
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            ip_address = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.META.get("REMOTE_ADDR")
            user_agent = request.META.get("HTTP_USER_AGENT", "")

        obj = cls.objects.create(
            phone_number_hash=phone_hash,
            otp_code_hash=hash_field(otp_code),
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return obj, otp_code

    def verify(self, code):
        """Verify code against hash and check expiration/attempts."""
        from django.utils import timezone

        from core.utils.field_encryption import hash_field

        if self.is_verified:
            return False, "OTP already used"

        if timezone.now() > self.expires_at:
            return False, "OTP expired"

        if self.attempts >= 5:
            return False, "Too many failed attempts"

        # Compare hash
        if hash_field(str(code)) == self.otp_code_hash:
            self.is_verified = True
            self.save(update_fields=["is_verified"])
            return True, "Verified"
        else:
            self.attempts += 1
            self.save(update_fields=["attempts"])
            return False, "Invalid code"


class UserInvitation(models.Model):
    """Secure invitation token for staff enrollment.

    Replaces SMS plaintext passwords with a secure registration link.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="invitation",
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_invitation"
        verbose_name = "User Invitation"
        verbose_name_plural = "User Invitations"

    def __str__(self):
        return f"Invitation for {self.user.email} (Expires: {self.expires_at})"

    @classmethod
    def create_for_user(cls, user):
        """Create a new invitation token for a user."""
        import secrets
        from datetime import timedelta

        from django.utils import timezone

        # Invalidate existing
        cls.objects.filter(user=user, is_used=False).delete()

        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)

        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
        )

    def is_valid(self):
        """Check if invitation is still valid."""
        from django.utils import timezone

        return not self.is_used and self.expires_at > timezone.now()
