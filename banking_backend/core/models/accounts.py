"""Account-related models for Coastal Banking."""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Sum


class Account(models.Model):
    ACCOUNT_TYPES = [
        ("daily_susu", "Daily Savings"),
        ("member_savings", "Member Savings"),
        ("youth_savings", "Youth Savings"),
        ("shares", "Shares"),
    ]

    # Precision constant for financial calculations (2 decimal places)
    TWOPLACES = Decimal("0.01")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="accounts")
    account_number = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=25, choices=ACCOUNT_TYPES, default="daily_susu")
    # Initial balance set at account opening (before any transactions)
    initial_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_account"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="account_user_created_idx"),
            models.Index(fields=["account_type", "is_active"], name="account_type_active_idx"),
            models.Index(fields=["is_active", "-balance"], name="account_active_balance_idx"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.account_number} ({self.account_type})"

    @property
    def calculated_balance(self):
        """Calculate balance dynamically from completed transactions."""
        # Deposits (money coming in)
        deposits = self.incoming_transactions.filter(status="completed").aggregate(total=Sum("amount"))[
            "total"
        ] or Decimal("0.00")

        # Withdrawals (money going out)
        withdrawals = self.outgoing_transactions.filter(status="completed").aggregate(total=Sum("amount"))[
            "total"
        ] or Decimal("0.00")

        result = self.initial_balance + deposits - withdrawals
        return result.quantize(self.TWOPLACES)

    def update_balance_from_transactions(self):
        """Update the stored balance field from transactions."""
        self.balance = self.calculated_balance
        self.save(update_fields=["balance", "updated_at"])


class AccountOpeningRequest(models.Model):
    """Model for storing account opening requests with customer information and photo."""

    ACCOUNT_TYPES = [
        ("daily_susu", "Daily Susu"),
        ("shares", "Shares"),
        ("monthly_contribution", "Monthly Contribution"),
    ]

    CARD_TYPES = [
        ("standard", "Standard Card"),
        ("gold", "Gold Card"),
        ("platinum", "Platinum Card"),
        ("none", "No Card Required"),
    ]

    ID_TYPES = [
        ("ghana_card", "Ghana Card"),
        ("voter_id", "Voter ID"),
        ("passport", "Passport"),
        ("drivers_license", "Driver's License"),
        ("nhis_card", "NHIS Card"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    # Account Details
    account_type = models.CharField(max_length=25, choices=ACCOUNT_TYPES, default="daily_susu")
    card_type = models.CharField(max_length=20, choices=CARD_TYPES, default="standard")
    initial_deposit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Initial deposit amount (optional, can be 0)",
    )

    # ID Information
    id_type = models.CharField(max_length=20, choices=ID_TYPES, default="ghana_card")

    # Personal Information (Encrypted)
    first_name_encrypted = models.TextField(blank=True, default="")
    last_name_encrypted = models.TextField(blank=True, default="")
    date_of_birth_encrypted = models.TextField(blank=True, default="")  # Stored as ISO string
    address_encrypted = models.TextField(blank=True, default="")

    @property
    def first_name(self):
        from core.utils.field_encryption import decrypt_field

        val = decrypt_field(self.first_name_encrypted)
        return val if val else ""

    @first_name.setter
    def first_name(self, value):
        from core.utils.field_encryption import encrypt_field

        self.first_name_encrypted = encrypt_field(value) if value else ""

    @property
    def last_name(self):
        from core.utils.field_encryption import decrypt_field

        val = decrypt_field(self.last_name_encrypted)
        return val if val else ""

    @last_name.setter
    def last_name(self, value):
        from core.utils.field_encryption import encrypt_field

        self.last_name_encrypted = encrypt_field(value) if value else ""

    @property
    def date_of_birth(self):
        from datetime import datetime

        from core.utils.field_encryption import decrypt_field

        val = decrypt_field(self.date_of_birth_encrypted)
        if val:
            try:
                return datetime.strptime(val, "%Y-%m-%d").date()
            except ValueError:
                return None
        return None

    @date_of_birth.setter
    def date_of_birth(self, value):
        from core.utils.field_encryption import encrypt_field

        if value:
            str_val = value.strftime("%Y-%m-%d") if hasattr(value, "strftime") else str(value)
            self.date_of_birth_encrypted = encrypt_field(str_val)
        else:
            self.date_of_birth_encrypted = ""

    @property
    def address(self):
        from core.utils.field_encryption import decrypt_field

        val = decrypt_field(self.address_encrypted)
        return val if val else ""

    @address.setter
    def address(self, value):
        from core.utils.field_encryption import encrypt_field

        self.address_encrypted = encrypt_field(value) if value else ""

    email = models.EmailField(default="", help_text="Customer email for login credentials")

    # Employment Information (Encrypted)
    occupation_encrypted = models.TextField(blank=True, default="")
    work_address_encrypted = models.TextField(blank=True, default="")
    position_encrypted = models.TextField(blank=True, default="")

    @property
    def occupation(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.occupation_encrypted)

    @occupation.setter
    def occupation(self, value):
        from core.utils.field_encryption import encrypt_field

        self.occupation_encrypted = encrypt_field(value) if value else ""

    @property
    def work_address(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.work_address_encrypted)

    @work_address.setter
    def work_address(self, value):
        from core.utils.field_encryption import encrypt_field

        self.work_address_encrypted = encrypt_field(value) if value else ""

    @property
    def position(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.position_encrypted)

    @position.setter
    def position(self, value):
        from core.utils.field_encryption import encrypt_field

        self.position_encrypted = encrypt_field(value) if value else ""

    # Location Information (Encrypted)
    digital_address_encrypted_val = models.TextField(
        blank=True, default=""
    )  # Avoid conflict with existing digital_address charfield if any
    location_encrypted = models.TextField(blank=True, default="")

    @property
    def digital_address(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.digital_address_encrypted_val)

    @digital_address.setter
    def digital_address(self, value):
        from core.utils.field_encryption import encrypt_field

        self.digital_address_encrypted_val = encrypt_field(value) if value else ""

    @property
    def location(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.location_encrypted)

    @location.setter
    def location(self, value):
        from core.utils.field_encryption import encrypt_field

        self.location_encrypted = encrypt_field(value) if value else ""

    # Next of Kin Details (Encrypted)
    next_of_kin_encrypted = models.TextField(blank=True, default="")

    @property
    def next_of_kin_data(self):
        import json

        from core.utils.field_encryption import decrypt_field

        val = decrypt_field(self.next_of_kin_encrypted)
        if val:
            try:
                return json.loads(val)
            except json.JSONDecodeError:
                return None
        return None

    @next_of_kin_data.setter
    def next_of_kin_data(self, value):
        import json

        from core.utils.field_encryption import encrypt_field

        if value:
            self.next_of_kin_encrypted = encrypt_field(json.dumps(value))
        else:
            self.next_of_kin_encrypted = ""

    # Photo (Encrypted Base64)
    photo_encrypted = models.TextField(blank=True, null=True, help_text="Encrypted Base64 encoded photo")

    @property
    def photo(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.photo_encrypted)

    @photo.setter
    def photo(self, value):
        from core.utils.field_encryption import encrypt_field

        self.photo_encrypted = encrypt_field(value) if value else ""

    # SECURITY: Encrypted storage for PII (Ghana DPA compliance)
    id_number_encrypted = models.TextField(blank=True, default="")
    phone_number_encrypted = models.TextField(blank=True, default="")

    # SECURITY: Searchable hashes for PII (Zero-Plaintext compliance)
    id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    phone_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)

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

    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_account_openings",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_account_openings",
    )

    # Related Account (created after approval)
    created_account = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True, related_name="opening_request"
    )

    # Credential Dispatch Tracking
    credentials_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="credential_approvals",
        help_text="Manager who approved the dispatch of login credentials",
    )
    credentials_sent_at = models.DateTimeField(null=True, blank=True)

    # Notes
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "core_accountopeningrequest"
        ordering = ["-created_at"]
        verbose_name = "Account Opening Request"
        verbose_name_plural = "Account Opening Requests"
        indexes = [
            models.Index(fields=["status", "-created_at"], name="acc_open_status_idx"),
            models.Index(fields=["submitted_by", "-created_at"], name="acc_open_sub_idx"),
        ]

    def __str__(self):
        return f"Account Opening #{self.id} - {self.first_name} {self.last_name} ({self.status})"

    def save(self, *args, **kwargs):
        """Override save to ensure super is called."""
        super().save(*args, **kwargs)


class AccountClosureRequest(models.Model):
    """Model for storing account closure requests with OTP verification."""

    CLOSURE_REASONS = [
        ("customer_request", "Customer Request"),
        ("account_inactive", "Account Inactive"),
        ("fraud_suspected", "Fraud Suspected"),
        ("compliance", "Compliance Issue"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    # Account being closed
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="closure_requests")

    # Closure Details
    closure_reason = models.CharField(max_length=30, choices=CLOSURE_REASONS)
    other_reason = models.TextField(blank=True)

    # Customer verification (Encrypted)
    phone_number_encrypted = models.TextField(blank=True, default="")

    @property
    def phone_number(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.phone_number_encrypted)

    @phone_number.setter
    def phone_number(self, value):
        from core.utils.field_encryption import encrypt_field

        self.phone_number_encrypted = encrypt_field(value) if value else ""

    otp_verified = models.BooleanField(default=False)

    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_account_closures",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_account_closures",
    )

    # Notes
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # Account balance at closure
    final_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "core_accountclosurerequest"
        ordering = ["-created_at"]
        verbose_name = "Account Closure Request"
        verbose_name_plural = "Account Closure Requests"

    def __str__(self):
        return f"Account Closure #{self.id} - Account {self.account.account_number} ({self.status})"
