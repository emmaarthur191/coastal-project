from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

User = get_user_model()


@pytest.mark.django_db
class TestUserRegistrationEdgeCases:
    def test_registration_duplicate_email(self):
        """Ensure registering with an already existing email fails."""
        client = APIClient()
        User.objects.create_user(
            email="existing@example.com",
            username="existinguser",
            password="testpassword123",
            phone_number="+233200001234",
        )
        url = reverse("users:register")
        data = {
            "email": "existing@example.com",
            "username": "newuser",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "phone_number": "+233200005678",
            "role": "customer",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in str(response.data).lower()

    def test_registration_malformed_phone(self):
        """Ensure invalid phone number format is blocked."""
        client = APIClient()
        url = reverse("users:register")
        data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "phone_number": "invalid_phone",
            "role": "customer",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "phone" in str(response.data).lower()

    def test_create_staff_unauthorized_role(self):
        """Verify adding an invalid staff role throws an error."""
        client = APIClient()
        admin_user = User.objects.create_superuser(
            email="admin@coastal.com", username="admin_test", password="password123"
        )
        url = reverse("users:create-staff")
        client.force_authenticate(user=admin_user)
        data = {
            "email": "invalidstaff@coastal.com",
            "role": "hacker",
            "phone": "+233244123456",
            "first_name": "Test",
            "last_name": "Staff",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "invalid role" in str(response.data).lower() or "role" in str(response.data).lower()


@pytest.mark.django_db
class TestPasswordResetFlow:
    def test_password_update_success(self):
        """Ensure password update workflow changes user credentials securely."""
        client = APIClient()
        customer_user = User.objects.create_user(
            email="customer@example.com", username="customer", password="password123", role="customer"
        )
        client.force_authenticate(user=customer_user)
        url = reverse("users:change-password")
        data = {
            "old_password": "password123",
            "new_password": "NewStrongPassword1!",
            "confirm_password": "NewStrongPassword1!",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Verify old password no longer works
        customer_user.refresh_from_db()
        assert not customer_user.check_password("password123")
        assert customer_user.check_password("NewStrongPassword1!")

    def test_password_update_mismatch(self):
        """Ensure password mismatch is caught."""
        client = APIClient()
        customer_user = User.objects.create_user(
            email="customer2@example.com", username="customer2", password="password123", role="customer"
        )
        client.force_authenticate(user=customer_user)
        url = reverse("users:change-password")
        data = {
            "old_password": "password123",
            "new_password": "NewStrongPassword1!",
            "confirm_password": "DifferentPassword2!",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProfileUpdateValidation:
    def test_partial_update_success(self):
        client = APIClient()
        customer_user = User.objects.create_user(
            email="customer3@example.com",
            username="customer3",
            password="password123",
            first_name="Old",
            role="customer",
        )
        url = reverse("users:user-detail")
        client.force_authenticate(user=customer_user)
        data = {"first_name": "UpdatedName"}
        response = client.patch(url, data, format="json")
        if response.status_code == 405:  # patch not allowed directly on some profile views
            response = client.put(url, data, format="json")
        assert response.status_code in [200, 204]


@pytest.mark.django_db
class TestUserManagement:
    def test_list_staff_permissions(self):
        """Verify only staff/admin can list staff members."""
        client = APIClient()
        customer = User.objects.create_user(username="cust", email="cust@test.com", role="customer")
        staff = User.objects.create_user(username="staff1", email="s1@test.com", role="cashier", is_staff=True)

        # Note: adjust the URL name if 'users:staff-list' is not the correct name
        try:
            url = reverse("users:staff-list")
        except:
            url = "/api/v1/users/staff/"  # fallback common path

        # 1. Customer blocked
        client.force_authenticate(user=customer)
        response = client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # 2. Staff allowed
        client.force_authenticate(user=staff)
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAuthentication:
    """Verify login and JWT token issuance."""

    def test_login_success(self):
        client = APIClient()
        User.objects.create_user(username="testuser", password="password123", email="test@auth.com")
        url = reverse("users:login")
        data = {"email": "test@auth.com", "password": "password123"}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["message"] == "Login successful"
        assert "user" in response.data

    def test_login_invalid_credentials(self):
        client = APIClient()
        User.objects.create_user(username="testuser", password="password123", email="test@auth.com")
        url = reverse("users:login")
        data = {"email": "test@auth.com", "password": "wrongpassword"}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestStaffCreationFlow:
    """Verify administrative staff creation."""

    def test_create_staff_success(self):
        client = APIClient()
        admin = User.objects.create_superuser(username="admin", password="password123", email="admin@test.com")
        client.force_authenticate(user=admin)
        url = reverse("users:create-staff")
        data = {
            "email": "newstaff@coastal.com",
            "username": "newstaff",
            "role": "cashier",
            "phone": "+233244999000",
            "first_name": "New",
            "last_name": "Staff",
        }
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username="newstaff", role="cashier").exists()
