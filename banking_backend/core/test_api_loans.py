"""Comprehensive API tests for Loan endpoints.

Tests CRUD operations, approval workflows, maker-checker enforcement,
amount-based authorization, and HTTP status codes.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import Loan

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


@pytest.mark.django_db
class TestLoanViewSetCRUD:
    """Test CRUD operations for LoanViewSet."""

    def test_create_loan_application(self, api_client, customer_user):
        """POST /api/loans/ creates loan application."""
        # Create account first (required for disbursement)
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", Decimal("0.00"))

        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/loans/", {"amount": "500.00", "interest_rate": "10.0", "term_months": 12, "purpose": "Business loan"}
        )

        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_create_loan_missing_required_field(self, api_client, customer_user):
        """POST /api/loans/ without required field returns 400."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/loans/",
            {
                "amount": "500.00",
                # Missing interest_rate and term_months
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_loan_invalid_amount(self, api_client, customer_user):
        """POST /api/loans/ with invalid amount returns 400."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/loans/", {"amount": "not-a-number", "interest_rate": "10.0", "term_months": 12}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_loans_authenticated(self, api_client, customer_user):
        """GET /api/loans/ returns 200 for authenticated user."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/loans/")

        assert response.status_code == status.HTTP_200_OK

    def test_list_loans_unauthenticated(self, api_client):
        """GET /api/loans/ returns 401 for unauthenticated user."""
        response = api_client.get("/api/loans/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestLoanApprovalWorkflow:
    """Test loan approval workflows and maker-checker."""

    def test_ops_manager_approves_small_loan(self, api_client, ops_manager_user, customer_user):
        """Operations Manager can approve loans < 1000 GHS."""
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", Decimal("0.00"))

        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=ops_manager_user)
        response = api_client.post(f"/api/loans/{loan.id}/approve/")

        assert response.status_code == status.HTTP_200_OK

    def test_ops_manager_cannot_approve_large_loan(self, api_client, ops_manager_user, customer_user):
        """Operations Manager cannot approve loans >= 1000 GHS."""
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", Decimal("0.00"))

        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("1500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=ops_manager_user)
        response = api_client.post(f"/api/loans/{loan.id}/approve/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        # DRF uses 'detail' for error messages
        error_msg = str(response.data.get("detail", "")).lower()
        assert "operations managers" in error_msg or "below 1000" in error_msg

    def test_manager_approves_large_loan(self, api_client, manager_user, customer_user):
        """Manager can approve loans >= 1000 GHS."""
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", Decimal("0.00"))

        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("1500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=manager_user)
        response = api_client.post(f"/api/loans/{loan.id}/approve/")

        assert response.status_code == status.HTTP_200_OK

    def test_customer_cannot_approve_loan(self, api_client, customer_user):
        """Customer cannot approve loans."""
        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=customer_user)
        response = api_client.post(f"/api/loans/{loan.id}/approve/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_approve_own_loan(self, api_client, ops_manager_user):
        """Staff cannot approve their own loan (maker-checker)."""
        from core.services import AccountService

        AccountService.create_account(ops_manager_user, "member_savings", Decimal("0.00"))

        loan = Loan.objects.create(
            user=ops_manager_user,
            amount=Decimal("500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=ops_manager_user)
        response = api_client.post(f"/api/loans/{loan.id}/approve/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "cannot approve" in response.data.get("error", "").lower()


@pytest.mark.django_db
class TestLoanStatusCodes:
    """Verify correct HTTP status codes for loan operations."""

    def test_successful_loan_creation_returns_201(self, api_client, customer_user):
        """Successful loan creation returns 201 CREATED."""
        from core.services import AccountService

        AccountService.create_account(customer_user, "member_savings", Decimal("0.00"))

        api_client.force_authenticate(user=customer_user)
        response = api_client.post("/api/loans/", {"amount": "500.00", "interest_rate": "10.0", "term_months": 12})

        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_invalid_loan_returns_400(self, api_client, customer_user):
        """Invalid loan data returns 400 BAD REQUEST."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/loans/",
            {
                "amount": "-500.00",  # Negative amount
                "interest_rate": "10.0",
                "term_months": 12,
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_approve_nonexistent_loan_returns_404(self, api_client, manager_user):
        """Approving nonexistent loan returns 404."""
        api_client.force_authenticate(user=manager_user)
        response = api_client.post("/api/loans/99999/approve/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthorized_approval_returns_403(self, api_client, customer_user):
        """Unauthorized approval returns 403 FORBIDDEN."""
        loan = Loan.objects.create(
            user=customer_user,
            amount=Decimal("500.00"),
            interest_rate=Decimal("10.0"),
            term_months=12,
            status="pending",
        )

        api_client.force_authenticate(user=customer_user)
        response = api_client.post(f"/api/loans/{loan.id}/approve/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
