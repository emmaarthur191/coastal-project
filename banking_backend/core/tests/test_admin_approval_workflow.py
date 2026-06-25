import io
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import override_settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
import pytest
from django.http import FileResponse
from unittest.mock import MagicMock
from core.models.accounts import AccountOpeningRequest, Account
from core.utils.field_encryption import hash_field

User = get_user_model()

@pytest.fixture
def manager_user(db):
    return User.objects.create_superuser(
        username="manager_test", 
        email="manager@coastal.com", 
        password="password123", 
        role="manager"
    )

@pytest.fixture
def manager_client(manager_user):
    client = APIClient()
    client.force_authenticate(user=manager_user)
    return client

@pytest.fixture
def client_user_unapproved(db):
    return User.objects.create_user(
        username="client_unapproved",
        email="pending@example.com",
        password="password123",
        role="customer",
        is_approved=False
    )

@pytest.mark.django_db(transaction=True)
class TestAdminApprovalWorkflow:
    """Test the new Admin-Approved Paper-First workflow."""

    def test_client_self_registration_creates_pending_request(self):
        """Verify client registration now directly creates a pending request (No OTP)."""
        client = APIClient()
        # Resolve the URL directly
        url = reverse("core:account-opening-submit-request")
        
        # Mock files
        passport_pic = io.BytesIO(b"fake_image_data")
        passport_pic.name = "passport.jpg"
        id_doc = io.BytesIO(b"fake_id_data")
        id_doc.name = "id_card.pdf"

        data = {
            "first_name": "Testing",
            "last_name": "Approval",
            "email": "approval@test.com",
            "phone_number": "+233501234567",
            "id_type": "ghana_card",
            "id_number": "GHA-999-0",
            "account_type": "daily_susu",
            "photo": passport_pic,
            "id_card_front": id_doc,
            "next_of_kin_data": "[]"
        }

        response = client.post(url, data, format="multipart")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        
        # Verify AccountOpeningRequest creation using a fresh query
        from core.utils.field_encryption import hash_field
        request_exists = AccountOpeningRequest.objects.filter(
            phone_number_hash=hash_field("+233501234567"),
            status="pending"
        ).first()
        assert request_exists is not None

    @override_settings(LOGIN_RATE_LIMIT_MAX=1000)
    def test_login_blocked_for_unapproved_user(self, db):
        """Verify users cannot log in unless is_approved=True."""
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        email = f"unapproved_{unique_id}@example.com"
        username = f"user_{unique_id}"
        
        User.objects.create_user(
            username=username,
            email=email,
            password="password123",
            role="customer",
            is_approved=False
        )
        
        client = APIClient()
        client.logout()
        client.cookies.clear()
        cache.clear() # Reset any accumlated rate limits
        
        url = reverse("users:login") 
        data = {
            "email": email,
            "password": "password123"
        }
        
        # Use a unique IP to ensure zero rate limit interference
        response = client.post(url, data, format="json", REMOTE_ADDR="1.2.3.99")
        assert response.status_code == status.HTTP_403_FORBIDDEN, f"Unexpected status {response.status_code} for unapproved user. Data: {response.data}"
        assert "pending" in response.data["detail"].lower()
        

    def test_admin_approve_and_finalize_logic(self, manager_client, manager_user):
        """Test the manual approval logic (simulating the Admin Action)."""
        # 1. Create a fully populated pending request to satisfy PDF generation
        opening_request = AccountOpeningRequest.objects.create(
            first_name="Manual",
            last_name="Test",
            email="manual@test.com",
            phone_number="+233240001111",
            account_type="shares",
            initial_deposit=100.0,
            id_type="ghana_card",
            id_number="GHA-123456789-0",
            digital_address="GA-123-4567",
            location="Accra",
            status="pending"
        )

        # 2. Simulate calling the admin action logic
        from core.admin import AccountOpeningRequestAdmin
        from django.contrib.admin.sites import AdminSite
        
        ma = AccountOpeningRequestAdmin(AccountOpeningRequest, AdminSite())
        
        mock_request = MagicMock()
        mock_request.user = manager_user
        
        # Call the action
        queryset = AccountOpeningRequest.objects.filter(id=opening_request.id)
        response = ma.approve_finalize_and_print(mock_request, queryset)
        
        # 3. Verify results by fetching a FRESH instance from DB
        updated_request = AccountOpeningRequest.objects.get(id=opening_request.id)
        assert updated_request.status == "completed"
        assert updated_request.created_account is not None
        
        # Check user creation
        new_user = User.objects.get(email="manual@test.com")
        assert new_user.is_approved is True
        assert new_user.role == "customer"
        
        # Verify account creation
        assert updated_request.created_account.user == new_user
        assert updated_request.created_account.account_type == "shares"
        
        # Check PDF response
        from django.http import FileResponse
        assert isinstance(response, FileResponse)

    def test_staff_approval_workflow(self, manager_client, manager_user):
        """Verify staff accounts are also gated by is_approved."""
        # 1. Create unapproved staff
        staff = User.objects.create_user(
            username="new_staff",
            email="new_staff@coastal.com",
            password="password123",
            role="cashier",
            is_staff=True,
            is_approved=False,
            is_active=True
        )
        # Ensure name exists for PDF
        staff.first_name = "New"
        staff.last_name = "Staff"
        staff.save()
        
        # 2. Simulate calling the staff approval action
        from users.admin import UserAdmin
        from django.contrib.admin.sites import AdminSite
        
        ua = UserAdmin(User, AdminSite())
        
        mock_request = MagicMock()
        mock_request.user = manager_user
        
        # Call the action
        queryset = User.objects.filter(id=staff.id)
        response = ua.approve_and_print_staff_letter(mock_request, queryset)
        
        # 3. Verify results by fetching a FRESH instance from DB
        updated_staff = User.objects.get(id=staff.id)
        assert updated_staff.is_approved is True
        assert updated_staff.is_active is True
        assert updated_staff.staff_id.startswith("CA")
        
        # 4. Check PDF response
        from django.http import FileResponse
        assert isinstance(response, FileResponse)
