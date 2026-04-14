"""URL configuration for the users and authentication application."""

from django.urls import include, path
from rest_framework.routers import SimpleRouter

app_name = "users"

from .views import (
    AuthCheckView,
    AuditLogListView,
    ClientBankerAssignmentView,
    ChangePasswordView,
    ClientsForMappingView,
    CookieTokenRefreshView,
    GetCSRFToken,
    LoginAttemptsView,
    LoginView,
    LogoutView,
    MemberDashboardView,
    MemberLookupView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    SendOTPView,
    SessionTerminateView,
    StaffIdsView,
    StaffListView,
    StaffManagementViewSet,
    UserDetailView,
    UserListView,
    UserSessionsView,
    VerifyOTPView,
)

router = SimpleRouter()
router.register(r"staff-management", StaffManagementViewSet, basename="staff-management")

urlpatterns = [
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password-alias"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/check/", AuthCheckView.as_view(), name="auth-check"),
    path("auth/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("auth/login-attempts/", LoginAttemptsView.as_view(), name="login-attempts"),
    path("audit-logs/", AuditLogListView.as_view(), name="audit-logs"),
    # Password Reset (NIST 800-63B compliant)
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("me/", UserDetailView.as_view(), name="user-detail"),
    path("list/", UserListView.as_view(), name="user-list"),
    path("members/", UserListView.as_view(), name="member-list-alias"),
    path("staff/", StaffListView.as_view(), name="staff-list"),
    path("staff-ids/", StaffIdsView.as_view(), name="staff-ids"),
    path("assign-banker/", ClientBankerAssignmentView.as_view(), name="assign-banker"),
    path("clients-for-mapping/", ClientsForMappingView.as_view(), name="clients-for-mapping"),
    path("member-dashboard/", MemberDashboardView.as_view(), name="member-dashboard"),
    path("member-lookup/", MemberLookupView.as_view(), name="member-lookup"),
    path("send-otp/", SendOTPView.as_view(), name="send-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("sessions/", UserSessionsView.as_view(), name="user-sessions"),
    path("sessions/<int:pk>/terminate/", SessionTerminateView.as_view(), name="session-terminate"),
    path("csrf/", GetCSRFToken.as_view(), name="csrf-token"),
    path("", include(router.urls)),
    # LEGACY COMPATIBILITY: Aliases for tests that expect these specific URL names
    path("create-staff/", StaffManagementViewSet.as_view({"post": "create"}), name="create-staff"),
    path("staff-enroll/", StaffManagementViewSet.as_view({"post": "verify_invitation"}), name="staff-enroll"),
]
