"""Core banking services for Coastal Banking Application.

This module contains service classes that implement business logic for
accounts, transactions, loans, fraud alerts, and messaging. All financial
operations are wrapped in atomic database transactions to ensure ACID compliance.
"""

import logging
import secrets
from decimal import Decimal

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .exceptions import (
    AccountSuspendedError,
    InsufficientFundsError,
    InvalidTransactionError,
    OperationalError,
)
from .models import Account, BankingMessage, FraudAlert, Loan, Transaction
from .serializers import BankingMessageSerializer, FraudAlertSerializer

logger = logging.getLogger(__name__)


class AccountService:
    """Service class for account-related operations.

    Provides methods for creating accounts, retrieving user accounts,
    and updating account balances with proper locking.
    """

    @staticmethod
    def _calculate_luhn(number: str) -> int:
        """Calculate the Luhn checksum for a numeric string."""
        digits = [int(d) for d in number]
        checksum = 0
        reverse_digits = digits[::-1]

        for i, digit in enumerate(reverse_digits):
            if i % 2 == 0:  # Even index in reverse (1st, 3rd...)
                doubled = digit * 2
                if doubled > 9:
                    doubled -= 9
                checksum += doubled
            else:
                checksum += digit

        return (10 - (checksum % 10)) % 10

    @staticmethod
    def create_account(user, account_type: str = "daily_susu", initial_balance: Decimal = Decimal("0.00")) -> Account:
        """Create a new account for a user with a unique structured account number.

        Algorithm: Branch(4) + Serial(8) + Luhn(1) = 13 digits.
        """
        branch_code = "2231"  # Default branch code for coastal project
        max_attempts = 10
        rng = secrets.SystemRandom()

        for attempt in range(max_attempts):
            try:
                # Generate 8 random digits for serial
                serial = "".join([str(rng.randint(0, 9)) for _ in range(8)])
                partial_number = f"{branch_code}{serial}"
                checksum = AccountService._calculate_luhn(partial_number)
                account_number = f"{partial_number}{checksum}"

                with transaction.atomic():
                    # Check for collisions (rare with 13 digits but good practice)
                    if Account.objects.filter(account_number=account_number).exists():
                        continue

                    account = Account.objects.create(
                        user=user,
                        account_number=account_number,
                        account_type=account_type,
                        initial_balance=initial_balance,
                        balance=initial_balance,
                    )
                    logger.info(f"Account created: {account.account_number} for user {user.email}")
                    return account

            except IntegrityError:
                if attempt == max_attempts - 1:
                    raise OperationalError(message="Failed to generate unique account number.", details={})
                continue
            except Exception as e:
                logger.error(f"Failed to create account for user {user.email}: {e}")
                raise OperationalError(message="Failed to create account.", details={"error": str(e)})

    @staticmethod
    def get_user_accounts(user):
        """Retrieve all active accounts for a user."""
        return Account.objects.filter(user=user, is_active=True)

    @staticmethod
    def update_balance(account: Account, amount: Decimal) -> Account:
        """Update an account's balance. This method MUST be called within a transaction.atomic() block."""
        # Select for update to lock the row
        account = Account.objects.select_for_update().get(pk=account.pk)
        account.balance += amount
        account.save(update_fields=["balance", "updated_at"])
        return account

    @staticmethod
    @transaction.atomic
    def lock_account(account: Account, reason: str = "") -> Account:
        """Freeze an account (is_active=False) with a reason."""
        account = Account.objects.select_for_update().get(pk=account.pk)
        account.is_active = False
        account.save(update_fields=["is_active", "updated_at"])

        from users.models import AuditLog

        AuditLog.objects.create(
            action="update",
            model_name="Account",
            object_id=str(account.id),
            object_repr=f"Lock Account {account.account_number}",
            changes={"is_active": "False", "reason": reason},
        )
        logger.warning(f"Account {account.account_number} locked. Reason: {reason}")
        return account

    @staticmethod
    @transaction.atomic
    def unlock_account(account: Account) -> Account:
        """Unfreeze an account."""
        account = Account.objects.select_for_update().get(pk=account.pk)
        account.is_active = True
        account.save(update_fields=["is_active", "updated_at"])
        logger.info(f"Account {account.account_number} unlocked.")
        return account


class TransactionService:
    """Service class for transaction-related operations.

    All transaction methods are wrapped in `transaction.atomic()` and use
    `select_for_update()` for row-level locking to prevent race conditions.
    """

    @staticmethod
    @transaction.atomic
    def create_transaction(
        from_account: Account | None,
        to_account: Account | None,
        amount: Decimal,
        transaction_type: str,
        description: str = "",
    ) -> Transaction:
        """Create and execute a financial transaction atomically.

        This method locks the involved accounts, validates the transaction,
        updates balances, and creates a transaction record in a single
        database transaction.

        DEADLOCK PREVENTION:
        Accounts are locked in a consistent order (by ID ascending) to prevent
        deadlocks when simultaneous reverse transactions occur.

        Args:
            from_account: The source account (for withdrawals/transfers).
            to_account: The destination account (for deposits/transfers).
            amount: The transaction amount.
            transaction_type: Type of transaction ('deposit', 'withdrawal', 'transfer', etc.).
            description: An optional description for the transaction.

        Returns:
            Transaction: The completed Transaction instance.

        Raises:
            InsufficientFundsError: If the source account lacks sufficient funds.
            InvalidTransactionError: If transaction parameters are invalid.
            OperationalError: For unexpected database errors.

        """
        logger.info(f"Creating transaction: type={transaction_type}, amount={amount}")

        # 1. Determine Locking Order to Prevent Deadlocks via "Resource Ordering"
        # We must always acquire locks in the same order (e.g., smaller ID first)
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
            # select_for_update() locks the row
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

        # Create AuditLog entry for financial transaction
        from users.models import AuditLog

        AuditLog.objects.create(
            action="create",
            model_name="Transaction",
            object_id=str(tx.id),
            object_repr=f"{transaction_type} of {amount}",
            changes={
                "amount": str(amount),
                "type": transaction_type,
                "from_account": str(locked_from_account.account_number) if locked_from_account else None,
                "to_account": str(locked_to_account.account_number) if locked_to_account else None,
            },
        )

        # Send SMS notification to account owner AFTER COMMIT
        # This prevents DB locks from being held while waiting for external SMS API
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
        """Validate transaction parameters before execution.

        Args:
            from_account: Source account.
            to_account: Destination account.
            amount: Transaction amount.
            transaction_type: Type of transaction.

        Returns:
            bool: True if validation passes.

        Raises:
            InvalidTransactionError: If validation fails.
            InsufficientFundsError: If funds are insufficient.

        """
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
            # Repayments (especially in the field) can be cash-based and might not have a source account.
            return True
        elif transaction_type == "deposit":
            if not to_account:
                raise InvalidTransactionError(message="Deposit requires a destination account.")

        return True

    @staticmethod
    def _send_transaction_notification(account: Account, transaction_type: str, amount: Decimal, tx_id: int):
        """Send SMS notification to account owner about a transaction.

        Args:
            account: The account involved in the transaction.
            transaction_type: 'deposit', 'withdrawal', 'transfer', etc.
            amount: Transaction amount.
            tx_id: Transaction ID for reference.

        """
        try:
            from users.services import SendexaService

            if not account or not account.user:
                return

            user = account.user
            # Get phone number from user profile (assuming phone_number or use email)
            phone = getattr(user, "phone_number", None) or getattr(user, "phone", None)

            if not phone:
                logger.info(f"No phone number for user {user.email}, skipping SMS")
                return

            # Format message based on transaction type
            account_name = account.get_account_type_display()
            if transaction_type == "deposit":
                message = f"Coastal Bank: GHS {amount:.2f} deposited to your {account_name} account ({account.account_number}). Ref: {tx_id}. New balance: GHS {account.balance:.2f}"
            elif transaction_type == "withdrawal":
                message = f"Coastal Bank: GHS {amount:.2f} withdrawn from your {account_name} account ({account.account_number}). Ref: {tx_id}. New balance: GHS {account.balance:.2f}"
            elif transaction_type == "transfer":
                message = f"Coastal Bank: GHS {amount:.2f} transferred from your {account_name} account ({account.account_number}). Ref: {tx_id}. New balance: GHS {account.balance:.2f}"
            else:
                message = f"Coastal Bank: Transaction of GHS {amount:.2f} processed. Ref: {tx_id}"

            success, result = SendexaService.send_sms(phone, message)
            if success:
                logger.info(f"SMS sent to {user.email} for transaction {tx_id}")
            else:
                logger.warning(f"SMS failed for transaction {tx_id}: {result}")

        except Exception as e:
            # Don't fail the transaction if SMS fails
            logger.error(f"SMS notification error for tx {tx_id}: {e}")


class LoanService:
    """Service class for loan-related operations."""

    @staticmethod
    @transaction.atomic
    def create_loan(user, amount: Decimal, interest_rate: Decimal, term_months: int) -> Loan:
        """Create a new loan application for a user.

        Args:
            user: The User applying for the loan.
            amount: The requested loan principal.
            interest_rate: The annual interest rate.
            term_months: The loan term in months.

        Returns:
            Loan: The newly created Loan instance.

        """
        loan = Loan.objects.create(
            user=user, amount=amount, interest_rate=interest_rate, term_months=term_months, outstanding_balance=amount
        )
        logger.info(f"Loan {loan.id} created for user {user.email}, amount: {amount}")
        return loan

    @staticmethod
    @transaction.atomic
    def approve_loan(loan: Loan, approved_by=None) -> Loan:
        """Approve a pending loan application and disburse funds."""
        if loan.status != "pending":
            raise ValidationError("Only pending loans can be approved.")

        # Check for Maker-Checker (if provided)
        if approved_by and approved_by == loan.user:
            raise PermissionDenied("A customer cannot approve their own loan (even if they have staff roles).")

        # Amount-Based Role Validation
        if approved_by:
            from decimal import Decimal as D

            if approved_by.role == "operations_manager":
                if loan.amount >= D("1000.00"):
                    raise PermissionDenied(
                        "Operations Managers can only approve loans below 1000 GHS. "
                        "Please escalate to a Manager for approval."
                    )
            # Managers and admins can approve any amount

        from core.models import Account

        # Business Logic: Disburse to the user's primary savings account
        # In a real system, we might ask which account, but we'll default to the oldest active savings account.
        target_account = (
            Account.objects.filter(user=loan.user, account_type="member_savings", is_active=True)
            .order_by("created_at")
            .first()
        )

        if not target_account:
            # Fallback to any active account
            target_account = Account.objects.filter(user=loan.user, is_active=True).order_by("created_at").first()

        if not target_account:
            raise ValidationError("User has no active accounts for loan disbursement.")

        loan.status = "approved"
        loan.approved_at = timezone.now()
        loan.save(update_fields=["status", "approved_at", "updated_at"])

        # Execute Disbursement Transaction
        TransactionService.create_transaction(
            from_account=None,  # System account (virtual)
            to_account=target_account,
            amount=loan.amount,
            transaction_type="disbursement",
            description=f"Loan Disbursement for Application #{loan.id}",
        )

        # Queue notification after transaction commits
        transaction.on_commit(lambda: LoanService._send_loan_notification(loan, "approved"))

        logger.info(f"Loan {loan.id} approved and disbursed to account {target_account.account_number}.")
        return loan

    @staticmethod
    def _send_loan_notification(loan: Loan, status: str):
        """Send SMS notification to user about loan status change."""
        try:
            from users.services import SendexaService

            user = loan.user
            phone = getattr(user, "phone_number", None) or getattr(user, "phone", None)

            if not phone:
                logger.info(f"No phone number for user {user.email}, skipping loan SMS")
                return

            if status == "approved":
                message = f"Coastal Bank: Your loan of GHS {loan.amount:.2f} has been APPROVED! Ref: LOAN-{loan.id}. Contact us for disbursement."
            elif status == "rejected":
                message = f"Coastal Bank: Your loan application (Ref: LOAN-{loan.id}) has been declined. Please visit our branch for details."
            elif status == "disbursed":
                message = f"Coastal Bank: GHS {loan.amount:.2f} has been disbursed to your account. Monthly payment: GHS {LoanService.calculate_monthly_payment(loan):.2f}"
            else:
                message = f"Coastal Bank: Your loan status updated to {status}. Ref: LOAN-{loan.id}"

            success, result = SendexaService.send_sms(phone, message)
            if success:
                logger.info(f"Loan SMS sent to {user.email} for loan {loan.id}")
            else:
                logger.warning(f"Loan SMS failed for loan {loan.id}: {result}")

        except Exception as e:
            logger.error(f"Loan SMS notification error for loan {loan.id}: {e}")

    @staticmethod
    @transaction.atomic
    def repay_loan(loan: Loan, amount: Decimal) -> Loan:
        """Record a loan repayment and update the outstanding balance.

        Args:
            loan: The Loan instance being repaid.
            amount: The repayment amount.

        Returns:
            Loan: The updated Loan instance.

        """
        if loan.status not in ["approved", "active", "disbursed"]:
            raise ValidationError("Repayments can only be made on approved or active loans.")

        if amount <= 0:
            raise ValidationError("Repayment amount must be positive.")

        # Update balance atomically
        loan.outstanding_balance = F("outstanding_balance") - amount
        loan.save(update_fields=["outstanding_balance", "updated_at"])

        # Refresh to get the calculated value
        loan.refresh_from_db()

        # Update status if fully repaid
        if loan.outstanding_balance <= 0:
            loan.status = "paid_off"
            loan.outstanding_balance = Decimal("0.00")
            loan.save(update_fields=["status", "outstanding_balance", "updated_at"])

        # Create repayment transaction
        TransactionService.create_transaction(
            from_account=None,
            to_account=None,
            amount=amount,
            transaction_type="repayment",
            description=f"Loan Repayment for Loan #{loan.id}",
        )

        logger.info(f"Loan {loan.id} repayment of {amount} processed. New balance: {loan.outstanding_balance}")
        return loan

    @staticmethod
    def calculate_monthly_payment(loan: Loan) -> Decimal:
        """Calculate the monthly payment for a loan using simple interest.

        Args:
            loan: The Loan instance.

        Returns:
            Decimal: The calculated monthly payment amount.

        """
        total_interest = loan.amount * (loan.interest_rate / 100) * (loan.term_months / 12)
        total_amount = loan.amount + total_interest
        return total_amount / loan.term_months


class FraudAlertService:
    """Service class for fraud alert operations."""

    @staticmethod
    def create_alert(user, message: str, severity: str = "medium") -> FraudAlert:
        """Create a new fraud alert and broadcast it via WebSocket.

        Args:
            user: The User associated with the alert.
            message: The alert message.
            severity: The alert severity level.

        Returns:
            FraudAlert: The created FraudAlert instance.

        """
        alert = FraudAlert.objects.create(user=user, message=message, severity=severity)
        logger.warning(f"Fraud alert created for user {user.email}: {message}")
        # Broadcast the new alert via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"fraud_alerts_{user.id}", {"type": "fraud_alert_update", "alert": FraudAlertSerializer(alert).data}
        )
        return alert

    @staticmethod
    def resolve_alert(alert: FraudAlert) -> FraudAlert:
        """Resolve a fraud alert."""
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.save(update_fields=["is_resolved", "resolved_at"])
        logger.info(f"Fraud alert {alert.id} resolved.")
        return alert


class BankingMessageService:
    """Service class for banking message operations."""

    @staticmethod
    def create_message(user, subject: str, body: str, parent_message=None) -> BankingMessage:
        """Create a new banking message and broadcast it via WebSocket.

        Args:
            user: The recipient User.
            subject: The message subject.
            body: The message body.
            parent_message: Optional parent message for threading.

        Returns:
            BankingMessage: The created BankingMessage instance.

        """
        message = BankingMessage.objects.create(user=user, subject=subject, body=body, parent_message=parent_message)
        # Broadcast the new message via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"messages_{user.id}", {"type": "message_update", "message": BankingMessageSerializer(message).data}
        )
        return message

    @staticmethod
    def mark_as_read(message: BankingMessage) -> BankingMessage:
        """Mark a banking message as read."""
        message.is_read = True
        message.read_at = timezone.now()
        message.save(update_fields=["is_read", "read_at"])
        return message

    @staticmethod
    def get_unread_count(user) -> int:
        """Get the count of unread messages for a user."""
        return BankingMessage.objects.filter(user=user, is_read=False).count()


class SystemHealthService:
    @staticmethod
    def get_health_status():
        from django.db import connection

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {e!s}"

        return {
            "database": db_status,
            "web_server": "healthy",
        }


class CalculationService:
    @staticmethod
    def calculate_commission(amount):
        if amount < 1000:
            rate = Decimal("0.01")
        elif amount < 10000:
            rate = Decimal("0.015")
        else:
            rate = Decimal("0.02")
        return amount * rate


class ReportService:
    @staticmethod
    def get_report_data(report_type, start_date=None, end_date=None):
        if report_type == "transactions":
            queryset = Transaction.objects.all()
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
            return queryset.order_by("-timestamp")[:100]
        return []


class DashboardService:
    @staticmethod
    def get_operations_metrics():
        # This is a placeholder for the complex logic in OperationsMetricsView
        return {}


class ServiceChargeService:
    @staticmethod
    def calculate_charges(account_type, amount):
        # Placeholder logic
        return Decimal("0.00")


class ServiceRequestService:
    @staticmethod
    def process_request(request_obj, status, processed_by):
        request_obj.status = status
        request_obj.processed_by = processed_by
        request_obj.processed_at = timezone.now()
        request_obj.save()
        return request_obj
