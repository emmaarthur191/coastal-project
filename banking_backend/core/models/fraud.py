"""Fraud-related models for Coastal Banking."""

from django.conf import settings
from django.db import models


class FraudAlert(models.Model):
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fraud_alerts")
    transaction = models.ForeignKey(
        "core.Transaction", on_delete=models.SET_NULL, null=True, blank=True, related_name="fraud_alerts"
    )
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_fraudalert"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="fraud_user_idx"),
            models.Index(fields=["severity", "is_resolved"], name="fraud_sev_res_idx"),
        ]

    def __str__(self):
        return f"Fraud Alert - {self.user.username} ({self.severity})"


class FraudRule(models.Model):
    RULE_TYPE_CHOICES = [
        ("transaction_amount", "Transaction Amount"),
        ("velocity", "Velocity"),
        ("geographic", "Geographic"),
        ("time_based", "Time Based"),
        ("account_activity", "Account Activity"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    rule_type = models.CharField(max_length=30, choices=RULE_TYPE_CHOICES, default="transaction_amount")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")
    field = models.CharField(max_length=50, help_text="Transaction field to evaluate")
    operator = models.CharField(max_length=20, help_text="Comparison operator (e.g., >, <, ==)")
    value = models.CharField(max_length=255, help_text="Threshold value for the rule")
    additional_conditions = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    auto_block = models.BooleanField(default=False)
    require_approval = models.BooleanField(default=False)
    escalation_threshold = models.PositiveIntegerField(default=0)
    trigger_count = models.PositiveIntegerField(default=0)
    false_positive_count = models.PositiveIntegerField(default=0)
    last_triggered = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_fraudrule"
        ordering = ["-created_at"]
        verbose_name = "Fraud Rule"
        verbose_name_plural = "Fraud Rules"

    def __str__(self):
        return f"Rule: {self.name} ({self.rule_type})"
