"""Reporting and monitoring models for Coastal Banking.

Includes report templates, schedules, and system health metrics.
"""

from django.conf import settings
from django.db import models


class ReportTemplate(models.Model):
    """Templates for generating reports."""

    REPORT_TYPES = [
        ("transaction", "Transaction Report"),
        ("account", "Account Report"),
        ("fraud", "Fraud Report"),
        ("compliance", "Compliance Report"),
        ("financial", "Financial Report"),
        ("audit", "Audit Report"),
        ("performance", "Performance Report"),
    ]

    name = models.CharField(max_length=100)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    description = models.TextField(blank=True)
    default_parameters = models.JSONField(default=dict, blank=True)
    sql_template = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_reporttemplate"
        ordering = ["report_type", "name"]
        verbose_name = "Report Template"
        verbose_name_plural = "Report Templates"

    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"


class Report(models.Model):
    """Generated reports from templates."""

    FORMAT_CHOICES = [
        ("pdf", "PDF"),
        ("csv", "CSV"),
        ("docx", "Word Document"),
        ("xlsx", "Excel"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("generating", "Generating"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    template = models.ForeignKey(
        ReportTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="generated_reports"
    )
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default="pdf")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    file_url = models.URLField(blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="generated_reports"
    )
    parameters = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "core_report"
        ordering = ["-created_at"]
        verbose_name = "Report"
        verbose_name_plural = "Reports"

    def __str__(self):
        return f"{self.title} ({self.status})"


class ReportSchedule(models.Model):
    """Scheduled report generation."""

    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
    ]

    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name="schedules")
    name = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    day_of_week = models.PositiveSmallIntegerField(null=True, blank=True)
    day_of_month = models.PositiveSmallIntegerField(null=True, blank=True)
    time_of_day = models.TimeField()
    format = models.CharField(max_length=10, default="pdf")
    parameters = models.JSONField(default=dict, blank=True)
    email_recipients = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="report_schedules"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_reportschedule"
        ordering = ["name"]
        verbose_name = "Report Schedule"
        verbose_name_plural = "Report Schedules"

    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"


class PerformanceMetric(models.Model):
    """System performance metrics."""

    METRIC_TYPES = [
        ("response_time", "Response Time"),
        ("cpu_usage", "CPU Usage"),
        ("memory_usage", "Memory Usage"),
        ("disk_usage", "Disk Usage"),
        ("request_count", "Request Count"),
        ("error_rate", "Error Rate"),
        ("transaction_volume", "Transaction Volume"),
    ]

    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    value = models.DecimalField(max_digits=15, decimal_places=4)
    unit = models.CharField(max_length=20)
    endpoint = models.CharField(max_length=200, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_performancemetric"
        ordering = ["-recorded_at"]
        verbose_name = "Performance Metric"
        verbose_name_plural = "Performance Metrics"
        indexes = [
            models.Index(fields=["metric_type", "recorded_at"]),
        ]

    def __str__(self):
        return f"{self.get_metric_type_display()}: {self.value} {self.unit}"


class SystemHealth(models.Model):
    """System health snapshots."""

    STATUS_CHOICES = [
        ("healthy", "Healthy"),
        ("degraded", "Degraded"),
        ("unhealthy", "Unhealthy"),
    ]

    service_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="healthy")
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_systemhealth"
        ordering = ["-checked_at"]
        verbose_name = "System Health"
        verbose_name_plural = "System Health Records"

    def __str__(self):
        return f"{self.service_name}: {self.status}"
