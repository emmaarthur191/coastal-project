from rest_framework import serializers
from .models import ReportTemplate, Report, ReportSchedule, ReportAnalytics


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ReportTemplate model."""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'template_type', 'frequency',
            'layout_config', 'filters_config', 'columns_config', 'charts_config',
            'created_by', 'created_by_name', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model."""
    template_name = serializers.CharField(source='template.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'template', 'template_name', 'title', 'description',
            'report_date', 'start_date', 'end_date', 'filters_applied',
            'status', 'status_display', 'format', 'format_display',
            'generated_by', 'generated_by_name', 'generated_at', 'completed_at',
            'data', 'file_path', 'file_size', 'error_message',
            'created_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'generated_by', 'generated_at', 'completed_at',
            'data', 'file_path', 'file_size', 'error_message', 'created_at'
        ]


class ReportScheduleSerializer(serializers.ModelSerializer):
    """Serializer for ReportSchedule model."""
    template_name = serializers.CharField(source='template.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)

    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'template', 'template_name', 'name', 'description',
            'frequency', 'frequency_display', 'next_run', 'last_run', 'expires_at',
            'recipients', 'delivery_method', 'delivery_method_display', 'delivery_config',
            'status', 'status_display', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'last_error', 'consecutive_failures'
        ]
        read_only_fields = [
            'id', 'last_run', 'created_at', 'updated_at',
            'last_error', 'consecutive_failures', 'created_by'
        ]


class ReportAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for ReportAnalytics model."""
    report_title = serializers.CharField(source='report.title', read_only=True)

    class Meta:
        model = ReportAnalytics
        fields = [
            'id', 'report', 'report_title',
            'total_transactions', 'total_amount', 'average_transaction_amount',
            'deposits_count', 'withdrawals_count', 'transfers_count', 'fees_count',
            'deposits_amount', 'withdrawals_amount', 'transfers_amount', 'fees_amount',
            'cashier_metrics', 'previous_period_comparison', 'trend_data',
            'compliance_flags', 'risk_indicators',
            'calculated_at'
        ]
        read_only_fields = ['id', 'calculated_at']


class ReportGenerationSerializer(serializers.Serializer):
    """Serializer for report generation requests."""
    template_id = serializers.UUIDField()
    report_date = serializers.DateField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    filters = serializers.JSONField(required=False, default=dict)
    format = serializers.ChoiceField(
        choices=['json', 'html', 'pdf', 'excel', 'csv'],
        default='json'
    )

    def validate(self, data):
        """Validate date ranges."""
        if 'start_date' in data and 'end_date' in data:
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError("Start date must be before end date")
        return data


class ReportScheduleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating report schedules."""

    class Meta:
        model = ReportSchedule
        fields = [
            'template', 'name', 'description', 'frequency', 'next_run',
            'expires_at', 'recipients', 'delivery_method', 'delivery_config'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ReportExportSerializer(serializers.Serializer):
    """Serializer for report export requests."""
    report_id = serializers.UUIDField()
    format = serializers.ChoiceField(choices=['pdf', 'excel', 'csv'])
    include_charts = serializers.BooleanField(default=True)
    custom_filters = serializers.JSONField(required=False, default=dict)