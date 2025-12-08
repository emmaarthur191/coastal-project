import logging
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.cache import never_cache
from health_check.views import MainView
from .monitoring import SystemHealthMonitor

logger = logging.getLogger(__name__)


class BankingHealthCheckView(MainView):
    """Custom health check view with banking-specific checks."""

    def get(self, request, *args, **kwargs):
        """Override to add custom banking health checks."""
        # Run standard health checks
        response = super().get(request, *args, **kwargs)

        # Add banking-specific health checks
        banking_health = self._check_banking_health()

        # Check if both database and cache are healthy
        db_status = banking_health.get('database', {}).get('status', 'unhealthy')
        cache_status = banking_health.get('cache', {}).get('status', 'unhealthy')
        is_healthy = (response.status_code == 200 and
                    db_status == 'healthy' and
                    cache_status == 'healthy')

        # Merge results
        if is_healthy:
            response_data = {
                'status': 'healthy',
                'checks': {
                    'database': banking_health.get('database', {}),
                    'cache': banking_health.get('cache', {}),
                }
            }
            return JsonResponse(response_data, status=200)
        else:
            response_data = {
                'status': 'unhealthy',
                'checks': {
                    'database': banking_health.get('database', {}),
                    'cache': banking_health.get('cache', {}),
                }
            }
            return JsonResponse(response_data, status=503)

    def _check_banking_health(self):
        """Perform banking-specific health checks."""
        return SystemHealthMonitor.get_system_metrics()


@require_GET
@never_cache
def prometheus_metrics_view(request):
    """Expose Prometheus metrics endpoint."""
    from django_prometheus.exports import ExportToDjangoResponse
    return ExportToDjangoResponse(request)


@require_GET
@never_cache
def system_health_view(request):
    """Detailed system health information."""
    try:
        health_data = SystemHealthMonitor.get_system_metrics()

        # Determine overall status
        db_status = health_data['database']['status']
        cache_status = health_data['cache']['status']

        overall_status = 'healthy' if db_status == 'healthy' and cache_status == 'healthy' else 'unhealthy'

        response_data = {
            'status': overall_status,
            'timestamp': health_data['timestamp'],
            'services': {
                'database': health_data['database'],
                'cache': health_data['cache'],
            }
        }

        status_code = 200 if overall_status == 'healthy' else 503

        logger.info(
            f"System health check: {overall_status}",
            extra={
                'overall_status': overall_status,
                'database_status': db_status,
                'cache_status': cache_status,
            }
        )

        return JsonResponse(response_data, status=status_code)

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'error': 'Health check failed',
            'timestamp': SystemHealthMonitor.get_system_metrics()['timestamp']
        }, status=500)


@require_GET
@never_cache
def banking_metrics_view(request):
    """
    Banking-specific metrics and KPIs.
    Synchronous view to avoid async middleware issues.
    """
    """Banking-specific metrics and KPIs."""
    from django.db.models import Count, Sum
    from django.utils import timezone
    from datetime import timedelta
    from banking.models import Transaction
    from banking.models import Account

    try:
        # Calculate metrics for the last 24 hours
        since = timezone.now() - timedelta(hours=24)

        # Transaction metrics
        transaction_metrics = Transaction.objects.filter(
            timestamp__gte=since
        ).aggregate(
            total_count=Count('id'),
            total_amount=Sum('amount')
        )

        # Account metrics
        account_metrics = {
            'total_accounts': Account.objects.count(),
            'active_accounts': Account.objects.filter(is_active=True).count()
        }

        response_data = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'metrics': {
                'transactions_24h': {
                    'count': transaction_metrics['total_count'] or 0,
                    'total_amount': float(transaction_metrics['total_amount'] or 0),
                },
                'accounts': {
                    'total': account_metrics['total_accounts'] or 0,
                    'active': account_metrics['active_accounts'] or 0,
                }
            }
        }

        logger.info(
            "Banking metrics retrieved",
            extra={
                'transaction_count_24h': transaction_metrics['total_count'] or 0,
                'total_accounts': account_metrics['total_accounts'] or 0,
            }
        )

        return JsonResponse(response_data, status=200)

    except Exception as e:
        logger.error(f"Banking metrics failed: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'error': 'Metrics calculation failed',
            'timestamp': timezone.now().isoformat()
        }, status=500)