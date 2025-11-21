import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from users.models import User


class PerformanceMetric(models.Model):
    """Performance metrics for monitoring system performance."""

    METRIC_TYPES = [
        ('response_time', 'Response Time'),
        ('throughput', 'Throughput'),
        ('error_rate', 'Error Rate'),
        ('cpu_usage', 'CPU Usage'),
        ('memory_usage', 'Memory Usage'),
        ('disk_usage', 'Disk Usage'),
        ('network_io', 'Network I/O'),
        ('transaction_volume', 'Transaction Volume'),
        ('active_users', 'Active Users'),
        ('queue_length', 'Queue Length'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    metric_name = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=15, decimal_places=4)
    unit = models.CharField(max_length=20, blank=True)  # e.g., 'ms', '%', 'requests/sec'
    timestamp = models.DateTimeField(default=timezone.now)

    # Context information
    service_name = models.CharField(max_length=100, blank=True)  # e.g., 'api', 'database', 'cache'
    endpoint = models.CharField(max_length=200, blank=True)  # API endpoint or component
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    # Additional metadata
    tags = models.JSONField(default=dict, blank=True)  # Custom tags for filtering
    metadata = models.JSONField(default=dict, blank=True)  # Additional context

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', '-timestamp']),
            models.Index(fields=['service_name', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.metric_name}: {self.value} {self.unit} ({self.timestamp})"


class SystemHealth(models.Model):
    """System health status and alerts."""

    HEALTH_STATUSES = [
        ('healthy', 'Healthy'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
        ('unknown', 'Unknown'),
    ]

    ALERT_TYPES = [
        ('performance', 'Performance Alert'),
        ('availability', 'Availability Alert'),
        ('capacity', 'Capacity Alert'),
        ('security', 'Security Alert'),
        ('compliance', 'Compliance Alert'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    component_name = models.CharField(max_length=100)  # e.g., 'database', 'api_server', 'cache'
    component_type = models.CharField(max_length=50)  # e.g., 'database', 'web_server', 'message_queue'

    # Health status
    status = models.CharField(max_length=20, choices=HEALTH_STATUSES, default='unknown')
    status_message = models.TextField(blank=True)
    last_check = models.DateTimeField(default=timezone.now)
    next_check = models.DateTimeField(null=True, blank=True)

    # Performance metrics
    response_time = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # in ms
    cpu_usage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # percentage
    memory_usage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # percentage
    disk_usage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # percentage
    active_connections = models.IntegerField(default=0)

    # Alert configuration
    alert_enabled = models.BooleanField(default=True)
    alert_thresholds = models.JSONField(default=dict, blank=True)  # e.g., {'cpu': 80, 'memory': 85}
    alert_contacts = models.JSONField(default=list, blank=True)  # List of user IDs or email addresses

    # Incident tracking
    incident_count = models.IntegerField(default=0)
    last_incident = models.DateTimeField(null=True, blank=True)
    downtime_minutes = models.IntegerField(default=0)  # Total downtime in minutes

    # Metadata
    location = models.CharField(max_length=100, blank=True)  # Server location or region
    version = models.CharField(max_length=50, blank=True)  # Software version
    tags = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['component_name']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['component_type']),
            models.Index(fields=['last_check']),
        ]
        unique_together = ['component_name', 'component_type']

    def __str__(self):
        return f"{self.component_name} ({self.component_type}): {self.status}"

    def is_healthy(self):
        """Check if component is currently healthy."""
        return self.status == 'healthy'

    def needs_alert(self):
        """Check if an alert should be triggered based on thresholds."""
        if not self.alert_enabled:
            return False

        thresholds = self.alert_thresholds
        if not thresholds:
            return False

        # Check CPU threshold
        if 'cpu' in thresholds and self.cpu_usage and self.cpu_usage > thresholds['cpu']:
            return True

        # Check memory threshold
        if 'memory' in thresholds and self.memory_usage and self.memory_usage > thresholds['memory']:
            return True

        # Check response time threshold
        if 'response_time' in thresholds and self.response_time and self.response_time > thresholds['response_time']:
            return True

        return False

    def record_incident(self):
        """Record a new incident."""
        self.incident_count += 1
        self.last_incident = timezone.now()
        self.save()


class DashboardWidget(models.Model):
    """Customizable dashboard widgets for performance monitoring."""

    WIDGET_TYPES = [
        ('chart', 'Chart'),
        ('metric', 'Metric'),
        ('table', 'Table'),
        ('alert', 'Alert Panel'),
        ('status', 'Status Indicator'),
    ]

    CHART_TYPES = [
        ('line', 'Line Chart'),
        ('bar', 'Bar Chart'),
        ('area', 'Area Chart'),
        ('pie', 'Pie Chart'),
        ('gauge', 'Gauge Chart'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    chart_type = models.CharField(max_length=20, choices=CHART_TYPES, blank=True, null=True)

    # Widget configuration
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    position_x = models.IntegerField(default=0)  # Grid position
    position_y = models.IntegerField(default=0)
    width = models.IntegerField(default=4)  # Grid width (1-12)
    height = models.IntegerField(default=3)  # Grid height

    # Data source configuration
    data_source = models.CharField(max_length=100)  # e.g., 'performance_metrics', 'system_health'
    metric_types = models.JSONField(default=list, blank=True)  # List of metric types to display
    filters = models.JSONField(default=dict, blank=True)  # Data filters
    time_range = models.CharField(max_length=20, default='1h')  # e.g., '1h', '24h', '7d', '30d'

    # Display options
    refresh_interval = models.IntegerField(default=60)  # Refresh interval in seconds
    show_legend = models.BooleanField(default=True)
    show_grid = models.BooleanField(default=True)
    colors = models.JSONField(default=list, blank=True)  # Custom color scheme

    # User and permissions
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_widgets')
    is_public = models.BooleanField(default=False)
    shared_with = models.JSONField(default=list, blank=True)  # List of user IDs who can view

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position_y', 'position_x']
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['is_active']),
            models.Index(fields=['widget_type']),
        ]

    def __str__(self):
        return f"{self.title} ({self.widget_type})"

    def can_view(self, user):
        """Check if user can view this widget."""
        if self.is_public:
            return True
        if self.created_by == user:
            return True
        return str(user.id) in self.shared_with


class PerformanceAlert(models.Model):
    """Performance alerts and notifications."""

    ALERT_LEVELS = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]

    ALERT_STATUSES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('suppressed', 'Suppressed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    alert_level = models.CharField(max_length=20, choices=ALERT_LEVELS, default='warning')
    status = models.CharField(max_length=20, choices=ALERT_STATUSES, default='active')

    # Alert source
    metric = models.ForeignKey(PerformanceMetric, on_delete=models.CASCADE, null=True, blank=True)
    system_health = models.ForeignKey(SystemHealth, on_delete=models.CASCADE, null=True, blank=True)

    # Threshold information
    threshold_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    actual_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    threshold_operator = models.CharField(max_length=10, default='>')  # >, <, >=, <=, ==

    # Notification settings
    notified_users = models.JSONField(default=list, blank=True)
    notification_channels = models.JSONField(default=list, blank=True)  # email, sms, slack, etc.
    escalation_policy = models.JSONField(default=dict, blank=True)

    # Timing
    triggered_at = models.DateTimeField(default=timezone.now)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acknowledged_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')

    # Metadata
    tags = models.JSONField(default=dict, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-triggered_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['alert_level']),
            models.Index(fields=['-triggered_at']),
        ]

    def __str__(self):
        return f"{self.alert_level.upper()}: {self.title}"

    def acknowledge(self, user):
        """Acknowledge the alert."""
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        self.acknowledged_by = user
        self.save()

    def resolve(self, user, notes=''):
        """Resolve the alert."""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.resolution_notes = notes
        self.save()

    def is_overdue(self):
        """Check if alert is overdue for acknowledgment."""
        if self.status != 'active':
            return False

        # Define SLA based on alert level
        sla_minutes = {
            'info': 60,      # 1 hour
            'warning': 30,   # 30 minutes
            'error': 15,     # 15 minutes
            'critical': 5,   # 5 minutes
        }

        sla_time = sla_minutes.get(self.alert_level, 60)
        return (timezone.now() - self.triggered_at).total_seconds() > (sla_time * 60)


class PerformanceRecommendation(models.Model):
    """Performance optimization recommendations."""

    RECOMMENDATION_TYPES = [
        ('optimization', 'Optimization'),
        ('scaling', 'Scaling'),
        ('maintenance', 'Maintenance'),
        ('configuration', 'Configuration'),
        ('architecture', 'Architecture'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUSES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('implemented', 'Implemented'),
        ('rejected', 'Rejected'),
        ('deferred', 'Deferred'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    recommendation_type = models.CharField(max_length=20, choices=RECOMMENDATION_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')

    # Analysis data
    analysis_data = models.JSONField(default=dict, blank=True)  # Performance analysis results
    metrics_snapshot = models.JSONField(default=dict, blank=True)  # Metrics at time of recommendation

    # Impact assessment
    estimated_impact = models.TextField(blank=True)
    implementation_effort = models.CharField(max_length=20, default='medium')  # low, medium, high
    cost_benefit_ratio = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Implementation tracking
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_recommendations')
    implemented_at = models.DateTimeField(null=True, blank=True)
    implemented_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='implemented_recommendations')
    implementation_notes = models.TextField(blank=True)

    # Metadata
    tags = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['recommendation_type']),
        ]

    def __str__(self):
        return f"{self.recommendation_type}: {self.title}"

    def implement(self, user, notes=''):
        """Mark recommendation as implemented."""
        self.status = 'implemented'
        self.implemented_at = timezone.now()
        self.implemented_by = user
        self.implementation_notes = notes
        self.save()