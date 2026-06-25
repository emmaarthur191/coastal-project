import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import User, UserInvitation, OTPVerification
from core.models import Account, Transaction
from decimal import Decimal
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
class TestUsersViewsCoverage:
    """Targeted tests to cover remaining branches in users/views.py."""

    @pytest.fixture
    def admin_user(self):
        return User.objects.create_superuser(
            email="admin@coastal.com", username="admin", password="Password123!", role="admin"
        )

    @pytest.fixture
    def manager_user(self):
        return User.objects.create_user(
            email="manager@coastal.com", username="manager", password="Password123!", role="manager", is_approved=True
        )

    @pytest.fixture
    def customer_user(self):
        return User.objects.create_user(
            email="customer@coastal.com", username="customer", password="Password123!", role="customer", is_approved=True
        )

    def test_create_staff_permission_denied(self, api_client, customer_user):
        """Line 51: Permission check for non-manager/admin."""
        api_client.force_authenticate(user=customer_user)
        url = reverse("users:create-staff")
        response = api_client.post(url, {"email": "staff@test.com", "role": "cashier"})
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data["code"] == "PERMISSION_DENIED"

    def test_create_staff_invalid_role(self, api_client, admin_user):
        """Line 73: Invalid role requested."""
        api_client.force_authenticate(user=admin_user)
        url = reverse("users:create-staff")
        response = api_client.post(url, {"email": "staff@test.com", "role": "ninja", "phone": "123"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "INVALID_ROLE"

    def test_create_staff_missing_phone(self, api_client, admin_user):
        """Line 90: Phone number required."""
        api_client.force_authenticate(user=admin_user)
        url = reverse("users:create-staff")
        response = api_client.post(url, {"email": "staff@test.com", "role": "cashier"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "REQUIRED_FIELD_MISSING"

    @patch("users.serializers.StaffCreationSerializer.save")
    def test_create_staff_exception(self, mock_save, api_client, admin_user):
        """Line 130: Generic exception handling."""
        mock_save.side_effect = Exception("Database error")
        api_client.force_authenticate(user=admin_user)
        url = reverse("users:create-staff")
        response = api_client.post(url, {"email": "staff@test.com", "role": "cashier", "phone": "+123456789"})
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response.data["code"] == "STAFF_REGISTRATION_FAILED"

    def test_verify_invitation_invalid_token(self, api_client):
        """Line 191: Invitation not found."""
        url = reverse("users:staff-enroll")
        response = api_client.post(url, {"token": "nonexistent", "password": "Password123!", "password_confirm": "Password123!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Invalid invitation token."

    def test_verify_invitation_mismatched_passwords(self, api_client):
        """Line 162: Password mismatch."""
        url = reverse("users:staff-enroll")
        response = api_client.post(url, {"token": "some-token", "password": "Password123!", "password_confirm": "Other123!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Passwords do not match."

    def test_verify_invitation_weak_password(self, api_client):
        """Line 167: Weak password."""
        url = reverse("users:staff-enroll")
        response = api_client.post(url, {"token": "some-token", "password": "weak", "password_confirm": "weak"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_change_password_wrong_old(self, api_client, customer_user):
        """Line 211: Wrong old password."""
        api_client.force_authenticate(user=customer_user)
        url = reverse("users:change-password")
        response = api_client.post(url, {"old_password": "WrongPassword123!", "new_password": "NewPassword123!", "confirm_password": "NewPassword123!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "old_password" in response.data

    @patch("users.security.SecurityService.is_rate_limited")
    def test_login_rate_limited(self, mock_rate, api_client):
        """Line 248: Rate limited login."""
        mock_rate.return_value = True
        url = reverse("users:login")
        response = api_client.post(url, {"email": "any@test.com", "password": "pwd"})
        assert response.status_code == 429
        assert response.data["code"] == "RATE_LIMITED"

    def test_login_account_locked(self, api_client, customer_user):
        """Line 268: Account locked check."""
        from django.utils import timezone
        import datetime
        customer_user.locked_until = timezone.now() + datetime.timedelta(minutes=15)
        customer_user.save()
        
        url = reverse("users:login")
        response = api_client.post(url, {"email": "customer@coastal.com", "password": "Password123!"})
        assert response.status_code == 403
        assert response.data["code"] == "ACCOUNT_LOCKED"

    def test_login_serializer_invalid_with_user(self, api_client, customer_user):
        """Line 287: Serializer invalid but user exists (trigger handle_failed_login)."""
        url = reverse("users:login")
        # Empty password should fail the serializer but email is present for lookup_user
        response = api_client.post(url, {"email": "customer@coastal.com", "password": ""})
        assert response.status_code == 400

    def test_auth_check_failure(self, api_client):
        """Line 471: Auth check silent failure."""
        with patch("users.authentication.JWTCookieAuthentication.authenticate", side_effect=Exception("SNAFU")):
            url = reverse("users:auth-check")
            response = api_client.get(url)
            assert response.status_code == 200
            assert response.data["authenticated"] is False

    def test_member_dashboard_empty(self, api_client, customer_user):
        """Dashboard with no accounts/transactions."""
        api_client.force_authenticate(user=customer_user)
        url = reverse("users:member-dashboard")
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data["total_balance"] == "0.00"

    def test_send_otp_spam_prevention(self, api_client, customer_user):
        """Line 578: OTP spam cooldown."""
        from core.utils.field_encryption import hash_field
        from django.utils import timezone
        import datetime
        phone = "+1234567890"
        OTPVerification.objects.create(
            phone_number_hash=hash_field(phone),
            is_verified=False,
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        api_client.force_authenticate(user=customer_user)
        url = reverse("users:send-otp")
        response = api_client.post(url, {"phone_number": phone})
        assert response.status_code == 429
        assert "wait 60 seconds" in response.data["error"]

    def test_staff_ids_permission_denied(self, api_client, customer_user):
        """Line 747: Staff IDs permission check."""
        api_client.force_authenticate(user=customer_user)
        url = reverse("users:staff-ids")
        response = api_client.get(url)
        assert response.status_code == 403
        assert response.data["code"] == "PERMISSION_DENIED"
