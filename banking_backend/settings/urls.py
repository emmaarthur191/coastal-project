from django.urls import path
from . import views

app_name = 'settings'

urlpatterns = [
    # Temporary minimal health check endpoint
    path('health/', views.api_health_check, name='api-health'),
]

# TODO: Re-enable these routes once the models and views are properly implemented:
# from rest_framework.routers import DefaultRouter
# router = DefaultRouter()
# router.register(r'user-settings', views.UserSettingsViewSet, basename='user-settings')
# router.register(r'system-settings', views.SystemSettingsViewSet, basename='system-settings')
# router.register(r'api-usage', views.APIUsageViewSet, basename='api-usage')
# router.register(r'rate-limits', views.APIRateLimitViewSet, basename='rate-limits')
# router.register(r'health-checks', views.HealthCheckViewSet, basename='health-checks')
# path('', include(router.urls)),
# path('system-status/', views.system_status, name='system-status'),