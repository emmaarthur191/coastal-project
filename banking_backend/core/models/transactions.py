"""Transaction-related models for Coastal Banking."""

from django.conf import settings
from django.db import models


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("deposit", "Deposit"),
        ("withdrawal", "Withdrawal"),
        ("transfer", "Transfer"),
        ("payment", "Payment"),
        ("repayment", "Loan Repayment"),
        ("fee", "Fee"),
    ]

    STATUS_CHOICES = [
        ("pending_approval", "Pending Approval"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
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
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_transactions",
    )
    approval_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "core_transaction"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["from_account", "-timestamp"], name="tx_from_idx"),
            models.Index(fields=["to_account", "-timestamp"], name="tx_to_idx"),
            models.Index(fields=["status", "-timestamp"], name="tx_status_idx"),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} ({self.status})"


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
        db_table = "core_checkdeposit"
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
    transaction = models.ForeignKey(
        Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name="refunds"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="processed_refunds"
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_refund"
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
        db_table = "core_accountstatement"
        ordering = ["-created_at"]
        verbose_name = "Account Statement"
        verbose_name_plural = "Account Statements"

    def __str__(self):
        return f"Statement for {self.account.account_number} ({self.start_date} to {self.end_date})"
