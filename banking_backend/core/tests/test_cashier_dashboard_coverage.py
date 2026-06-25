import pytest
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from unittest.mock import patch
from core.models.accounts import Account
from core.models.operational import CashAdvance, CashDrawer, CashDrawerDenomination, ServiceRequest
from core.models.transactions import CheckDeposit, Transaction
from core.models.loans import Loan
from core.models.hr import Expense
from users.models import User, AdminNotification, UserActivity

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="mgr_cashier",
        email="mgr_cashier@example.com",
        password="Password123!",
        role="manager",
        is_approved=True,
        is_staff=True # Required for submitted_by logic
    )

@pytest.fixture
def cashier_user(db):
    return User.objects.create_user(
        username="cashier_user",
        email="cashier@example.com",
        password="Password123!",
        role="cashier",
        is_approved=True,
        is_staff=True # Required for submitted_by logic
    )

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="customer_cashier",
        email="cust_cashier@example.com",
        password="Password123!",
        role="customer",
        is_approved=True
    )

@pytest.fixture
def customer_account(customer_user):
    return Account.objects.create(
        user=customer_user,
        account_number="ACC_CASHIER",
        balance=Decimal("1000.00"),
        account_type="daily_susu"
    )

@pytest.mark.django_db
class TestCashAdvanceViewSetCoverage:
    def test_cash_advance_lifecycle(self, api_client, cashier_user, manager_user):
        # 1. Create Request
        api_client.force_authenticate(user=cashier_user)
        url = reverse("core:cash-advance-list")
        data = {"amount": "500.00", "reason": "Emergency"}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        advance_id = response.data["id"]
        
        # 2. Approve (Maker-Checker violation check)
        url_approve = reverse("core:cash-advance-approve", args=[advance_id])
        response = api_client.post(url_approve)
        assert response.status_code == status.HTTP_403_FORBIDDEN # Self-approval blocked
        
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(url_approve)
        assert response.status_code == status.HTTP_200_OK
        
        # 3. Disburse
        url_disburse = reverse("core:cash-advance-disburse", args=[advance_id])
        response = api_client.post(url_disburse)
        assert response.status_code == status.HTTP_200_OK
        
        # 4. Repay
        url_repay = reverse("core:cash-advance-repay", args=[advance_id])
        response = api_client.post(url_repay)
        assert response.status_code == status.HTTP_200_OK

    def test_cashier_repay_loan(self, api_client, cashier_user, customer_user):
        loan = Loan.objects.create(
            user=customer_user, 
            amount=Decimal("1000.00"), 
            outstanding_balance=Decimal("1000.00"),
            interest_rate=Decimal("15.0"),
            term_months=12,
            status="active"
        )
        
        # Ensure customer has enough balance to repay (since repay_loan deducts from account)
        Account.objects.create(
            user=customer_user,
            account_number="ACC_LOAN_REPAY",
            balance=Decimal("500.00"),
            account_type="member_savings"
        )
        
        api_client.force_authenticate(user=cashier_user)
        url = reverse("core:cash-advance-repay-loan", args=[loan.id])
        response = api_client.post(url, {"amount": "200.00"})
        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data["data"]["outstanding_balance"]) == Decimal("800.00")

@pytest.mark.django_db
class TestCashDrawerViewSetCoverage:
    def test_drawer_lifecycle(self, api_client, cashier_user, manager_user):
        api_client.force_authenticate(user=cashier_user)
        # 1. Open
        url_open = reverse("core:cash-drawer-open")
        response = api_client.post(url_open, {"opening_balance": "1000.00"})
        assert response.status_code == status.HTTP_201_CREATED
        drawer_id = response.data["id"]
        
        # 2. Close
        url_close = reverse("core:cash-drawer-close", args=[drawer_id])
        data = {
            "closing_balance": "1050.00",
            "closing_denominations": [{"denomination": "50.0", "count": 1}]
        }
        response = api_client.post(url_close, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data["variance"]) == Decimal("50.00")
        
        # 3. Reconcile
        api_client.force_authenticate(user=manager_user)
        url_reconcile = reverse("core:cash-drawer-reconcile", args=[drawer_id])
        response = api_client.post(url_reconcile, {"notes": "Verified"})
        assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
class TestCheckDepositViewSetCoverage:
    def test_check_deposit_lifecycle(self, api_client, cashier_user, manager_user, customer_user, customer_account):
        api_client.force_authenticate(user=cashier_user)
        # 1. Process Check (Cashier Dashboard)
        url_process = reverse("core:check-deposit-process-check-deposit")
        data = {
            "member_id": customer_user.id,
            "amount": "100.00",
            "account_type": "daily_susu",
            "bank_name": "EcoBank"
        }
        response = api_client.post(url_process, data)
        assert response.status_code == status.HTTP_200_OK
        check_id = response.data["id"]
        
        # 2. Approve
        url_approve = reverse("core:check-deposit-approve", args=[check_id])
        # Self-approval block
        response = api_client.post(url_approve)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(url_approve)
        assert response.status_code == status.HTTP_200_OK
        
        customer_account.refresh_from_db()
        assert customer_account.balance == Decimal("1100.00")

@pytest.mark.django_db(transaction=True)
class TestDashboardViewsCoverage:
    def test_cash_flow_view(self, api_client, manager_user, customer_account):
        Transaction.objects.create(to_account=customer_account, amount=Decimal("100.00"), transaction_type="deposit", status="completed")
        Transaction.objects.create(from_account=customer_account, amount=Decimal("50.00"), transaction_type="withdrawal", status="completed")
        
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:cash-flow")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["inflow"]["total"] == 100.00
        assert response.data["outflow"]["total"] == 50.00

    def test_operations_metrics_view(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:operations-metrics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "transactions_today" in response.data

    def test_system_alerts_view(self, api_client, manager_user):
        AdminNotification.objects.create(message="System high load", priority="critical")
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:system-alerts")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_performance_dashboard_view(self, api_client, manager_user):
        from core.models.reporting import SystemHealth
        # Explicit cleanup to prevent pollution from other tests
        SystemHealth.objects.all().delete()
        SystemHealth.objects.create(status="healthy", response_time_ms=100, details={"cpu_usage": 10})
        
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:performance-dashboard")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["system_health"]["overall_status"] == "healthy"

    def test_workflow_status_view(self, api_client, manager_user, customer_user):
        ServiceRequest.objects.create(user=customer_user, request_type="statement", status="pending")
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:workflow-status")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pending_approval"] >= 1
