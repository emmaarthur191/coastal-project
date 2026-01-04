from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

User = get_user_model()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    return User.objects.create_user(
        email="testauth@example.com",
        username="testauth",
        password="securepassword123",
        phone_number="+233200000000",
        role="customer",
    )


@pytest.mark.django_db
class TestAuthIntegration:
    """Integration tests for the full authentication flow."""

    def test_complete_authentication_workflow(self, test_user, settings):
        settings.DEBUG = True
        settings.SECURE_SSL_REDIRECT = False
        client = APIClient()

        # 1. Login
        login_url = reverse("login")
        print(f"Login URL: {login_url}")
        login_data = {"email": test_user.email, "password": "securepassword123"}
        response = client.post(login_url, login_data, follow=True)
        print(f"Login Response: {response.status_code}, URL: {response.url if hasattr(response, 'url') else 'N/A'}")
        assert response.status_code == status.HTTP_200_OK
        assert "access" in client.cookies
        assert "refresh" in client.cookies

        # 2. Check Auth (Success)
        check_url = reverse("auth-check")
        response = client.get(check_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["authenticated"] is True
        assert response.data["user"]["email"] == test_user.email

        # 3. OTP Send (Debug Mode should provide the OTP)
        # Note: We rely on settings.DEBUG being True for this to work in tests
        otp_send_url = reverse("send-otp")
        response = client.post(otp_send_url, {"phone_number": test_user.phone_number})
        assert response.status_code == status.HTTP_200_OK

        # In test environment, we might need to mock settings.DEBUG if it's False
        otp_code = response.data.get("debug_otp")
        if not otp_code:
            # Fallback for when DEBUG=False in test environment
            # We can mock the session or just ensure DEBUG is True for this test
            pytest.skip("DEBUG mode required for OTP integration test or mock needed")

        # 4. OTP Verify
        otp_verify_url = reverse("verify-otp")
        response = client.post(
            otp_verify_url,
            {"phone_number": test_user.phone_number, "otp_code": otp_code, "verification_type": "2fa_setup"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["verified"] is True

        # 5. Logout
        logout_url = reverse("logout")
        # We need to send refresh token for blacklisting if possible,
        # but the view also reads from cookies
        response = client.post(logout_url)
        print(f"Logout Response: {response.status_code}")
        assert response.status_code == status.HTTP_200_OK

        # 6. Check Auth (Failure)
        response = client.get(check_url)
        print(f"Check Auth (Failure) Response: {response.status_code}, Data: {response.data}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["authenticated"] is False
