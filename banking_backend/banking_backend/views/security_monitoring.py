"""
Security monitoring views for the banking backend.
Provides API endpoints for security dashboard and monitoring.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from banking.permissions import IsOperationsManager, IsManager
from banking_backend.utils.security_monitoring import security_monitoring_service


class SecurityMonitoringViewSet(viewsets.GenericViewSet):
    """
    Security monitoring and alerting API endpoints.
    Provides comprehensive security monitoring data and alert management.
    """
    permission_classes = [IsAuthenticated, IsManager]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsManager])
    def dashboard(self, request):
        """
        Get security monitoring dashboard data.
        Endpoint: /api/v1/security/dashboard/
        """
        try:
            hours = int(request.query_params.get('hours', 24))
            dashboard_data = security_monitoring_service.get_security_dashboard_data(hours)

            return Response(dashboard_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve security dashboard data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsManager])
    def alerts(self, request):
        """
        Get active security alerts.
        Endpoint: /api/v1/security/alerts/
        """
        try:
            alerts = security_monitoring_service._get_active_alerts()
            return Response({'alerts': alerts}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve alerts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsOperationsManager])
    def create_alert(self, request):
        """
        Create a new security alert.
        Endpoint: /api/v1/security/create-alert/
        """
        try:
            alert_type = request.data.get('alert_type')
            severity = request.data.get('severity', 'medium')
            message = request.data.get('message')
            details = request.data.get('details', {})

            if not alert_type or not message:
                return Response(
                    {'error': 'alert_type and message are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            alert = security_monitoring_service.create_security_alert(
                alert_type=alert_type,
                severity=severity,
                message=message,
                details=details
            )

            return Response({'alert': alert}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to create alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsManager])
    def resolve_alert(self, request, pk=None):
        """
        Resolve a security alert.
        Endpoint: /api/v1/security/alerts/{id}/resolve/
        """
        try:
            resolution_notes = request.data.get('resolution_notes', '')

            success = security_monitoring_service.resolve_alert(pk, resolution_notes)

            if success:
                return Response(
                    {'message': 'Alert resolved successfully'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Alert not found or already resolved'},
                    status=status.HTTP_404_NOT_FOUND
                )

        except Exception as e:
            return Response(
                {'error': f'Failed to resolve alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsManager])
    def compliance_status(self, request):
        """
        Get compliance status summary.
        Endpoint: /api/v1/security/compliance-status/
        """
        try:
            hours = int(request.query_params.get('hours', 24))
            compliance_status = security_monitoring_service._get_compliance_status(hours)

            return Response(compliance_status, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve compliance status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsManager])
    def audit_trail(self, request):
        """
        Get audit trail summary.
        Endpoint: /api/v1/security/audit-trail/
        """
        try:
            hours = int(request.query_params.get('hours', 24))
            audit_summary = security_monitoring_service._get_audit_summary(hours)

            return Response(audit_summary, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve audit trail: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )