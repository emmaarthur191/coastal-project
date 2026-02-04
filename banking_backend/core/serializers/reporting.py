"""Reporting and monitoring serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.reporting import (
    PerformanceMetric,
    Report,
    ReportSchedule,
    ReportTemplate,
    SystemHealth,
)


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for report templates."""

    report_type_display = serializers.CharField(source="get_report_type_display", read_only=True)
    type = serializers.CharField(source="report_type", read_only=True)

    class Meta:
        model = ReportTemplate
        fields = [
            "id",
            "name",
            "report_type",
            "type",
            "report_type_display",
            "description",
            "default_parameters",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for generated reports."""

    template_name = serializers.CharField(source="template.name", read_only=True)
    generated_by_name = serializers.SerializerMethodField()
    format_display = serializers.CharField(source="get_format_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    report_url = serializers.CharField(source="file_url", read_only=True)
    type = serializers.CharField(source="report_type", read_only=True)
    generated_at = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "template",
            "template_name",
            "title",
            "report_type",
            "format",
            "format_display",
            "status",
            "status_display",
            "file_url",
            "report_url",
            "type",
            "generated_at",
            "file_path",
            "file_size",
            "generated_by",
            "generated_by_name",
            "parameters",
            "error_message",
            "created_at",
            "completed_at",
        ]
        read_only_fields = [
            "id",
            "generated_by",
            "file_url",
            "file_path",
            "file_size",
            "error_message",
            "created_at",
            "completed_at",
        ]

    def get_generated_by_name(self, obj):
        return obj.generated_by.get_full_name() if obj.generated_by else None


class ReportScheduleSerializer(serializers.ModelSerializer):
    """Serializer for report schedules."""

    template_name = serializers.CharField(source="template.name", read_only=True)
    frequency_display = serializers.CharField(source="get_frequency_display", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReportSchedule
        fields = [
            "id",
            "template",
            "template_name",
            "name",
            "frequency",
            "frequency_display",
            "day_of_week",
            "day_of_month",
            "time_of_day",
            "format",
            "parameters",
            "email_recipients",
            "is_active",
            "last_run",
            "next_run",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "last_run", "next_run", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class PerformanceMetricSerializer(serializers.ModelSerializer):
    """Serializer for performance metrics."""

    metric_type_display = serializers.CharField(source="get_metric_type_display", read_only=True)

    class Meta:
        model = PerformanceMetric
        fields = ["id", "metric_type", "metric_type_display", "value", "unit", "endpoint", "recorded_at"]
        read_only_fields = ["id", "recorded_at"]


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for system health records."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SystemHealth
        fields = ["id", "service_name", "status", "status_display", "response_time_ms", "details", "checked_at"]
        read_only_fields = ["id", "checked_at"]
