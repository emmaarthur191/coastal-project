"""Fraud detection models for Coastal Banking."""

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
        ordering = ["-created_at"]

    def __str__(self):
        return f"Fraud Alert - {self.user.username} ({self.severity})"
