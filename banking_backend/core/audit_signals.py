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


# --- PII Fields to Mask in Audit Logs ---
PII_FIELDS = [
    "id_number",
    "phone_number",
    "ssnit_number",
    "staff_id",
    "first_name",
    "last_name",
    "date_of_birth",
    "address",
    "nationality",
    "occupation",
    "work_address",
    "position",
    "digital_address",
    "location",
    "location_encrypted",
    "next_of_kin_data",
    "client_name",
    "client_name_encrypted",
    "id_number_encrypted",
    "phone_number_encrypted",
    "ssnit_number_encrypted",
    "staff_id_encrypted",
    "id_number_hash",
    "phone_number_hash",
    "ssnit_number_hash",
    "staff_id_hash",
    "first_name_encrypted",
    "last_name_encrypted",
    "date_of_birth_encrypted",
    "address_encrypted",
    "next_of_kin_encrypted",
    "occupation_encrypted",
    "work_address_encrypted",
    "position_encrypted",
    "digital_address_encrypted",
    "digital_address_encrypted_val",
    "photo",
    "photo_encrypted",
    "next_of_kin_1_name",
    "next_of_kin_1_name_encrypted",
    "next_of_kin_1_phone",
    "next_of_kin_1_phone_encrypted",
    "next_of_kin_1_address",
    "next_of_kin_1_address_encrypted",
    "next_of_kin_2_name",
    "next_of_kin_2_name_encrypted",
    "next_of_kin_2_phone",
    "next_of_kin_2_phone_encrypted",
    "next_of_kin_2_address",
    "next_of_kin_2_address_encrypted",
    "guarantor_1_name",
    "guarantor_1_name_encrypted",
    "guarantor_1_id_number",
    "guarantor_1_id_number_encrypted",
    "guarantor_1_id_number_hash",
    "guarantor_1_phone",
    "guarantor_1_phone_encrypted",
    "guarantor_1_address",
    "guarantor_1_address_encrypted",
    "guarantor_2_name",
    "guarantor_2_name_encrypted",
    "guarantor_2_id_number",
    "guarantor_2_id_number_encrypted",
    "guarantor_2_id_number_hash",
    "guarantor_2_phone",
    "guarantor_2_phone_encrypted",
    "guarantor_2_address",
    "guarantor_2_address_encrypted",
    "body",
    "body_encrypted",
    "content",
    "content_encrypted",
    "message",
    "message_encrypted",
    "first_name_hash",
    "last_name_hash",
]


def create_audit_log(action: str, model_name: str, instance, changes: dict = None):
    """Create an audit log entry for a model change."""
    from users.models import AuditLog

    user, ip = get_request_context()

    # Sanitize changes dictionary to prevent PII leakage
    # Even if property-based PII access isn't directly logged, we mask these keys to be safe
    sanitized_changes = changes or {}
    for field in PII_FIELDS:
        if field in sanitized_changes:
            sanitized_changes[field] = "[REDACTED]"

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(instance.pk),
            object_repr=str(instance)[:255],
            changes=sanitized_changes,
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


# --- Deletion Audit ---
from django.db.models.signals import post_delete

@receiver(post_delete, sender="core.Account")
@receiver(post_delete, sender="core.Loan")
@receiver(post_delete, sender="users.User")
def log_deletion(sender, instance, **kwargs):
    """Automatically log deletion of critical models."""
    create_audit_log("delete", sender.__name__, instance, {"automated": True})
