"""
URL configuration for security monitoring views.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .security_monitoring import SecurityMonitoringViewSet

# Create a router for the security monitoring viewset
router = DefaultRouter()
router.register(r'', SecurityMonitoringViewSet, basename='security-monitoring')

urlpatterns = [
    path('', include(router.urls)),
]