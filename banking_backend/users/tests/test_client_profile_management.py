import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from conftest import TEST_PASSWORD

User = get_user_model()


@pytest.mark.django_db
class TestClientProfileManagement:
    """Verify that staff (managers, mobile bankers) can manage client profile details."""

    @pytest.fixture(autouse=True)
    def setup_users(self):
        # Create different roles
        self.manager = User.objects.create_user(
            email="manager@coastal.com",
            username="manager_user",
            password=TEST_PASSWORD,
            role="manager",
            is_approved=True,
            is_active=True,
        )
        self.mobile_banker = User.objects.create_user(
            email="banker@coastal.com",
            username="banker_user",
            password=TEST_PASSWORD,
            role="mobile_banker",
            is_approved=True,
            is_active=True,
        )
        self.customer = User.objects.create_user(
            email="customer@coastal.com",
            username="customer_user",
            password=TEST_PASSWORD,
            role="customer",
            is_approved=True,
            is_active=True,
            phone_number="+233244111222",
        )
        self.another_customer = User.objects.create_user(
            email="another@coastal.com",
            username="another_customer",
            password=TEST_PASSWORD,
            role="customer",
            is_approved=True,
            is_active=True,
        )

    def test_manager_can_retrieve_and_update_client_profile(self):
        """Verify that a manager can update a client's next of kin, photo, and phone number."""
        client = APIClient()
        client.force_authenticate(user=self.manager)

        url = reverse("users:client-detail", kwargs={"pk": self.customer.pk})

        # 1. Retrieve profile
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == self.customer.email

        # 2. Update profile
        next_of_kin_payload = {
            "name": "Kofi Mensah",
            "relationship": "Brother",
            "phone": "+233244999888",
            "address": "Accra, Ghana"
        }
        update_data = {
            "first_name": "UpdatedName",
            "phone_number": "+233244555666",
            "next_of_kin_data": next_of_kin_payload,
            "profile_photo": "dGVzdF9waG90b19kYXRh"  # base64 for "test_photo_data"
        }

        response = client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "UpdatedName"
        assert response.data["phone_number"] == "+233244555666"
        assert response.data["next_of_kin_data"] == next_of_kin_payload
        assert response.data["profile_photo"] == "dGVzdF9waG90b19kYXRh"

        # 3. Verify database encryption
        self.customer.refresh_from_db()
        assert self.customer.first_name == "UpdatedName"
        assert self.customer.phone_number == "+233244555666"
        assert self.customer.next_of_kin_data == next_of_kin_payload
        assert self.customer.profile_photo == "dGVzdF9waG90b19kYXRh"

        # Check raw DB fields are encrypted
        assert self.customer.phone_number_encrypted != "+233244555666"
        assert self.customer.next_of_kin_encrypted != ""
        assert "Kofi Mensah" not in self.customer.next_of_kin_encrypted

    def test_mobile_banker_can_update_client_profile(self):
        """Verify that a mobile banker can also update a client's profile."""
        client = APIClient()
        client.force_authenticate(user=self.mobile_banker)

        url = reverse("users:client-detail", kwargs={"pk": self.customer.pk})

        next_of_kin_payload = {
            "name": "Ama Serwaa",
            "relationship": "Sister",
            "phone": "+233244777888",
        }
        update_data = {
            "next_of_kin_data": next_of_kin_payload,
        }

        response = client.patch(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["next_of_kin_data"] == next_of_kin_payload

    def test_customer_cannot_update_other_client_profile(self):
        """Ensure customers cannot access this endpoint to manage other clients."""
        client = APIClient()
        client.force_authenticate(user=self.customer)

        url = reverse("users:client-detail", kwargs={"pk": self.another_customer.pk})

        response = client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        response = client.patch(url, {"first_name": "Hacked"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
