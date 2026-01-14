"""Core views package for Coastal Banking.

This package provides modular views organized by domain.
Imports are provided for backward compatibility with existing code.
"""

# Account views
from core.views.accounts import (
    AccountBalanceView,
    AccountClosureViewSet,
    AccountOpeningViewSet,
    AccountViewSet,
    StaffAccountsViewSet,
)

# Calculation views
from core.views.calculations import CalculateCommissionView, CalculateInterestView

# Cashier views
from core.views.cashier import (
    CashAdvanceViewSet,
    CashDrawerViewSet,
    CheckDepositViewSet,
)

# Dashboard views
from core.views.dashboard import (
    AuditDashboardView,
    BranchActivityView,
    CashFlowView,
    ExpensesView,
    ManagerOverviewView,
    OperationsMetricsView,
    PerformanceAlertsView,
    PerformanceChartView,
    PerformanceDashboardView,
    PerformanceMetricsView,
    PerformanceRecommendationsView,
    PerformanceVolumeView,
    SystemAlertsView,
    WorkflowStatusView,
)

# Fraud views
from core.views.fraud import FraudAlertViewSet, FraudRuleViewSet

# Loan views
from core.views.loans import LoanViewSet

# Messaging views
from core.views.messaging import (
    BankingMessageViewSet,
    BlockedUsersViewSet,
    DeviceViewSet,
    MessageThreadViewSet,
    MessageViewSet,
    OperationsMessagesViewSet,
    UserPreferencesView,
)

# Mobile views
from core.views.mobile import (
    ClientAssignmentViewSet,
    MobileBankerMetricsView,
    MobileOperationsViewSet,
    VisitScheduleViewSet,
)

# Product views
from core.views.products import ProductViewSet, PromotionViewSet

# Registration views
from core.views.registration import ClientRegistrationViewSet, MemberViewSet

# Report views
from core.views.reports import (
    AccountStatementViewSet,
    GeneratePayslipView,
    GenerateReportView,
    GenerateStatementView,
    PayslipViewSet,
    ReportAnalyticsView,
    ReportScheduleViewSet,
    ReportTemplateViewSet,
    ReportViewSet,
)

# Service views
from core.views.services import (
    CalculateServiceChargeView,
    ComplaintViewSet,
    RefundViewSet,
    ServiceChargesView,
    ServiceRequestViewSet,
    ServiceStatsView,
)

# System views
from core.views.system import HealthCheckView, SystemHealthView

# Transaction views
from core.views.transactions import TransactionViewSet

# Export all views for backward compatibility
__all__ = [
    "AccountClosureViewSet",
    "AccountOpeningViewSet",
    "AccountStatementViewSet",
    # Accounts
    "AccountViewSet",
    "AuditDashboardView",
    # Messaging
    "BankingMessageViewSet",
    "BlockedUsersViewSet",
    "BranchActivityView",
    # Calculations
    "CalculateCommissionView",
    "CalculateInterestView",
    "CalculateServiceChargeView",
    # Cashier
    "CashAdvanceViewSet",
    "CashDrawerViewSet",
    # Dashboard
    "CashFlowView",
    "CheckDepositViewSet",
    "ClientAssignmentViewSet",
    # Registration
    "ClientRegistrationViewSet",
    "ComplaintViewSet",
    "DeviceViewSet",
    "ExpensesView",
    # Fraud
    "FraudAlertViewSet",
    "FraudRuleViewSet",
    "GeneratePayslipView",
    # Reports
    "GenerateReportView",
    "GenerateStatementView",
    "HealthCheckView",
    # Loans
    "LoanViewSet",
    "MemberViewSet",
    "MessageThreadViewSet",
    "MessageViewSet",
    "MobileBankerMetricsView",
    "MobileOperationsViewSet",
    "OperationsMessagesViewSet",
    "OperationsMetricsView",
    "PayslipViewSet",
    "PerformanceAlertsView",
    "PerformanceChartView",
    "PerformanceDashboardView",
    "PerformanceMetricsView",
    "PerformanceRecommendationsView",
    "PerformanceVolumeView",
    # Products
    "ProductViewSet",
    "PromotionViewSet",
    "RefundViewSet",
    "ReportAnalyticsView",
    "ReportScheduleViewSet",
    "ReportTemplateViewSet",
    "ReportViewSet",
    # Services
    "ServiceChargesView",
    "ServiceRequestViewSet",
    "ServiceStatsView",
    "StaffAccountsViewSet",
    "SystemAlertsView",
    # System
    "SystemHealthView",
    # Transactions
    "TransactionViewSet",
    "UserPreferencesView",
    # Mobile
    "VisitScheduleViewSet",
    "WorkflowStatusView",
]
