"""Transaction-related services for Coastal Banking.

Handles financial transactions, balance movements, and SMS notifications.
"""

import logging
from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from users.models import User

from django.db import transaction
from django.utils import timezone

from core.exceptions import (
    AccountSuspendedError,
    InsufficientFundsError,
    InvalidTransactionError,
)
from core.ml.fraud_detector import MLFraudDetector
from core.models.accounts import Account
from core.models.transactions import Transaction

from .accounts import AccountService

logger = logging.getLogger(__name__)


class TransactionService:
    """Service class for transaction-related operations."""

    @staticmethod
    @transaction.atomic
    def create_transaction(
        from_account: Account | None,
        to_account: Account | None,
        amount: Decimal,
        transaction_type: str,
        description: str = "",
    ) -> Transaction:
        """Create and execute a financial transaction atomically."""
        logger.info(f"Creating transaction: type={transaction_type}, amount={amount}")

        # 1. Determine Locking Order to Prevent Deadlocks
        accounts_to_lock = []
        if from_account:
            accounts_to_lock.append(from_account)
        if to_account:
            accounts_to_lock.append(to_account)

        # Sort by primary key to ensure consistent locking order
        accounts_to_lock.sort(key=lambda acc: acc.pk)

        # 2. Acquire Locks
        locked_accounts_map = {}
        for acc in accounts_to_lock:
            locked_acc = Account.objects.select_for_update().get(pk=acc.pk)
            if not locked_acc.is_active:
                raise AccountSuspendedError(message=f"Account {locked_acc.account_number} is suspended.")
            locked_accounts_map[acc.pk] = locked_acc

        # 3. Retrieve Locked Instances
        locked_from_account = locked_accounts_map.get(from_account.pk) if from_account else None
        locked_to_account = locked_accounts_map.get(to_account.pk) if to_account else None

        # Validate the transaction
        TransactionService.validate_transaction(locked_from_account, locked_to_account, amount, transaction_type)

        # Check for Maker-Checker (4-Eyes Principle) Threshold
        # Threshold is GHS 5,000.00
        from django.conf import settings

        threshold = getattr(settings, "TRANSACTION_APPROVAL_THRESHOLD", Decimal("5000.00"))
        requires_approval = amount >= threshold

        # 4. ML Fraud Detection check
        is_anomaly = False
        fraud_risk_level = "low"
        try:
            # Prepare a candidate object for prediction
            tx_candidate = Transaction(
                from_account=locked_from_account,
                to_account=locked_to_account,
                amount=amount,
                transaction_type=transaction_type,
                timestamp=timezone.now(),
            )
            detector = MLFraudDetector()
            fraud_result = detector.predict(tx_candidate)
            is_anomaly = fraud_result.get("is_anomaly", False)
            fraud_risk_level = fraud_result.get("risk_level", "low")

            if is_anomaly:
                logger.warning(f"Transaction flagged by ML Fraud Detector (Level: {fraud_risk_level})")
        except Exception:
            logger.exception("Fraud detector service error encountered.")

        status = "pending_approval" if (requires_approval or is_anomaly) else "completed"
        processed_at = None if (requires_approval or is_anomaly) else timezone.now()

        # Create the transaction record
        tx = Transaction.objects.create(
            from_account=locked_from_account,
            to_account=locked_to_account,
            amount=amount,
            transaction_type=transaction_type,
            description=f"{description} (Fraud Risk: {fraud_risk_level})" if is_anomaly else description,
            status=status,
            processed_at=processed_at,
        )

        # Update balances ONLY if approval is not required
        if status == "completed":
            if locked_from_account:
                AccountService.update_balance(locked_from_account, -amount)
            if locked_to_account:
                AccountService.update_balance(locked_to_account, amount)

            # Send SMS notification
            TransactionService._enqueue_notification(tx)
        else:
            logger.info(f"Transaction {tx.id} requires approval (Amount: {amount} >= {threshold})")

        # Create AuditLog entry
        from users.models import AuditLog

        AuditLog.objects.create(
            action="create",
            model_name="Transaction",
            object_id=str(tx.id),
            object_repr=f"{transaction_type} of {amount}",
            changes={
                "amount": str(amount),
                "type": transaction_type,
                "from_account": AccountService._mask_account_number(locked_from_account.account_number)
                if locked_from_account
                else None,
                "to_account": AccountService._mask_account_number(locked_to_account.account_number)
                if locked_to_account
                else None,
            },
        )

        logger.info(f"Transaction {tx.id} created with status: {status}")
        return tx

    @staticmethod
    @transaction.atomic
    def approve_transaction(transaction_id: int, approved_by: "User") -> Transaction:
        """Approve a pending transaction and execute balance changes."""
        tx = Transaction.objects.select_for_update().get(pk=transaction_id)

        if tx.status != "pending_approval":
            raise InvalidTransactionError(message=f"Transaction {transaction_id} is not pending approval.")

        if tx.from_account and tx.from_account.user_id == approved_by.id:
            raise InvalidTransactionError(message="Self-approval is not allowed (Maker-Checker violation).")

        # Refetch and lock accounts in a consistent order (smaller ID first) to prevent deadlocks
        from_acc = None
        to_acc = None

        account_ids = []
        if tx.from_account_id:
            account_ids.append(tx.from_account_id)
        if tx.to_account_id:
            account_ids.append(tx.to_account_id)

        # Enforce global PK lock ordering
        account_ids.sort()
        locked_accounts = {}
        for aid in account_ids:
            locked_accounts[aid] = Account.objects.select_for_update().get(pk=aid)

        if tx.from_account_id:
            from_acc = locked_accounts[tx.from_account_id]
        if tx.to_account_id:
            to_acc = locked_accounts[tx.to_account_id]

        # Re-validate (balance might have changed while pending)
        TransactionService.validate_transaction(from_acc, to_acc, tx.amount, tx.transaction_type)

        # Execute
        if from_acc:
            AccountService.update_balance(from_acc, -tx.amount)
        if to_acc:
            AccountService.update_balance(to_acc, tx.amount)

        tx.status = "completed"
        tx.approved_by = approved_by
        tx.approval_date = timezone.now()
        tx.processed_at = timezone.now()
        tx.save()

        # Notify
        TransactionService._enqueue_notification(tx)

        logger.info(f"Transaction {transaction_id} approved by {approved_by.email}")
        return tx

    @staticmethod
    def reject_transaction(transaction_id: int, rejected_by: "User", reason: str = "") -> Transaction:
        """Reject a pending transaction."""
        tx = Transaction.objects.get(pk=transaction_id)
        if tx.status != "pending_approval":
            raise InvalidTransactionError(message="Only pending transactions can be rejected.")

        tx.status = "cancelled"
        tx.description = f"{tx.description} | Rejected: {reason}"
        tx.save()

        logger.info(f"Transaction {transaction_id} rejected by {rejected_by.email}")
        return tx

    @staticmethod
    @transaction.atomic
    def reverse_transaction(transaction_id: str, reversed_by: "User", reason: str = "") -> Transaction:
        """Reverse a completed transaction and adjust balances accordingly."""
        tx = Transaction.objects.select_for_update().get(pk=transaction_id)
        if tx.status != "completed":
            raise InvalidTransactionError(message="Only completed transactions can be reversed.")

        # 1. Acquire locks on involved accounts in a consistent order (smaller ID first) to prevent deadlocks
        from_acc = None
        to_acc = None

        account_ids = []
        if tx.from_account_id:
            account_ids.append(tx.from_account_id)
        if tx.to_account_id:
            account_ids.append(tx.to_account_id)

        # Enforce global PK lock ordering
        account_ids.sort()
        locked_accounts = {}
        for aid in account_ids:
            locked_accounts[aid] = Account.objects.select_for_update().get(pk=aid)

        if tx.from_account_id:
            from_acc = locked_accounts[tx.from_account_id]
        if tx.to_account_id:
            to_acc = locked_accounts[tx.to_account_id]

        # 2. Reverse balance changes
        if from_acc:
            AccountService.update_balance(from_acc, tx.amount)  # Add back
        if to_acc:
            AccountService.update_balance(to_acc, -tx.amount)  # Deduct back

        # 3. Update status
        tx.status = "reversed"
        tx.description = f"{tx.description} | REVERSED by {reversed_by.email}. Reason: {reason}"
        tx.save()

        logger.info(f"Transaction {transaction_id} reversed by {reversed_by.email}")
        return tx

    @staticmethod
    def _enqueue_notification(tx: Transaction):
        """Helper to enqueue SMS and WebSocket notifications on commit."""
        target_account = tx.from_account or tx.to_account
        if not target_account:
            return

        def trigger_notifications():
            TransactionService._send_transaction_notification(
                target_account, tx.transaction_type, tx.amount, tx.id
            )
            TransactionService._broadcast_transaction_notification(
                target_account, tx.transaction_type, tx.amount, tx.id
            )

        transaction.on_commit(trigger_notifications)

    @staticmethod
    def validate_transaction(
        from_account: Account | None, to_account: Account | None, amount: Decimal, transaction_type: str
    ) -> bool:
        """Validate transaction parameters before execution."""
        if amount <= 0:
            raise InvalidTransactionError(message="Transaction amount must be positive.")

        if transaction_type == "transfer":
            if not from_account or not to_account:
                raise InvalidTransactionError(message="Transfer requires both source and destination accounts.")
            if from_account.pk == to_account.pk:
                raise InvalidTransactionError(message="Cannot transfer to the same account.")
            if from_account.balance < amount:
                raise InsufficientFundsError(
                    message=f"Insufficient funds. Available: {from_account.balance}, Requested: {amount}",
                    details={"available": str(from_account.balance), "requested": str(amount)},
                )
        elif transaction_type in ["withdrawal", "payment"]:
            if not from_account:
                raise InvalidTransactionError(message=f"{transaction_type.capitalize()} requires a source account.")
            if from_account.balance < amount:
                raise InsufficientFundsError(
                    message=f"Insufficient funds. Available: {from_account.balance}, Requested: {amount}",
                    details={"available": str(from_account.balance), "requested": str(amount)},
                )
        elif transaction_type == "repayment":
            return True
        elif transaction_type in ["deposit", "disbursement"]:
            if not to_account:
                raise InvalidTransactionError(message=f"{transaction_type.capitalize()} requires a destination account.")

        return True

    @staticmethod
    def _send_transaction_notification(account: Account, transaction_type: str, amount: Decimal, tx_id: int):
        """Send SMS notification to account owner about a transaction."""
        try:
            from users.services import SendexaService

            if not account or not account.user:
                return

            user = account.user
            phone = getattr(user, "phone_number", None) or getattr(user, "phone", None)

            if not phone:
                logger.info(f"No phone number for user {user.email}, skipping SMS")
                return

            account_name = account.get_account_type_display()
            masked_acc = TransactionService._mask_account_number(account.account_number)

            if transaction_type == "deposit":
                message = f"Coastal Bank: GHS {amount:.2f} deposited to your {account_name} account ({masked_acc}). Ref: {tx_id}. Check portal for balance."
            elif transaction_type == "disbursement":
                message = f"Coastal Bank: GHS {amount:.2f} loan DISBURSEMENT credited to your {account_name} account ({masked_acc}). Ref: {tx_id}. Congratulations!"
            elif transaction_type == "withdrawal":
                message = f"Coastal Bank: GHS {amount:.2f} withdrawn from your {account_name} account ({masked_acc}). Ref: {tx_id}. Check portal for balance."
            elif transaction_type == "transfer":
                message = f"Coastal Bank: GHS {amount:.2f} transferred from your {account_name} account ({masked_acc}). Ref: {tx_id}. Check portal for balance."
            else:
                message = f"Coastal Bank: Transaction of GHS {amount:.2f} processed. Ref: {tx_id}"

            success, result = SendexaService.send_sms(phone, message)
            if success:
                logger.info(f"SMS sent to {user.email} for transaction {tx_id}")
            else:
                logger.warning(f"SMS failed for transaction {tx_id}: {result}")

        except Exception:
            logger.exception(f"SMS notification service error for tx {tx_id}")

    @staticmethod
    def _mask_account_number(acc_num):
        """Mask account number for SMS."""
        if not acc_num or len(acc_num) < 8:
            return "XXXX"
        return f"{acc_num[:4]}****{acc_num[-4:]}"

    @staticmethod
    def _broadcast_transaction_notification(account, transaction_type, amount, tx_id):
        """Broadcast real-time transaction notification via WebSocket."""
        try:
            if not account or not account.user:
                return

            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            from django.utils import timezone

            user = account.user
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("No channel layer configured, skipping WebSocket broadcast")
                return

            notification_data = {
                "type": "transaction",
                "transaction_type": transaction_type,
                "amount": float(amount),
                "reference": str(tx_id),
                "account_number": account.account_number,
                "new_balance": float(account.balance),
                "timestamp": timezone.now().isoformat(),
                "message": f"GHS {amount:.2f} {transaction_type} processed successfully."
            }

            async_to_sync(channel_layer.group_send)(
                f"notifications_{user.id}",
                {
                    "type": "send_notification",
                    "data": notification_data
                }
            )
            logger.info(f"WebSocket transaction notification sent to user {user.id}")

        except Exception:
            logger.exception("Failed to send WebSocket transaction notification")

