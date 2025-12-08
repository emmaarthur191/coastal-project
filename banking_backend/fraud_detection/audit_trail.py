import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from django.db import models, transaction as db_transaction
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Count
from cryptography.fernet import Fernet
from django.conf import settings
import structlog
from .logging_system import distributed_logger

logger = structlog.get_logger(__name__)


class FraudAuditTrail(models.Model):
    """
    Immutable audit trail for fraud detection decisions.
    Stores encrypted decision data with rollback capabilities.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    correlation_id = models.CharField(max_length=255, db_index=True)
    transaction_id = models.CharField(max_length=255, db_index=True)
    user_id = models.CharField(max_length=255, db_index=True)

    # Decision data (encrypted)
    decision_data = models.TextField()  # Encrypted JSON
    decision_hash = models.CharField(max_length=128)  # SHA-256 hash for integrity

    # Metadata
    decision_type = models.CharField(max_length=50, choices=[
        ('fraud_evaluation', 'Fraud Evaluation'),
        ('alert_creation', 'Alert Creation'),
        ('rule_trigger', 'Rule Trigger'),
        ('manual_review', 'Manual Review'),
        ('rollback', 'Rollback Action')
    ])
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical')
    ], default='low')

    # Status and actions
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('reverted', 'Reverted'),
        ('expired', 'Expired')
    ], default='active')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fraud_audit_trails_created'
    )
    reverted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='fraud_audit_trails_reverted'
    )
    reverted_at = models.DateTimeField(null=True, blank=True)
    revert_reason = models.TextField(blank=True)

    # Compliance
    compliance_standard = models.CharField(max_length=50, blank=True)
    data_classification = models.CharField(max_length=20, choices=[
        ('public', 'Public'),
        ('internal', 'Internal'),
        ('confidential', 'Confidential'),
        ('restricted', 'Restricted')
    ], default='confidential')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['correlation_id', 'created_at']),
            models.Index(fields=['transaction_id', 'created_at']),
            models.Index(fields=['decision_type', 'status']),
            models.Index(fields=['created_at', 'expires_at']),
        ]

    def __str__(self):
        return f"Audit {self.id} - {self.decision_type} - {self.correlation_id}"

    def save(self, *args, **kwargs):
        # Set expiration date if not set (default 7 years for compliance)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=2555)  # 7 years

        # Validate data integrity
        if self.decision_data and not self.decision_hash:
            self.decision_hash = self._calculate_hash()

        super().save(*args, **kwargs)

    def _calculate_hash(self) -> str:
        """Calculate SHA-256 hash of decision data for integrity."""
        import hashlib
        data = f"{self.correlation_id}:{self.transaction_id}:{self.decision_data}"
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Verify data integrity using stored hash."""
        return self._calculate_hash() == self.decision_hash

    def get_decrypted_data(self) -> Dict[str, Any]:
        """Decrypt and return decision data."""
        if not self.decision_data:
            return {}

        try:
            cipher = self._get_cipher()
            decrypted = cipher.decrypt(self.decision_data.encode())
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.error(f"Failed to decrypt audit data {self.id}: {e}")
            return {'error': 'decryption_failed'}

    def set_encrypted_data(self, data: Dict[str, Any]):
        """Encrypt and store decision data."""
        try:
            cipher = self._get_cipher()
            json_data = json.dumps(data, sort_keys=True)
            encrypted = cipher.encrypt(json_data.encode())
            self.decision_data = encrypted.decode()
            self.decision_hash = self._calculate_hash()
        except Exception as e:
            logger.error(f"Failed to encrypt audit data: {e}")
            raise ValidationError("Failed to encrypt audit data")

    def _get_cipher(self):
        """Get Fernet cipher for encryption/decryption."""
        key = getattr(settings, 'FRAUD_AUDIT_ENCRYPTION_KEY')
        if not key:
            raise ValueError("FRAUD_AUDIT_ENCRYPTION_KEY not configured")
        return Fernet(key)

    def can_rollback(self, user: User) -> Tuple[bool, str]:
        """
        Check if this audit entry can be rolled back.
        Returns (can_rollback, reason)
        """
        if self.status != 'active':
            return False, f"Cannot rollback {self.status} entry"

        if self.created_at < timezone.now() - timedelta(hours=24):
            return False, "Cannot rollback entries older than 24 hours"

        # Check user permissions
        if not user.has_perm('fraud_detection.can_rollback_audit'):
            return False, "User lacks rollback permissions"

        return True, ""

    def rollback(self, user: User, reason: str) -> bool:
        """
        Rollback this audit entry.
        Returns True if successful.
        """
        can_rollback, error_msg = self.can_rollback(user)
        if not can_rollback:
            logger.warning(f"Rollback denied for audit {self.id}: {error_msg}")
            return False

        with db_transaction.atomic():
            # Mark as reverted
            self.status = 'reverted'
            self.reverted_by = user
            self.reverted_at = timezone.now()
            self.revert_reason = reason
            self.save()

            # Log rollback action
            distributed_logger.log_fraud_event(
                'audit_rollback',
                self.correlation_id,
                self.transaction_id,
                self.user_id,
                {
                    'audit_id': str(self.id),
                    'rollback_reason': reason,
                    'rollback_by': user.username
                },
                'warning'
            )

            # Execute rollback actions based on decision type
            self._execute_rollback_actions(user, reason)

        logger.info(f"Audit entry {self.id} rolled back by {user.username}")
        return True

    def _execute_rollback_actions(self, user: User, reason: str):
        """Execute specific rollback actions based on decision type."""
        data = self.get_decrypted_data()

        if self.decision_type == 'alert_creation':
            # Dismiss related fraud alert
            alert_id = data.get('alert_id')
            if alert_id:
                try:
                    from .models import FraudAlert
                    alert = FraudAlert.objects.get(id=alert_id)
                    alert.status = 'dismissed'
                    alert.resolved_by = user
                    alert.resolution_notes = f"Rolled back: {reason}"
                    alert.save()
                except Exception as e:
                    logger.error(f"Failed to rollback alert {alert_id}: {e}")

        elif self.decision_type == 'fraud_evaluation':
            # This would trigger re-evaluation or other corrective actions
            logger.info(f"Fraud evaluation rollback for transaction {self.transaction_id}")


class AuditTrailManager:
    """
    Manager class for audit trail operations with compliance features.
    """

    def __init__(self):
        self.encryption_key = getattr(settings, 'FRAUD_AUDIT_ENCRYPTION_KEY')
        if not self.encryption_key:
            logger.warning("FRAUD_AUDIT_ENCRYPTION_KEY not configured - audit data will not be encrypted")

    def create_audit_entry(self, correlation_id: str, transaction_id: str, user_id: str,
                          decision_type: str, decision_data: Dict[str, Any],
                          severity: str = 'low', created_by: User = None) -> FraudAuditTrail:
        """
        Create a new audit trail entry.
        """
        audit_entry = FraudAuditTrail(
            correlation_id=correlation_id,
            transaction_id=transaction_id,
            user_id=user_id,
            decision_type=decision_type,
            severity=severity,
            created_by=created_by,
            compliance_standard='PCI DSS',  # Default compliance standard
        )

        # Encrypt and set decision data
        audit_entry.set_encrypted_data(decision_data)
        audit_entry.save()

        # Log audit creation
        distributed_logger.log_fraud_event(
            'audit_created',
            correlation_id,
            transaction_id,
            user_id,
            {
                'audit_id': str(audit_entry.id),
                'decision_type': decision_type,
                'severity': severity
            },
            'info'
        )

        return audit_entry

    def query_audit_trail(self, filters: Dict[str, Any] = None,
                         start_date: datetime = None, end_date: datetime = None,
                         limit: int = 100) -> List[FraudAuditTrail]:
        """
        Query audit trail with filters.
        """
        queryset = FraudAuditTrail.objects.all()

        # Apply filters
        if filters:
            if 'correlation_id' in filters:
                queryset = queryset.filter(correlation_id=filters['correlation_id'])
            if 'transaction_id' in filters:
                queryset = queryset.filter(transaction_id=filters['transaction_id'])
            if 'user_id' in filters:
                queryset = queryset.filter(user_id=filters['user_id'])
            if 'decision_type' in filters:
                queryset = queryset.filter(decision_type=filters['decision_type'])
            if 'status' in filters:
                queryset = queryset.filter(status=filters['status'])
            if 'severity' in filters:
                queryset = queryset.filter(severity=filters['severity'])

        # Date range
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return list(queryset[:limit])

    def get_audit_statistics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get audit trail statistics.
        """
        since_date = timezone.now() - timedelta(days=days)

        stats = {
            'total_entries': FraudAuditTrail.objects.filter(created_at__gte=since_date).count(),
            'entries_by_type': {},
            'entries_by_status': {},
            'entries_by_severity': {},
            'rollback_count': FraudAuditTrail.objects.filter(
                created_at__gte=since_date, status='reverted'
            ).count()
        }

        # Aggregate by decision type
        type_stats = FraudAuditTrail.objects.filter(created_at__gte=since_date).values(
            'decision_type'
        ).annotate(count=Count('id'))

        for stat in type_stats:
            stats['entries_by_type'][stat['decision_type']] = stat['count']

        # Aggregate by status
        status_stats = FraudAuditTrail.objects.filter(created_at__gte=since_date).values(
            'status'
        ).annotate(count=Count('id'))

        for stat in status_stats:
            stats['entries_by_status'][stat['status']] = stat['count']

        # Aggregate by severity
        severity_stats = FraudAuditTrail.objects.filter(created_at__gte=since_date).values(
            'severity'
        ).annotate(count=Count('id'))

        for stat in severity_stats:
            stats['entries_by_severity'][stat['severity']] = stat['count']

        return stats

    def export_audit_data(self, start_date: datetime, end_date: datetime,
                         export_format: str = 'json') -> str:
        """
        Export audit data for compliance reporting.
        """
        entries = self.query_audit_trail(
            start_date=start_date,
            end_date=end_date,
            limit=10000  # Reasonable limit for export
        )

        export_data = []
        for entry in entries:
            data = {
                'id': str(entry.id),
                'correlation_id': entry.correlation_id,
                'transaction_id': entry.transaction_id,
                'user_id': entry.user_id,
                'decision_type': entry.decision_type,
                'severity': entry.severity,
                'status': entry.status,
                'created_at': entry.created_at.isoformat(),
                'decision_data': entry.get_decrypted_data(),
                'integrity_verified': entry.verify_integrity()
            }
            export_data.append(data)

        if export_format == 'json':
            return json.dumps(export_data, indent=2)
        else:
            # Could implement CSV, XML, etc.
            return json.dumps(export_data)

    def cleanup_expired_entries(self) -> int:
        """
        Clean up expired audit entries.
        Returns number of entries cleaned up.
        """
        expired_entries = FraudAuditTrail.objects.filter(
            expires_at__lt=timezone.now(),
            status='active'
        )

        count = expired_entries.update(status='expired')
        logger.info(f"Cleaned up {count} expired audit entries")

        return count

    def verify_audit_integrity(self) -> Tuple[int, List[str]]:
        """
        Verify integrity of all audit entries.
        Returns (total_checked, failed_ids)
        """
        entries = FraudAuditTrail.objects.filter(status='active')
        failed_ids = []

        for entry in entries:
            if not entry.verify_integrity():
                failed_ids.append(str(entry.id))

        logger.info(f"Audit integrity check: {len(entries)} checked, {len(failed_ids)} failed")

        if failed_ids:
            logger.error(f"Audit integrity violations detected: {failed_ids}")

        return len(entries), failed_ids


# Global instance
audit_trail_manager = AuditTrailManager()