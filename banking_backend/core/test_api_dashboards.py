import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import Account, Report, ReportTemplate, SystemHealth, Transaction

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff_dashboard",
        email="staff_dashboard@example.com",
        password="password123",
        role="staff",
        is_staff=True,
    )


@pytest.fixture
def dashboard_data(db, staff_user):
    # Create some health data
    SystemHealth.objects.create(
        service_name="api",
        status="healthy",
        response_time_ms=100,
        details={"cpu_usage": 20.0, "memory_usage": 50.0, "database_connected": True},
    )

    # Create some transactions
    account = Account.objects.create(user=staff_user, account_number="1234567890", balance=1000, account_type="savings")

    Transaction.objects.create(
        from_account=account, amount=100, transaction_type="deposit", status="completed", timestamp=timezone.now()
    )

    # Create report data
    template = ReportTemplate.objects.create(name="Test Template", report_type="transactions", is_active=True)

    Report.objects.create(
        template=template,
        title="Test Report",
        report_type="transactions",
        format="pdf",
        status="completed",
        generated_by=staff_user,
        created_at=timezone.now() - datetime.timedelta(minutes=5),
        completed_at=timezone.now(),
    )


@pytest.mark.django_db
class TestDashboardAPI:
    def test_performance_dashboard_data(self, api_client, staff_user, dashboard_data):
        api_client.force_authenticate(user=staff_user)
        url = reverse("core:performance-dashboard")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert isinstance(data, dict)
        assert "performance_summary" in data
        assert "system_health" in data
        assert "active_alerts" in data

    def test_performance_metrics(self, api_client, staff_user, dashboard_data):
        api_client.force_authenticate(user=staff_user)
        url = reverse("core:performance-metrics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert any(item["name"] == "Avg Response Time" for item in response.data)

    def test_performance_volume(self, api_client, staff_user, dashboard_data):
        api_client.force_authenticate(user=staff_user)
        url = reverse("core:performance-volume")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        if len(response.data) > 0:
            assert "volume" in response.data[0]

    def test_performance_chart(self, api_client, staff_user, dashboard_data):
        api_client.force_authenticate(user=staff_user)
        url = reverse("core:performance-chart")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "labels" in response.data
        assert "datasets" in response.data

    def test_report_analytics(self, api_client, staff_user, dashboard_data):
        api_client.force_authenticate(user=staff_user)
        url = reverse("core:report-analytics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_reports"] >= 1
        assert "generation_stats" in response.data
        assert response.data["generation_stats"]["total_generated"] >= 1
