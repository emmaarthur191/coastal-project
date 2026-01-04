from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from rest_framework.test import APIRequestFactory

import pytest

from core.models import Loan
from core.permissions import IsMobileBanker
from core.services import LoanService

User = get_user_model()


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="customer", email="customer@example.com", password="password123", role="customer"
    )


@pytest.fixture
def ops_manager_user(db):
    return User.objects.create_user(
        username="ops_manager",
        email="ops@example.com",
        password="password123",
        role="operations_manager",
        is_staff=True,
    )


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="manager", email="manager@example.com", password="password123", role="manager", is_staff=True
    )


@pytest.fixture
def mobile_banker_user(db):
    return User.objects.create_user(
        username="mobile_banker",
        email="mobile@example.com",
        password="password123",
        role="mobile_banker",
        is_staff=True,
    )


@pytest.mark.django_db
class TestSecurityPermissions:
    """Test suite for role-based security enhancements."""

    def test_ismobile_banker_permission_allows_mobile_banker(self, mobile_banker_user):
        """Verify IsMobileBanker permission allows mobile banker role."""
        factory = APIRequestFactory()
        request = factory.post("/api/mobile/deposit/")
        request.user = mobile_banker_user

        permission = IsMobileBanker()
        assert permission.has_permission(request, None) is True

    def test_ismobile_banker_permission_denies_customer(self, customer_user):
        """Verify IsMobileBanker permission denies customer role."""
        factory = APIRequestFactory()
        request = factory.post("/api/mobile/deposit/")
        request.user = customer_user

        permission = IsMobileBanker()
        assert permission.has_permission(request, None) is False

    def test_ops_manager_can_approve_small_loan(self, ops_manager_user, customer_user):
        """Verify Operations Manager can approve loans < 1000 GHS."""
        # Create customer account first (required for disbursement)
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", initial_balance=Decimal("0.00"))

        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        # This should NOT raise PermissionDenied
        LoanService.approve_loan(loan, approved_by=ops_manager_user)
        loan.refresh_from_db()
        assert loan.status == "approved"

    def test_ops_manager_cannot_approve_large_loan(self, ops_manager_user, customer_user):
        """Verify Operations Manager cannot approve loans >= 1000 GHS."""
        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("1500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        # This should raise PermissionDenied
        with pytest.raises(PermissionDenied) as exc_info:
            LoanService.approve_loan(loan, approved_by=ops_manager_user)

        assert "Operations Managers can only approve loans below 1000 GHS" in str(exc_info.value)

    def test_manager_can_approve_large_loan(self, manager_user, customer_user):
        """Verify Manager can approve loans >= 1000 GHS."""
        # Create customer account first (required for disbursement)
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", initial_balance=Decimal("0.00"))

        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("1500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        # This should NOT raise PermissionDenied
        LoanService.approve_loan(loan, approved_by=manager_user)
        loan.refresh_from_db()
        assert loan.status == "approved"

    def test_maker_checker_still_enforced(self, ops_manager_user):
        """Verify maker-checker is still enforced even for small loans."""
        loan = Loan.objects.create(
            user=ops_manager_user,  # Ops manager is the loan applicant
            amount=Decimal("500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        # Even though amount is < 1000, self-approval should be blocked
        with pytest.raises(PermissionDenied) as exc_info:
            LoanService.approve_loan(loan, approved_by=ops_manager_user)

        assert "cannot approve their own loan" in str(exc_info.value).lower()
