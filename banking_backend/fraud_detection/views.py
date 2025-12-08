from datetime import datetime, timedelta
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
import structlog

from .models import FraudRule, FraudAlert
from .audit_trail import FraudAuditTrail
from .redis_rule_engine import redis_rule_engine
from .audit_trail import audit_trail_manager
from .logging_system import distributed_logger
from .serializers import (
    FraudRuleSerializer, FraudAlertSerializer, FraudAuditTrailSerializer
)

logger = structlog.get_logger(__name__)


class FraudRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing fraud detection rules.
    Provides CRUD operations with real-time synchronization.
    """
    queryset = FraudRule.objects.all()
    serializer_class = FraudRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on user permissions."""
        user = self.request.user
        if user.has_perm('fraud_detection.can_manage_rules'):
            return FraudRule.objects.all()
        elif user.has_perm('fraud_detection.can_view_rules'):
            return FraudRule.objects.filter(is_active=True)
        else:
            return FraudRule.objects.none()

    def perform_create(self, serializer):
        """Create rule and sync with Redis."""
        rule = serializer.save(created_by=self.request.user)

        # Sync with Redis rule engine
        redis_rule_engine.reload_rules()

        # Log rule creation
        distributed_logger.log_fraud_event(
            'rule_created',
            f"rule_{rule.id}",
            "system",
            str(self.request.user.id),
            {
                'rule_id': str(rule.id),
                'rule_name': rule.name,
                'rule_type': rule.rule_type
            },
            'info'
        )

    def perform_update(self, serializer):
        """Update rule and sync with Redis."""
        rule = serializer.save(updated_by=self.request.user)

        # Sync with Redis rule engine
        redis_rule_engine.reload_rules()

        # Log rule update
        distributed_logger.log_fraud_event(
            'rule_updated',
            f"rule_{rule.id}",
            "system",
            str(self.request.user.id),
            {
                'rule_id': str(rule.id),
                'rule_name': rule.name,
                'changes': serializer.validated_data
            },
            'info'
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a fraud rule."""
        rule = self.get_object()

        if not request.user.has_perm('fraud_detection.can_manage_rules'):
            raise PermissionDenied("Insufficient permissions")

        rule.is_active = True
        rule.save()

        redis_rule_engine.reload_rules()

        distributed_logger.log_fraud_event(
            'rule_activated',
            f"rule_{rule.id}",
            "system",
            str(request.user.id),
            {'rule_id': str(rule.id), 'rule_name': rule.name},
            'info'
        )

        return Response({'status': 'Rule activated'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a fraud rule."""
        rule = self.get_object()

        if not request.user.has_perm('fraud_detection.can_manage_rules'):
            raise PermissionDenied("Insufficient permissions")

        rule.is_active = False
        rule.save()

        redis_rule_engine.reload_rules()

        distributed_logger.log_fraud_event(
            'rule_deactivated',
            f"rule_{rule.id}",
            "system",
            str(request.user.id),
            {'rule_id': str(rule.id), 'rule_name': rule.name},
            'warning'
        )

        return Response({'status': 'Rule deactivated'})

    @action(detail=False, methods=['post'])
    def reload_cache(self, request):
        """Force reload of rule cache from database."""
        if not request.user.has_perm('fraud_detection.can_manage_rules'):
            raise PermissionDenied("Insufficient permissions")

        success = redis_rule_engine.reload_rules()

        return Response({
            'status': 'Cache reloaded' if success else 'Cache reload failed',
            'success': success
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get rule engine statistics."""
        stats = redis_rule_engine.get_rule_statistics()
        return Response(stats)

    @action(detail=True, methods=['post'])
    def test_rule(self, request, pk=None):
        """Test a rule against sample data."""
        rule = self.get_object()
        test_data = request.data.get('test_data', {})

        if not test_data:
            return Response(
                {'error': 'test_data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create test correlation ID
        correlation_id = f"test_{rule.id}_{timezone.now().timestamp()}"

        # Evaluate rule
        is_fraudulent, score, triggered_rules = redis_rule_engine.evaluate_rules(
            test_data, correlation_id
        )

        result = {
            'rule_id': str(rule.id),
            'rule_name': rule.name,
            'is_fraudulent': is_fraudulent,
            'score': score,
            'triggered_rules': triggered_rules,
            'correlation_id': correlation_id,
            'test_timestamp': timezone.now().isoformat()
        }

        return Response(result)


class FraudAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing fraud alerts.
    Provides read-only access with filtering and pagination.
    """
    queryset = FraudAlert.objects.all()
    serializer_class = FraudAlertSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """Filter alerts based on user permissions and query parameters."""
        user = self.request.user
        queryset = FraudAlert.objects.select_related('transaction', 'account', 'user')

        # Permission-based filtering
        if not user.has_perm('fraud_detection.can_monitor_alerts'):
            return FraudAlert.objects.none()

        # Query parameters
        priority = self.request.query_params.get('priority')
        status_filter = self.request.query_params.get('status')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if priority:
            queryset = queryset.filter(priority=priority)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a fraud alert."""
        alert = self.get_object()

        if not request.user.has_perm('fraud_detection.can_resolve_alerts'):
            raise PermissionDenied("Insufficient permissions")

        notes = request.data.get('notes', '')
        alert.status = 'acknowledged'
        alert.resolved_by = request.user
        alert.resolution_notes = notes
        alert.save()

        # Log acknowledgement
        distributed_logger.log_fraud_event(
            'alert_acknowledged',
            f"alert_{alert.id}",
            str(alert.transaction.id) if alert.transaction else "unknown",
            str(request.user.id),
            {
                'alert_id': str(alert.id),
                'acknowledged_by': request.user.username,
                'notes': notes
            },
            'info'
        )

        return Response({'status': 'Alert acknowledged'})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a fraud alert."""
        alert = self.get_object()

        if not request.user.has_perm('fraud_detection.can_resolve_alerts'):
            raise PermissionDenied("Insufficient permissions")

        resolution = request.data.get('resolution', 'resolved')
        notes = request.data.get('notes', '')

        alert.status = resolution
        alert.resolved_by = request.user
        alert.resolution_notes = notes
        alert.save()

        # Log resolution
        distributed_logger.log_fraud_event(
            'alert_resolved',
            f"alert_{alert.id}",
            str(alert.transaction.id) if alert.transaction else "unknown",
            str(request.user.id),
            {
                'alert_id': str(alert.id),
                'resolution': resolution,
                'resolved_by': request.user.username,
                'notes': notes
            },
            'info'
        )

        return Response({'status': f'Alert {resolution}'})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get alert statistics."""
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now() - timedelta(days=days)

        stats = {
            'total_alerts': FraudAlert.objects.filter(created_at__gte=since_date).count(),
            'active_alerts': FraudAlert.objects.filter(
                created_at__gte=since_date, status='new'
            ).count(),
            'resolved_alerts': FraudAlert.objects.filter(
                created_at__gte=since_date, status__in=['resolved', 'dismissed']
            ).count(),
            'critical_alerts': FraudAlert.objects.filter(
                created_at__gte=since_date, priority='critical'
            ).count(),
            'high_priority_alerts': FraudAlert.objects.filter(
                created_at__gte=since_date, priority='high'
            ).count()
        }

        return Response(stats)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for fraud alerts."""
        hours = int(request.query_params.get('hours', 24))
        start_time = timezone.now() - timedelta(hours=hours)

        alerts = FraudAlert.objects.filter(created_at__gte=start_time)
        stats = {
            'total_alerts': alerts.count(),
            'alerts_by_type': alerts.values('type').annotate(count=Count('id')),
            'high_risk': alerts.filter(risk_level='HIGH').count(),
            # Add more stats based on your needs
        }

        return Response(stats)


class FraudAuditTrailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for querying audit trails.
    Provides secure access to fraud detection audit logs.
    """
    queryset = FraudAuditTrail.objects.all()
    serializer_class = FraudAuditTrailSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """Filter audit entries based on permissions."""
        user = self.request.user

        if user.has_perm('fraud_detection.can_view_audit_trail'):
            queryset = FraudAuditTrail.objects.all()
        elif user.has_perm('fraud_detection.can_view_own_audit_trail'):
            queryset = FraudAuditTrail.objects.filter(created_by=user)
        else:
            return FraudAuditTrail.objects.none()

        # Apply query filters
        correlation_id = self.request.query_params.get('correlation_id')
        transaction_id = self.request.query_params.get('transaction_id')
        decision_type = self.request.query_params.get('decision_type')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if correlation_id:
            queryset = queryset.filter(correlation_id=correlation_id)
        if transaction_id:
            queryset = queryset.filter(transaction_id=transaction_id)
        if decision_type:
            queryset = queryset.filter(decision_type=decision_type)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        """Rollback an audit entry."""
        audit_entry = self.get_object()

        if not request.user.has_perm('fraud_detection.can_rollback_audit'):
            raise PermissionDenied("Insufficient permissions")

        reason = request.data.get('reason', 'Manual rollback')

        success = audit_entry.rollback(request.user, reason)

        if success:
            return Response({'status': 'Audit entry rolled back'})
        else:
            return Response(
                {'error': 'Rollback failed'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get audit trail statistics."""
        days = int(request.query_params.get('days', 30))
        stats = audit_trail_manager.get_audit_statistics(days)
        return Response(stats)

    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export audit data for compliance."""
        if not request.user.has_perm('fraud_detection.can_export_audit_data'):
            raise PermissionDenied("Insufficient permissions")

        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        export_format = request.data.get('format', 'json')

        if not start_date_str or not end_date_str:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Invalid date format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        export_data = audit_trail_manager.export_audit_data(start_date, end_date, export_format)

        response = HttpResponse(export_data, content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="fraud_audit_{start_date.date()}_{end_date.date()}.{export_format}"'

        return response

    @action(detail=True, methods=['get'])
    def verify_integrity(self, request, pk=None):
        """Verify integrity of an audit entry."""
        audit_entry = self.get_object()

        is_valid = audit_entry.verify_integrity()

        return Response({
            'audit_id': str(audit_entry.id),
            'integrity_verified': is_valid,
            'hash': audit_entry.decision_hash
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evaluate_transaction(request):
    """
    Evaluate a transaction against fraud detection rules.
    """
    if not request.user.has_perm('fraud_detection.can_evaluate_transactions'):
        raise PermissionDenied("Insufficient permissions")

    transaction_data = request.data.get('transaction_data', {})
    if not transaction_data:
        return Response(
            {'error': 'transaction_data is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Generate correlation ID
    correlation_id = f"eval_{request.user.id}_{timezone.now().timestamp()}"

    # Evaluate transaction
    is_fraudulent, score, triggered_rules = redis_rule_engine.evaluate_rules(
        transaction_data, correlation_id
    )

    # Create audit entry
    audit_trail_manager.create_audit_entry(
        correlation_id=correlation_id,
        transaction_id=transaction_data.get('transaction_id', 'unknown'),
        user_id=transaction_data.get('user_id', str(request.user.id)),
        decision_type='fraud_evaluation',
        decision_data={
            'is_fraudulent': is_fraudulent,
            'score': score,
            'triggered_rules': triggered_rules,
            'transaction_data': transaction_data
        },
        severity='high' if is_fraudulent else 'low',
        created_by=request.user
    )

    result = {
        'correlation_id': correlation_id,
        'is_fraudulent': is_fraudulent,
        'fraud_score': score,
        'triggered_rules': triggered_rules,
        'evaluation_timestamp': timezone.now().isoformat()
    }

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health(request):
    """
    Get overall system health status.
    """
    if not request.user.has_perm('fraud_detection.can_monitor_system'):
        raise PermissionDenied("Insufficient permissions")

    # Check Redis connectivity
    redis_status = 'healthy'
    try:
        redis_rule_engine.redis_client.ping()
    except Exception:
        redis_status = 'unhealthy'

    # Get system statistics
    rule_stats = redis_rule_engine.get_rule_statistics()
    log_stats = distributed_logger.get_log_statistics()
    audit_stats = audit_trail_manager.get_audit_statistics(7)

    health_data = {
        'timestamp': timezone.now().isoformat(),
        'redis_status': redis_status,
        'rule_engine': {
            'status': 'healthy' if rule_stats.get('cache_status') == 'active' else 'degraded',
            'active_rules': rule_stats.get('total_rules', 0),
            'cache_status': rule_stats.get('cache_status', 'unknown')
        },
        'logging_system': {
            'status': 'healthy',
            'total_logs': log_stats.get('total_logs', 0),
            'correlation_count': log_stats.get('correlation_count', 0)
        },
        'audit_trail': {
            'status': 'healthy',
            'total_entries': audit_stats.get('total_entries', 0),
            'rollback_count': audit_stats.get('rollback_count', 0)
        },
        'overall_status': 'healthy' if redis_status == 'healthy' else 'degraded'
    }

    return Response(health_data)
