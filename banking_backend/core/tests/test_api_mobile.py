import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.accounts import Account
from core.models.loans import Loan
from core.models.operational import ClientAssignment, VisitSchedule
from core.models.transactions import Transaction

User = get_user_model()


@pytest.fixture
def mobile_banker(db):
    return User.objects.create_user(
        username="mb1", email="mb1@coastal.com", password="pwd", role="mobile_banker", is_staff=True, is_approved=True
    )


@pytest.fixture
def mb_client(mobile_banker):
    client = APIClient()
    client.force_authenticate(user=mobile_banker)
    return client


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="cust_mobile", email="cust_m@test.com", password="pwd", role="customer", is_approved=True
    )


@pytest.mark.django_db
class TestMobileBankerWorkflows:
    def test_mobile_metrics_accumulation(self, mb_client, mobile_banker, customer_user):
        """Verify that collections and visits are aggregated correctly."""
        # 1. Create a visit
        VisitSchedule.objects.create(
            mobile_banker=mobile_banker,
            client_name="Test Client",
            location="Accra",
            scheduled_time=timezone.now(),
            status="completed",
        )

        # 2. Create a mobile collection transaction
        # The view looks for "Mobile deposit by {banker_email}" in description
        Account.objects.create(user=customer_user, account_number="MB-ACCOUNT", balance=100)
        Transaction.objects.create(
            transaction_type="deposit",
            amount=Decimal("50.00"),
            status="completed",
            description=f"Mobile deposit by {mobile_banker.email}",
            timestamp=timezone.now(),
        )

        url = reverse("core:mobile-banker-metrics")
        response = mb_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["visits"]["completed"] == 1
        assert float(response.data["collections"]["today"]) == 50.0

    def test_mobile_deposit_operation(self, mb_client, mobile_banker, customer_user):
        account = Account.objects.create(
            user=customer_user, account_number="DEP-123", balance=10, account_type="daily_susu"
        )
        # SECURITY: Assign client to mobile banker to pass the 403 gate
        ClientAssignment.objects.create(
            mobile_banker=mobile_banker, client=customer_user, status="assigned", is_active=True
        )

        url = reverse("core:mobile-ops-process-deposit")
        data = {"member_id": customer_user.id, "amount": 100.0, "account_type": "daily_susu"}
        response = mb_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        account.refresh_from_db()
        assert account.balance == 110

    def test_mobile_withdrawal_insufficient_funds(self, mb_client, mobile_banker, customer_user):
        account = Account.objects.create(
            user=customer_user, account_number="WITH-123", balance=10, account_type="daily_susu"
        )
        # SECURITY: Assign client to mobile banker to pass the 403 gate
        ClientAssignment.objects.create(
            mobile_banker=mobile_banker, client=customer_user, status="assigned", is_active=True
        )

        url = reverse("core:mobile-ops-process-withdrawal")
        data = {"member_id": customer_user.id, "amount": 500.0}
        response = mb_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Insufficient funds" in response.data["error"]

    def test_mobile_repayment_flow(self, mb_client, mobile_banker, customer_user):
        # Add active account for repayment deduction
        Account.objects.create(user=customer_user, account_number="REPAY-ACC", balance=5000, is_active=True)

        # SECURITY: Assign client to mobile banker to pass the 403 gate
        ClientAssignment.objects.create(
            mobile_banker=mobile_banker, client=customer_user, status="assigned", is_active=True
        )
        loan = Loan.objects.create(
            user=customer_user, amount=1000, outstanding_balance=1000, interest_rate=10, term_months=12, status="active"
        )
        url = reverse("core:mobile-process-repayment")
        data = {"member_id": customer_user.id, "amount": 200.0}
        # Note: Repayment logic is complex, might need more mocking if LoanService is heavy.
        # But let's see if the view handles it.
        response = mb_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.outstanding_balance < 1000


@pytest.mark.django_db
class TestVisitManagement:
    def test_schedule_visit_rpc(self, mb_client):
        url = reverse("core:mobile-ops-schedule-visit")
        data = {
            "client_name": "New Prospect",
            "location": "Kumasi",
            "scheduled_time": (timezone.now() + datetime.timedelta(days=1)).isoformat(),
        }
        response = mb_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        # Check first record name using the property
        assert VisitSchedule.objects.all()[0].client_name == "New Prospect"
