from django.contrib import admin
from .models import PerformanceMetric, SystemHealth, DashboardWidget, PerformanceAlert, PerformanceRecommendation


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'metric_type', 'value', 'unit', 'service_name', 'timestamp']
    list_filter = ['metric_type', 'service_name', 'timestamp']
    search_fields = ['metric_name', 'service_name', 'endpoint']
    readonly_fields = ['id', 'timestamp']
    ordering = ['-timestamp']


@admin.register(SystemHealth)
class SystemHealthAdmin(admin.ModelAdmin):
    list_display = ['component_name', 'component_type', 'status', 'last_check', 'cpu_usage', 'memory_usage']
    list_filter = ['status', 'component_type', 'alert_enabled']
    search_fields = ['component_name', 'component_type']
    readonly_fields = ['id', 'last_check']
    ordering = ['component_name']


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'title', 'created_by', 'is_active', 'created_at']
    list_filter = ['widget_type', 'is_active', 'is_public']
    search_fields = ['name', 'title', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(PerformanceAlert)
class PerformanceAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'alert_level', 'status', 'triggered_at', 'acknowledged_by']
    list_filter = ['alert_level', 'status', 'triggered_at']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'triggered_at', 'acknowledged_at', 'resolved_at']
    ordering = ['-triggered_at']


@admin.register(PerformanceRecommendation)
class PerformanceRecommendationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recommendation_type', 'priority', 'status', 'created_at']
    list_filter = ['recommendation_type', 'priority', 'status']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'implemented_at']
    ordering = ['-created_at']