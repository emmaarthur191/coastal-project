"""System health and utility views for Coastal Banking.

This module contains views for system health checks and monitoring.
"""

import logging

from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class SystemHealthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request):
        """Return a detailed system health report including database connectivity and service status."""
        # Check database connection
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {e!s}"

        # System health data
        health_data = {
            "status": "healthy" if db_status == "healthy" else "unhealthy",
            "timestamp": timezone.now().isoformat(),
            "services": {
                "database": db_status,
                "web_server": "healthy",  # Assuming running
            },
            "version": "1.0.0",  # Placeholder
        }

        status_code = status.HTTP_200_OK if health_data["status"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_data, status=status_code)


class HealthCheckView(APIView):
    """Simple health check endpoint for load balancers."""

    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request):
        """Return a simple HTTP 200 OK status for basic health checks."""
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
