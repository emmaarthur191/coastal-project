"""Audit logging signals for Coastal Banking.

This module provides automatic audit logging for critical model changes,
ensuring compliance with banking regulations and data protection standards.
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


def get_request_context():
    """Get current request context from thread-local storage."""
    from users.signals import get_current_request, get_current_user

    request = get_current_request()
    user = get_current_user()
    ip = None
    if request:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")
    return user, ip


def create_audit_log(action: str, model_name: str, instance, changes: dict = None):
    """Create an audit log entry for a model change."""
    from users.models import AuditLog

    user, ip = get_request_context()

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(instance.pk),
            object_repr=str(instance)[:255],
            changes=changes or {},
            ip_address=ip,
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")


# --- Transaction Audit ---
@receiver(post_save, sender="core.Transaction")
def log_transaction_save(sender, instance, created, **kwargs):
    """Log transaction creation and updates."""
    action = "create" if created else "update"
    changes = {
        "amount": str(instance.amount),
        "type": instance.transaction_type,
        "status": instance.status,
    }
    create_audit_log(action, "Transaction", instance, changes)


# --- Account Audit ---
@receiver(post_save, sender="core.Account")
def log_account_save(sender, instance, created, **kwargs):
    """Log account creation and balance changes."""
    action = "create" if created else "update"
    changes = {
        "balance": str(instance.balance),
        "is_active": instance.is_active,
    }
    create_audit_log(action, "Account", instance, changes)


# --- Loan Audit ---
@receiver(post_save, sender="core.Loan")
def log_loan_save(sender, instance, created, **kwargs):
    """Log loan application and status changes."""
    action = "create" if created else "update"
    changes = {
        "amount": str(instance.amount),
        "status": instance.status,
    }
    create_audit_log(action, "Loan", instance, changes)


# --- User Audit ---
@receiver(post_save, sender="users.User")
def log_user_save(sender, instance, created, **kwargs):
    """Log user creation and profile changes (no PII logged)."""
    action = "create" if created else "update"
    # Deliberately exclude PII from changes
    changes = {
        "role": instance.role,
        "is_active": instance.is_active,
    }
    create_audit_log(action, "User", instance, changes)
