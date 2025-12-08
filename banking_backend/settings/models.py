import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from users.models import User


class UserSettings(models.Model):
    """Comprehensive user settings beyond basic notifications."""

    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto'),
    ]

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('fr', 'French'),
        ('es', 'Spanish'),
        ('de', 'German'),
        ('zh', 'Chinese'),
    ]

    CURRENCY_CHOICES = [
        ('GHS', 'Ghanaian Cedi'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
    ]

    DATE_FORMAT_CHOICES = [
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
    ]

    TIME_FORMAT_CHOICES = [
        ('12h', '12 Hour'),
        ('24h', '24 Hour'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')

    # Appearance
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='auto')
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='GHS')
    date_format = models.CharField(max_length=15, choices=DATE_FORMAT_CHOICES, default='DD/MM/YYYY')
    time_format = models.CharField(max_length=5, choices=TIME_FORMAT_CHOICES, default='24h')

    # Dashboard preferences
    dashboard_layout = models.JSONField(default=dict, blank=True)  # Widget positions and sizes
    default_dashboard_view = models.CharField(max_length=50, default='overview')
    items_per_page = models.IntegerField(default=25)
    auto_refresh_interval = models.IntegerField(default=60)  # seconds

    # Transaction preferences
    default_transaction_type = models.CharField(max_length=20, default='deposit')
    require_transaction_confirmation = models.BooleanField(default=True)
    show_transaction_receipts = models.BooleanField(default=True)
    transaction_notification_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('1000.00'))

    # Security preferences
    session_timeout = models.IntegerField(default=30)  # minutes
    require_2fa = models.BooleanField(default=False)
    login_alerts = models.BooleanField(default=True)
    suspicious_activity_alerts = models.BooleanField(default=True)

    # Cashier-specific settings
    cash_drawer_shortcuts = models.BooleanField(default=True)
    auto_calculate_change = models.BooleanField(default=True)
    receipt_printer_enabled = models.BooleanField(default=False)
    receipt_printer_address = models.CharField(max_length=100, blank=True)

    # Notification preferences (extended)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    notification_sound = models.BooleanField(default=True)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    # Accessibility
    high_contrast_mode = models.BooleanField(default=False)
    large_text = models.BooleanField(default=False)
    screen_reader_optimized = models.BooleanField(default=False)
    keyboard_navigation = models.BooleanField(default=True)

    # Advanced settings
    advanced_mode = models.BooleanField(default=False)
    debug_mode = models.BooleanField(default=False)
    api_access_enabled = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['theme']),
            models.Index(fields=['language']),
        ]

    def __str__(self):
        return f"Settings for {self.user.email}"


class SystemSettings(models.Model):
    """System-wide configuration settings."""

    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('decimal', 'Decimal'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('choice', 'Choice'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='string')
    value = models.TextField()  # Store as string, cast as needed
    default_value = models.TextField(blank=True)

    # Validation
    choices = models.JSONField(default=list, blank=True)  # For choice type
    min_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    max_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)

    # Permissions
    is_public = models.BooleanField(default=False)
    required_role = models.CharField(max_length=20, default='administrator')

    # Metadata
    category = models.CharField(max_length=50, default='general')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_system_settings')

    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.key})"

    def get_value(self):
        """Get the typed value based on setting_type."""
        if self.setting_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'integer':
            try:
                return int(self.value)
            except ValueError:
                return 0
        elif self.setting_type == 'decimal':
            try:
                return Decimal(self.value)
            except:
                return Decimal('0.00')
        elif self.setting_type == 'json':
            import json
            try:
                return json.loads(self.value)
            except:
                return {}
        else:
            return self.value

    def set_value(self, value):
        """Set the value, converting to string."""
        if isinstance(value, bool):
            self.value = 'true' if value else 'false'
        elif isinstance(value, (int, float, Decimal)):
            self.value = str(value)
        elif isinstance(value, dict):
            import json
            self.value = json.dumps(value)
        else:
            self.value = str(value)

    def is_valid_value(self, value):
        """Validate the value against constraints."""
        if self.setting_type == 'choice' and self.choices:
            return str(value) in [str(choice) for choice in self.choices]

        if self.min_value is not None and isinstance(value, (int, float, Decimal)):
            if Decimal(str(value)) < self.min_value:
                return False

        if self.max_value is not None and isinstance(value, (int, float, Decimal)):
            if Decimal(str(value)) > self.max_value:
                return False

        return True


class APIUsage(models.Model):
    """Track API usage for analytics and rate limiting."""

    HTTP_METHODS = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_usage')
    endpoint = models.CharField(max_length=200)
    method = models.CharField(max_length=10, choices=HTTP_METHODS)

    # Request details
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    request_size = models.PositiveIntegerField(default=0)  # bytes
    response_size = models.PositiveIntegerField(default=0)  # bytes

    # Response details
    status_code = models.IntegerField()
    response_time = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)  # milliseconds
    error_message = models.TextField(blank=True)

    # Context
    api_version = models.CharField(max_length=10, default='v1')
    user_role = models.CharField(max_length=20)
    session_id = models.CharField(max_length=100, blank=True)

    # Timestamps
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['endpoint', '-timestamp']),
            models.Index(fields=['method']),
            models.Index(fields=['status_code']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.user.email} ({self.status_code})"


class APIRateLimit(models.Model):
    """Rate limiting configuration for API endpoints."""

    SCOPE_CHOICES = [
        ('user', 'Per User'),
        ('ip', 'Per IP Address'),
        ('global', 'Global'),
        ('endpoint', 'Per Endpoint'),
    ]

    TIME_UNITS = [
        ('second', 'Per Second'),
        ('minute', 'Per Minute'),
        ('hour', 'Per Hour'),
        ('day', 'Per Day'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    # Scope and limits
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='user')
    endpoint_pattern = models.CharField(max_length=200, help_text='Regex pattern for matching endpoints')
    methods = models.JSONField(default=list, blank=True)  # List of HTTP methods, empty means all

    # Rate limits
    requests_per_unit = models.IntegerField(default=100)
    time_unit = models.CharField(max_length=10, choices=TIME_UNITS, default='minute')
    burst_limit = models.IntegerField(default=10)  # Allow burst requests

    # Actions
    action_on_limit = models.CharField(max_length=20, default='block',
                                     choices=[('block', 'Block Request'), ('delay', 'Delay Request'), ('log', 'Log Only')])
    block_duration = models.IntegerField(default=60)  # seconds to block

    # Exceptions
    exempt_users = models.JSONField(default=list, blank=True)  # List of user IDs
    exempt_ips = models.JSONField(default=list, blank=True)  # List of IP addresses

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_rate_limits')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['scope']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.requests_per_unit}/{self.time_unit}"

    def matches_request(self, request, user=None):
        """Check if this rate limit applies to the given request."""
        import re

        # Check endpoint pattern
        if not re.match(self.endpoint_pattern, request.path):
            return False

        # Check HTTP method
        if self.methods and request.method not in self.methods:
            return False

        # Check exemptions
        if user and str(user.id) in self.exempt_users:
            return False

        client_ip = self._get_client_ip(request)
        if client_ip and client_ip in self.exempt_ips:
            return False

        return True

    def _get_client_ip(self, request):
        """Get the client IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class HealthCheck(models.Model):
    """Detailed health check results and history."""

    COMPONENT_TYPES = [
        ('api', 'API'),
        ('database', 'Database'),
        ('cache', 'Cache'),
        ('queue', 'Message Queue'),
        ('storage', 'Storage'),
        ('external_service', 'External Service'),
        ('system', 'System'),
    ]

    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
        ('unknown', 'Unknown'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    component_name = models.CharField(max_length=100)
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)

    # Health status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unknown')
    status_message = models.TextField(blank=True)
    response_time = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)  # milliseconds

    # Detailed metrics
    metrics = models.JSONField(default=dict, blank=True)  # CPU, memory, disk, etc.
    dependencies = models.JSONField(default=dict, blank=True)  # Status of dependencies

    # Check configuration
    check_url = models.URLField(blank=True)
    check_timeout = models.IntegerField(default=30)  # seconds
    check_interval = models.IntegerField(default=60)  # seconds

    # Alerting
    alert_enabled = models.BooleanField(default=True)
    alert_thresholds = models.JSONField(default=dict, blank=True)
    last_alert_sent = models.DateTimeField(null=True, blank=True)

    # History
    consecutive_failures = models.IntegerField(default=0)
    last_success = models.DateTimeField(null=True, blank=True)
    last_failure = models.DateTimeField(null=True, blank=True)

    # Metadata
    location = models.CharField(max_length=100, blank=True)
    environment = models.CharField(max_length=50, default='production')
    tags = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['component_type', 'component_name']
        indexes = [
            models.Index(fields=['component_type']),
            models.Index(fields=['status']),
            models.Index(fields=['environment']),
            models.Index(fields=['-updated_at']),
        ]
        unique_together = ['component_name', 'component_type', 'environment']

    def __str__(self):
        return f"{self.component_name} ({self.component_type}): {self.status}"

    def is_healthy(self):
        """Check if component is currently healthy."""
        return self.status == 'healthy'

    def should_alert(self):
        """Check if an alert should be sent."""
        if not self.alert_enabled:
            return False

        if self.status in ['critical', 'unknown']:
            return True

        if self.status == 'warning' and self.consecutive_failures > 2:
            return True

        return False

    def record_success(self):
        """Record a successful health check."""
        self.status = 'healthy'
        self.consecutive_failures = 0
        self.last_success = timezone.now()
        self.save()

    def record_failure(self, message='', response_time=None):
        """Record a failed health check."""
        self.status = 'critical'
        self.status_message = message
        if response_time:
            self.response_time = response_time
        self.consecutive_failures += 1
        self.last_failure = timezone.now()
        self.save()