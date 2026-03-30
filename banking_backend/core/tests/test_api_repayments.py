from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

import pytest

from core.models.accounts import Account
from core.models.loans import Loan
from core.models.operational import ClientAssignment

User = get_user_model()


@pytest.fixture
def repayment_user(db):
    return User.objects.create_user(
        username="repay_user", email="repay@test.com", password="password123", role="customer"
    )


@pytest.fixture
def repayment_account(repayment_user):
    return Account.objects.create(
        user=repayment_user,
        account_number="ACC-REPAY-001",
        balance=Decimal("2000.00"),
        account_type="member_savings",
        is_active=True,
    )


@pytest.fixture
def repayment_loan(repayment_user):
    return Loan.objects.create(
        user=repayment_user,
        amount=Decimal("1000.00"),
        interest_rate=Decimal("10.0"),
        term_months=12,
        outstanding_balance=Decimal("1000.00"),
        status="approved",
    )


@pytest.mark.django_db
class TestUnifiedRepayments:
    """Verifies all loan repayment channels: Customer, Mobile Banker, and Cashier."""

    def test_customer_self_repayment(self, api_client, repayment_user, repayment_loan, repayment_account):
        """Verify customers can repay their own loans via the API."""
        api_client.force_authenticate(user=repayment_user)
        url = reverse("core:loan-repay", kwargs={"pk": repayment_loan.pk})

        # 1. Successful repayment
        response = api_client.post(url, {"amount": "400.00"})
        assert response.status_code == status.HTTP_200_OK

        repayment_loan.refresh_from_db()
        repayment_account.refresh_from_db()
        assert repayment_loan.outstanding_balance == Decimal("600.00")
        assert repayment_account.balance == Decimal("1600.00")

        # 2. Insufficient funds
        response = api_client.post(url, {"amount": "3000.00"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Insufficient funds" in str(response.data)

    def test_mobile_banker_repayment_security(
        self, api_client, mobile_banker_user, repayment_user, repayment_loan, repayment_account
    ):
        """Verify CVE-COASTAL-04: Mobile Bankers can only process repayments for assigned clients."""
        api_client.force_authenticate(user=mobile_banker_user)
        url = reverse("core:mobile-process-repayment")
        data = {"member_id": repayment_user.id, "amount": "100.00"}

        # 1. Attempt without assignment (Should fail)
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "not assigned" in str(response.data).lower()

        # 2. Create assignment and retry (Should pass)
        ClientAssignment.objects.create(mobile_banker=mobile_banker_user, client=repayment_user, is_active=True)
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK

        repayment_loan.refresh_from_db()
        assert repayment_loan.outstanding_balance == Decimal("900.00")

    def test_cashier_loan_repayment(self, api_client, cashier_user, repayment_loan, repayment_account):
        """Verify cashiers can process repayments for standard loans."""
        api_client.force_authenticate(user=cashier_user)
        url = reverse("core:cash-advance-repay-loan", kwargs={"pk": repayment_loan.pk})

        response = api_client.post(url, {"amount": "500.00"})
        assert response.status_code == status.HTTP_200_OK

        repayment_loan.refresh_from_db()
        assert repayment_loan.outstanding_balance == Decimal("500.00")

        # Verify Audit Log
        from users.models import AuditLog

        assert AuditLog.objects.filter(action="repayment", object_id=str(repayment_loan.id)).exists()

    def test_repayment_completes_loan(self, api_client, repayment_user, repayment_loan, repayment_account):
        """Verify that a full repayment moves the loan status to 'paid_off'."""
        api_client.force_authenticate(user=repayment_user)
        url = reverse("core:loan-repay", kwargs={"pk": repayment_loan.pk})

        response = api_client.post(url, {"amount": "1000.00"})
        assert response.status_code == status.HTTP_200_OK

        repayment_loan.refresh_from_db()
        assert repayment_loan.status == "paid_off"
        assert repayment_loan.outstanding_balance == Decimal("0.00")
