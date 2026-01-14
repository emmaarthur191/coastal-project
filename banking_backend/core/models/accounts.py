"""Account-related models for Coastal Banking."""

from decimal import Decimal

from django.conf import settings
from django.core.validators import FileExtensionValidator
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
        ordering = ["-created_at"]
        # Database indexes for query optimization
        indexes = [
            models.Index(fields=["user", "-created_at"], name="account_user_created_idx"),
            models.Index(fields=["account_type", "is_active"], name="account_type_active_idx"),
            models.Index(fields=["is_active", "-balance"], name="account_active_balance_idx"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.account_number} ({self.account_type})"

    @property
    def calculated_balance(self):
        """Calculate balance dynamically from completed transactions.

        Uses Decimal.quantize() to prevent floating-point precision issues
        following Python/Django best practices for financial calculations.
        """
        # Deposits (money coming in)
        deposits = self.incoming_transactions.filter(status="completed").aggregate(total=Sum("amount"))[
            "total"
        ] or Decimal("0.00")

        # Withdrawals (money going out)
        withdrawals = self.outgoing_transactions.filter(status="completed").aggregate(total=Sum("amount"))[
            "total"
        ] or Decimal("0.00")

        # Calculate with proper precision: initial + deposits - withdrawals
        # Use quantize to ensure exact 2 decimal places (banker's rounding)
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
        ("member_savings", "Member Savings"),
        ("youth_savings", "Youth Savings"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    ID_TYPES = [
        ("ghana_card", "Ghana Card"),
        ("passport", "Passport"),
        ("voter_id", "Voter ID"),
        ("drivers_license", "Driver's License"),
    ]

    # Customer Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True)

    # Contact Information
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)

    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)

    # Identification
    id_type = models.CharField(max_length=30, choices=ID_TYPES, default="ghana_card")
    id_number = models.CharField(max_length=50, blank=True)
    # SECURITY FIX: Validate file extensions to prevent malicious uploads
    id_document = models.ImageField(
        upload_to="id_documents/",
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "pdf"])],
    )

    # Customer Photo
    # SECURITY FIX: Validate file extensions to prevent malicious uploads
    customer_photo = models.ImageField(
        upload_to="customer_photos/",
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png"])],
    )

    # Account Details
    account_type = models.CharField(max_length=30, choices=ACCOUNT_TYPES, default="daily_susu")
    initial_deposit = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))

    # Employment/Occupation
    occupation = models.CharField(max_length=100, blank=True)
    employer_name = models.CharField(max_length=200, blank=True)
    employer_address = models.TextField(blank=True)

    # Next of Kin
    next_of_kin_name = models.CharField(max_length=200, blank=True)
    next_of_kin_phone = models.CharField(max_length=20, blank=True)
    next_of_kin_relationship = models.CharField(max_length=50, blank=True)

    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_account_requests",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_account_requests",
    )
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Account Opening Request"
        verbose_name_plural = "Account Opening Requests"

    def __str__(self):
        return f"Account Opening #{self.id} - {self.first_name} {self.last_name} ({self.status})"


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

    # Customer verification
    phone_number = models.CharField(max_length=20)
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
        ordering = ["-created_at"]
        verbose_name = "Account Closure Request"
        verbose_name_plural = "Account Closure Requests"

    def __str__(self):
        return f"Account Closure #{self.id} - Account {self.account.account_number} ({self.status})"
