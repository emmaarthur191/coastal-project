"""Transaction-related services for Coastal Banking.

Handles financial transactions, balance movements, and SMS notifications.
"""

import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from core.exceptions import (
    AccountSuspendedError,
    InsufficientFundsError,
    InvalidTransactionError,
)
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

        # Create the transaction record
        tx = Transaction.objects.create(
            from_account=locked_from_account,
            to_account=locked_to_account,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            status="completed",
            processed_at=timezone.now(),
        )

        # Update balances
        if locked_from_account:
            AccountService.update_balance(locked_from_account, -amount)
        if locked_to_account:
            AccountService.update_balance(locked_to_account, amount)

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

        # Send SMS notification AFTER COMMIT
        if locked_from_account:
            transaction.on_commit(
                lambda: TransactionService._send_transaction_notification(
                    locked_from_account, transaction_type, amount, tx.id
                )
            )
        elif locked_to_account:
            transaction.on_commit(
                lambda: TransactionService._send_transaction_notification(
                    locked_to_account, transaction_type, amount, tx.id
                )
            )

        logger.info(f"Transaction {tx.id} completed successfully.")
        return tx

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
        elif transaction_type == "deposit":
            if not to_account:
                raise InvalidTransactionError(message="Deposit requires a destination account.")

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

        except Exception as e:
            logger.error(f"SMS notification error for tx {tx_id}: {e}")

    @staticmethod
    def _mask_account_number(acc_num):
        """Mask account number for SMS."""
        if not acc_num or len(acc_num) < 8:
            return "XXXX"
        return f"{acc_num[:4]}****{acc_num[-4:]}"
