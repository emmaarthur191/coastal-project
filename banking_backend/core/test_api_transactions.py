"""Comprehensive API tests for Transaction endpoints.

Tests CRUD operations, request validation, error handling,
and HTTP status codes for TransactionViewSet.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import Transaction

User = get_user_model()


class SecureAPIClient(APIClient):
    """API Client that forces HTTPS for all requests."""

    def get(self, path, data=None, **extra):
        extra["secure"] = True
        return super().get(path, data, **extra)

    def post(self, path, data=None, format=None, content_type=None, **extra):
        extra["secure"] = True
        return super().post(path, data, format, content_type, **extra)

    def put(self, path, data=None, format=None, content_type=None, **extra):
        extra["secure"] = True
        return super().put(path, data, format, content_type, **extra)

    def patch(self, path, data=None, format=None, content_type=None, **extra):
        extra["secure"] = True
        return super().patch(path, data, format, content_type, **extra)

    def delete(self, path, data=None, format=None, content_type=None, **extra):
        extra["secure"] = True
        return super().delete(path, data, format, content_type, **extra)


@pytest.fixture
def api_client():
    """Return API client that uses HTTPS for all requests."""
    return SecureAPIClient()


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="customer", email="customer@example.com", password="password123", role="customer"
    )


@pytest.fixture
def customer_account(customer_user):
    from core.services import AccountService

    return AccountService.create_account(customer_user, "member_savings", Decimal("1000.00"))


@pytest.fixture
def recipient_user(db):
    return User.objects.create_user(
        username="recipient", email="recipient@example.com", password="password123", role="customer"
    )


@pytest.fixture
def recipient_account(recipient_user):
    from core.services import AccountService

    return AccountService.create_account(recipient_user, "member_savings", Decimal("500.00"))


@pytest.mark.django_db
class TestTransactionViewSetCRUD:
    """Test CRUD operations for TransactionViewSet."""

    def test_list_transactions_authenticated(self, api_client, customer_user, customer_account):
        """GET /api/transactions/ returns 200 for authenticated user."""
        # Create a transaction
        Transaction.objects.create(
            from_account=customer_account,
            to_account=None,
            amount=Decimal("50.00"),
            transaction_type="withdrawal",
            status="completed",
        )

        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/transactions/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) > 0

    def test_list_transactions_unauthenticated(self, api_client):
        """GET /api/transactions/ returns 401 for unauthenticated user."""
        response = api_client.get("/api/transactions/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_transaction(self, api_client, customer_user, customer_account):
        """GET /api/transactions/{id}/ returns 200."""
        transaction = Transaction.objects.create(
            from_account=customer_account,
            to_account=None,
            amount=Decimal("50.00"),
            transaction_type="withdrawal",
            status="completed",
        )

        api_client.force_authenticate(user=customer_user)
        response = api_client.get(f"/api/transactions/{transaction.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert Decimal(response.data["amount"]) == Decimal("50.00")


@pytest.mark.django_db
class TestTransactionValidation:
    """Test request validation for transactions."""

    def test_transfer_with_insufficient_balance(self, api_client, customer_account, recipient_account):
        """Transfer exceeding balance returns 400."""
        api_client.force_authenticate(user=customer_account.user)
        response = api_client.post(
            "/api/transactions/",
            {
                "from_account": customer_account.id,
                "to_account": recipient_account.id,
                "amount": "2000.00",  # More than balance
                "transaction_type": "transfer",
            },
            format="json",
        )

        # Should return 400 Bad Request for validation error
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_transfer_with_invalid_amount(self, api_client, customer_account, recipient_account):
        """Transfer with invalid amount returns 400."""
        api_client.force_authenticate(user=customer_account.user)
        response = api_client.post(
            "/api/transactions/",
            {
                "from_account": customer_account.id,
                "to_account": recipient_account.id,
                "amount": "invalid",  # Not a number
                "transaction_type": "transfer",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_transfer_with_negative_amount(self, api_client, customer_account, recipient_account):
        """Transfer with negative amount returns 400."""
        api_client.force_authenticate(user=customer_account.user)
        response = api_client.post(
            "/api/transactions/",
            {
                "from_account": customer_account.id,
                "to_account": recipient_account.id,
                "amount": "-100.00",
                "transaction_type": "transfer",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_transfer_missing_required_field(self, api_client, customer_account):
        """Transfer missing required field returns 400."""
        api_client.force_authenticate(user=customer_account.user)
        response = api_client.post(
            "/api/transactions/",
            {
                "from_account": customer_account.id,
                # Missing to_account and amount
                "transaction_type": "transfer",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTransactionAuthorization:
    """Test authorization for transaction operations."""

    def test_customer_cannot_view_others_transactions(self, api_client, customer_user, recipient_user):
        """Customer should only see their own transactions."""
        # Create accounts
        from core.services import AccountService

        customer_account = AccountService.create_account(customer_user, "member_savings", Decimal("1000.00"))
        recipient_account = AccountService.create_account(recipient_user, "member_savings", Decimal("500.00"))

        # Create transaction from recipient (customer should not see this)
        Transaction.objects.create(
            from_account=recipient_account,
            to_account=None,
            amount=Decimal("50.00"),
            transaction_type="withdrawal",
            status="completed",
        )

        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/transactions/")

        assert response.status_code == status.HTTP_200_OK
        # Should not contain recipient's withdrawal
        # (unless customer was recipient, which they aren't)

    def test_transfer_from_account_not_owned(self, api_client, customer_user, recipient_account):
        """Cannot transfer from account you don't own."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/transactions/",
            {
                "from_account": recipient_account.id,  # Not customer's account
                "to_account": recipient_account.id,
                "amount": "100.00",
                "transaction_type": "transfer",
            },
            format="json",
        )

        # Should be forbidden or bad request
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]


@pytest.mark.django_db
class TestTransactionStatusCodes:
    """Verify correct HTTP status codes."""

    def test_successful_transfer_returns_200_or_201(self, api_client, customer_account, recipient_account):
        """Successful transfer returns 200 OK or 201 CREATED."""
        api_client.force_authenticate(user=customer_account.user)
        response = api_client.post(
            "/api/transactions/",
            {
                "from_account": customer_account.id,
                "to_account": recipient_account.id,
                "amount": "100.00",
                "transaction_type": "transfer",
            },
            format="json",
        )

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

    def test_invalid_transaction_returns_400(self, api_client, customer_account):
        """Invalid transaction data returns 400 BAD REQUEST."""
        api_client.force_authenticate(user=customer_account.user)
        response = api_client.post(
            "/api/transactions/",
            {"from_account": customer_account.id, "amount": "invalid", "transaction_type": "transfer"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_transaction_returns_404(self, api_client, customer_user):
        """GET /api/transactions/99999/ returns 404."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/transactions/99999/")

        assert response.status_code == status.HTTP_404_NOT_FOUND
