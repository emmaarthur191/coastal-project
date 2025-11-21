from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FraudRuleViewSet, FraudAlertViewSet, FraudAuditTrailViewSet,
    evaluate_transaction, system_health
)

# Create a router for the fraud detection APIs
router = DefaultRouter()
router.register(r'rules', FraudRuleViewSet, basename='fraud-rules')
router.register(r'alerts', FraudAlertViewSet, basename='fraud-alerts')
router.register(r'audit-trail', FraudAuditTrailViewSet, basename='fraud-audit-trail')

urlpatterns = [
    path('', include(router.urls)),
    path('evaluate-transaction/', evaluate_transaction, name='evaluate-transaction'),
    path('system-health/', system_health, name='system-health'),
]