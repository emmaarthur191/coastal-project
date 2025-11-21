from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, CashAdvanceViewSet, RefundViewSet, ComplaintViewSet,
    CashAdvanceReportViewSet, RefundReportViewSet, ComplaintReportViewSet, LoanViewSet,
    AccountViewSet, AccountSummaryViewSet
)

router = DefaultRouter()

# Cashier dashboard endpoints
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'cash-advances', CashAdvanceViewSet, basename='cash-advances')
router.register(r'refunds', RefundViewSet, basename='refunds')
router.register(r'complaints', ComplaintViewSet, basename='complaints')
router.register(r'loans', LoanViewSet, basename='loans')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'account-summary', AccountSummaryViewSet, basename='account-summary')

# Reporting endpoints
router.register(r'cash-advances/reports', CashAdvanceReportViewSet, basename='cash-advance-reports')
router.register(r'refunds/reports', RefundReportViewSet, basename='refund-reports')
router.register(r'complaints/reports', ComplaintReportViewSet, basename='complaint-reports')

urlpatterns = router.urls