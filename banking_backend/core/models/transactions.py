from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("deposit", "Deposit"),
        ("withdrawal", "Withdrawal"),
        ("transfer", "Transfer"),
        ("payment", "Payment"),
        ("repayment", "Loan Repayment"),
        ("fee", "Fee"),
        ("disbursement", "Loan Disbursement"),
    ]

    STATUS_CHOICES = [
        ("pending_approval", "Pending Approval"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
        ("reversed", "Reversed"),
    ]

    from_account = models.ForeignKey(
        "core.Account", on_delete=models.CASCADE, related_name="outgoing_transactions", null=True, blank=True
    )
    to_account = models.ForeignKey(
        "core.Account", on_delete=models.CASCADE, related_name="incoming_transactions", null=True, blank=True
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="completed")
    timestamp = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    # Maker-Checker (4-Eyes Principle) fields
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_transactions",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_transactions",
    )
    approval_date = models.DateTimeField(null=True, blank=True)

    is_flagged_for_review = models.BooleanField(
        default=False, help_text="Manually or automatically flagged for manager intervention."
    )
    is_stale = models.BooleanField(
        default=False, help_text="Transaction has exceeded the 24-hour approval window."
    )

    class Meta:
        db_table = "transaction"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["from_account", "-timestamp"], name="tx_from_idx"),
            models.Index(fields=["to_account", "-timestamp"], name="tx_to_idx"),
            models.Index(fields=["status", "-timestamp"], name="tx_status_idx"),
            models.Index(fields=["is_stale"], name="tx_stale_idx"),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} ({self.status})"

    def clean(self):
        """Enforce Maker-Checker (4-Eyes Principle) and threshold rules."""
        super().clean()

        threshold = getattr(settings, "TRANSACTION_APPROVAL_THRESHOLD", 5000.00)

        # 1. Enforce Approval for high-value transactions
        if self.amount >= threshold:
            if self.status == "completed" and not self.approved_by:
                raise ValidationError(
                    f"Transactions over {threshold} require manager approval before completion."
                )

        # 2. Enforce 4-Eyes Principle (Maker cannot be Checker)
        if self.approved_by and self.processed_by:
            if self.approved_by == self.processed_by:
                raise ValidationError(
                    "4-Eyes Principle Violation: The processor and approver must be distinct staff members."
                )

        # 3. Ensure approved_by is set if status is completed for high-value tx
        if self.status == "completed" and self.amount >= threshold and not self.approved_by:
             raise ValidationError("Approved by must be set for high-value completed transactions.")

    def save(self, *args, **kwargs):
        """Override save to handle dynamic status transitions based on threshold."""
        threshold = getattr(settings, "TRANSACTION_APPROVAL_THRESHOLD", 5000.00)

        # Force 'pending_approval' for New high-value transactions if not already approved
        if not self.pk and self.amount >= threshold and not self.approved_by:
            self.status = "pending_approval"

        # Set approval date if newly approved
        if self.approved_by and not self.approval_date:
            self.approval_date = timezone.now()

        # Run full validation
        self.full_clean()
        super().save(*args, **kwargs)


class CheckDeposit(models.Model):
    """Check deposit processing and tracking."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("cleared", "Cleared"),
    ]

    account = models.ForeignKey("core.Account", on_delete=models.CASCADE, related_name="check_deposits")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    check_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=100)
    routing_number = models.CharField(max_length=20, blank=True)
    front_image = models.ImageField(upload_to="check_deposits/front/", null=True, blank=True)
    back_image = models.ImageField(upload_to="check_deposits/back/", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    rejection_reason = models.TextField(blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_check_deposits",
    )
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_check_deposits",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    cleared_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "check_deposit"
        ordering = ["-created_at"]
        verbose_name = "Check Deposit"
        verbose_name_plural = "Check Deposits"

    def __str__(self):
        return f"Check #{self.check_number} - {self.amount} ({self.status})"


class Refund(models.Model):
    """Refund requests from customers."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("processed", "Processed"),
    ]

    REASON_CHOICES = [
        ("duplicate_charge", "Duplicate Charge"),
        ("unauthorized", "Unauthorized Transaction"),
        ("service_issue", "Service Issue"),
        ("product_return", "Product Return"),
        ("billing_error", "Billing Error"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="refunds")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="initiated_refunds",
        help_text="Staff member who initiated the refund request for the customer.",
    )
    transaction = models.ForeignKey(
        Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name="refunds"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)

    # IDENTITY VERIFICATION (Maker Metadata)
    id_type = models.CharField(max_length=50, default="ghana_card")
    id_number_encrypted = models.TextField(blank=True, default="")
    id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    verification_notes = models.TextField(blank=True, help_text="Notes from physical ID verification")

    @property
    def id_number(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.id_number_encrypted)

    @id_number.setter
    def id_number(self, value):
        from core.utils.field_encryption import encrypt_field, hash_field
        self.id_number_encrypted = encrypt_field(value) if value else ""
        self.id_number_hash = hash_field(value) if value else ""

    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="processed_refunds"
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "refund"
        ordering = ["-created_at"]
        verbose_name = "Refund"
        verbose_name_plural = "Refunds"

    def __str__(self):
        return f"Refund #{self.id} - {self.user.email} ({self.status})"


class AccountStatement(models.Model):
    """Auto-generated account statements for customers."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("generated", "Generated"),
        ("failed", "Failed"),
    ]

    account = models.ForeignKey("core.Account", on_delete=models.CASCADE, related_name="statements")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="requested_statements"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    pdf_file = models.FileField(upload_to="statements/", null=True, blank=True)
    transaction_count = models.IntegerField(default=0)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    closing_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "account_statement"
        ordering = ["-created_at"]
        verbose_name = "Account Statement"
        verbose_name_plural = "Account Statements"

    def __str__(self):
        return f"Statement for {self.account.account_number} ({self.start_date} to {self.end_date})"
