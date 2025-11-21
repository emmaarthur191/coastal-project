from rest_framework import serializers
from .models import (
    PerformanceMetric, SystemHealth, DashboardWidget,
    PerformanceAlert, PerformanceRecommendation
)


class PerformanceMetricSerializer(serializers.ModelSerializer):
    """Serializer for PerformanceMetric model."""

    class Meta:
        model = PerformanceMetric
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for SystemHealth model."""

    class Meta:
        model = SystemHealth
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    """Serializer for DashboardWidget model."""

    class Meta:
        model = DashboardWidget
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PerformanceAlertSerializer(serializers.ModelSerializer):
    """Serializer for PerformanceAlert model."""

    class Meta:
        model = PerformanceAlert
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at', 'resolved_by']


class PerformanceRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for PerformanceRecommendation model."""

    class Meta:
        model = PerformanceRecommendation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'implemented_at', 'implemented_by']