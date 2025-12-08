import uuid
from datetime import date
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ReportTemplate(models.Model):
    """Template for report generation with customizable layouts."""

    TEMPLATE_TYPES = [
        ('transaction_summary', 'Transaction Summary'),
        ('cashier_activity', 'Cashier Activity Report'),
        ('compliance', 'Compliance Report'),
        ('financial_overview', 'Financial Overview'),
        ('custom', 'Custom Report'),
    ]

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')

    # Template configuration
    layout_config = models.JSONField(default=dict, blank=True)  # Layout settings
    filters_config = models.JSONField(default=dict, blank=True)  # Default filters
    columns_config = models.JSONField(default=dict, blank=True)  # Column definitions
    charts_config = models.JSONField(default=dict, blank=True)  # Chart configurations

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_report_templates')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['template_type']),
            models.Index(fields=['frequency']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.template_type})"


class Report(models.Model):
    """Generated report instances."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]

    FORMAT_CHOICES = [
        ('json', 'JSON'),
        ('html', 'HTML'),
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ReportTemplate, on_delete=models.PROTECT, related_name='reports')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Report parameters
    report_date = models.DateField(default=date.today)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    filters_applied = models.JSONField(default=dict, blank=True)

    # Generation details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='json')
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_reports')
    generated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Report data and files
    data = models.JSONField(default=dict, blank=True)  # Report data
    file_path = models.CharField(max_length=500, blank=True)  # Path to generated file
    file_size = models.PositiveIntegerField(null=True, blank=True)  # File size in bytes

    # Error handling
    error_message = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['report_date']),
            models.Index(fields=['template']),
            models.Index(fields=['generated_by']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.report_date}"

    def start_generation(self, user=None):
        """Mark report as started generation."""
        self.status = 'generating'
        self.generated_by = user or self.generated_by
        self.generated_at = timezone.now()
        self.save()

    def complete_generation(self, data=None, file_path=None):
        """Mark report as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if data:
            self.data = data
        if file_path:
            self.file_path = file_path
        self.save()

    def fail_generation(self, error_message=''):
        """Mark report as failed."""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.save()

    def is_expired(self):
        """Check if report has expired."""
        return self.expires_at and timezone.now() > self.expires_at


class ReportSchedule(models.Model):
    """Automated report scheduling and delivery."""

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]

    DELIVERY_METHODS = [
        ('email', 'Email'),
        ('dashboard', 'Dashboard Only'),
        ('api', 'API Access'),
        ('file_system', 'File System'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('expired', 'Expired'),
        ('error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='schedules')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Scheduling
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    next_run = models.DateTimeField()
    last_run = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Recipients and delivery
    recipients = models.JSONField(default=list, blank=True)  # List of email addresses or user IDs
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS, default='dashboard')
    delivery_config = models.JSONField(default=dict, blank=True)  # Additional delivery settings

    # Status and control
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)

    # Audit
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_report_schedules')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Error tracking
    last_error = models.TextField(blank=True)
    consecutive_failures = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['next_run']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['next_run']),
            models.Index(fields=['frequency']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.frequency})"

    def calculate_next_run(self):
        """Calculate the next run date based on frequency."""
        from dateutil.relativedelta import relativedelta

        if self.frequency == 'daily':
            self.next_run = self.next_run + relativedelta(days=1)
        elif self.frequency == 'weekly':
            self.next_run = self.next_run + relativedelta(weeks=1)
        elif self.frequency == 'monthly':
            self.next_run = self.next_run + relativedelta(months=1)
        elif self.frequency == 'quarterly':
            self.next_run = self.next_run + relativedelta(months=3)
        elif self.frequency == 'yearly':
            self.next_run = self.next_run + relativedelta(years=1)

    def should_run_now(self):
        """Check if the schedule should run now."""
        return self.status == 'active' and self.next_run <= timezone.now()

    def mark_run_started(self):
        """Mark that a run has started."""
        self.last_run = timezone.now()
        self.save()

    def mark_run_completed(self):
        """Mark that a run has completed successfully."""
        self.consecutive_failures = 0
        self.last_error = ''
        self.calculate_next_run()
        self.save()

    def mark_run_failed(self, error_message=''):
        """Mark that a run has failed."""
        self.consecutive_failures += 1
        self.last_error = error_message
        if self.consecutive_failures >= 5:  # Auto-pause after 5 failures
            self.status = 'error'
        self.save()

    def pause_schedule(self):
        """Pause the schedule."""
        self.status = 'paused'
        self.save()

    def resume_schedule(self):
        """Resume the schedule."""
        if self.status == 'paused':
            self.status = 'active'
            self.save()

    def is_expired(self):
        """Check if schedule has expired."""
        return self.expires_at and timezone.now() > self.expires_at


class ReportAnalytics(models.Model):
    """Analytics and metrics for reports."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.OneToOneField(Report, on_delete=models.CASCADE, related_name='analytics')

    # Transaction metrics
    total_transactions = models.PositiveIntegerField(default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    average_transaction_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Transaction breakdown
    deposits_count = models.PositiveIntegerField(default=0)
    withdrawals_count = models.PositiveIntegerField(default=0)
    transfers_count = models.PositiveIntegerField(default=0)
    fees_count = models.PositiveIntegerField(default=0)

    deposits_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    withdrawals_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    transfers_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    fees_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Cashier performance (if applicable)
    cashier_metrics = models.JSONField(default=dict, blank=True)

    # Trends and comparisons
    previous_period_comparison = models.JSONField(default=dict, blank=True)
    trend_data = models.JSONField(default=dict, blank=True)

    # Compliance metrics
    compliance_flags = models.JSONField(default=dict, blank=True)
    risk_indicators = models.JSONField(default=dict, blank=True)

    # Metadata
    calculated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['calculated_at']),
        ]

    def __str__(self):
        return f"Analytics for {self.report.title}"

    def calculate_metrics(self):
        """Calculate analytics metrics from report data."""
        # This would be implemented based on the report data structure
        # For now, placeholder implementation
