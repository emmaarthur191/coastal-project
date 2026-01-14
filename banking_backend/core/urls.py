from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .chat_views import (
    ChatMessageCreateView,
    ChatMessageListView,
    ChatRoomCreateView,
    ChatRoomDetailView,
    ChatRoomListView,
    MarkMessagesReadView,
)
from .ml.views import MLBatchAnalysisView, MLFraudAnalysisView, MLModelStatusView, MLModelTrainView
from .report_download import ReportDownloadView
from .views import (
    AccountBalanceView,
    AccountClosureViewSet,
    AccountOpeningViewSet,
    AccountStatementViewSet,
    AccountViewSet,
    AuditDashboardView,
    BlockedUsersViewSet,
    BranchActivityView,
    CalculateCommissionView,
    CalculateInterestView,
    CalculateServiceChargeView,
    # Cashier dashboard ViewSets
    CashAdvanceViewSet,
    CashDrawerViewSet,
    CashFlowView,
    CheckDepositViewSet,
    ClientAssignmentViewSet,
    ClientRegistrationViewSet,
    ComplaintViewSet,
    DeviceViewSet,
    ExpensesView,
    FraudAlertViewSet,
    FraudRuleViewSet,
    GeneratePayslipView,
    GenerateReportView,
    GenerateStatementView,
    LoanViewSet,
    ManagerOverviewView,
    MessageThreadViewSet,
    MessageViewSet,
    MobileBankerMetricsView,
    MobileOperationsViewSet,
    # Mobile Banker Views
    OperationsMessagesViewSet,
    # Manager dashboard views
    OperationsMetricsView,
    PayslipViewSet,
    PerformanceAlertsView,
    PerformanceChartView,
    PerformanceDashboardView,
    PerformanceMetricsView,
    PerformanceRecommendationsView,
    PerformanceVolumeView,
    ProductViewSet,
    PromotionViewSet,
    RefundViewSet,
    ReportAnalyticsView,
    ReportScheduleViewSet,
    ReportTemplateViewSet,
    ReportViewSet,
    ServiceChargesView,
    ServiceRequestViewSet,
    ServiceStatsView,
    StaffAccountsViewSet,
    SystemAlertsView,
    SystemHealthView,
    TransactionViewSet,
    # Messaging preferences and blocked users
    UserPreferencesView,
    VisitScheduleViewSet,
    WorkflowStatusView,
)

app_name = "core"

router = DefaultRouter()
router.register(r"accounts", AccountViewSet)
router.register(r"transactions", TransactionViewSet)
router.register(r"loans", LoanViewSet)
router.register(r"fraud-alerts", FraudAlertViewSet)
router.register(r"banking/messages", MessageViewSet, basename="message")
router.register(r"services/requests", ServiceRequestViewSet, basename="service-request")

# Banking endpoints for cashier dashboard
router.register(r"banking/refunds", RefundViewSet, basename="refund")
router.register(r"banking/complaints", ComplaintViewSet, basename="complaint")
router.register(r"banking/account-openings", AccountOpeningViewSet, basename="account-opening")
router.register(r"banking/account-closures", AccountClosureViewSet, basename="account-closure")
router.register(r"banking/cash-advances", CashAdvanceViewSet, basename="cash-advance")
router.register(r"banking/cash-drawers", CashDrawerViewSet, basename="cash-drawer")
router.register(r"banking/message-threads", MessageThreadViewSet, basename="message-thread")
router.register(r"banking/devices", DeviceViewSet, basename="device")
router.register(r"banking/loans", LoanViewSet, basename="banking-loan")

# Staff accounts for manager dashboard
router.register(r"banking/staff-accounts", StaffAccountsViewSet, basename="staff-account")

# Fraud endpoints (alias to fraud-alerts for frontend compatibility)
router.register(r"fraud/alerts", FraudAlertViewSet, basename="fraud-alert")
router.register(r"fraud/rules", FraudRuleViewSet, basename="fraud-rule")
router.register(r"banking/fraud-alerts", FraudAlertViewSet, basename="banking-fraud-alert")

# Reports endpoints
router.register(r"reports/reports", ReportViewSet, basename="report")
router.register(r"reports/templates", ReportTemplateViewSet, basename="report-template")
router.register(r"reports/schedules", ReportScheduleViewSet, basename="report-schedule")
router.register(r"reports", ReportViewSet, basename="report-general")

# Products and promotions
router.register(r"products/products", ProductViewSet, basename="product")
router.register(r"products/promotions", PromotionViewSet, basename="promotion")

# Check deposits
router.register(r"check-deposits", CheckDepositViewSet, basename="check-deposit")

# Client registrations
router.register(r"banking/client-registrations", ClientRegistrationViewSet, basename="client-registration")

# Messaging - blocked users viewset

# Messaging - blocked users viewset
router.register(r"messaging/blocked-users", BlockedUsersViewSet, basename="blocked-user")

# Operations/Mobile Banker endpoints
router.register(r"operations/messages", OperationsMessagesViewSet, basename="operations-message")
router.register(r"operations/visit-schedules", VisitScheduleViewSet, basename="visit-schedule")
router.register(r"operations/assignments", ClientAssignmentViewSet, basename="client-assignment")
router.register(r"operations", MobileOperationsViewSet, basename="mobile-ops")

# Payslip and Statement endpoints
router.register(r"operations/payslips", PayslipViewSet, basename="payslip")
router.register(r"operations/statements", AccountStatementViewSet, basename="statement")


urlpatterns = [
    # Account summary endpoint (maps to StaffAccountsViewSet.summary)
    path("accounts/summary/", StaffAccountsViewSet.as_view({"get": "summary"}), name="accounts-summary"),
    # Account balance endpoint for authenticated users
    path("accounts/balance/", AccountBalanceView.as_view(), name="account-balance"),
    # Manager dashboard overview endpoint
    path("accounts/manager/overview/", ManagerOverviewView.as_view(), name="manager-overview"),
    path("performance/system-health/", SystemHealthView.as_view(), name="system-health"),
    path("performance/dashboard-data/", PerformanceDashboardView.as_view(), name="performance-dashboard"),
    path("performance/metrics/", PerformanceMetricsView.as_view(), name="performance-metrics"),
    path("performance/volume/", PerformanceVolumeView.as_view(), name="performance-volume"),
    path("performance/chart/", PerformanceChartView.as_view(), name="performance-chart"),
    path("performance/alerts/", PerformanceAlertsView.as_view(), name="performance-alerts"),
    path("performance/recommendations/", PerformanceRecommendationsView.as_view(), name="performance-recommendations"),
    path("services/stats/", ServiceStatsView.as_view(), name="service-stats"),
    path("audit/dashboard/", AuditDashboardView.as_view(), name="audit-dashboard"),
    path("reports/analytics/", ReportAnalyticsView.as_view(), name="report-analytics"),
    # Operations metrics for manager dashboard
    path("operations/metrics/", OperationsMetricsView.as_view(), name="operations-metrics"),
    path("operations/service-charges/", ServiceChargesView.as_view(), name="service-charges"),
    path("operations/cash-flow/", CashFlowView.as_view(), name="cash-flow"),
    path("operations/expenses/", ExpensesView.as_view(), name="expenses"),
    path("operations/calculate-commission/", CalculateCommissionView.as_view(), name="calculate-commission"),
    path("operations/calculate-service-charge/", CalculateServiceChargeView.as_view(), name="calculate-service-charge"),
    path("operations/calculate-interest/", CalculateInterestView.as_view(), name="calculate-interest"),
    path("operations/generate-payslip/", GeneratePayslipView.as_view(), name="generate-payslip"),
    path("banking/generate-statement/", GenerateStatementView.as_view(), name="generate-statement"),
    path("operations/workflow-status/", WorkflowStatusView.as_view(), name="workflow-status"),
    path("operations/branch-activity/", BranchActivityView.as_view(), name="branch-activity"),
    path("operations/system-alerts/", SystemAlertsView.as_view(), name="system-alerts"),
    path("operations/generate-report/", GenerateReportView.as_view(), name="generate-report"),
    path("reports/download/<str:report_id>/", ReportDownloadView.as_view(), name="report-download"),
    # Mobile Banker endpoints
    path("operations/mobile-banker-metrics/", MobileBankerMetricsView.as_view(), name="mobile-banker-metrics"),
    # Messaging preferences
    path("messaging/preferences/", UserPreferencesView.as_view(), name="user-preferences"),
    # Simple Chat API (WhatsApp-style)
    path("chat/rooms/", ChatRoomListView.as_view(), name="chat-room-list"),
    path("chat/rooms/create/", ChatRoomCreateView.as_view(), name="chat-room-create"),
    path("chat/rooms/<int:pk>/", ChatRoomDetailView.as_view(), name="chat-room-detail"),
    path("chat/rooms/<int:room_id>/messages/", ChatMessageListView.as_view(), name="chat-messages"),
    path("chat/rooms/<int:room_id>/messages/send/", ChatMessageCreateView.as_view(), name="chat-send"),
    path("chat/rooms/<int:room_id>/read/", MarkMessagesReadView.as_view(), name="chat-mark-read"),
    # ML Fraud Detection API
    path("ml/fraud/analyze/", MLFraudAnalysisView.as_view(), name="ml-fraud-analyze"),
    path("ml/fraud/model/status/", MLModelStatusView.as_view(), name="ml-model-status"),
    path("ml/fraud/model/train/", MLModelTrainView.as_view(), name="ml-model-train"),
    path("ml/fraud/batch-analyze/", MLBatchAnalysisView.as_view(), name="ml-batch-analyze"),
    # Router URLs (must be last to allow specific paths to be matched first)
    path("", include(router.urls)),
]
