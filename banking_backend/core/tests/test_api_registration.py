import io
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.accounts import AccountOpeningRequest
from core.models.operational import ClientRegistration
from core.utils.field_encryption import hash_field

User = get_user_model()


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff_reg", email="staff_reg@coastal.com", password="password123", role="staff", is_staff=True
    )


@pytest.fixture
def staff_client(staff_user):
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.mark.django_db
class TestRegistrationFlow:
    """Test the client onboarding and OTP verification flow."""

    def test_client_onboarding_submission_success(self, staff_client):
        """Verify staff can submit a new client registration with files."""
        url = reverse("core:client-registration-submit-registration")

        # Mock files
        passport_pic = io.BytesIO(b"fake_image_data")
        passport_pic.name = "passport.jpg"
        id_doc = io.BytesIO(b"fake_id_data")
        id_doc.name = "id_card.pdf"

        data = {
            "firstName": "John",
            "lastName": "Doe",
            "email": "doe@example.com",
            "phoneNumber": "+233201234567",
            "idType": "ghana_card",
            "idNumber": "GHA-123456789-0",
            "accountType": "savings",
            "passportPicture": passport_pic,
            "idDocument": id_doc,
            "next_of_kin_data": '{"name": "Jane Doe", "relationship": "Spouse"}',
        }

        response = staff_client.post(url, data, format="multipart")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "registration_id" in response.data

        # Verify database record
        reg = ClientRegistration.objects.get(registration_id=response.data["registration_id"])
        assert reg.first_name == "John"
        assert reg.status == "pending_verification"

    def test_registration_missing_required_fields(self, staff_client):
        """Ensure submission fails if core identifiers are missing."""
        url = reverse("core:client-registration-submit-registration")
        data = {"email": "incomplete@test.com"}
        response = staff_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    @patch("users.services.SendexaService.send_sms", return_value=(True, "Mock sent"))
    def test_send_and_verify_otp_flow(self, mock_sms, staff_client, staff_user):
        """Verify the full OTP lifecycle from send to verification."""
        # 1. Setup registration
        reg = ClientRegistration.objects.create(
            registration_id="REG-TEST123",
            submitted_by=staff_user,
            first_name="Test",
            last_name="User",
            phone_number="+233201234567",
            status="pending_verification",
        )

        # 2. Request OTP
        send_url = reverse("core:client-registration-send-otp")
        response = staff_client.post(send_url, {"email": reg.registration_id}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert mock_sms.called

        # 3. Get OTP from session (mocking the internal backend behavior)
        session = staff_client.session
        otp_code = session.get(f"reg_otp_{reg.registration_id}")
        assert otp_code is not None

        # 4. Verify OTP
        verify_url = reverse("core:client-registration-verify-otp")
        verify_data = {"email": reg.registration_id, "otp": otp_code}
        response = staff_client.post(verify_url, verify_data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "verified" in response.data["message"].lower()

        # 5. Check bridge creations
        reg.refresh_from_db()
        assert reg.status == "under_review"
        assert AccountOpeningRequest.objects.filter(phone_number_hash=hash_field(reg.phone_number)).exists()

    def test_otp_cooldown_enforcement(self, staff_client, staff_user):
        """Ensure OTP cannot be requested twice within 60 seconds."""
        reg = ClientRegistration.objects.create(
            registration_id="REG-COOLDOWN",
            submitted_by=staff_user,
            first_name="Cooldown",
            last_name="Test",
            phone_number="+233201234567",
        )
        url = reverse("core:client-registration-send-otp")

        # First request
        with patch("users.services.SendexaService.send_sms", return_value=(True, "")):
            staff_client.post(url, {"email": reg.registration_id}, format="json")

        # Second request (too soon)
        response = staff_client.post(url, {"email": reg.registration_id}, format="json")
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "60 seconds" in response.data["error"]
