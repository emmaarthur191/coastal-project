import io

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.accounts import Account
from core.models.operational import CashAdvance, CashDrawer
from core.models.transactions import CheckDeposit

User = get_user_model()


@pytest.fixture
def cashier_user(db):
    return User.objects.create_user(
        username="cashier_test", email="cash_test@coastal.com", password="pwd", role="cashier", is_staff=True
    )


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="manager_test", email="mgr_test@coastal.com", password="pwd", role="manager", is_staff=True
    )


@pytest.fixture
def other_cashier(db):
    return User.objects.create_user(
        username="cashier2", email="cash2@coastal.com", password="pwd", role="cashier", is_staff=True
    )


@pytest.mark.django_db
class TestCashDrawerOperations:
    def test_open_drawer_success(self, cashier_user):
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        url = reverse("core:cash-drawer-open")
        data = {"opening_balance": 500.0}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert CashDrawer.objects.filter(cashier=cashier_user, status="open").exists()

    def test_close_drawer_with_variance(self, cashier_user):
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        drawer = CashDrawer.objects.create(
            cashier=cashier_user, opening_balance=500, current_balance=700, status="open", opened_at=timezone.now()
        )
        url = reverse("core:cash-drawer-close", kwargs={"pk": drawer.pk})
        data = {
            "closing_balance": 650.0,  # $50 variance
            "closing_denominations": [{"denomination": 50, "count": 13}],
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        drawer.refresh_from_db()
        assert drawer.status == "closed"
        assert drawer.variance == -50.0

    def test_reconcile_drawer_unauthorized(self, cashier_user, other_cashier):
        # Only manager or drawer owner can reconcile? View says cashier or manager.
        # Let's test non-owner cashier
        client = APIClient()
        client.force_authenticate(user=other_cashier)
        drawer = CashDrawer.objects.create(
            cashier=cashier_user, opening_balance=0, current_balance=0, status="closed", opened_at=timezone.now()
        )
        url = reverse("core:cash-drawer-reconcile", kwargs={"pk": drawer.pk})
        response = client.post(url, {"notes": "reconciled"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCashAdvanceHierarchy:
    def test_maker_checker_enforcement(self, cashier_user):
        """Standard staff cannot approve their own requests."""
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        advance = CashAdvance.objects.create(user=cashier_user, amount=100, status="pending", submitted_by=cashier_user)
        url = reverse("core:cash-advance-approve", kwargs={"pk": advance.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_manager_approval_success(self, cashier_user, manager_user):
        client = APIClient()
        client.force_authenticate(user=manager_user)
        advance = CashAdvance.objects.create(user=cashier_user, amount=100, status="pending", submitted_by=cashier_user)
        url = reverse("core:cash-advance-approve", kwargs={"pk": advance.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        advance.refresh_from_db()
        assert advance.status == "approved"


@pytest.mark.django_db
class TestCheckDepositWorkflow:
    def test_process_check_deposit(self, cashier_user):
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        # Create a member to deposit for
        member = User.objects.create_user(username="member1", email="m1@test.com", password="pwd")
        account = Account.objects.create(user=member, account_number="999888777", balance=10)

        url = reverse("core:check-deposit-process-check-deposit")
        front_img = io.BytesIO(b"front")
        front_img.name = "front.jpg"

        data = {"member_id": member.id, "amount": 200.0, "bank_name": "Test Bank", "front_image": front_img}
        response = client.post(url, data, format="multipart")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "pending"
        assert CheckDeposit.objects.filter(account=account).exists()

    def test_approve_check_deposit_credits_account(self, manager_user, cashier_user):
        client = APIClient()
        client.force_authenticate(user=manager_user)
        member = User.objects.create_user(username="member2", email="m2@test.com", password="pwd")
        account = Account.objects.create(user=member, account_number="111222333", balance=50)
        check = CheckDeposit.objects.create(account=account, amount=100, status="pending", submitted_by=cashier_user)

        url = reverse("core:check-deposit-approve", kwargs={"pk": check.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        account.refresh_from_db()
        assert account.balance == 150
