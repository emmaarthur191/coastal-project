from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowViewSet, WorkflowStepViewSet, ClientKYCViewSet,
    FieldCollectionViewSet, CommissionViewSet, ExpenseViewSet, VisitScheduleViewSet, MessageViewSet, calculate_commission,
    get_cash_flow, get_operational_metrics, get_branch_activity,
    get_system_alerts, get_workflow_status, service_charges,
    calculate_service_charge, calculate_interest, generate_report, get_mobile_banker_metrics
)

router = DefaultRouter()
router.register(r'workflows', WorkflowViewSet, basename='workflows')
router.register(r'workflow-steps', WorkflowStepViewSet, basename='workflow-steps')
router.register(r'client-kyc', ClientKYCViewSet, basename='client-kyc')
router.register(r'field-collections', FieldCollectionViewSet, basename='field-collections')
router.register(r'commissions', CommissionViewSet, basename='commissions')
router.register(r'expenses', ExpenseViewSet, basename='expenses')
router.register(r'visit_schedules', VisitScheduleViewSet, basename='visit_schedules')
router.register(r'messages', MessageViewSet, basename='messages')

urlpatterns = [
    path('calculate-commission/', calculate_commission, name='calculate-commission'),
    path('cash-flow/', get_cash_flow, name='cash-flow'),
    path('metrics/', get_operational_metrics, name='operational-metrics'),
    path('branch-activity/', get_branch_activity, name='branch-activity'),
    path('system-alerts/', get_system_alerts, name='system-alerts'),
    path('workflow-status/', get_workflow_status, name='workflow-status'),
    path('service-charges/', service_charges, name='service-charges'),
    path('calculate-service-charge/', calculate_service_charge, name='calculate-service-charge'),
    path('calculate-interest/', calculate_interest, name='calculate-interest'),
    path('generate-report/', generate_report, name='generate-report'),
    path('mobile-banker-metrics/', get_mobile_banker_metrics, name='mobile-banker-metrics'),
] + router.urls