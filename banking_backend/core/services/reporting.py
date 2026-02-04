"""Reporting and health monitoring services for Coastal Banking."""

import logging

from django.db import connection

from core.models.transactions import Transaction

logger = logging.getLogger(__name__)


class ReportService:
    """Service class for report data retrieval."""

    @staticmethod
    def get_report_data(report_type: str, start_date=None, end_date=None):
        """Retrieve filtered transaction data for reporting purposes."""
        if report_type == "transactions":
            queryset = Transaction.objects.all()
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
            return queryset.order_by("-timestamp")[:100]
        return []


class SystemHealthService:
    """Service class for system health monitoring."""

    @staticmethod
    def get_health_status() -> dict:
        """Check the operational status of core system components (DB, Server)."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {e!s}"

        return {
            "database": db_status,
            "web_server": "healthy",
        }
