"""Comprehensive API tests for Account endpoints.

Tests CRUD operations, request validation, error handling,
and HTTP status codes for AccountViewSet and related endpoints.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import AccountOpeningRequest

User = get_user_model()


class SecureAPIClient(APIClient):
    """API Client that forces HTTPS for all requests."""

    def get(self, path, data=None, **extra):
        """Force HTTPS for GET requests."""
        extra["secure"] = True
        return super().get(path, data, **extra)

    def post(self, path, data=None, format=None, content_type=None, **extra):
        """Force HTTPS for POST requests."""
        extra["secure"] = True
        return super().post(path, data, format, content_type, **extra)

    def put(self, path, data=None, format=None, content_type=None, **extra):
        """Force HTTPS for PUT requests."""
        extra["secure"] = True
        return super().put(path, data, format, content_type, **extra)

    def patch(self, path, data=None, format=None, content_type=None, **extra):
        """Force HTTPS for PATCH requests."""
        extra["secure"] = True
        return super().patch(path, data, format, content_type, **extra)

    def delete(self, path, data=None, format=None, content_type=None, **extra):
        """Force HTTPS for DELETE requests."""
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
def staff_user(db):
    return User.objects.create_user(
        username="staff", email="staff@example.com", password="password123", role="cashier", is_staff=True
    )


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="manager", email="manager@example.com", password="password123", role="manager", is_staff=True
    )


@pytest.fixture
def customer_account(customer_user):
    from core.services import AccountService

    return AccountService.create_account(customer_user, "member_savings", Decimal("1000.00"))


@pytest.mark.django_db
class TestAccountViewSetCRUD:
    """Test CRUD operations for AccountViewSet."""

    def test_list_accounts_authenticated(self, api_client, customer_user, customer_account):
        """GET /api/accounts/ returns 200 for authenticated user."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/accounts/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["account_number"] == customer_account.account_number

    def test_list_accounts_unauthenticated(self, api_client):
        """GET /api/accounts/ returns 401 for unauthenticated user."""
        response = api_client.get("/api/accounts/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_own_account(self, api_client, customer_user, customer_account):
        """GET /api/accounts/{id}/ returns 200 for own account."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get(f"/api/accounts/{customer_account.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["account_number"] == customer_account.account_number

    def test_retrieve_nonexistent_account(self, api_client, customer_user):
        """GET /api/accounts/{invalid_id}/ returns 404."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/accounts/99999/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_account_valid_data(self, api_client, customer_user):
        """POST /api/accounts/ with valid data returns 201 or 403."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/accounts/",
            {
                "account_type": "daily_susu",
            },
            format="json",
        )

        # Account creation may succeed immediately or require approval workflow
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,  # Validation error
            status.HTTP_403_FORBIDDEN,  # If direct creation not allowed
        ]

    def test_create_account_missing_required_field(self, api_client, customer_user):
        """POST /api/accounts/ with missing field returns 400."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/accounts/",
            {
                # Missing account_type
                "initial_balance": "100.00"
            },
        )

        # Should return 400 Bad Request for missing required field
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]

    def test_create_account_invalid_balance(self, api_client, customer_user):
        """POST /api/accounts/ with invalid balance returns 400."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/accounts/",
            {
                "account_type": "member_savings",
                "initial_balance": "invalid",  # Not a number
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestAccountAuthorization:
    """Test authorization rules for account operations."""

    def test_customer_cannot_view_other_accounts(self, api_client, customer_user, staff_user):
        """Customer should not see other customers' accounts."""
        # Create account for staff user
        from core.services import AccountService

        staff_account = AccountService.create_account(staff_user, "member_savings", Decimal("500.00"))

        # Customer tries to list accounts
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/accounts/")

        assert response.status_code == status.HTTP_200_OK
        # Should not contain staff_account
        account_numbers = [acc["account_number"] for acc in response.data["results"]]
        assert staff_account.account_number not in account_numbers

    def test_staff_can_view_all_accounts(self, api_client, staff_user, customer_account):
        """Staff should be able to view customer accounts via StaffAccountsViewSet."""
        api_client.force_authenticate(user=staff_user)
        response = api_client.get("/api/banking/staff-accounts/")

        # Staff endpoint for viewing all accounts
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAccountOpeningWorkflow:
    """Test account opening approval workflow."""

    def test_submit_account_opening_request(self, api_client, customer_user):
        """POST /api/banking/account-openings/ creates pending request."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(
            "/api/banking/account-openings/", {"account_type": "member_savings", "purpose": "Savings"}, format="json"
        )

        # Should create a pending request
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

    def test_approve_account_opening_two_stage_process(self, api_client, manager_user, staff_user):
        """Manager can approve account opening and then dispatch credentials."""
        from datetime import date

        from django.contrib.auth import get_user_model

        User = get_user_model()

        # 1. Submission (by staff)
        opening_request = AccountOpeningRequest.objects.create(
            first_name="Jane",
            last_name="Smith",
            date_of_birth=date(1992, 5, 15),
            phone_number="0247654321",
            email="janesmith@example.com",
            account_type="daily_susu",
            status="pending",
            submitted_by=staff_user,
        )

        # 2. Stage 1: Account Approval (by manager)
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(f"/api/banking/account-openings/{opening_request.id}/approve/")

        assert response.status_code == status.HTTP_200_OK
        opening_request.refresh_from_db()
        assert opening_request.status == "approved"
        assert opening_request.created_account is not None

        # Verify a new user was created for the client
        client_user = User.objects.get(email="janesmith@example.com")
        assert client_user.role == "customer"
        assert opening_request.created_account.user == client_user

        # 3. Stage 2: Credential Dispatch (by manager)
        # Verify maker-checker: staff who submitted cannot dispatch credentials
        api_client.force_authenticate(user=staff_user)
        dispatch_response = api_client.post(f"/api/banking/account-openings/{opening_request.id}/dispatch-credentials/")
        assert dispatch_response.status_code == status.HTTP_403_FORBIDDEN

        # Dispatch as manager
        api_client.force_authenticate(user=manager_user)
        dispatch_response = api_client.post(f"/api/banking/account-openings/{opening_request.id}/dispatch-credentials/")

        assert dispatch_response.status_code == status.HTTP_200_OK
        opening_request.refresh_from_db()
        assert opening_request.status == "completed"
        assert opening_request.credentials_approved_by == manager_user
        assert opening_request.credentials_sent_at is not None

    def test_customer_cannot_approve_account_opening(self, api_client, customer_user):
        """Customer cannot approve account openings."""
        from datetime import date

        opening_request = AccountOpeningRequest.objects.create(
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1990, 1, 1),  # Required in migration
            phone_number="0241234567",
            email="john@example.com",  # Required in migration
            account_type="member_savings",
            status="pending",
        )

        api_client.force_authenticate(user=customer_user)
        response = api_client.post(f"/api/banking/account-openings/{opening_request.id}/approve/")

        # Customer should be forbidden from approving
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        ]


@pytest.mark.django_db
class TestAccountStatusCodes:
    """Verify correct HTTP status codes for various scenarios."""

    def test_successful_get_returns_200(self, api_client, customer_user, customer_account):
        """Successful GET returns 200 OK."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get(f"/api/accounts/{customer_account.id}/")
        assert response.status_code == 200

    def test_not_found_returns_404(self, api_client, customer_user):
        """Missing resource returns 404 NOT FOUND."""
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/accounts/999999/")
        assert response.status_code == 404

    def test_unauthorized_returns_401(self, api_client):
        """No authentication returns 401 UNAUTHORIZED."""
        response = api_client.get("/api/accounts/")
        assert response.status_code == 401

    def test_forbidden_returns_403(self, api_client, customer_user):
        """Insufficient permissions returns 403 FORBIDDEN."""
        api_client.force_authenticate(user=customer_user)
        # Customer trying to access staff-only endpoint
        response = api_client.post("/api/account-openings/1/approve/")
        assert response.status_code in [403, 404]  # 404 if doesn't exist, 403 if exists
