from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'templates', views.ReportTemplateViewSet, basename='reporttemplate')
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'schedules', views.ReportScheduleViewSet, basename='reportschedule')
router.register(r'analytics', views.ReportAnalyticsViewSet, basename='reportanalytics')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]