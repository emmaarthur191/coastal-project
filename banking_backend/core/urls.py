from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, TransactionViewSet, LoanViewSet, FraudAlertViewSet, 
    MessageViewSet, SystemHealthView, ServiceRequestViewSet,
    RefundViewSet, ComplaintViewSet, AccountOpeningViewSet, AccountClosureViewSet,
    MessageThreadViewSet, DeviceViewSet,
    # Cashier dashboard ViewSets
    CashAdvanceViewSet, CashDrawerViewSet, ServiceStatsView, AuditDashboardView,
    ReportViewSet, ReportTemplateViewSet, ReportScheduleViewSet, ReportAnalyticsView,
    PerformanceDashboardView, PerformanceMetricsView,
    ProductViewSet, PromotionViewSet, CheckDepositViewSet, MemberViewSet,
    # Manager dashboard views
    OperationsMetricsView, StaffAccountsViewSet, ServiceChargesView, CashFlowView, ExpensesView,
    CalculateCommissionView, CalculateInterestView, CalculateServiceChargeView, GeneratePayslipView, GenerateStatementView, WorkflowStatusView,
    BranchActivityView, SystemAlertsView, ClientRegistrationViewSet, GenerateReportView,
    # Messaging preferences and blocked users
    UserPreferencesView, BlockedUsersViewSet,
    # Mobile Banker Views
    OperationsMessagesViewSet, VisitScheduleViewSet, MobileBankerMetricsView, MobileOperationsViewSet,
    ClientAssignmentViewSet,
    PayslipViewSet, AccountStatementViewSet
)

from .report_download import ReportDownloadView
from .chat_views import (
    ChatRoomListView, ChatRoomCreateView, ChatRoomDetailView,
    ChatMessageListView, ChatMessageCreateView, MarkMessagesReadView
)


app_name = 'core'

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'fraud-alerts', FraudAlertViewSet)
router.register(r'banking/messages', MessageViewSet, basename='message')
router.register(r'services/requests', ServiceRequestViewSet, basename='service-request')

# Banking endpoints for cashier dashboard
router.register(r'banking/refunds', RefundViewSet, basename='refund')
router.register(r'banking/complaints', ComplaintViewSet, basename='complaint')
router.register(r'banking/account-openings', AccountOpeningViewSet, basename='account-opening')
router.register(r'banking/account-closures', AccountClosureViewSet, basename='account-closure')
router.register(r'banking/cash-advances', CashAdvanceViewSet, basename='cash-advance')
router.register(r'banking/cash-drawers', CashDrawerViewSet, basename='cash-drawer')
router.register(r'banking/message-threads', MessageThreadViewSet, basename='message-thread')
router.register(r'banking/devices', DeviceViewSet, basename='device')
router.register(r'banking/loans', LoanViewSet, basename='banking-loan')

# Staff accounts for manager dashboard
router.register(r'banking/staff-accounts', StaffAccountsViewSet, basename='staff-account')

# Fraud endpoints (alias to fraud-alerts for frontend compatibility)
router.register(r'fraud/alerts', FraudAlertViewSet, basename='fraud-alert')

# Reports endpoints
router.register(r'reports/reports', ReportViewSet, basename='report')
router.register(r'reports/templates', ReportTemplateViewSet, basename='report-template')
router.register(r'reports/schedules', ReportScheduleViewSet, basename='report-schedule')
router.register(r'reports', ReportViewSet, basename='report-general')

# Products and promotions
router.register(r'products/products', ProductViewSet, basename='product')
router.register(r'products/promotions', PromotionViewSet, basename='promotion')

# Check deposits
router.register(r'check-deposits', CheckDepositViewSet, basename='check-deposit')

# Client registrations
router.register(r'banking/client-registrations', ClientRegistrationViewSet, basename='client-registration')

# Messaging - blocked users viewset

# Messaging - blocked users viewset
router.register(r'messaging/blocked-users', BlockedUsersViewSet, basename='blocked-user')

# Operations/Mobile Banker endpoints
router.register(r'operations/messages', OperationsMessagesViewSet, basename='operations-message')
router.register(r'operations/visit_schedules', VisitScheduleViewSet, basename='visit-schedule')
router.register(r'operations/assignments', ClientAssignmentViewSet, basename='client-assignment')
router.register(r'operations', MobileOperationsViewSet, basename='mobile-ops')

# Payslip and Statement endpoints
router.register(r'operations/payslips', PayslipViewSet, basename='payslip')
router.register(r'operations/statements', AccountStatementViewSet, basename='statement')


urlpatterns = [
    path('performance/system-health/', SystemHealthView.as_view(), name='system-health'),
    path('performance/dashboard-data/', PerformanceDashboardView.as_view(), name='performance-dashboard'),
    path('performance/metrics/', PerformanceMetricsView.as_view(), name='performance-metrics'),
    path('services/stats/', ServiceStatsView.as_view(), name='service-stats'),
    path('audit/dashboard/', AuditDashboardView.as_view(), name='audit-dashboard'),
    path('reports/analytics/', ReportAnalyticsView.as_view(), name='report-analytics'),
    # Operations metrics for manager dashboard
    path('operations/metrics/', OperationsMetricsView.as_view(), name='operations-metrics'),
    path('operations/service-charges/', ServiceChargesView.as_view(), name='service-charges'),
    path('operations/cash-flow/', CashFlowView.as_view(), name='cash-flow'),
    path('operations/expenses/', ExpensesView.as_view(), name='expenses'),
    path('operations/calculate-commission/', CalculateCommissionView.as_view(), name='calculate-commission'),
    path('operations/calculate-service-charge/', CalculateServiceChargeView.as_view(), name='calculate-service-charge'),
    path('operations/calculate-interest/', CalculateInterestView.as_view(), name='calculate-interest'),
    path('operations/generate-payslip/', GeneratePayslipView.as_view(), name='generate-payslip'),
    path('banking/generate-statement/', GenerateStatementView.as_view(), name='generate-statement'),
    path('operations/workflow-status/', WorkflowStatusView.as_view(), name='workflow-status'),
    path('operations/branch-activity/', BranchActivityView.as_view(), name='branch-activity'),
    path('operations/system-alerts/', SystemAlertsView.as_view(), name='system-alerts'),
    path('operations/generate-report/', GenerateReportView.as_view(), name='generate-report'),
    path('reports/download/<str:report_id>/', ReportDownloadView.as_view(), name='report-download'),
    
    # Mobile Banker endpoints
    path('operations/mobile-banker-metrics/', MobileBankerMetricsView.as_view(), name='mobile-banker-metrics'),

    # Messaging preferences
    path('messaging/preferences/', UserPreferencesView.as_view(), name='user-preferences'),
    
    # Simple Chat API (WhatsApp-style)
    path('chat/rooms/', ChatRoomListView.as_view(), name='chat-room-list'),
    path('chat/rooms/create/', ChatRoomCreateView.as_view(), name='chat-room-create'),
    path('chat/rooms/<int:pk>/', ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('chat/rooms/<int:room_id>/messages/', ChatMessageListView.as_view(), name='chat-messages'),
    path('chat/rooms/<int:room_id>/messages/send/', ChatMessageCreateView.as_view(), name='chat-send'),
    path('chat/rooms/<int:room_id>/read/', MarkMessagesReadView.as_view(), name='chat-mark-read'),
    
    # Router URLs (must be last to allow specific paths to be matched first)
    path('', include(router.urls)),
]
