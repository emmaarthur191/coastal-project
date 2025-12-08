import uuid
from datetime import datetime
from django.db import models
from users.models import User


class Workflow(models.Model):
    """Workflow model for managing operational processes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(default=datetime.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class WorkflowStep(models.Model):
    """Individual steps within a workflow."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='steps')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField()
    required_role = models.CharField(max_length=100)  # e.g., 'mobile_banker', 'operations_manager'
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=datetime.now)

    class Meta:
        ordering = ['order']
        unique_together = ['workflow', 'order']

    def __str__(self):
        return f"{self.workflow.name} - {self.name}"


class ClientKYC(models.Model):
    """Client KYC information and submissions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_name = models.CharField(max_length=255)
    client_id = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, default='Pending')
    submitted_by = models.ForeignKey(User, on_delete=models.PROTECT)
    submitted_at = models.DateTimeField(default=datetime.now)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_kyc')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    documents = models.JSONField()  # URLs to uploaded documents
    geotag = models.CharField(max_length=100, blank=True)  # e.g., "40.7128, -74.0060"
    workflow = models.ForeignKey(Workflow, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"KYC for {self.client_name} ({self.status})"


class FieldCollection(models.Model):
    """Field collection operations for mobile bankers."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_kyc = models.ForeignKey(ClientKYC, on_delete=models.CASCADE, related_name='field_collections')
    collected_by = models.ForeignKey(User, on_delete=models.PROTECT)
    collected_at = models.DateTimeField(default=datetime.now)
    location = models.CharField(max_length=100)  # Geotag or location description
    data = models.JSONField()  # Collected field data
    status = models.CharField(max_length=50, default='Collected')
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Field Collection for {self.client_kyc.client_name} by {self.collected_by.email}"


class Expense(models.Model):
    """Track operational expenses for the banking system."""
    EXPENSE_CATEGORIES = [
        ('office_supplies', 'Office Supplies'),
        ('utilities', 'Utilities'),
        ('rent', 'Rent'),
        ('salaries', 'Salaries'),
        ('marketing', 'Marketing'),
        ('maintenance', 'Maintenance'),
        ('insurance', 'Insurance'),
        ('travel', 'Travel'),
        ('training', 'Training'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date_incurred = models.DateField()
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(default=datetime.now)
    updated_at = models.DateTimeField(auto_now=True)
    receipt_url = models.URLField(blank=True, null=True)  # Optional receipt attachment
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    is_approved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date_incurred']
        indexes = [
            models.Index(fields=['-date_incurred']),
            models.Index(fields=['category']),
            models.Index(fields=['is_approved']),
        ]

    def __str__(self):
        return f"{self.category} - {self.amount} ({self.date_incurred})"


class VisitSchedule(models.Model):
    """Visit schedules for mobile bankers."""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]

    PURPOSE_CHOICES = [
        ('loan_follow_up', 'Loan Follow-up'),
        ('account_opening', 'Account Opening'),
        ('savings_collection', 'Savings Collection'),
        ('payment_collection', 'Payment Collection'),
        ('kyc_update', 'KYC Update'),
        ('general_inquiry', 'General Inquiry'),
        ('loan_application', 'Loan Application'),
        ('client_onboarding', 'Client Onboarding'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)  # Address or location description
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    assigned_to = models.ForeignKey(User, on_delete=models.PROTECT, related_name='assigned_visits')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_visits')
    created_at = models.DateTimeField(default=datetime.now)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(blank=True)
    geotag = models.CharField(max_length=100, blank=True)  # GPS coordinates when visit starts

    class Meta:
        ordering = ['scheduled_date', 'scheduled_time']
        indexes = [
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['purpose']),
        ]

    def __str__(self):
        return f"Visit to {self.client_name} on {self.scheduled_date} at {self.scheduled_time}"

    def mark_completed(self, completion_notes='', geotag=''):
        """Mark the visit as completed."""
        from django.utils import timezone
        self.status = 'completed'
        self.actual_end_time = timezone.now()
        self.completion_notes = completion_notes
        if geotag:
            self.geotag = geotag
        self.save()

    def start_visit(self, geotag=''):
        """Mark the visit as started."""
        from django.utils import timezone
        self.status = 'in_progress'
        self.actual_start_time = timezone.now()
        if geotag:
            self.geotag = geotag
        self.save()


class Message(models.Model):
    """Messages related to loan applications and operations."""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sent_operation_messages')
    recipient = models.ForeignKey(User, on_delete=models.PROTECT, related_name='received_messages', null=True, blank=True)
    subject = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=datetime.now)
    read_at = models.DateTimeField(null=True, blank=True)
    loan_application = models.ForeignKey('banking.LoanApplication', on_delete=models.CASCADE, related_name='messages', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_read']),
            models.Index(fields=['recipient']),
            models.Index(fields=['loan_application']),
        ]

    def __str__(self):
        return f"Message: {self.subject} ({self.created_at.date()})"

    def mark_as_read(self):
        """Mark the message as read."""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class Commission(models.Model):
    """Track commissions generated from various banking operations."""
    COMMISSION_TYPES = [
        ('deposit', 'Deposit Commission'),
        ('withdrawal', 'Withdrawal Commission'),
        ('transfer', 'Transfer Commission'),
        ('loan', 'Loan Commission'),
        ('other', 'Other Commission'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey('banking.Transaction', on_delete=models.CASCADE, related_name='commissions', null=True, blank=True)
    commission_type = models.CharField(max_length=50, choices=COMMISSION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Commission rate applied
    base_amount = models.DecimalField(max_digits=12, decimal_places=2)  # Amount commission was calculated from
    earned_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='commissions_earned')
    created_at = models.DateTimeField(default=datetime.now)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['commission_type']),
            models.Index(fields=['earned_by']),
        ]

    def __str__(self):
        return f"{self.commission_type} - {self.amount} ({self.created_at.date()})"


class CustomerAssignment(models.Model):
    """Track assignments of customers/users to mobile bankers."""

    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('reassigned', 'Reassigned'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_assignments')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_customers')
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments_made')

    # Assignment details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    assigned_at = models.DateTimeField(default=datetime.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    # Geolocation tracking
    assignment_location = models.CharField(max_length=100, blank=True, help_text="Geotag when assignment was made")
    last_location = models.CharField(max_length=100, blank=True, help_text="Last known location of mobile banker")

    # Performance tracking
    priority = models.CharField(max_length=10, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium')
    estimated_completion = models.DateTimeField(null=True, blank=True)
    actual_completion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_at']),
        ]
        unique_together = ['customer', 'assigned_to']  # One active assignment per customer-mobile banker pair

    def mark_completed(self, location='', notes=''):
        """Mark assignment as completed."""
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.actual_completion = timezone.now()
        if location:
            self.last_location = location
        if notes:
            self.notes = notes
        self.save()

    def update_location(self, location):
        """Update last known location."""
        self.last_location = location
        self.save()

    def __str__(self):
        return f"{self.customer.email} assigned to {self.assigned_to.email} ({self.status})"


class AssignmentHistory(models.Model):
    """History of assignment changes for audit trail."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(CustomerAssignment, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    change_type = models.CharField(max_length=50)  # assigned, reassigned, completed, etc.
    old_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    change_reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(default=datetime.now)
    location = models.CharField(max_length=100, blank=True)  # Geotag when change was made

    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['assignment', '-changed_at']),
            models.Index(fields=['changed_by']),
        ]

    def __str__(self):
        return f"Assignment {self.assignment.id} - {self.change_type} by {self.changed_by.email}"
