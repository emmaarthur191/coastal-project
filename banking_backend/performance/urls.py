from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'metrics', views.PerformanceMetricViewSet)
router.register(r'system-health', views.SystemHealthViewSet)
router.register(r'dashboard-widgets', views.DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'alerts', views.PerformanceAlertViewSet)
router.register(r'recommendations', views.PerformanceRecommendationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('transaction-volume/', views.transaction_volume, name='transaction-volume'),
    path('chart-data/', views.performance_chart_data, name='performance-chart-data'),
    path('dashboard-data/', views.dashboard_data, name='dashboard-data'),
]