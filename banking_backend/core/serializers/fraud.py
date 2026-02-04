"""Fraud-related serializers for Coastal Banking."""

from django.utils import timezone
from rest_framework import serializers

from core.models.fraud import FraudAlert, FraudRule


class FraudAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudAlert
        fields = ["id", "user", "message", "severity", "is_resolved", "resolved_at", "created_at"]
        read_only_fields = ["id", "resolved_at", "created_at"]

    def update(self, instance, validated_data):
        if validated_data.get("is_resolved") and not instance.is_resolved:
            validated_data["resolved_at"] = timezone.now()
        return super().update(instance, validated_data)


class FraudRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudRule
        fields = [
            "id",
            "name",
            "description",
            "rule_type",
            "severity",
            "field",
            "operator",
            "value",
            "additional_conditions",
            "is_active",
            "auto_block",
            "require_approval",
            "escalation_threshold",
            "trigger_count",
            "false_positive_count",
            "last_triggered",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "trigger_count", "false_positive_count", "last_triggered", "created_at", "updated_at"]
