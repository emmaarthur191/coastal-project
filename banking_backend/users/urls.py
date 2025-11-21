from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # User profile endpoints
    path('profile/', views.ProfileSettingsView.as_view(), name='profile'),
    path('notifications/', views.NotificationSettingsView.as_view(), name='notifications'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),

    # Additional authentication endpoints
    path('auth/check/', views.AuthCheckView.as_view(), name='auth_check'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),

    # Dashboard endpoints
    path('member-dashboard/', views.MemberDashboardView.as_view(), name='member_dashboard'),
    
    # OTP endpoints
    path('send-otp/', views.SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify_otp'),
    
    # User management endpoints (staff only)
    path('create/', views.CreateUserView.as_view(), name='create_user'),
    path('staff/', views.StaffListView.as_view(), name='staff_list'),
    path('members/', views.MembersListView.as_view(), name='members_list'),
    path('deactivate-staff/', views.DeactivateStaffView.as_view(), name='deactivate_staff'),
    path('reactivate-staff/', views.ReactivateStaffView.as_view(), name='reactivate_staff'),

    # Superuser operations (superuser only)
    path('superuser/operations/', views.SuperuserOperationsView.as_view(), name='superuser_operations_api'),

    # Superuser dashboard URLs
    path('web/superuser/dashboard/', views.superuser_dashboard, name='superuser_dashboard'),
    path('web/superuser/users/', views.superuser_users, name='superuser_users'),
    path('web/superuser/settings/', views.superuser_settings, name='superuser_settings'),
    path('web/superuser/operations/', views.superuser_operations_page, name='superuser_operations'),
    path('web/superuser/audit/', views.superuser_audit, name='superuser_audit'),
    path('web/superuser/monitoring/', views.superuser_monitoring, name='superuser_monitoring'),
    path('web/superuser/security/', views.superuser_security, name='superuser_security'),

    # Web interface URLs
    path('web/login/', views.login_view, name='login'),
    path('web/logout/', views.logout_view, name='logout'),
    path('web/register/', views.register_view, name='register'),
    path('web/dashboard/', views.dashboard_view, name='dashboard'),
    path('web/profile/', views.profile_view, name='profile'),
    path('web/change-password/', views.change_password_view, name='change_password'),

    # Staff user management URLs
    path('web/users/', views.UserListView.as_view(), name='user_list'),
    path('web/users/create/', views.UserCreateView.as_view(), name='user_create'),
    path('web/users/<uuid:pk>/update/', views.UserUpdateView.as_view(), name='user_update'),
    path('web/users/<uuid:pk>/delete/', views.UserDeleteView.as_view(), name='user_delete'),
    path('web/users/<uuid:pk>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
]