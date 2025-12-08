from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, CashAdvanceViewSet, RefundViewSet, ComplaintViewSet,
    CashAdvanceReportViewSet, RefundReportViewSet, ComplaintReportViewSet, LoanViewSet,
    AccountViewSet, StaffAccountViewSet, AccountSummaryViewSet, AccountSummaryView, PendingLoansView,
    UserEncryptionKeyViewSet, MessageThreadViewSet, MessageViewSet, ClientRegistrationViewSet
)

router = DefaultRouter()

# Cashier dashboard endpoints
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'cash-advances', CashAdvanceViewSet, basename='cash-advances')
router.register(r'refunds', RefundViewSet, basename='refunds')
router.register(r'complaints', ComplaintViewSet, basename='complaints')
router.register(r'loans', LoanViewSet, basename='loans')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'staff-accounts', StaffAccountViewSet, basename='staff-accounts')
router.register(r'account-summary', AccountSummaryViewSet, basename='account-summary')

# Messaging endpoints
router.register(r'encryption-keys', UserEncryptionKeyViewSet, basename='encryption-keys')
router.register(r'message-threads', MessageThreadViewSet, basename='message-threads')
router.register(r'messages', MessageViewSet, basename='messages')

# Client registration endpoints
router.register(r'client-registrations', ClientRegistrationViewSet, basename='client-registrations')

# Reporting endpoints
router.register(r'cash-advances/reports', CashAdvanceReportViewSet, basename='cash-advance-reports')
router.register(r'refunds/reports', RefundReportViewSet, basename='refund-reports')
router.register(r'complaints/reports', ComplaintReportViewSet, basename='complaint-reports')

urlpatterns = router.urls + [
    path('banking/account-summary/', AccountSummaryView.as_view(), name='account-summary'),
    path('banking/loans/pending/', PendingLoansView.as_view({'get': 'list'}), name='pending-loans'),
    path('banking/loans/<int:pk>/approve/', PendingLoansView.as_view({'post': 'approve'}), name='loan-approve'),
    path('banking/loans/<int:pk>/reject/', PendingLoansView.as_view({'post': 'reject'}), name='loan-reject'),
    path('banking/loans/<int:pk>/disburse/', PendingLoansView.as_view({'post': 'disburse'}), name='loan-disburse'),
]