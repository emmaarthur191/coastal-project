from rest_framework import serializers
from .models import PerformanceMetric, SystemHealth, DashboardWidget, PerformanceAlert, PerformanceRecommendation


class PerformanceMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceMetric
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class SystemHealthSerializer(serializers.ModelSerializer):
    is_healthy = serializers.ReadOnlyField()
    needs_alert = serializers.ReadOnlyField()

    class Meta:
        model = SystemHealth
        fields = '__all__'
        read_only_fields = ['id', 'last_check']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    can_view = serializers.SerializerMethodField()

    class Meta:
        model = DashboardWidget
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_can_view(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.can_view(request.user)
        return False


class PerformanceAlertSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = PerformanceAlert
        fields = '__all__'
        read_only_fields = ['id', 'triggered_at', 'acknowledged_at', 'resolved_at']


class PerformanceRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceRecommendation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'implemented_at']


# Specialized serializers for dashboard data

class PerformanceMetricsSummarySerializer(serializers.Serializer):
    total_metrics = serializers.IntegerField()
    metric_types = serializers.DictField()
    time_range = serializers.CharField()
    average_response_time = serializers.DecimalField(max_digits=10, decimal_places=2)
    error_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    throughput = serializers.IntegerField()


class SystemHealthSummarySerializer(serializers.Serializer):
    total_components = serializers.IntegerField()
    healthy_components = serializers.IntegerField()
    warning_components = serializers.IntegerField()
    critical_components = serializers.IntegerField()
    overall_status = serializers.CharField()
    last_updated = serializers.DateTimeField()


class TransactionVolumeSerializer(serializers.Serializer):
    date = serializers.DateField()
    deposits = serializers.IntegerField()
    withdrawals = serializers.IntegerField()
    transfers = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_transaction_value = serializers.DecimalField(max_digits=12, decimal_places=2)


class PerformanceChartDataSerializer(serializers.Serializer):
    labels = serializers.ListField(child=serializers.CharField())
    datasets = serializers.ListField(child=serializers.DictField())


class DashboardDataSerializer(serializers.Serializer):
    performance_summary = PerformanceMetricsSummarySerializer()
    system_health = SystemHealthSummarySerializer()
    transaction_volume = TransactionVolumeSerializer(many=True)
    active_alerts = PerformanceAlertSerializer(many=True)
    recent_recommendations = PerformanceRecommendationSerializer(many=True)