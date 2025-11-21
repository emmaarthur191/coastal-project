from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.db.models import Count, Avg, Q, Max
from django.utils import timezone
from datetime import timedelta
from .models import UserSettings, SystemSettings, APIUsage, APIRateLimit, HealthCheck
from .serializers import (
    UserSettingsSerializer, SystemSettingsSerializer, APIUsageSerializer,
    APIRateLimitSerializer, HealthCheckSerializer, APIAnalyticsSerializer,
    SystemHealthOverviewSerializer
)
from users.permissions import IsAdministrator, IsSuperuser, BaseRolePermission


class CanAccessSystemSettings(BaseRolePermission):
    """Allow access to system settings for administrators and superusers."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['administrator', 'superuser']


class UserSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for user settings management."""
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSettings.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create user settings."""
        obj, created = UserSettings.objects.get_or_create(user=self.request.user)
        return obj

    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        """Get current user's settings."""
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_my_settings(self, request):
        """Update current user's settings."""
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for system settings management."""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [CanAccessSystemSettings]

    @action(detail=False, methods=['get'])
    def public_settings(self, request):
        """Get public system settings."""
        settings = self.get_queryset().filter(is_public=True, is_active=True)
        serializer = self.get_serializer(settings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_value(self, request, pk=None):
        """Update a specific setting value."""
        setting = self.get_object()
        new_value = request.data.get('value')

        if not setting.is_valid_value(new_value):
            return Response(
                {'error': 'Invalid value for this setting'},
                status=status.HTTP_400_BAD_REQUEST
            )

        setting.set_value(new_value)
        setting.save()

        serializer = self.get_serializer(setting)
        return Response(serializer.data)


class APIUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for API usage analytics."""
    queryset = APIUsage.objects.all()
    serializer_class = APIUsageSerializer
    permission_classes = [CanAccessSystemSettings]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)

        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by endpoint
        endpoint = self.request.query_params.get('endpoint')
        if endpoint:
            queryset = queryset.filter(endpoint__icontains=endpoint)

        return queryset

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get API usage analytics."""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)

        # Basic metrics
        total_requests = self.get_queryset().filter(timestamp__gte=start_date).count()
        unique_users = self.get_queryset().filter(timestamp__gte=start_date).values('user').distinct().count()

        # Average response time
        avg_response_time = self.get_queryset().filter(
            timestamp__gte=start_date,
            response_time__isnull=False
        ).aggregate(avg=Avg('response_time'))['avg'] or 0

        # Error rate
        total_with_status = self.get_queryset().filter(timestamp__gte=start_date).count()
        error_count = self.get_queryset().filter(
            timestamp__gte=start_date,
            status_code__gte=400
        ).count()
        error_rate = (error_count / total_with_status * 100) if total_with_status > 0 else 0

        # Top endpoints
        top_endpoints = self.get_queryset().filter(timestamp__gte=start_date).values('endpoint').annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        # Requests by method
        requests_by_method = dict(self.get_queryset().filter(timestamp__gte=start_date).values('method').annotate(
            count=Count('id')
        ).values_list('method', 'count'))

        # Requests by status
        requests_by_status = dict(self.get_queryset().filter(timestamp__gte=start_date).values('status_code').annotate(
            count=Count('id')
        ).values_list('status_code', 'count'))

        # Requests over time (daily)
        requests_over_time = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            next_date = date + timedelta(days=1)
            count = self.get_queryset().filter(
                timestamp__gte=date,
                timestamp__lt=next_date
            ).count()
            requests_over_time.append({
                'date': date.date().isoformat(),
                'count': count
            })

        data = {
            'total_requests': total_requests,
            'unique_users': unique_users,
            'average_response_time': avg_response_time,
            'error_rate': error_rate,
            'top_endpoints': list(top_endpoints),
            'requests_by_method': requests_by_method,
            'requests_by_status': requests_by_status,
            'requests_over_time': requests_over_time,
        }

        serializer = APIAnalyticsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class APIRateLimitViewSet(viewsets.ModelViewSet):
    """ViewSet for API rate limiting configuration."""
    queryset = APIRateLimit.objects.all()
    serializer_class = APIRateLimitSerializer
    permission_classes = [CanAccessSystemSettings]

    @action(detail=True, methods=['post'])
    def test_pattern(self, request, pk=None):
        """Test if a URL pattern matches the rate limit."""
        rate_limit = self.get_object()
        test_url = request.data.get('url', '')
        test_method = request.data.get('method', 'GET')

        # Mock request object for testing
        class MockRequest:
            def __init__(self, path, method, META=None):
                self.path = path
                self.method = method
                self.META = META or {}

        mock_request = MockRequest(test_url, test_method)
        matches = rate_limit.matches_request(mock_request)

        return Response({
            'matches': matches,
            'pattern': rate_limit.endpoint_pattern,
            'methods': rate_limit.methods,
            'scope': rate_limit.scope
        })


class HealthCheckViewSet(viewsets.ModelViewSet):
    """ViewSet for health check management."""
    queryset = HealthCheck.objects.all()
    serializer_class = HealthCheckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by environment
        environment = self.request.query_params.get('environment')
        if environment:
            queryset = queryset.filter(environment=environment)

        # Filter by status
        health_status = self.request.query_params.get('status')
        if health_status:
            queryset = queryset.filter(status=health_status)

        # Filter by component type
        component_type = self.request.query_params.get('component_type')
        if component_type:
            queryset = queryset.filter(component_type=component_type)

        return queryset

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get system health overview."""
        components = self.get_queryset()

        total_components = components.count()
        healthy_components = components.filter(status='healthy').count()
        warning_components = components.filter(status='warning').count()
        critical_components = components.filter(status='critical').count()

        # Determine overall status
        if critical_components > 0:
            overall_status = 'critical'
        elif warning_components > 0:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'

        last_updated = components.aggregate(
            latest=Max('updated_at')
        )['latest'] if total_components > 0 else None

        data = {
            'overall_status': overall_status,
            'total_components': total_components,
            'healthy_components': healthy_components,
            'warning_components': warning_components,
            'critical_components': critical_components,
            'components': HealthCheckSerializer(components, many=True).data,
            'last_updated': last_updated,
        }

        serializer = SystemHealthOverviewSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

    @action(detail=True, methods=['post'])
    def run_check(self, request, pk=None):
        """Manually run a health check."""
        health_check = self.get_object()

        # This would implement the actual health check logic
        # For now, just update the timestamp
        health_check.updated_at = timezone.now()
        health_check.save()

        serializer = self.get_serializer(health_check)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_check(self, request):
        """Run health checks for multiple components."""
        component_names = request.data.get('components', [])

        if not component_names:
            return Response(
                {'error': 'No components specified'},
                status=status.HTTP_400_BAD_REQUEST
            )

        components = self.get_queryset().filter(component_name__in=component_names)

        # This would implement bulk health checking
        # For now, just update timestamps
        components.update(updated_at=timezone.now())

        serializer = self.get_serializer(components, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_health_check(request):
    """Simple API health check endpoint."""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now(),
        'version': '1.0.0',
        'service': 'banking-api'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_status(request):
    """Get overall system status."""
    # Check database connectivity
    try:
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        db_status = 'healthy'
    except Exception:
        db_status = 'critical'

    # Check cache (if configured)
    cache_status = 'healthy'  # Placeholder

    # Get recent health checks
    recent_checks = HealthCheck.objects.filter(
        updated_at__gte=timezone.now() - timedelta(minutes=5)
    )

    overall_status = 'healthy'
    if any(check.status == 'critical' for check in recent_checks):
        overall_status = 'critical'
    elif any(check.status == 'warning' for check in recent_checks):
        overall_status = 'warning'

    return Response({
        'overall_status': overall_status,
        'database': db_status,
        'cache': cache_status,
        'components_checked': recent_checks.count(),
        'timestamp': timezone.now(),
    })


# Custom throttles for API rate limiting
class CustomUserRateThrottle(UserRateThrottle):
    """Custom user rate throttle with configurable limits."""
    scope = 'user'

    def get_rate(self):
        # This could be made configurable per user/role
        return '1000/hour'


class CustomAnonRateThrottle(AnonRateThrottle):
    """Custom anonymous rate throttle."""
    scope = 'anon'

    def get_rate(self):
        return '100/hour'