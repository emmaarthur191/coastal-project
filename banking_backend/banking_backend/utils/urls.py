"""
URL configuration for audit utilities.
"""

from django.urls import path
from .audit import (
    audit_dashboard_api,
    user_activity_api,
    compliance_report_api,
    high_risk_transactions_api
)

app_name = 'audit'

urlpatterns = [
    path('dashboard/', audit_dashboard_api, name='audit_dashboard'),
    path('user-activity/<uuid:user_id>/', user_activity_api, name='user_activity'),
    path('compliance-report/', compliance_report_api, name='compliance_report'),
    path('high-risk-transactions/', high_risk_transactions_api, name='high_risk_transactions'),
]