import pytest
from conftest import TEST_PASSWORD
from django.urls import reverse
from django.utils import timezone
import datetime
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User, UserActivity

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="manager_test", email="manager@test.com", password=TEST_PASSWORD, role="manager", is_approved=True
    )

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="customer_test", email="customer@test.com", password=TEST_PASSWORD, role="customer", is_approved=True
    )

@pytest.mark.django_db
class TestSessionsAndDiagnostics:
    """Test suite for UserSessionsView, SessionTerminateView, and SecurityDiagnosticsView."""

    def test_user_sessions_manager_access(self, api_client, manager_user):
        """Manager can list sessions, receiving keys aligned with the serializer."""
        # Create a login activity to mock an active session
        UserActivity.objects.create(
            user=manager_user,
            action="login",
            ip_address="127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0)",
            details={"device": "PC", "os": "Windows 10", "location": "Localhost"}
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("users:user-sessions")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        
        session = response.data[0]
        # Assert structure matches UserSessionSerializer
        assert "id" in session
        assert "user_id" in session
        assert "email" in session
        assert "name" in session
        assert "role" in session
        assert "last_activity" in session
        assert "ip_address" in session
        assert "device" in session
        assert "location" in session

    def test_user_sessions_customer_blocked(self, api_client, customer_user):
        """Customers are forbidden from retrieving active user sessions."""
        api_client.force_authenticate(user=customer_user)
        url = reverse("users:user-sessions")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_terminate_session_success(self, api_client, manager_user, customer_user):
        """Manager can terminate user session, blacklisting tokens and logging force_logout."""
        activity = UserActivity.objects.create(
            user=customer_user,
            action="login",
            ip_address="127.0.0.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0)"
        )

        api_client.force_authenticate(user=manager_user)
        url = reverse("users:session-terminate", args=[activity.pk])
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "success"

        # Verify activity log contains force_logout
        assert UserActivity.objects.filter(
            user=customer_user,
            action="force_logout",
            details__original_login_id=activity.pk
        ).exists()

    def test_security_diagnostics_access(self, api_client, manager_user, customer_user):
        """Manager/Admin can view diagnostics, customer is blocked."""
        # Registered in core/urls.py, included under api/ prefix in config/urls.py
        url = "/api/health/diagnostics/"

        # 1. Customer blocked
        api_client.force_authenticate(user=customer_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # 2. Manager blocked (since only superuser allowed now per M-07)
        api_client.force_authenticate(user=manager_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # 3. Superuser allowed and gets correct fields
        manager_user.is_superuser = True
        manager_user.save()
        api_client.force_authenticate(user=manager_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "environment" in response.data
        assert "critical_checks" in response.data
        assert "field_encryption_key" in response.data["critical_checks"]
        assert "sendexa_api_key" in response.data["critical_checks"]
