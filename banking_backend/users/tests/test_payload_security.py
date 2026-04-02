from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from users.models import UserActivity, UserInvitation

User = get_user_model()


@pytest.mark.django_db
class TestPayloadSecurity:
    """Consolidated security tests for payload and logic hardening."""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def admin_user(self):
        return User.objects.create_superuser(
            email="admin@coastal.com", username="admin", password="StrongPassword123!", role="admin", is_approved=True
        )

    @pytest.fixture
    def customer_user(self):
        return User.objects.create_user(
            email="customer1@gmail.com",
            username="customer1",
            password="StrongPassword123!",
            role="customer",
            is_approved=True,
        )

    @pytest.fixture
    def cashier_user(self):
        return User.objects.create_user(
            email="cashier1@coastal.com",
            username="cashier1",
            password="StrongPassword123!",
            role="cashier",
            is_approved=True,
        )

    # --- Staff Invitation Flow Tests ---

    def test_create_staff_invitation_flow(self, api_client, admin_user):
        """Verify that creating staff user generates an invitation and remains inactive."""
        api_client.force_authenticate(user=admin_user)
        url = reverse("users:create-staff")
        data = {
            "email": "newstaff@coastal.com",
            "first_name": "New",
            "last_name": "Staff",
            "role": "cashier",
            "phone": "+233244123456",
        }

        with patch("users.services.SendexaService.send_sms", return_value=(True, {})):
            response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED

        # Verify user is created but INACTIVE
        new_user = User.objects.get(email="newstaff@coastal.com")
        assert not new_user.is_active

        # Verify invitation was created
        invitation = UserInvitation.objects.get(user=new_user)
        assert invitation.token is not None
        assert not invitation.is_used

    def test_verify_staff_invitation_success(self, api_client):
        """Verify that staff can activate account using a valid invitation token."""
        # Setup inactive user with invitation
        user = User.objects.create_user(
            email="inactive@coastal.com", username="inactive", password="TempPassword123!", is_active=False
        )
        invitation = UserInvitation.create_for_user(user)

        url = reverse("users:staff-enroll")
        data = {
            "token": invitation.token,
            "password": "NewStrongPassword@2026",
            "password_confirm": "NewStrongPassword@2026",
        }

        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK

        # Verify user is now active
        user.refresh_from_db()
        assert user.is_active
        assert user.check_password("NewStrongPassword@2026")

        # Verify invitation is marked as used
        invitation.refresh_from_db()
        assert invitation.is_used

    def test_verify_staff_invitation_expired(self, api_client):
        """Verify that expired invitation tokens are rejected."""
        user = User.objects.create_user(
            email="expired@coastal.com", username="expired", password="TempPassword123!", is_active=False
        )
        invitation = UserInvitation.create_for_user(user)
        invitation.expires_at = timezone.now() - timedelta(hours=1)
        invitation.save()

        url = reverse("users:staff-enroll")
        data = {
            "token": invitation.token,
            "password": "NewStrongPassword@2026",
            "password_confirm": "NewStrongPassword@2026",
        }

        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "expired" in str(response.data)

    # --- Messaging IDOR Tests ---

    def test_messaging_idor_customer_to_customer(self, api_client, customer_user):
        """Verify that customers cannot initiate threads with other customers."""
        another_customer = User.objects.create_user(
            email="victim@gmail.com", username="victim", password="Password123!", role="customer"
        )

        api_client.force_authenticate(user=customer_user)
        url = reverse("core:message-thread-list")
        data = {"subject": "Unauthorized Chat", "participant_ids": [customer_user.id, another_customer.id]}

        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Customers cannot initiate direct threads with other customers" in str(response.data)

    def test_messaging_legitimate_customer_to_staff(self, api_client, customer_user, cashier_user):
        """Verify that customers CAN initiate threads with staff."""
        api_client.force_authenticate(user=customer_user)
        url = reverse("core:message-thread-list")
        data = {"subject": "Support Request", "participant_ids": [customer_user.id, cashier_user.id]}

        response = api_client.post(url, data)
        print("MESSAGING ERROR:", response.data)
        assert response.status_code == status.HTTP_201_CREATED

    # --- Payload Anomaly Logging Tests ---

    def test_payload_anomaly_logging(self, api_client, customer_user):
        """Verify that an unauthorized attempt (IDOR) is logged in UserActivity."""
        another_customer = User.objects.create_user(
            email="victim2@gmail.com", username="victim2", password="Password123!", role="customer"
        )

        api_client.force_authenticate(user=customer_user)
        url = reverse("core:message-thread-list")
        data = {"subject": "Anomaly Test", "participant_ids": [customer_user.id, another_customer.id]}

        # Trigger IDOR
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Verify it exists in database
        activity = UserActivity.objects.filter(action="payload_anomaly").first()
        assert activity is not None
        assert "Unauthorized customer-to-customer thread attempt" in activity.details["message"]
