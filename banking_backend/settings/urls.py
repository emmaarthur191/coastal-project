from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'settings'

router = DefaultRouter()
router.register(r'user-settings', views.UserSettingsViewSet, basename='user-settings')
router.register(r'system-settings', views.SystemSettingsViewSet, basename='system-settings')
router.register(r'api-usage', views.APIUsageViewSet, basename='api-usage')
router.register(r'rate-limits', views.APIRateLimitViewSet, basename='rate-limits')
router.register(r'health-checks', views.HealthCheckViewSet, basename='health-checks')

urlpatterns = [
    path('', include(router.urls)),

    # Health and monitoring endpoints
    path('health/', views.api_health_check, name='api-health'),
    path('system-status/', views.system_status, name='system-status'),
]