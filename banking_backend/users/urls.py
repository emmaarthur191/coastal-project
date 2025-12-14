from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView, LoginView, LogoutView, UserDetailView, 
    UserListView, AuthCheckView, MemberDashboardView, SendOTPView, VerifyOTPView,
    LoginAttemptsView, UserSessionsView, MembersListView, StaffListView, StaffIdsView,
    SessionTerminateView, CreateStaffView
)

urlpatterns = [
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('create/', CreateStaffView.as_view(), name='create-staff'), # Maps to 'users/create/' based on config
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/check/', AuthCheckView.as_view(), name='auth-check'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/login-attempts/', LoginAttemptsView.as_view(), name='login-attempts'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('members/', MembersListView.as_view(), name='members-list'),
    path('staff/', StaffListView.as_view(), name='staff-list'),
    path('staff-ids/', StaffIdsView.as_view(), name='staff-ids'),
    path('member-dashboard/', MemberDashboardView.as_view(), name='member-dashboard'),
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('sessions/', UserSessionsView.as_view(), name='user-sessions'),
    path('sessions/<int:pk>/terminate/', SessionTerminateView.as_view(), name='session-terminate'),
]