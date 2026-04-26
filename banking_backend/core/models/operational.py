"""Operational models for Coastal Banking.

Includes service requests, cash management, and staff assignments.
"""

from django.conf import settings
from django.db import models


class ServiceCharge(models.Model):
    """Model for configurable service charges."""

    CHARGE_TYPES = [
        ("fixed", "Fixed Amount"),
        ("percentage", "Percentage"),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    charge_type = models.CharField(max_length=20, choices=CHARGE_TYPES, default="fixed")
    rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount or Percentage")
    applicable_to = models.JSONField(default=list, help_text="List of account types/services this applies to")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_charge"

    def __str__(self):
        return f"{self.name} ({self.charge_type}: {self.rate})"


class ServiceRequest(models.Model):
    """Service requests from customers (statements, checkbooks, cards, etc.)."""

    REQUEST_TYPES = [
        ("statement", "Account Statement"),
        ("checkbook", "Cheque Book"),
        ("card_replacement", "Card Replacement"),
        ("account_closure", "Account Closure"),
        ("address_change", "Address Change"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
        ("cancelled", "Cancelled"),
    ]

    DELIVERY_METHODS = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("pickup", "Branch Pickup"),
        ("mail", "Postal Mail"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_requests")
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPES)
    description = models.TextField(blank=True)
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS, default="email")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="processed_requests"
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_request"
        ordering = ["-created_at"]
        verbose_name = "Service Request"
        verbose_name_plural = "Service Requests"

    def __str__(self):
        return f"{self.user.email} - {self.request_type} ({self.status})"


class Complaint(models.Model):
    """Customer complaints."""

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    CATEGORY_CHOICES = [
        ("account", "Account Issues"),
        ("transaction", "Transaction Issues"),
        ("service", "Service Quality"),
        ("staff", "Staff Behavior"),
        ("technical", "Technical Issues"),
        ("fees", "Fees and Charges"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="complaints")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    resolution = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_complaints"
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="resolved_complaints"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "complaint"
        ordering = ["-created_at"]
        verbose_name = "Complaint"
        verbose_name_plural = "Complaints"

    def __str__(self):
        return f"Complaint #{self.id} - {self.subject} ({self.status})"


class Device(models.Model):
    """Model for registered devices for push notifications."""

    DEVICE_TYPES = [
        ("web", "Web Browser"),
        ("android", "Android"),
        ("ios", "iOS"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="devices")
    device_token = models.CharField(max_length=500)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default="web")
    device_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "device"
        ordering = ["-last_used_at"]
        verbose_name = "Device"
        verbose_name_plural = "Devices"
        unique_together = ["user", "device_token"]

    def __str__(self):
        return f"{self.user.email} - {self.device_type} ({self.device_name or 'Unknown'})"


class CashAdvance(models.Model):
    """Short-term credit for users."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("disbursed", "Disbursed"),
        ("repaid", "Repaid"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cash_advances")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_cash_advances",
        help_text="Staff member who created this cash advance request",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_cash_advances",
    )
    repayment_date = models.DateField(null=True, blank=True)
    repaid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cash_advance"
        ordering = ["-created_at"]
        verbose_name = "Cash Advance"
        verbose_name_plural = "Cash Advances"

    def __str__(self):
        return f"Cash Advance: {self.user.email} - {self.amount} ({self.status})"


class CashDrawer(models.Model):
    """Physical cash drawer management for cashiers."""

    STATUS_CHOICES = [
        ("open", "Open"),
        ("closed", "Closed"),
        ("reconciled", "Reconciled"),
    ]

    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cash_drawers")
    drawer_number = models.CharField(max_length=20)
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "cash_drawer"
        ordering = ["-opened_at"]
        verbose_name = "Cash Drawer"
        verbose_name_plural = "Cash Drawers"

    def __str__(self):
        return f"Drawer {self.drawer_number} - {self.cashier.email} ({self.status})"


class CashDrawerDenomination(models.Model):
    """Denomination breakdown for cash drawer reconciliation."""

    cash_drawer = models.ForeignKey(CashDrawer, on_delete=models.CASCADE, related_name="denominations")
    denomination = models.DecimalField(max_digits=10, decimal_places=2)
    count = models.PositiveIntegerField(default=0)
    is_opening = models.BooleanField(default=True)

    class Meta:
        db_table = "cash_drawer_denomination"
        ordering = ["-denomination"]
        verbose_name = "Denomination"
        verbose_name_plural = "Denominations"

    @property
    def total(self):
        return self.denomination * self.count

    def __str__(self):
        return f"₵{self.denomination} x {self.count} = ₵{self.total}"


class VisitSchedule(models.Model):
    """Model for scheduling mobile banker visits."""

    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("missed", "Missed"),
    ]

    mobile_banker = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="visit_schedules"
    )
    client_name_encrypted = models.TextField(blank=True, default="")
    location_encrypted = models.TextField(blank=True, default="")

    @property
    def client_name(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.client_name_encrypted)

    @client_name.setter
    def client_name(self, value):
        from core.utils.field_encryption import encrypt_field

        self.client_name_encrypted = encrypt_field(value) if value else ""

    @property
    def location(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.location_encrypted)

    @location.setter
    def location(self, value):
        from core.utils.field_encryption import encrypt_field

        self.location_encrypted = encrypt_field(value) if value else ""

    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    notes = models.TextField(blank=True)
    check_in_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    check_in_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "visit_schedule"
        ordering = ["-scheduled_time"]

    def __str__(self):
        return f"Visit to {self.client_name} by {self.mobile_banker.username} on {self.scheduled_time}"


class ClientAssignment(models.Model):
    """Track which clients are assigned to mobile bankers."""

    STATUS_CHOICES = [
        ("pending", "Pending Visit"),
        ("due_payment", "Due Payment"),
        ("overdue_payment", "Overdue Payment"),
        ("loan_application", "Loan Application"),
        ("account_opening", "Account Opening"),
        ("follow_up", "Follow Up"),
        ("completed", "Completed"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    mobile_banker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_clients",
        limit_choices_to={"role": "mobile_banker"},
    )
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assigned_to_bankers")
    # NOTE: client_name is no longer cached here. Always derive from self.client.get_full_name().
    # This eliminates the stale-data risk when user names change.
    location_encrypted = models.TextField(blank=True, default="")

    @property
    def location(self):
        from core.utils.field_encryption import decrypt_field

        return decrypt_field(self.location_encrypted)

    @location.setter
    def location(self, value):
        from core.utils.field_encryption import encrypt_field

        self.location_encrypted = encrypt_field(value) if value else ""

    # Convenience read-only property so serializers and templates can call assignment.client_name
    @property
    def client_name(self) -> str:
        """Derive client name from the FK relation (always fresh, never stale)."""
        if self.client_id:
            return self.client.get_full_name() or self.client.email
        return ""

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    amount_due = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    next_visit = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "client_assignment"
        ordering = ["-priority", "next_visit"]
        verbose_name = "Client Assignment"
        verbose_name_plural = "Client Assignments"
        unique_together = ["mobile_banker", "client"]

    def save(self, *args, **kwargs):
        """Automatically set priority based on status and debt levels."""
        if self.status == "overdue_payment":
            self.priority = "urgent"
        elif self.status in ["due_payment", "loan_application"]:
            # Upgrade to high if not already urgent
            if self.priority != "urgent":
                self.priority = "high"
        elif self.amount_due and self.amount_due > 1000:
            if self.priority not in ["urgent", "high"]:
                self.priority = "high"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client_name or self.client.email} assigned to {self.mobile_banker.email}"


class SystemAlert(models.Model):
    """Dedicated model for security and system critical alerts."""

    ALERT_TYPES = [
        ("security", "Security Incident"),
        ("performance", "Performance Degradation"),
        ("reliability", "Infrastructure Failure"),
    ]

    SEVERITY_LEVELS = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, default="security")
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default="medium")
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_active = models.BooleanField(default=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "system_alert"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"
