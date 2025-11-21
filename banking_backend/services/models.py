import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone


class ServiceRequest(models.Model):
    """Base model for all service requests."""

    REQUEST_TYPES = [
        ('checkbook', 'Checkbook Request'),
        ('statement', 'Statement Request'),
        ('loan_info', 'Loan Information Request'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('in_progress', 'In Progress'),
        ('fulfilled', 'Fulfilled'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='service_requests',
        help_text='Member requesting the service'
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_service_requests',
        help_text='Staff member who created the request'
    )
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    notes = models.TextField(blank=True, help_text='Additional notes or comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Approval and fulfillment tracking
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_requests'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    fulfilled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fulfilled_requests'
    )
    fulfilled_at = models.DateTimeField(null=True, blank=True)

    # Fee tracking
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    fee_paid = models.BooleanField(default=False)
    fee_paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['request_type', 'status']),
        ]

    def __str__(self):
        return f"{self.request_type} - {self.member.email} ({self.status})"

    def approve(self, approved_by_user):
        """Approve the service request."""
        self.status = 'approved'
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        self.save()

    def reject(self, approved_by_user, notes=None):
        """Reject the service request."""
        self.status = 'rejected'
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        if notes:
            self.notes += f"\nRejected: {notes}"
        self.save()

    def start_fulfillment(self):
        """Mark request as in progress."""
        self.status = 'in_progress'
        self.save()

    def complete_fulfillment(self, fulfilled_by_user):
        """Mark request as fulfilled."""
        self.status = 'fulfilled'
        self.fulfilled_by = fulfilled_by_user
        self.fulfilled_at = timezone.now()
        self.save()

    def cancel(self):
        """Cancel the service request."""
        self.status = 'cancelled'
        self.save()


class CheckbookRequest(ServiceRequest):
    """Model for checkbook ordering requests."""

    DELIVERY_CHOICES = [
        ('pickup', 'Pickup at Branch'),
        ('mail', 'Mail Delivery'),
        ('courier', 'Courier Delivery'),
    ]

    quantity = models.PositiveIntegerField(default=1, help_text='Number of checkbooks requested')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='pickup')
    delivery_address = models.TextField(blank=True, help_text='Delivery address if not pickup')
    special_instructions = models.TextField(blank=True, help_text='Special printing instructions')

    # Tracking
    order_number = models.CharField(max_length=50, blank=True, unique=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.request_type:
            self.request_type = 'checkbook'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Checkbook Request - {self.quantity} books for {self.member.email}"


class StatementRequest(ServiceRequest):
    """Model for account statement requests."""

    DELIVERY_CHOICES = [
        ('digital', 'Digital (Email)'),
        ('physical', 'Physical (Mail)'),
        ('both', 'Both Digital and Physical'),
    ]

    STATEMENT_TYPES = [
        ('monthly', 'Monthly Statement'),
        ('quarterly', 'Quarterly Statement'),
        ('annual', 'Annual Statement'),
        ('custom', 'Custom Date Range'),
    ]

    statement_type = models.CharField(max_length=20, choices=STATEMENT_TYPES, default='monthly')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='digital')
    start_date = models.DateField(null=True, blank=True, help_text='Start date for custom statements')
    end_date = models.DateField(null=True, blank=True, help_text='End date for custom statements')

    # Account information (if specific account requested)
    account_number = models.CharField(max_length=50, blank=True, help_text='Specific account number')

    # Delivery tracking
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    mailed = models.BooleanField(default=False)
    mailed_at = models.DateTimeField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.request_type:
            self.request_type = 'statement'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Statement Request - {self.statement_type} for {self.member.email}"


class LoanInfoRequest(ServiceRequest):
    """Model for loan information requests."""

    INFO_TYPES = [
        ('balance', 'Current Balance'),
        ('payment_history', 'Payment History'),
        ('terms', 'Loan Terms and Conditions'),
        ('amortization', 'Amortization Schedule'),
        ('full_details', 'Full Loan Details'),
    ]

    DELIVERY_CHOICES = [
        ('digital', 'Digital (Email)'),
        ('physical', 'Physical (Mail)'),
        ('in_person', 'In Person Review'),
    ]

    info_type = models.CharField(max_length=20, choices=INFO_TYPES)
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='digital')
    loan_account_number = models.CharField(max_length=50, help_text='Loan account number')

    # Privacy and authorization
    authorization_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_loan_requests'
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    # Information provided
    info_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True, help_text='Notes about information delivery')

    def save(self, *args, **kwargs):
        if not self.request_type:
            self.request_type = 'loan_info'
        super().save(*args, **kwargs)

    def verify_authorization(self, verified_by_user):
        """Verify member authorization for loan information."""
        self.authorization_verified = True
        self.verified_by = verified_by_user
        self.verified_at = timezone.now()
        self.save()

    def deliver_info(self, notes=None):
        """Mark information as delivered."""
        self.info_delivered = True
        self.delivered_at = timezone.now()
        if notes:
            self.delivery_notes = notes
        self.save()

    def __str__(self):
        return f"Loan Info Request - {self.info_type} for {self.member.email}"