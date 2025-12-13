"""
Core banking services for Coastal Banking Application.

This module contains service classes that implement business logic for
accounts, transactions, loans, fraud alerts, and messaging. All financial
operations are wrapped in atomic database transactions to ensure ACID compliance.
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Account, Transaction, Loan, FraudAlert, BankingMessage
from .serializers import BankingMessageSerializer, FraudAlertSerializer
from .exceptions import (
    InsufficientFundsError,
    AccountNotFoundError,
    AccountSuspendedError,
    InvalidTransactionError,
    OperationalError,
)

logger = logging.getLogger(__name__)


class AccountService:
    """
    Service class for account-related operations.
    
    Provides methods for creating accounts, retrieving user accounts,
    and updating account balances with proper locking.
    """

    @staticmethod
    def create_account(user, account_type: str = 'checking') -> Account:
        """
        Create a new account for a user with a unique 13-digit account number.

        Args:
            user: The User instance to create the account for.
            account_type: The type of account (e.g., 'daily_susu', 'shares').

        Returns:
            Account: The newly created Account instance.

        Raises:
            OperationalError: If account creation fails due to a database issue.
        """
        import random
        from django.db import IntegrityError
        
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                with transaction.atomic():
                    # Generate unique 13-digit account number starting with 2231
                    account_number = '2231' + ''.join([str(random.randint(0, 9)) for _ in range(9)])
                    
                    # Check if exists (for extra safety before insert)
                    while Account.objects.filter(account_number=account_number).exists():
                        account_number = '2231' + ''.join([str(random.randint(0, 9)) for _ in range(9)])
                    
                    account = Account.objects.create(
                        user=user,
                        account_number=account_number,
                        account_type=account_type
                    )
                    logger.info(f"Account created: {account.account_number} for user {user.email}")
                    return account
                    
            except IntegrityError:
                # Race condition - duplicate key, retry
                if attempt == max_attempts - 1:
                    logger.error(f"Failed to create unique account number after {max_attempts} attempts")
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
        """
        Update an account's balance. This method MUST be called within a transaction.atomic() block.

        Args:
            account: The Account instance to update.
            amount: The amount to add (positive) or subtract (negative).

        Returns:
            Account: The updated Account instance.
        """
        account.balance += amount
        account.save(update_fields=['balance', 'updated_at'])
        return account


class TransactionService:
    """
    Service class for transaction-related operations.
    
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
        description: str = ''
    ) -> Transaction:
        """
        Create and execute a financial transaction atomically.

        This method locks the involved accounts, validates the transaction,
        updates balances, and creates a transaction record in a single
        database transaction.

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

        # Lock accounts for the duration of the transaction
        locked_from_account = None
        locked_to_account = None

        if from_account:
            locked_from_account = Account.objects.select_for_update().get(pk=from_account.pk)
            if not locked_from_account.is_active:
                raise AccountSuspendedError(message=f"Account {locked_from_account.account_number} is suspended.")
        
        if to_account:
            locked_to_account = Account.objects.select_for_update().get(pk=to_account.pk)
            if not locked_to_account.is_active:
                raise AccountSuspendedError(message=f"Account {locked_to_account.account_number} is suspended.")

        # Validate the transaction
        TransactionService.validate_transaction(locked_from_account, locked_to_account, amount, transaction_type)

        # Create the transaction record
        tx = Transaction.objects.create(
            from_account=locked_from_account,
            to_account=locked_to_account,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            status='completed',
            processed_at=timezone.now()
        )

        # Update balances
        if locked_from_account:
            AccountService.update_balance(locked_from_account, -amount)
        if locked_to_account:
            AccountService.update_balance(locked_to_account, amount)
        
        # Create AuditLog entry for financial transaction
        from users.models import AuditLog
        AuditLog.objects.create(
            action='create',
            model_name='Transaction',
            object_id=str(tx.id),
            object_repr=f"{transaction_type} of {amount}",
            changes={
                'amount': str(amount),
                'type': transaction_type,
                'from_account': str(locked_from_account.account_number) if locked_from_account else None,
                'to_account': str(locked_to_account.account_number) if locked_to_account else None,
            }
        )
        
        # Send SMS notification to account owner
        TransactionService._send_transaction_notification(
            locked_from_account or locked_to_account,
            transaction_type,
            amount,
            tx.id
        )
        
        logger.info(f"Transaction {tx.id} completed successfully.")
        return tx

    @staticmethod
    def validate_transaction(
        from_account: Account | None,
        to_account: Account | None,
        amount: Decimal,
        transaction_type: str
    ) -> bool:
        """
        Validate transaction parameters before execution.

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
        
        if transaction_type == 'transfer':
            if not from_account or not to_account:
                raise InvalidTransactionError(message="Transfer requires both source and destination accounts.")
            if from_account.pk == to_account.pk:
                raise InvalidTransactionError(message="Cannot transfer to the same account.")
            if from_account.balance < amount:
                raise InsufficientFundsError(
                    message=f"Insufficient funds. Available: {from_account.balance}, Requested: {amount}",
                    details={"available": str(from_account.balance), "requested": str(amount)}
                )
        elif transaction_type in ['withdrawal', 'payment']:
            if not from_account:
                raise InvalidTransactionError(message=f"{transaction_type.capitalize()} requires a source account.")
            if from_account.balance < amount:
                raise InsufficientFundsError(
                    message=f"Insufficient funds. Available: {from_account.balance}, Requested: {amount}",
                    details={"available": str(from_account.balance), "requested": str(amount)}
                )
        elif transaction_type == 'deposit':
            if not to_account:
                raise InvalidTransactionError(message="Deposit requires a destination account.")
        
        return True
    
    @staticmethod
    def _send_transaction_notification(account: Account, transaction_type: str, amount: Decimal, tx_id: int):
        """
        Send SMS notification to account owner about a transaction.
        
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
            phone = getattr(user, 'phone_number', None) or getattr(user, 'phone', None)
            
            if not phone:
                logger.info(f"No phone number for user {user.email}, skipping SMS")
                return
            
            # Format message based on transaction type
            if transaction_type == 'deposit':
                message = f"Coastal Bank: GHS {amount:.2f} deposited to your account. Ref: {tx_id}. New balance: GHS {account.balance:.2f}"
            elif transaction_type == 'withdrawal':
                message = f"Coastal Bank: GHS {amount:.2f} withdrawn from your account. Ref: {tx_id}. New balance: GHS {account.balance:.2f}"
            elif transaction_type == 'transfer':
                message = f"Coastal Bank: GHS {amount:.2f} transferred. Ref: {tx_id}. New balance: GHS {account.balance:.2f}"
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
        """
        Create a new loan application for a user.

        Args:
            user: The User applying for the loan.
            amount: The requested loan principal.
            interest_rate: The annual interest rate.
            term_months: The loan term in months.

        Returns:
            Loan: The newly created Loan instance.
        """
        loan = Loan.objects.create(
            user=user,
            amount=amount,
            interest_rate=interest_rate,
            term_months=term_months,
            outstanding_balance=amount
        )
        logger.info(f"Loan {loan.id} created for user {user.email}, amount: {amount}")
        return loan

    @staticmethod
    @transaction.atomic
    def approve_loan(loan: Loan) -> Loan:
        """
        Approve a pending loan application.

        Args:
            loan: The Loan instance to approve.

        Returns:
            Loan: The updated Loan instance.
        """
        loan.status = 'approved'
        loan.approved_at = timezone.now()
        loan.save(update_fields=['status', 'approved_at', 'updated_at'])
        
        # Send SMS notification for loan approval
        LoanService._send_loan_notification(loan, 'approved')
        
        logger.info(f"Loan {loan.id} approved.")
        return loan
    
    @staticmethod
    def _send_loan_notification(loan: Loan, status: str):
        """Send SMS notification to user about loan status change."""
        try:
            from users.services import SendexaService
            
            user = loan.user
            phone = getattr(user, 'phone_number', None) or getattr(user, 'phone', None)
            
            if not phone:
                logger.info(f"No phone number for user {user.email}, skipping loan SMS")
                return
            
            if status == 'approved':
                message = f"Coastal Bank: Your loan of GHS {loan.amount:.2f} has been APPROVED! Ref: LOAN-{loan.id}. Contact us for disbursement."
            elif status == 'rejected':
                message = f"Coastal Bank: Your loan application (Ref: LOAN-{loan.id}) has been declined. Please visit our branch for details."
            elif status == 'disbursed':
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
    def calculate_monthly_payment(loan: Loan) -> Decimal:
        """
        Calculate the monthly payment for a loan using simple interest.

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
    def create_alert(user, message: str, severity: str = 'medium') -> FraudAlert:
        """
        Create a new fraud alert and broadcast it via WebSocket.

        Args:
            user: The User associated with the alert.
            message: The alert message.
            severity: The alert severity level.

        Returns:
            FraudAlert: The created FraudAlert instance.
        """
        alert = FraudAlert.objects.create(
            user=user,
            message=message,
            severity=severity
        )
        logger.warning(f"Fraud alert created for user {user.email}: {message}")
        # Broadcast the new alert via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'fraud_alerts_{user.id}',
            {
                'type': 'fraud_alert_update',
                'alert': FraudAlertSerializer(alert).data
            }
        )
        return alert

    @staticmethod
    def resolve_alert(alert: FraudAlert) -> FraudAlert:
        """Resolve a fraud alert."""
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.save(update_fields=['is_resolved', 'resolved_at'])
        logger.info(f"Fraud alert {alert.id} resolved.")
        return alert


class BankingMessageService:
    """Service class for banking message operations."""

    @staticmethod
    def create_message(user, subject: str, body: str, parent_message=None) -> BankingMessage:
        """
        Create a new banking message and broadcast it via WebSocket.

        Args:
            user: The recipient User.
            subject: The message subject.
            body: The message body.
            parent_message: Optional parent message for threading.

        Returns:
            BankingMessage: The created BankingMessage instance.
        """
        message = BankingMessage.objects.create(
            user=user,
            subject=subject,
            body=body,
            parent_message=parent_message
        )
        # Broadcast the new message via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'messages_{user.id}',
            {
                'type': 'message_update',
                'message': BankingMessageSerializer(message).data
            }
        )
        return message

    @staticmethod
    def mark_as_read(message: BankingMessage) -> BankingMessage:
        """Mark a banking message as read."""
        message.is_read = True
        message.read_at = timezone.now()
        message.save(update_fields=['is_read', 'read_at'])
        return message

    @staticmethod
    def get_unread_count(user) -> int:
        """Get the count of unread messages for a user."""
        return BankingMessage.objects.filter(user=user, is_read=False).count()
