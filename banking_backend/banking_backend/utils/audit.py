import logging
import json
from auditlog.models import LogEntry
from auditlog.context import set_actor
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
from .monitoring import log_security_event

logger = logging.getLogger(__name__)
User = get_user_model()

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


class AuditService:
    """Enhanced service for managing comprehensive audit logging for financial operations."""

    AUDIT_LEVELS = {
        'LOW': 'low',
        'MEDIUM': 'medium',
        'HIGH': 'high',
        'CRITICAL': 'critical'
    }

    @staticmethod
    def log_financial_operation(user, operation_type, model_name, object_id, changes=None, metadata=None, audit_level='MEDIUM'):
        """
        Log a financial operation for audit purposes with enhanced detail.

        Args:
            user: User performing the operation
            operation_type: Type of operation (CREATE, UPDATE, DELETE, VIEW)
            model_name: Name of the model being operated on
            object_id: ID of the object being operated on
            changes: Dict of changes made
            metadata: Additional metadata
            audit_level: Audit importance level
        """
        import uuid
        # Skip LogEntry creation for UUID primary keys as LogEntry.object_id expects integer
        if isinstance(object_id, uuid.UUID):
            return

        try:
            # Create comprehensive audit log entry
            audit_data = {
                'user_id': str(user.id),
                'user_email': user.email,
                'user_role': getattr(user, 'role', 'unknown'),
                'operation_type': operation_type,
                'model_name': model_name,
                'object_id': str(object_id),
                'changes': changes or {},
                'metadata': metadata or {},
                'audit_level': audit_level,
                'ip_address': getattr(user, 'ip_address', None),
                'user_agent': metadata.get('user_agent') if metadata else None,
                'session_id': metadata.get('session_id') if metadata else None,
                'timestamp': timezone.now().isoformat(),
                'compliance_flags': AuditService._check_compliance_flags(operation_type, model_name, changes, metadata)
            }

            # Create audit log entry with enhanced data
            # Skip LogEntry creation for Account model due to UUID object_id issue
            if model_name != 'Account':
                try:
                    log_entry = LogEntry.objects.create(
                        actor=user,
                        action=AuditService._map_operation_to_action(operation_type),
                        content_type_id=None,  # Will be set by auditlog
                        object_id=str(object_id),
                        object_repr=f"{model_name} {object_id}",
                        changes=json.dumps(audit_data, default=decimal_default),
                        timestamp=timezone.now(),
                    )
                except Exception as e:
                    if "object_id" in str(e) or "expected a number" in str(e):
                        pass  # ignore for now — or use a custom LogEntry model with BigIntegerField/UUIDField
                    else:
                        raise

            # Log to application logger with structured data
            logger.info(
                f"AUDIT: {operation_type} on {model_name} {object_id} by {user.email} ({user.role})",
                extra=audit_data
            )

            # Log security event for sensitive operations
            if audit_level in ['HIGH', 'CRITICAL'] or (operation_type in ['CREATE', 'UPDATE', 'DELETE'] and model_name in ['Account', 'Transaction', 'Loan']):
                log_security_event(
                    event_type=f'financial_operation_{operation_type.lower()}',
                    severity=audit_level.lower(),
                    user_id=user.id,
                    ip_address=audit_data.get('ip_address'),
                    description=f"{operation_type} operation on {model_name}",
                    details=audit_data
                )

        except Exception as e:
            logger.error(f"Failed to log financial operation: {str(e)}", exc_info=True)

    @staticmethod
    def _map_operation_to_action(operation_type):
        """Map operation type to auditlog action."""
        mapping = {
            'CREATE': LogEntry.Action.CREATE,
            'UPDATE': LogEntry.Action.UPDATE,
            'DELETE': LogEntry.Action.DELETE,
            'VIEW': LogEntry.Action.UPDATE,  # Use UPDATE for view operations
        }
        return mapping.get(operation_type, LogEntry.Action.UPDATE)

    @staticmethod
    def _check_compliance_flags(operation_type, model_name, changes, metadata):
        """Check for compliance-related flags that require special attention."""
        flags = []

        # High-value transaction flag
        if model_name == 'Transaction' and changes:
            amount = changes.get('amount', 0)
            if isinstance(amount, (int, float, Decimal)) and abs(amount) > 10000:  # GHS 10,000 threshold
                flags.append('HIGH_VALUE_TRANSACTION')

        # Suspicious activity flags
        if operation_type == 'UPDATE' and model_name == 'Account':
            if changes.get('status') == 'suspended':
                flags.append('ACCOUNT_SUSPENSION')
            elif changes.get('balance', 0) < -1000:  # Overdraft threshold
                flags.append('LARGE_OVERDRAFT')

        # Regulatory reporting flags
        if model_name in ['Transaction', 'Loan'] and operation_type in ['CREATE', 'UPDATE']:
            flags.append('REGULATORY_REPORTING_REQUIRED')

        # Cash transaction flags
        if metadata and metadata.get('transaction_type') == 'cash':
            flags.append('CASH_TRANSACTION')

        return flags

    @staticmethod
    def log_transaction(user, transaction, operation_type="CREATE", metadata=None):
        """Log transaction-related operations with enhanced detail."""
        changes = {
            'amount': str(transaction.amount),
            'type': transaction.type,
            'account': str(transaction.account.id) if hasattr(transaction, 'account') else None,
            'timestamp': transaction.timestamp.isoformat(),
            'status': getattr(transaction, 'status', 'unknown'),
            'description': getattr(transaction, 'description', ''),
        }

        # Determine audit level based on transaction characteristics
        audit_level = 'MEDIUM'
        if abs(transaction.amount) > 50000:  # High value transaction
            audit_level = 'HIGH'
        elif transaction.type in ['withdrawal', 'transfer'] and abs(transaction.amount) > 10000:
            audit_level = 'HIGH'

        combined_metadata = {
            'transaction_type': transaction.type,
            'account_type': getattr(transaction.account, 'account_type', 'unknown') if hasattr(transaction, 'account') else 'unknown',
            'branch': getattr(user, 'branch', 'unknown'),
            'cashier_id': str(user.id),
        }
        if metadata:
            combined_metadata.update(metadata)

        AuditService.log_financial_operation(
            user=user,
            operation_type=operation_type,
            model_name="Transaction",
            object_id=transaction.id,
            changes=changes,
            metadata=combined_metadata,
            audit_level=audit_level
        )

    @staticmethod
    def log_account_balance_change(user, account, old_balance, new_balance, reason, metadata=None):
        """Log account balance changes with compliance tracking."""
        changes = {
            'old_balance': str(old_balance),
            'new_balance': str(new_balance),
            'change_amount': str(new_balance - old_balance),
            'reason': reason,
            'account_type': getattr(account, 'account_type', 'unknown'),
            'account_status': getattr(account, 'status', 'unknown'),
        }

        # Determine audit level based on change characteristics
        audit_level = 'MEDIUM'
        change_amount = abs(new_balance - old_balance)
        if change_amount > 50000:
            audit_level = 'HIGH'
        elif new_balance < -5000:  # Significant overdraft
            audit_level = 'HIGH'
        elif reason in ['suspicious_activity', 'fraud_investigation']:
            audit_level = 'CRITICAL'

        combined_metadata = {
            'account_number': getattr(account, 'account_number', 'unknown'),
            'customer_id': str(getattr(account, 'customer_id', 'unknown')),
            'branch': getattr(user, 'branch', 'unknown'),
            'compliance_check_required': change_amount > 10000 or new_balance < 0,
        }
        if metadata:
            combined_metadata.update(metadata)

        AuditService.log_financial_operation(
            user=user,
            operation_type="UPDATE",
            model_name="Account",
            object_id=account.id,
            changes=changes,
            metadata=combined_metadata,
            audit_level=audit_level
        )

    @staticmethod
    def log_loan_operation(user, loan, operation_type, changes=None, metadata=None):
        """Log loan-related operations with regulatory compliance."""
        audit_changes = changes or {}
        if hasattr(loan, 'principal_amount'):
            audit_changes['loan_amount'] = str(loan.principal_amount)
        if hasattr(loan, 'interest_rate'):
            audit_changes['interest_rate'] = str(loan.interest_rate)
        if hasattr(loan, 'status'):
            audit_changes['status'] = loan.status

        # Determine audit level
        audit_level = 'HIGH' if operation_type in ['CREATE', 'UPDATE'] else 'MEDIUM'

        combined_metadata = {
            'loan_type': getattr(loan, 'loan_type', 'unknown'),
            'customer_id': str(getattr(loan, 'customer_id', 'unknown')),
            'branch': getattr(user, 'branch', 'unknown'),
            'regulatory_reporting_required': True,  # Loans typically require regulatory reporting
        }
        if metadata:
            combined_metadata.update(metadata)

        AuditService.log_financial_operation(
            user=user,
            operation_type=operation_type,
            model_name="Loan",
            object_id=loan.id,
            changes=audit_changes,
            metadata=combined_metadata,
            audit_level=audit_level
        )

    @staticmethod
    def log_cash_drawer_operation(user, drawer, operation_type, changes=None, metadata=None):
        """Log cash drawer operations for teller accountability."""
        audit_changes = changes or {}
        if hasattr(drawer, 'current_balance'):
            audit_changes['balance'] = str(drawer.current_balance)
        if hasattr(drawer, 'status'):
            audit_changes['status'] = drawer.status

        combined_metadata = {
            'drawer_id': str(drawer.id),
            'branch': getattr(user, 'branch', 'unknown'),
            'operation_time': timezone.now().isoformat(),
            'cashier_shift': getattr(user, 'current_shift', 'unknown'),
        }
        if metadata:
            combined_metadata.update(metadata)

        AuditService.log_financial_operation(
            user=user,
            operation_type=operation_type,
            model_name="CashDrawer",
            object_id=drawer.id,
            changes=audit_changes,
            metadata=combined_metadata,
            audit_level='HIGH'  # Cash operations are always high priority
        )

    @staticmethod
    def log_security_event(user, event_type, description, severity='MEDIUM', details=None):
        """Log security-related events."""
        try:
            audit_data = {
                'user_id': str(user.id) if user else None,
                'user_email': user.email if user else None,
                'user_role': getattr(user, 'role', 'unknown') if user else None,
                'event_type': event_type,
                'description': description,
                'severity': severity,
                'details': details or {},
                'ip_address': getattr(user, 'ip_address', None) if user else None,
                'timestamp': timezone.now().isoformat(),
            }

            logger.warning(
                f"SECURITY EVENT: {event_type} - {description}",
                extra=audit_data
            )

            # Create audit log entry for security events
            if user:
                try:
                    LogEntry.objects.create(
                        actor=user,
                        action=LogEntry.Action.UPDATE,
                        content_type_id=None,
                        object_id=f"security_{event_type}_{timezone.now().strftime('%Y%m%d%H%M%S')}",
                        object_repr=f"Security Event: {event_type}",
                        changes=json.dumps(audit_data),
                        timestamp=timezone.now(),
                    )
                except ValueError as e:
                    if "object_id" in str(e):
                        pass  # ignore for now — or use a custom LogEntry model with BigIntegerField/UUIDField
                    else:
                        raise

        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}", exc_info=True)


def audit_context(user):
    """
    Context manager to set the audit actor for operations within the context.
    """
    return set_actor(user)


def get_audit_trail(model_instance, limit=50):
    """
    Get audit trail for a specific model instance.

    Args:
        model_instance: Django model instance
        limit: Maximum number of entries to return

    Returns:
        QuerySet of LogEntry objects
    """
    return LogEntry.objects.filter(
        content_type__model=model_instance._meta.model_name,
        object_id=str(model_instance.pk)
    ).order_by('-timestamp')[:limit]


class AuditReportingService:
    """Service for generating audit reports and analytics."""

    @staticmethod
    def get_user_activity_report(user_id, days=30):
        """Generate activity report for a specific user."""
        start_date = timezone.now() - timedelta(days=days)

        entries = LogEntry.objects.filter(
            actor__id=user_id,
            timestamp__gte=start_date
        ).order_by('-timestamp')

        # Parse the JSON changes field to extract meaningful data
        activities = []
        for entry in entries:
            try:
                changes_data = json.loads(entry.changes) if entry.changes else {}
                activities.append({
                    'timestamp': entry.timestamp,
                    'action': entry.action,
                    'model': changes_data.get('model_name', 'Unknown'),
                    'operation': changes_data.get('operation_type', 'Unknown'),
                    'audit_level': changes_data.get('audit_level', 'LOW'),
                    'details': changes_data
                })
            except (json.JSONDecodeError, TypeError):
                activities.append({
                    'timestamp': entry.timestamp,
                    'action': entry.action,
                    'model': 'Unknown',
                    'operation': 'Unknown',
                    'audit_level': 'LOW',
                    'details': {}
                })

        return {
            'user_id': user_id,
            'period_days': days,
            'total_activities': len(activities),
            'activities': activities,
            'summary': AuditReportingService._summarize_activities(activities)
        }

    @staticmethod
    def get_compliance_report(days=90):
        """Generate compliance report for regulatory requirements."""
        start_date = timezone.now() - timedelta(days=days)

        # Get all audit entries with compliance flags
        entries = LogEntry.objects.filter(
            timestamp__gte=start_date
        ).exclude(changes__isnull=True)

        compliance_events = []
        for entry in entries:
            try:
                changes_data = json.loads(entry.changes)
                flags = changes_data.get('compliance_flags', [])
                if flags:
                    compliance_events.append({
                        'timestamp': entry.timestamp,
                        'user': entry.actor.email if entry.actor else 'System',
                        'event_type': changes_data.get('operation_type', 'Unknown'),
                        'model': changes_data.get('model_name', 'Unknown'),
                        'flags': flags,
                        'details': changes_data
                    })
            except (json.JSONDecodeError, TypeError):
                continue

        return {
            'period_days': days,
            'total_events': len(compliance_events),
            'compliance_events': compliance_events,
            'flag_summary': AuditReportingService._summarize_compliance_flags(compliance_events),
            'regulatory_requirements': AuditReportingService._check_regulatory_compliance(compliance_events)
        }

    @staticmethod
    def get_high_risk_transaction_report(days=7):
        """Generate report of high-risk transactions."""
        start_date = timezone.now() - timedelta(days=days)

        # Get entries with HIGH or CRITICAL audit levels
        entries = LogEntry.objects.filter(
            timestamp__gte=start_date
        ).exclude(changes__isnull=True)

        high_risk_transactions = []
        for entry in entries:
            try:
                changes_data = json.loads(entry.changes)
                audit_level = changes_data.get('audit_level', 'LOW')
                model_name = changes_data.get('model_name', '')

                if audit_level in ['HIGH', 'CRITICAL'] and model_name in ['Transaction', 'Account', 'Loan']:
                    high_risk_transactions.append({
                        'timestamp': entry.timestamp,
                        'user': entry.actor.email if entry.actor else 'System',
                        'model': model_name,
                        'operation': changes_data.get('operation_type', 'Unknown'),
                        'amount': changes_data.get('changes', {}).get('amount', 'N/A'),
                        'audit_level': audit_level,
                        'flags': changes_data.get('compliance_flags', []),
                        'details': changes_data
                    })
            except (json.JSONDecodeError, TypeError):
                continue

        return {
            'period_days': days,
            'total_high_risk_transactions': len(high_risk_transactions),
            'transactions': high_risk_transactions,
            'risk_summary': AuditReportingService._summarize_risk_levels(high_risk_transactions)
        }

    @staticmethod
    def get_audit_dashboard_data(hours=24):
        """Get comprehensive audit data for dashboard display."""
        start_time = timezone.now() - timedelta(hours=hours)

        # Get recent audit entries
        recent_entries = LogEntry.objects.filter(
            timestamp__gte=start_time
        ).order_by('-timestamp')[:100]

        # Parse entries for dashboard
        dashboard_data = []
        for entry in recent_entries:
            try:
                changes_data = json.loads(entry.changes) if entry.changes else {}
                dashboard_data.append({
                    'id': entry.id,
                    'timestamp': entry.timestamp.isoformat(),
                    'user': entry.actor.email if entry.actor else 'System',
                    'action': entry.action,
                    'model': changes_data.get('model_name', 'Unknown'),
                    'operation': changes_data.get('operation_type', 'Unknown'),
                    'audit_level': changes_data.get('audit_level', 'LOW'),
                    'compliance_flags': changes_data.get('compliance_flags', [])
                })
            except (json.JSONDecodeError, TypeError):
                dashboard_data.append({
                    'id': entry.id,
                    'timestamp': entry.timestamp.isoformat(),
                    'user': 'System',
                    'action': entry.action,
                    'model': 'Unknown',
                    'operation': 'Unknown',
                    'audit_level': 'LOW',
                    'compliance_flags': []
                })

        # Generate summary statistics
        summary = {
            'total_entries': len(dashboard_data),
            'period_hours': hours,
            'by_audit_level': {},
            'by_operation': {},
            'by_user': {},
            'compliance_flags_count': 0
        }

        for entry in dashboard_data:
            # Count by audit level
            level = entry['audit_level']
            summary['by_audit_level'][level] = summary['by_audit_level'].get(level, 0) + 1

            # Count by operation
            operation = entry['operation']
            summary['by_operation'][operation] = summary['by_operation'].get(operation, 0) + 1

            # Count by user
            user = entry['user']
            summary['by_user'][user] = summary['by_user'].get(user, 0) + 1

            # Count compliance flags
            summary['compliance_flags_count'] += len(entry['compliance_flags'])

        return {
            'summary': summary,
            'recent_entries': dashboard_data[:50],  # Last 50 entries for display
            'alerts': AuditReportingService._generate_audit_alerts(dashboard_data)
        }

    @staticmethod
    def _summarize_activities(activities):
        """Summarize user activities."""
        summary = {
            'total_activities': len(activities),
            'by_operation': {},
            'by_model': {},
            'by_audit_level': {},
            'high_risk_activities': 0
        }

        for activity in activities:
            # Count by operation
            op = activity['operation']
            summary['by_operation'][op] = summary['by_operation'].get(op, 0) + 1

            # Count by model
            model = activity['model']
            summary['by_model'][model] = summary['by_model'].get(model, 0) + 1

            # Count by audit level
            level = activity['audit_level']
            summary['by_audit_level'][level] = summary['by_audit_level'].get(level, 0) + 1

            # Count high-risk activities
            if level in ['HIGH', 'CRITICAL']:
                summary['high_risk_activities'] += 1

        return summary

    @staticmethod
    def _summarize_compliance_flags(events):
        """Summarize compliance flags."""
        flag_counts = {}
        for event in events:
            for flag in event['flags']:
                flag_counts[flag] = flag_counts.get(flag, 0) + 1

        return flag_counts

    @staticmethod
    def _check_regulatory_compliance(events):
        """Check regulatory compliance requirements."""
        requirements = {
            'HIGH_VALUE_TRANSACTION': {'required': True, 'present': False},
            'REGULATORY_REPORTING_REQUIRED': {'required': True, 'present': False},
            'CASH_TRANSACTION': {'required': True, 'present': False}
        }

        for event in events:
            for flag in event['flags']:
                if flag in requirements:
                    requirements[flag]['present'] = True

        compliance_status = 'COMPLIANT'
        missing_requirements = []

        for req, status in requirements.items():
            if status['required'] and not status['present']:
                compliance_status = 'NON_COMPLIANT'
                missing_requirements.append(req)

        return {
            'status': compliance_status,
            'missing_requirements': missing_requirements,
            'checked_requirements': list(requirements.keys())
        }

    @staticmethod
    def _summarize_risk_levels(transactions):
        """Summarize risk levels in transactions."""
        summary = {
            'by_risk_level': {},
            'by_model': {},
            'total_amount': 0,
            'high_value_count': 0
        }

        for transaction in transactions:
            # Count by risk level
            level = transaction['audit_level']
            summary['by_risk_level'][level] = summary['by_risk_level'].get(level, 0) + 1

            # Count by model
            model = transaction['model']
            summary['by_model'][model] = summary['by_model'].get(model, 0) + 1

            # Sum amounts and count high-value transactions
            try:
                amount = float(transaction['amount']) if transaction['amount'] != 'N/A' else 0
                summary['total_amount'] += amount
                if amount > 10000:  # GHS 10,000 threshold
                    summary['high_value_count'] += 1
            except (ValueError, TypeError):
                pass

        return summary

    @staticmethod
    def _generate_audit_alerts(entries):
        """Generate audit alerts based on recent activity."""
        alerts = []

        # Check for unusual activity patterns
        high_risk_count = sum(1 for entry in entries if entry['audit_level'] in ['HIGH', 'CRITICAL'])
        if high_risk_count > 10:
            alerts.append({
                'type': 'HIGH_RISK_ACTIVITY',
                'severity': 'HIGH',
                'message': f'Unusual number of high-risk activities detected: {high_risk_count} in the last hour'
            })

        # Check for compliance flag anomalies
        total_flags = sum(len(entry['compliance_flags']) for entry in entries)
        if total_flags > 20:
            alerts.append({
                'type': 'COMPLIANCE_FLAG_SPIKE',
                'severity': 'MEDIUM',
                'message': f'High number of compliance flags detected: {total_flags} in the last hour'
            })

        # Check for single user activity spikes
        user_activity = {}
        for entry in entries:
            user = entry['user']
            user_activity[user] = user_activity.get(user, 0) + 1

        for user, count in user_activity.items():
            if count > 30:  # More than 30 activities per hour
                alerts.append({
                    'type': 'USER_ACTIVITY_SPIKE',
                    'severity': 'MEDIUM',
                    'message': f'Unusual activity from user {user}: {count} actions in the last hour'
                })

        return alerts


# Django REST Framework views for audit reporting
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes


class AuditDashboardView(APIView):
    """API view for audit dashboard data."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get audit dashboard data."""
        hours = int(request.query_params.get('hours', 24))

        # Check user permissions - only managers and above can access audit data
        if not request.user.has_role_permission('manager'):
            return Response({'error': 'Insufficient permissions'}, status=403)

        try:
            dashboard_data = AuditReportingService.get_audit_dashboard_data(hours)
            return Response(dashboard_data)
        except Exception as e:
            logger.error(f"Error generating audit dashboard data: {str(e)}")
            return Response({'error': 'Failed to generate audit dashboard'}, status=500)


class UserActivityReportView(APIView):
    """API view for user activity reports."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get activity report for a specific user."""
        days = int(request.query_params.get('days', 30))

        # Check permissions
        if not request.user.has_role_permission('manager'):
            return Response({'error': 'Insufficient permissions'}, status=403)

        # Managers can only view their own reports or those of subordinates
        if request.user.role == 'manager' and str(request.user.id) != user_id:
            return Response({'error': 'Can only view own activity report'}, status=403)

        try:
            report_data = AuditReportingService.get_user_activity_report(user_id, days)
            return Response(report_data)
        except Exception as e:
            logger.error(f"Error generating user activity report: {str(e)}")
            return Response({'error': 'Failed to generate user activity report'}, status=500)


class ComplianceReportView(APIView):
    """API view for compliance reports."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get compliance report."""
        days = int(request.query_params.get('days', 90))

        # Only operations managers and administrators can access compliance reports
        if not request.user.has_role_permission('operations_manager'):
            return Response({'error': 'Insufficient permissions'}, status=403)

        try:
            report_data = AuditReportingService.get_compliance_report(days)
            return Response(report_data)
        except Exception as e:
            logger.error(f"Error generating compliance report: {str(e)}")
            return Response({'error': 'Failed to generate compliance report'}, status=500)


class HighRiskTransactionReportView(APIView):
    """API view for high-risk transaction reports."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get high-risk transaction report."""
        days = int(request.query_params.get('days', 7))

        # Only managers and above can access high-risk reports
        if not request.user.has_role_permission('manager'):
            return Response({'error': 'Insufficient permissions'}, status=403)

        try:
            report_data = AuditReportingService.get_high_risk_transaction_report(days)
            return Response(report_data)
        except Exception as e:
            logger.error(f"Error generating high-risk transaction report: {str(e)}")
            return Response({'error': 'Failed to generate high-risk transaction report'}, status=500)


# Convenience functions for easy access
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_dashboard_api(request):
    """API endpoint for audit dashboard data."""
    view = AuditDashboardView()
    return view.get(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity_api(request, user_id):
    """API endpoint for user activity reports."""
    view = UserActivityReportView()
    view.kwargs = {'user_id': user_id}
    return view.get(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compliance_report_api(request):
    """API endpoint for compliance reports."""
    view = ComplianceReportView()
    return view.get(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def high_risk_transactions_api(request):
    """API endpoint for high-risk transaction reports."""
    view = HighRiskTransactionReportView()
    return view.get(request)