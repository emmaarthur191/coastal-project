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
        db_table = "core_servicecharge"

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
        db_table = "core_servicerequest"
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
        db_table = "core_complaint"
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
        db_table = "core_device"
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_cashadvance"
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
        db_table = "core_cashdrawer"
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
        db_table = "core_cashdrawerdenomination"
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
    client_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")
    notes = models.TextField(blank=True)
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
    client_name = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=255, blank=True)
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

    def __str__(self):
        return f"{self.client_name or self.client.email} assigned to {self.mobile_banker.email}"

    def save(self, *args, **kwargs):
        if not self.client_name and self.client:
            self.client_name = f"{self.client.first_name} {self.client.last_name}".strip() or self.client.email
        super().save(*args, **kwargs)


class ClientRegistration(models.Model):
    """Registration applications submitted by mobile bankers."""

    STATUS_CHOICES = [
        ("pending_verification", "Pending Verification"),
        ("under_review", "Under Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    ACCOUNT_TYPE_CHOICES = [
        ("daily_susu", "Daily Savings"),
        ("member_savings", "Member Savings"),
        ("youth_savings", "Youth Savings"),
        ("shares", "Shares"),
    ]

    ID_TYPE_CHOICES = [
        ("ghana_card", "Ghana Card"),
        ("voters_id", "Voter's ID"),
        ("passport", "Passport"),
        ("drivers_license", "Driver's License"),
    ]

    registration_id = models.CharField(max_length=20, unique=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_registrations",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20)
    id_type = models.CharField(max_length=20, choices=ID_TYPE_CHOICES, default="ghana_card")
    id_number = models.CharField(max_length=50, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    work_address = models.TextField(blank=True)
    position = models.CharField(max_length=100, blank=True)
    account_type = models.CharField(max_length=25, choices=ACCOUNT_TYPE_CHOICES, default="daily_susu")
    digital_address = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    next_of_kin_data = models.JSONField(null=True, blank=True)
    id_document = models.FileField(upload_to="registration/ids/", null=True, blank=True)
    passport_picture = models.ImageField(upload_to="registration/passports/", null=True, blank=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="pending_verification")
    notes = models.TextField(blank=True)
    created_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registration_record",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "client_registration"
        ordering = ["-created_at"]
        verbose_name = "Client Registration"
        verbose_name_plural = "Client Registrations"

    def __str__(self):
        return f"{self.registration_id}: {self.first_name} {self.last_name}"
