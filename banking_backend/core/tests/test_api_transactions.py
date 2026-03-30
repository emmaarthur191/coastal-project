from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.accounts import Account
from core.models.transactions import Transaction

User = get_user_model()


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(username="cust1", email="cust1@test.com", password="password123", role="customer")


@pytest.fixture
def other_customer(db):
    return User.objects.create_user(username="cust2", email="cust2@test.com", password="password123", role="customer")


@pytest.fixture
def cashier_user(db):
    return User.objects.create_user(
        username="cashier1", email="cashier1@coastal.com", password="password123", role="cashier", is_staff=True
    )


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="manager1", email="manager1@coastal.com", password="password123", role="manager", is_staff=True
    )


@pytest.mark.django_db
class TestTransactionSecurity:
    def test_customer_cannot_transfer_from_others_account(self, customer_user, other_customer):
        """Verify IDOR protection on transaction creation."""
        client = APIClient()
        client.force_authenticate(user=customer_user)

        other_account = Account.objects.create(user=other_customer, account_number="OTHER-123", balance=1000)
        own_account = Account.objects.create(user=customer_user, account_number="OWN-123", balance=100)

        url = reverse("core:transaction-list")
        data = {
            "from_account": other_account.id,
            "to_account": own_account.id,
            "amount": 500.0,
            "transaction_type": "transfer",
            "description": "Stealing funds",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not own this account" in response.data["message"]


@pytest.mark.django_db
class TestCashierTransactionProcessing:
    def test_cashier_process_deposit_success(self, cashier_user, customer_user):
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        account = Account.objects.create(user=customer_user, account_number="DEP-001", balance=10)

        url = reverse("core:transaction-process")
        data = {"member_id": customer_user.id, "amount": 1000.0, "type": "deposit", "account_type": "daily_susu"}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        account.refresh_from_db()
        assert account.balance == 1010

    def test_cashier_process_withdrawal_insufficient_funds(self, cashier_user, customer_user):
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        account = Account.objects.create(user=customer_user, account_number="WITH-001", balance=50)

        url = reverse("core:transaction-process")
        data = {"member_id": customer_user.id, "amount": 500.0, "type": "withdrawal"}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Insufficient funds" in response.data["message"]


@pytest.mark.django_db
class TestTransactionSearch:
    def test_staff_search_transactions_filters(self, cashier_user, customer_user):
        client = APIClient()
        client.force_authenticate(user=cashier_user)
        acc = Account.objects.create(user=customer_user, account_number="ACC-SEARCH", balance=100)
        tx = Transaction.objects.create(
            to_account=acc,
            amount=123.45,
            transaction_type="deposit",
            status="completed",
            description="DEP-SEARCH-UNIQUE",
        )

        url = reverse("core:transaction-search")
        # Search by unique description fragment
        response = client.get(url, {"reference": "DEP-SEARCH-UNIQUE"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["amount"] == "123.45"


@pytest.mark.django_db
class TestMakerCheckerPhase2:
    def test_manager_approve_transaction(self, manager_user, customer_user):
        """Verify manager can approve a large transaction and trigger balance update."""
        client = APIClient()
        client.force_authenticate(user=manager_user)
        acc = Account.objects.create(user=customer_user, account_number="ACC-APPROVAL", balance=100)

        # 1. Create a transaction that requires approval (Amount >= 5,000.00)
        from core.services.transactions import TransactionService

        tx = TransactionService.create_transaction(
            from_account=None,
            to_account=acc,
            amount=6000,
            transaction_type="deposit",
            description="Large deposit needing approval",
        )

        # 2. Verify status is pending and balance is NOT updated yet
        assert tx.status == "pending_approval"
        acc.refresh_from_db()
        assert acc.balance == 100

        # 3. Manager approves
        url = reverse("core:transaction-approve", kwargs={"pk": tx.id})
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK

        # 4. Verify status is completed and balance is updated
        tx.refresh_from_db()
        assert tx.status == "completed"
        acc.refresh_from_db()
        assert acc.balance == 6100

    def test_manager_cannot_approve_own_transaction(self, manager_user):
        """Verify security constraint: managers cannot approve their own transactions."""
        client = APIClient()
        client.force_authenticate(user=manager_user)

        # 1. Create account for manager
        manager_acc = Account.objects.create(user=manager_user, account_number="MGR-ACC", balance=10000)

        # 2. Create a transaction from manager (e.g. transfer to someone)
        # Use a secondary customer as receiver
        other_user = User.objects.create_user(username="other", email="other@test.com")
        other_acc = Account.objects.create(user=other_user, account_number="OTHER-ACC", balance=0)

        from core.services.transactions import TransactionService

        tx = TransactionService.create_transaction(
            from_account=manager_acc, to_account=other_acc, amount=7000, transaction_type="transfer"
        )

        # 3. Manager attempts to approve their own transaction
        url = reverse("core:transaction-approve", kwargs={"pk": tx.id})
        response = client.post(url)

        # 4. Verify 400 Bad Request and error message
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Self-approval is not allowed" in response.data["message"]

        # 5. Verify balance is NOT moved
        manager_acc.refresh_from_db()
        assert manager_acc.balance == 10000
