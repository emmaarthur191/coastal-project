from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'metrics', views.PerformanceMetricViewSet)
router.register(r'system-health', views.SystemHealthViewSet)
router.register(r'dashboard-widgets', views.DashboardWidgetViewSet)
router.register(r'alerts', views.PerformanceAlertViewSet)
router.register(r'recommendations', views.PerformanceRecommendationViewSet)

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-data/', views.dashboard_data, name='dashboard-data'),
    path('transaction-volume/', views.transaction_volume, name='transaction-volume'),
    path('chart-data/', views.chart_data, name='chart-data'),
    path('generate-recommendations/', views.generate_recommendations, name='generate-recommendations'),
    path('collect-metrics/', views.collect_metrics, name='collect-metrics'),
]