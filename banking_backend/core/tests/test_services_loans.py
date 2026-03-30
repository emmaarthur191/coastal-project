from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

import pytest

from core.models.accounts import Account
from core.models.loans import Loan
from core.services.loans import LoanService

User = get_user_model()


@pytest.fixture
def loan_user(db):
    return User.objects.create_user(username="serv_user", email="service@test.com", password="password")


@pytest.mark.django_db
class TestLoanServiceUnit:
    """Detailed unit tests for LoanService business logic."""

    def test_calculate_monthly_payment(self):
        """Verify simple interest calculation: (Principal + Interest) / Term."""
        # 1200 GHS, 10% interest, 12 months -> 120 interest -> 1320 total -> 110/mo
        loan = Loan(amount=Decimal("1200.00"), interest_rate=Decimal("10.0"), term_months=12)
        payment = LoanService.calculate_monthly_payment(loan)
        assert payment == Decimal("110.00")

    def test_approve_already_approved_loan(self, loan_user):
        """Verify only pending loans can be approved."""
        loan = Loan.objects.create(
            user=loan_user, amount=Decimal("500"), interest_rate=Decimal("10"), term_months=12, status="approved"
        )
        with pytest.raises(ValidationError, match="Only pending loans can be approved"):
            LoanService.approve_loan(loan)

    def test_repay_negative_amount(self, loan_user):
        """Verify repayment amount must be positive."""
        loan = Loan.objects.create(
            user=loan_user, amount=Decimal("500"), interest_rate=Decimal("10"), term_months=12, status="approved"
        )
        with pytest.raises(ValidationError, match="must be positive"):
            LoanService.repay_loan(loan, Decimal("-10.00"))

    def test_disbursement_account_selection(self, loan_user):
        """Verify disbursement picks member_savings if available, or any active account."""
        # 1. Setup two accounts
        acc1 = Account.objects.create(user=loan_user, account_number="ACC1", account_type="daily_susu", is_active=True)
        acc2 = Account.objects.create(
            user=loan_user, account_number="ACC2", account_type="member_savings", is_active=True
        )

        loan = Loan.objects.create(
            user=loan_user, amount=Decimal("100"), interest_rate=Decimal("10"), term_months=12, status="pending"
        )

        # Should pick acc2 (member_savings)
        LoanService.approve_loan(loan)

        # Verify transaction went to acc2 (balance should be 100)
        acc2.refresh_from_db()
        assert acc2.balance == Decimal("100.00")
        acc1.refresh_from_db()
        assert acc1.balance == Decimal("0.00")
