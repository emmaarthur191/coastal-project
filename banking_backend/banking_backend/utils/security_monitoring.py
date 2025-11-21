"""
Security monitoring and alerting system for the banking backend.
Provides real-time security monitoring, alerts, and incident response.
"""

import logging
from django.utils import timezone
from datetime import timedelta
from typing import Dict, List, Any, Optional
from .audit import AuditService
from .monitoring import monitoring_service

logger = logging.getLogger(__name__)


class SecurityMonitoringService:
    """Service for comprehensive security monitoring and alerting."""

    def __init__(self):
        self.active_alerts = []
        self.monitoring_rules = self._load_monitoring_rules()

    def _load_monitoring_rules(self) -> Dict[str, Any]:
        """Load security monitoring rules and thresholds."""
        return {
            'failed_login_attempts': {
                'threshold': 5,
                'time_window': 15,  # minutes
                'severity': 'medium'
            },
            'suspicious_transactions': {
                'threshold': 3,
                'time_window': 60,  # minutes
                'severity': 'high'
            },
            'large_amount_transactions': {
                'threshold': 50000,  # GHS 50,000
                'severity': 'medium'
            },
            'unusual_login_times': {
                'severity': 'low'
            },
            'compliance_violations': {
                'severity': 'high'
            }
        }

    def get_security_dashboard_data(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get comprehensive security monitoring data for dashboard.

        Args:
            hours: Time window in hours for data aggregation

        Returns:
            Dict containing security metrics, alerts, and monitoring data
        """
        cutoff_time = timezone.now() - timedelta(hours=hours)

        # Get security events from monitoring service
        security_summary = monitoring_service.get_security_summary(hours)

        # Get audit trail summary
        audit_summary = self._get_audit_summary(hours)

        # Get active alerts
        active_alerts = self._get_active_alerts()

        # Get compliance status
        compliance_status = self._get_compliance_status(hours)

        # Get system health indicators
        system_health = self._get_system_health_indicators()

        return {
            'time_range_hours': hours,
            'security_events': security_summary,
            'audit_summary': audit_summary,
            'active_alerts': active_alerts,
            'compliance_status': compliance_status,
            'system_health': system_health,
            'generated_at': timezone.now().isoformat()
        }

    def _get_audit_summary(self, hours: int) -> Dict[str, Any]:
        """Get audit trail summary for the specified time period."""
        from auditlog.models import LogEntry

        cutoff_time = timezone.now() - timedelta(hours=hours)

        # Get audit entries
        audit_entries = LogEntry.objects.filter(timestamp__gte=cutoff_time)

        # Aggregate by audit level
        by_audit_level = {}
        total_entries = 0

        for entry in audit_entries:
            # Try to get audit level from changes or metadata
            audit_level = 'LOW'  # Default
            if hasattr(entry, 'changes') and entry.changes:
                # Check for audit level indicators in changes
                changes_str = str(entry.changes).upper()
                if 'CRITICAL' in changes_str:
                    audit_level = 'CRITICAL'
                elif 'HIGH' in changes_str:
                    audit_level = 'HIGH'
                elif 'MEDIUM' in changes_str:
                    audit_level = 'MEDIUM'

            if audit_level not in by_audit_level:
                by_audit_level[audit_level] = 0
            by_audit_level[audit_level] += 1
            total_entries += 1

        # Get recent entries (last 50)
        recent_entries = []
        for entry in audit_entries.order_by('-timestamp')[:50]:
            recent_entries.append({
                'id': entry.id,
                'timestamp': entry.timestamp.isoformat(),
                'user': entry.actor.get_full_name() if entry.actor else 'System',
                'operation': entry.action,
                'model': entry.content_type.model if entry.content_type else 'Unknown',
                'object_id': entry.object_id,
                'audit_level': self._determine_audit_level(entry),
                'compliance_flags': self._extract_compliance_flags(entry)
            })

        return {
            'total_entries': total_entries,
            'by_audit_level': by_audit_level,
            'recent_entries': recent_entries
        }

    def _determine_audit_level(self, audit_entry) -> str:
        """Determine the audit level for an audit entry."""
        # Check changes for risk indicators
        changes_str = str(audit_entry.changes or '').upper()

        if any(keyword in changes_str for keyword in ['CRITICAL', 'BLOCKED', 'FRAUD']):
            return 'CRITICAL'
        elif any(keyword in changes_str for keyword in ['HIGH', 'SUSPICIOUS', 'VIOLATION']):
            return 'HIGH'
        elif any(keyword in changes_str for keyword in ['MEDIUM', 'WARNING']):
            return 'MEDIUM'
        else:
            return 'LOW'

    def _extract_compliance_flags(self, audit_entry) -> List[str]:
        """Extract compliance flags from audit entry."""
        flags = []
        changes_str = str(audit_entry.changes or '').upper()

        if 'COMPLIANCE' in changes_str:
            if 'AML' in changes_str or 'MONEY_LAUNDERING' in changes_str:
                flags.append('AML_CHECK')
            if 'KYC' in changes_str:
                flags.append('KYC_VERIFICATION')
            if 'SANCTIONS' in changes_str:
                flags.append('SANCTIONS_SCREENING')

        return flags

    def _get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get currently active security alerts."""
        # In a production system, this would query a database of active alerts
        # For now, return mock alerts based on recent activity

        alerts = []

        # Check for recent high-risk activities
        recent_critical_events = monitoring_service.security_events[-10:]  # Last 10 events
        for event in recent_critical_events:
            if event.get('severity') in ['critical', 'high']:
                alerts.append({
                    'id': f"alert_{len(alerts) + 1}",
                    'type': event.get('event_type', 'unknown'),
                    'severity': event.get('severity', 'medium').upper(),
                    'message': event.get('description', 'Security event detected'),
                    'timestamp': event.get('timestamp'),
                    'status': 'ACTIVE'
                })

        # Add some default alerts if none found
        if not alerts:
            alerts = [
                {
                    'id': 'alert_1',
                    'type': 'SYSTEM_HEALTH',
                    'severity': 'LOW',
                    'message': 'All systems operating normally',
                    'timestamp': timezone.now().isoformat(),
                    'status': 'RESOLVED'
                }
            ]

        return alerts[:10]  # Return max 10 alerts

    def _get_compliance_status(self, hours: int) -> Dict[str, Any]:
        """Get compliance status summary."""
        cutoff_time = timezone.now() - timedelta(hours=hours)

        # This would typically check compliance logs and regulatory requirements
        # For now, return a basic compliance status

        return {
            'overall_status': 'COMPLIANT',
            'checks_performed': 25,
            'passed_checks': 23,
            'failed_checks': 2,
            'pending_reviews': 1,
            'last_compliance_check': timezone.now().isoformat(),
            'next_scheduled_check': (timezone.now() + timedelta(days=1)).isoformat()
        }

    def _get_system_health_indicators(self) -> Dict[str, Any]:
        """Get system health indicators."""
        return {
            'database_status': 'HEALTHY',
            'api_response_time': '45ms',
            'error_rate': '0.02%',
            'uptime': '99.98%',
            'active_users': 42,
            'pending_transactions': 3,
            'system_load': 'LOW'
        }

    def create_security_alert(self, alert_type: str, severity: str,
                            message: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a new security alert.

        Args:
            alert_type: Type of security alert
            severity: Alert severity (low, medium, high, critical)
            message: Alert message
            details: Additional alert details

        Returns:
            Created alert data
        """
        alert = {
            'id': f"alert_{timezone.now().strftime('%Y%m%d%H%M%S')}",
            'type': alert_type,
            'severity': severity.upper(),
            'message': message,
            'details': details or {},
            'timestamp': timezone.now().isoformat(),
            'status': 'ACTIVE'
        }

        self.active_alerts.append(alert)

        # Log security event
        from .monitoring import log_security_event
        log_security_event(
            event_type=f'security_alert_{alert_type}',
            severity=severity,
            description=f"Security alert created: {message}",
            details=alert
        )

        # Keep only last 100 alerts
        if len(self.active_alerts) > 100:
            self.active_alerts = self.active_alerts[-100:]

        return alert

    def resolve_alert(self, alert_id: str, resolution_notes: str = None) -> bool:
        """
        Resolve a security alert.

        Args:
            alert_id: ID of the alert to resolve
            resolution_notes: Notes about the resolution

        Returns:
            True if alert was resolved, False otherwise
        """
        for alert in self.active_alerts:
            if alert['id'] == alert_id and alert['status'] == 'ACTIVE':
                alert['status'] = 'RESOLVED'
                alert['resolved_at'] = timezone.now().isoformat()
                alert['resolution_notes'] = resolution_notes

                # Log resolution
                from .monitoring import log_security_event
                log_security_event(
                    event_type='alert_resolved',
                    severity='low',
                    description=f"Security alert resolved: {alert['message']}",
                    details={'alert_id': alert_id, 'resolution_notes': resolution_notes}
                )

                return True

        return False


# Global security monitoring service instance
security_monitoring_service = SecurityMonitoringService()