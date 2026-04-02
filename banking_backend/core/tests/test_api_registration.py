import io

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.operational import ClientRegistration

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
        assert reg.status == "pending_manager_approval"

    def test_registration_missing_required_fields(self, staff_client):
        """Ensure submission fails if core identifiers are missing."""
        url = reverse("core:client-registration-submit-registration")
        data = {"email": "incomplete@test.com"}
        response = staff_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
