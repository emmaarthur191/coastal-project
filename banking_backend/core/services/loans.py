"""Loan-related services for Coastal Banking.

Handles loan applications, approvals, disbursements, and repayments.
"""

import logging
from decimal import Decimal

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from core.exceptions import InsufficientFundsError
from core.models.accounts import Account
from core.models.loans import Loan

logger = logging.getLogger(__name__)


class LoanService:
    """Service class for loan-related operations."""

    @staticmethod
    @transaction.atomic
    def create_loan(user, amount: Decimal, interest_rate: Decimal, term_months: int) -> Loan:
        """Create a new loan application for a user."""
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

        if approved_by and approved_by == loan.user:
            raise PermissionDenied("A customer cannot approve their own loan.")

        if approved_by:
            from decimal import Decimal as D

            if approved_by.role == "operations_manager":
                if loan.amount >= D("1000.00"):
                    raise PermissionDenied("Operations Managers can only approve loans below 1000 GHS.")

        target_account = (
            Account.objects.filter(user=loan.user, account_type="member_savings", is_active=True)
            .order_by("created_at")
            .first()
        )

        if not target_account:
            target_account = Account.objects.filter(user=loan.user, is_active=True).order_by("created_at").first()

        if not target_account:
            raise ValidationError("User has no active accounts for loan disbursement.")

        loan.status = "approved"
        loan.approved_at = timezone.now()
        loan.save(update_fields=["status", "approved_at", "updated_at"])

        from .transactions import TransactionService

        TransactionService.create_transaction(
            from_account=None,
            to_account=target_account,
            amount=loan.amount,
            transaction_type="disbursement",
            description=f"Loan Disbursement for Application #{loan.id}",
        )

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
        """Record a loan repayment and update both loan balance and user account balance."""
        if loan.status not in ["approved", "active", "disbursed"]:
            raise ValidationError("Repayments can only be made on approved or active loans.")

        if amount <= 0:
            raise ValidationError("Repayment amount must be positive.")

        source_account = (
            Account.objects.filter(user=loan.user, account_type="member_savings", is_active=True)
            .order_by("created_at")
            .first()
        )
        if not source_account:
            source_account = Account.objects.filter(user=loan.user, is_active=True).order_by("created_at").first()

        if not source_account:
            raise ValidationError("Client has no active account to deduct repayment from.")

        if source_account.balance < amount:
            raise InsufficientFundsError(
                message=f"Insufficient funds for loan repayment. Account balance: {source_account.balance}"
            )

        from .transactions import TransactionService

        TransactionService.create_transaction(
            from_account=source_account,
            to_account=None,
            amount=amount,
            transaction_type="payment",
            description=f"Loan Repayment for Loan #{loan.id}",
        )

        from django.db.models import F

        loan.outstanding_balance = F("outstanding_balance") - amount
        loan.save(update_fields=["outstanding_balance", "updated_at"])

        loan.refresh_from_db()

        if loan.outstanding_balance <= 0:
            loan.status = "paid_off"
            loan.outstanding_balance = Decimal("0.00")
            loan.save(update_fields=["status", "outstanding_balance", "updated_at"])

        logger.info(f"Loan {loan.id} repayment of {amount} processed. New balance: {loan.outstanding_balance}")
        return loan

    @staticmethod
    def calculate_monthly_payment(loan: Loan) -> Decimal:
        """Calculate the monthly payment for a loan using simple interest."""
        total_interest = loan.amount * (loan.interest_rate / 100) * (loan.term_months / 12)
        total_amount = loan.amount + total_interest
        return total_amount / loan.term_months
