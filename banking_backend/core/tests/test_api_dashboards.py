import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import SystemHealth, Transaction
from core.models.operational import ServiceRequest

User = get_user_model()


def api_client_helper():
    return APIClient()


@pytest.fixture
def staff_client(db):
    client = APIClient()
    staff = User.objects.create_user(
        username="staff2", email="staff2@example.com", password="password123", role="staff", is_staff=True
    )
    client.force_authenticate(user=staff)
    return client


@pytest.mark.django_db
class TestDashboardAggregationEdgeCases:
    def test_cash_flow_empty_database(self, staff_client):
        """Verify CashFlowView returns zeros and doesn't crash on None aggregates."""
        # /api/core/dashboards/cash-flow/ -> Need to check URL routes if naming differs.
        # Assuming we can just hit the view manually or via URL.
        # Let's see core/urls.py for the exact name.
        url = reverse("core:cash-flow")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["inflow"]["total"] == 0
        assert data["outflow"]["total"] == 0
        assert data["net_cash_flow"] == 0

    def test_workflow_status_zero_efficiency(self, staff_client):
        """Verify efficiency calculation avoids division by zero."""
        url = reverse("core:workflow-status")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["efficiency_rate"] == 0

    def test_workflow_status_with_requests(self, staff_client):
        """Verify efficiency calculation and time formatting logic."""
        now = timezone.now()
        user = User.objects.create_user(username="workflow_user", email="workflow@test.com", password="password123")
        sr = ServiceRequest.objects.create(
            user=user, request_type="card_replacement", description="test", status="completed"
        )
        sr.created_at = now - datetime.timedelta(hours=2, minutes=30)
        sr.processed_at = now
        sr.save()

        url = reverse("core:workflow-status")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["completed_today"] == 1
        assert response.data["efficiency_rate"] == 100.0
        assert "2h 30m" in response.data["avg_processing_time"]


@pytest.mark.django_db
class TestSystemHealthCachingBehavior:
    def test_performance_dashboard_health_summary(self, staff_client):
        """Verify performance dashboard handles null constraints and system health logic properly."""
        date = timezone.now()  # USE CURRENT TIME to ensure it's the latest
        SystemHealth.objects.create(
            status="critical",
            response_time_ms=500.0,
            details={"cpu_usage": 85.0, "memory_usage": 91.0},
            checked_at=date,
        )
        cache.clear()
        url = reverse("core:performance-dashboard")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        # Alert should be triggered for CPU > 80%
        active_alerts = data.get("active_alerts", [])
        assert len(active_alerts) > 0
        assert active_alerts[0]["id"] == "cpu-high"

        # Recommendations should exist
        assert len(data.get("recent_recommendations")) > 0

    def test_operations_metrics_edge_case(self, staff_client):
        """Verify OperationsMetricsView calculations do not divide by zero on zero transactions."""
        url = reverse("core:operations-metrics")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["transaction_change"] == 0
        assert response.data["transactions_today"] == 0
        assert response.data["api_response_time"] == 125  # Should fallback to 125


@pytest.mark.django_db
class TestExpensesAndCashFlow:
    def test_expenses_list(self, staff_client):
        from core.models.hr import Expense

        Expense.objects.create(
            category="utilities", description="Electricity", amount=500.0, date=timezone.now().date()
        )
        url = reverse("core:expenses")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]["category"] == "utilities"

    def test_cash_flow_calculation(self, staff_client, sender_account):
        # Inflow (Deposit)
        Transaction.objects.create(
            to_account=sender_account, amount=Decimal("1000.00"), transaction_type="deposit", status="completed"
        )
        # Outflow (Withdrawal)
        Transaction.objects.create(
            from_account=sender_account, amount=Decimal("200.00"), transaction_type="withdrawal", status="completed"
        )

        url = reverse("core:cash-flow")
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert float(response.data["inflow"]["total"]) >= 1000.0
        assert float(response.data["outflow"]["total"]) >= 200.0
        assert float(response.data["net_cash_flow"]) >= 800.0
