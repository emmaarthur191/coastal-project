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
def loan_customer(db):
    """Fixture for a loan applicant."""
    return User.objects.create_user(
        username="loan_cust", email="loancust@test.com", password="password123", role="customer"
    )


@pytest.fixture
def customer_account(loan_customer):
    """Fixture for the applicant's savings account."""
    return Account.objects.create(
        user=loan_customer,
        account_number="ACC-LOAN-001",
        balance=Decimal("100.00"),
        account_type="member_savings",
        is_active=True,
    )


@pytest.mark.django_db
class TestLoanLifecycle:
    """Verifies the end-to-end loan lifecycle and security constraints."""

    def test_customer_apply_loan(self, api_client, loan_customer):
        """Verify a customer can apply for a loan themselves."""
        api_client.force_authenticate(user=loan_customer)
        url = reverse("core:loan-list")
        data = {"amount": "500.00", "interest_rate": "15.0", "term_months": 12, "purpose": "Business Expansion"}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Loan.objects.filter(user=loan_customer, status="pending").exists()

    def test_mobile_banker_apply_for_assigned_client(self, api_client, mobile_banker_user, loan_customer):
        """Verify CVE-COASTAL-04: Mobile Bankers can only apply for assigned clients."""
        # 1. Attempt without assignment (Should fail)
        api_client.force_authenticate(user=mobile_banker_user)
        url = reverse("core:loan-list")
        data = {"user": loan_customer.id, "amount": "300.00", "interest_rate": "10.0", "term_months": 6}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not assigned" in str(response.data)

        # 2. Create assignment and retry (Should pass)
        ClientAssignment.objects.create(mobile_banker=mobile_banker_user, client=loan_customer)
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_ops_manager_threshold_enforcement(self, api_client, ops_manager_user, loan_customer):
        """Verify Ops Managers cannot approve loans >= 1,000 GHS."""
        # 1. Create a large loan
        loan = Loan.objects.create(
            user=loan_customer,
            amount=Decimal("2000.00"),
            interest_rate=Decimal("15.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=ops_manager_user)
        # Verify access is denied at the detail level first (Hardening)
        url_detail = reverse("core:loan-detail", kwargs={"pk": loan.pk})
        response_detail = api_client.get(url_detail)
        assert response_detail.status_code == status.HTTP_403_FORBIDDEN

        # Verify approval is denied
        url_approve = reverse("core:loan-approve", kwargs={"pk": loan.pk})
        response_approve = api_client.post(url_approve)
        assert response_approve.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_approve_large_loan(self, api_client, manager_user, loan_customer, customer_account):
        """Verify Manager can approve large loans and trigger disbursement."""
        loan = Loan.objects.create(
            user=loan_customer,
            amount=Decimal("2500.00"),
            interest_rate=Decimal("15.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("core:loan-approve", kwargs={"pk": loan.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.status == "approved"

        # Verify disbursement transaction
        customer_account.refresh_from_db()
        assert customer_account.balance == Decimal("2600.00")  # 100 + 2500

    def test_loan_repayment_logic(self, loan_customer, customer_account):
        """Verify LoanService.repay_loan reduces balance correctly."""
        from core.services.loans import LoanService

        # 1. Setup approved loan with 2500 balance
        loan = Loan.objects.create(
            user=loan_customer,
            amount=Decimal("2500.00"),
            interest_rate=Decimal("15.0"),
            term_months=12,
            outstanding_balance=Decimal("2500.00"),
            status="approved",
        )
        customer_account.balance = Decimal("3000.00")
        customer_account.save()

        # 2. Repay 1000
        LoanService.repay_loan(loan, Decimal("1000.00"))

        loan.refresh_from_db()
        customer_account.refresh_from_db()
        assert loan.outstanding_balance == Decimal("1500.00")
        assert customer_account.balance == Decimal("2000.00")

        # 3. Pay off the rest
        LoanService.repay_loan(loan, Decimal("1500.00"))
        loan.refresh_from_db()
        assert loan.status == "paid_off"
        assert loan.outstanding_balance == Decimal("0.00")

    def test_maker_checker_self_approval_loan(self, api_client, manager_user):
        """Verify managers cannot approve their own loans."""
        loan = Loan.objects.create(
            user=manager_user, amount=Decimal("500.00"), interest_rate=Decimal("10.0"), term_months=6, status="pending"
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("core:loan-approve", kwargs={"pk": loan.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "You cannot approve your own loan" in str(response.data)
