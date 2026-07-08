import io
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models.accounts import AccountOpeningRequest, Account, AccountClosureRequest
from django.utils import timezone

User = get_user_model()

@pytest.fixture
def manager_user(db):
    return User.objects.create_superuser(
        email="manager@coastal.com", 
        password="password123", 
        role="manager"
    )

@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        email="staff@coastal.com", 
        password="password123", 
        role="cashier",
        is_staff=True
    )

@pytest.fixture
def manager_client(manager_user):
    client = APIClient()
    client.force_authenticate(user=manager_user)
    return client

@pytest.fixture
def pending_opening(db):
    return AccountOpeningRequest.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        phone_number="+233240001111",
        account_type="daily_susu",
        id_type="ghana_card",
        id_number="GHA-123456789-0",
        digital_address="GA-123-4567",
        location="Accra",
        status="pending"
    )

@pytest.fixture
def pending_staff(db):
    user = User.objects.create_user(
        email="newstaff@coastal.com",
        password="password123",
        role="cashier",
        is_approved=False,
        is_active=True
    )
    # Set PII via properties to ensure encryption
    user.first_name = "Jane"
    user.last_name = "Staff"
    user.phone_number = "+233240002222"
    user.save()
    return user

@pytest.mark.django_db(transaction=True)
class TestManagerDashboardAPI:
    """Functional tests for the migrated Manager Dashboard actions."""

    def test_approve_account_opening_and_print(self, manager_client, pending_opening):
        """Verify account opening approval generates a PDF and creates a user."""
        url = reverse("core:account-opening-approve-and-print", kwargs={"pk": pending_opening.pk})
        response = manager_client.post(url, {"kyc_verified": True})

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        
        # Verify side effects
        pending_opening.refresh_from_db()
        assert pending_opening.status == "completed"
        assert pending_opening.created_account is not None
        
        # Verify user was created and approved
        new_user = User.objects.get(email=pending_opening.email)
        assert new_user.is_approved is True
        assert new_user.role == "customer"

    def test_approve_staff_and_print(self, manager_client, pending_staff):
        """Verify staff approval generates ID and returns PDF."""
        # Use the correct registered URL for StaffManagementViewSet
        url = f"/api/users/staff-management/{pending_staff.pk}/approve-and-print/"
        response = manager_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"

        pending_staff.refresh_from_db()
        assert pending_staff.is_approved is True
        assert pending_staff.is_active is True
        assert pending_staff.staff_id.startswith("CA")
        assert pending_staff.staff_number is not None

    def test_account_closure_approval_no_otp(self, manager_client, staff_user):
        """Verify account closure can be approved without OTP."""
        # 1. Setup account and closure request
        customer = User.objects.create_user(email="cust@test.com", password="pw", role="customer")
        account = Account.objects.create(user=customer, account_number="123456789", balance=0, initial_balance=0)
        
        closure_request = AccountClosureRequest.objects.create(
            account=account,
            status="pending",
            submitted_by=staff_user,
            final_balance=0
        )

        # 2. Approve via Manager
        url = reverse("core:account-closure-approve", kwargs={"pk": closure_request.pk})
        response = manager_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        
        closure_request.refresh_from_db()
        account.refresh_from_db()
        assert closure_request.status == "approved"
        assert account.is_active is False

    def test_account_closure_maker_checker_violation(self, manager_client, manager_user):
        """Verify a manager cannot approve their own closure request."""
        customer = User.objects.create_user(email="cust2@test.com", password="pw", role="customer")
        account = Account.objects.create(user=customer, account_number="987654321", balance=100)
        
        closure_request = AccountClosureRequest.objects.create(
            account=account,
            status="pending",
            submitted_by=manager_user, # Submitted by the same manager
            final_balance=100
        )

        url = reverse("core:account-closure-approve", kwargs={"pk": closure_request.pk})
        response = manager_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Maker-Checker Violation" in response.data["message"]
        
        closure_request.refresh_from_db()
        assert closure_request.status == "pending"
