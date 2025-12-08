from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from banking.models import Transaction
from .models import (
    PerformanceMetric, SystemHealth, DashboardWidget,
    PerformanceAlert, PerformanceRecommendation
)
from .serializers import (
    PerformanceMetricSerializer, SystemHealthSerializer,
    DashboardWidgetSerializer, PerformanceAlertSerializer,
    PerformanceRecommendationSerializer, TransactionVolumeSerializer
)


class PerformanceMetricViewSet(viewsets.ModelViewSet):
    queryset = PerformanceMetric.objects.all()
    serializer_class = PerformanceMetricSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        metric_type = self.request.query_params.get('metric_type')
        service_name = self.request.query_params.get('service_name')
        time_range = self.request.query_params.get('time_range', '24h')

        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)
        if service_name:
            queryset = queryset.filter(service_name=service_name)

        # Apply time range filter
        if time_range:
            hours = self._parse_time_range(time_range)
            if hours:
                start_time = timezone.now() - timedelta(hours=hours)
                queryset = queryset.filter(timestamp__gte=start_time)

        return queryset.order_by('-timestamp')

    def _parse_time_range(self, time_range):
        """Parse time range string to hours."""
        time_ranges = {
            '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720
        }
        return time_ranges.get(time_range)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get performance metrics summary."""
        time_range = request.query_params.get('time_range', '24h')
        hours = self._parse_time_range(time_range) or 24
        start_time = timezone.now() - timedelta(hours=hours)

        metrics = self.get_queryset().filter(timestamp__gte=start_time)

        summary = {
            'total_metrics': metrics.count(),
            'metric_types': dict(metrics.values('metric_type').annotate(count=Count('metric_type')).values_list('metric_type', 'count')),
            'time_range': time_range,
            'average_response_time': metrics.filter(metric_type='response_time').aggregate(avg=Avg('value'))['avg'] or 0,
            'error_rate': self._calculate_error_rate(metrics),
            'throughput': metrics.filter(metric_type='throughput').aggregate(avg=Avg('value'))['avg'] or 0,
        }

        return Response(summary)

    def _calculate_error_rate(self, metrics):
        """Calculate error rate from metrics."""
        error_metrics = metrics.filter(metric_type='error_rate')
        if error_metrics.exists():
            return error_metrics.aggregate(avg=Avg('value'))['avg'] or 0
        return 0


class SystemHealthViewSet(viewsets.ModelViewSet):
    queryset = SystemHealth.objects.all()
    serializer_class = SystemHealthSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get system health summary."""
        components = self.get_queryset()
        total = components.count()
        healthy = components.filter(status='healthy').count()
        warning = components.filter(status='warning').count()
        critical = components.filter(status='critical').count()

        overall_status = 'healthy'
        if critical > 0:
            overall_status = 'critical'
        elif warning > 0:
            overall_status = 'warning'

        summary = {
            'total_components': total,
            'healthy_components': healthy,
            'warning_components': warning,
            'critical_components': critical,
            'overall_status': overall_status,
            'last_updated': components.aggregate(last_check=Max('last_check'))['last_check']
        }

        return Response(summary)

    @action(detail=True, methods=['post'])
    def check_health(self, request, pk=None):
        """Manually trigger health check for a component."""
        component = self.get_object()
        # Implement health check logic here
        # For now, just update the last_check timestamp
        component.last_check = timezone.now()
        component.save()
        return Response({'status': 'Health check completed'})


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Filter widgets that user can access
        # For SQLite compatibility, check shared_with manually
        widgets = DashboardWidget.objects.filter(
            Q(created_by=user) | Q(is_public=True)
        )

        # Add widgets shared with user (check JSON array contains user ID)
        shared_widgets = []
        for widget in DashboardWidget.objects.all():
            if str(user.id) in widget.shared_with:
                shared_widgets.append(widget.pk)

        if shared_widgets:
            widgets = widgets | DashboardWidget.objects.filter(pk__in=shared_widgets)

        return widgets.distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PerformanceAlertViewSet(viewsets.ModelViewSet):
    queryset = PerformanceAlert.objects.all()
    serializer_class = PerformanceAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        level_filter = self.request.query_params.get('level')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if level_filter:
            queryset = queryset.filter(alert_level=level_filter)

        return queryset.order_by('-triggered_at')

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert."""
        alert = self.get_object()
        alert.acknowledge(request.user)
        return Response({'status': 'Alert acknowledged'})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an alert."""
        alert = self.get_object()
        notes = request.data.get('notes', '')
        alert.resolve(request.user, notes)
        return Response({'status': 'Alert resolved'})


class PerformanceRecommendationViewSet(viewsets.ModelViewSet):
    queryset = PerformanceRecommendation.objects.all()
    serializer_class = PerformanceRecommendationSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def implement(self, request, pk=None):
        """Mark recommendation as implemented."""
        recommendation = self.get_object()
        notes = request.data.get('notes', '')
        recommendation.implement(request.user, notes)
        return Response({'status': 'Recommendation implemented'})


def _get_transaction_volume_data(time_range='7d'):
    """Helper function to get transaction volume data."""
    days = 7

    if time_range == '30d':
        days = 30
    elif time_range == '90d':
        days = 90

    start_date = timezone.now().date() - timedelta(days=days)

    # Aggregate transaction data by date
    transactions = Transaction.objects.filter(
        timestamp__date__gte=start_date
    ).values('timestamp__date').annotate(
        deposits=Count('id', filter=Q(type='deposit')),
        withdrawals=Count('id', filter=Q(type='withdrawal')),
        transfers=Count('id', filter=Q(type='transfer')),
        total_amount=Sum('amount')
    ).order_by('timestamp__date')

    # Calculate average transaction value
    volume_data = []
    for tx in transactions:
        total_transactions = tx['deposits'] + tx['withdrawals'] + tx['transfers']
        avg_value = tx['total_amount'] / total_transactions if total_transactions > 0 else 0

        volume_data.append({
            'date': tx['timestamp__date'],
            'deposits': tx['deposits'],
            'withdrawals': tx['withdrawals'],
            'transfers': tx['transfers'],
            'total_amount': tx['total_amount'],
            'average_transaction_value': avg_value
        })

    return volume_data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_volume(request):
    """Get transaction volume data for charts."""
    time_range = request.query_params.get('time_range', '7d')
    volume_data = _get_transaction_volume_data(time_range)
    serializer = TransactionVolumeSerializer(volume_data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_chart_data(request):
    """Get performance data formatted for charts."""
    metric_type = request.query_params.get('metric_type', 'response_time')
    time_range = request.query_params.get('time_range', '24h')
    hours = 24

    if time_range == '1h':
        hours = 1
    elif time_range == '6h':
        hours = 6
    elif time_range == '7d':
        hours = 168

    start_time = timezone.now() - timedelta(hours=hours)

    # Get metrics data
    metrics = PerformanceMetric.objects.filter(
        metric_type=metric_type,
        timestamp__gte=start_time
    ).order_by('timestamp')

    # Group by hour for chart data
    chart_data = {
        'labels': [],
        'datasets': [{
            'label': metric_type.replace('_', ' ').title(),
            'data': [],
            'borderColor': 'rgb(75, 192, 192)',
            'tension': 0.1
        }]
    }

    # Simple aggregation by hour
    hourly_data = {}
    for metric in metrics:
        hour_key = metric.timestamp.strftime('%Y-%m-%d %H:00')
        if hour_key not in hourly_data:
            hourly_data[hour_key] = []
        hourly_data[hour_key].append(float(metric.value))

    for hour, values in sorted(hourly_data.items()):
        chart_data['labels'].append(hour)
        # Use average value for the hour
        avg_value = sum(values) / len(values)
        chart_data['datasets'][0]['data'].append(round(avg_value, 2))

    return Response(chart_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    """Get comprehensive dashboard data."""
    # Performance summary
    time_range = '24h'
    hours = 24
    start_time = timezone.now() - timedelta(hours=hours)

    metrics = PerformanceMetric.objects.filter(timestamp__gte=start_time)
    performance_summary = {
        'total_metrics': metrics.count(),
        'metric_types': dict(metrics.values('metric_type').annotate(count=Count('metric_type')).values_list('metric_type', 'count')),
        'time_range': time_range,
        'average_response_time': metrics.filter(metric_type='response_time').aggregate(avg=Avg('value'))['avg'] or 0,
        'error_rate': 0,  # Calculate based on error metrics
        'throughput': metrics.filter(metric_type='throughput').aggregate(avg=Avg('value'))['avg'] or 0,
    }

    # System health summary
    components = SystemHealth.objects.all()
    system_health = {
        'total_components': components.count(),
        'healthy_components': components.filter(status='healthy').count(),
        'warning_components': components.filter(status='warning').count(),
        'critical_components': components.filter(status='critical').count(),
        'overall_status': 'healthy',  # Calculate based on component statuses
        'last_updated': components.aggregate(last_check=Max('last_check'))['last_check']
    }

    # Transaction volume (last 7 days)
    volume_data = _get_transaction_volume_data()

    # Active alerts
    active_alerts = PerformanceAlert.objects.filter(status='active').order_by('-triggered_at')[:10]

    # Recent recommendations
    recent_recommendations = PerformanceRecommendation.objects.filter(
        status__in=['pending', 'in_progress']
    ).order_by('-created_at')[:5]

    dashboard_data = {
        'performance_summary': performance_summary,
        'system_health': system_health,
        'transaction_volume': volume_data,
        'active_alerts': PerformanceAlertSerializer(active_alerts, many=True).data,
        'recent_recommendations': PerformanceRecommendationSerializer(recent_recommendations, many=True).data
    }

    return Response(dashboard_data)


# Import Max for aggregation
from django.db.models import Max