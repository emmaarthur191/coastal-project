import os
import sys

import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.append(r"e:\coastal\banking_backend")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate

from core.views.dashboard import PerformanceDashboardView, PerformanceMetricsView
from core.views.reports import ReportAnalyticsView

User = get_user_model()


def run_test():
    factory = APIRequestFactory()
    user = User.objects.filter(is_staff=True).first()
    if not user:
        user = User.objects.create_user(
            username="test_diagnostic", password="password123", is_staff=True, role="manager"
        )

    views = [
        ("Performance Dashboard", PerformanceDashboardView),
        ("Performance Metrics", PerformanceMetricsView),
        ("Report Analytics", ReportAnalyticsView),
    ]

    for name, view_class in views:
        print(f"\n--- Testing {name} ---")
        try:
            view = view_class.as_view()
            request = factory.get("/")
            force_authenticate(request, user=user)
            response = view(request)
            print(f"Status: {response.status_code}")
            print(f"Data: {response.data}")
        except Exception:
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    run_test()
