from django.contrib import admin
from .models import ReportTemplate, Report, ReportSchedule, ReportAnalytics


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'frequency', 'is_active', 'created_by', 'created_at']
    list_filter = ['template_type', 'frequency', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'template_type', 'frequency')
        }),
        ('Configuration', {
            'fields': ('layout_config', 'filters_config', 'columns_config', 'charts_config'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'template', 'status', 'report_date', 'generated_by', 'generated_at']
    list_filter = ['status', 'format', 'report_date', 'generated_at']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at', 'generated_at', 'completed_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('template', 'title', 'description')
        }),
        ('Parameters', {
            'fields': ('report_date', 'start_date', 'end_date', 'filters_applied')
        }),
        ('Generation', {
            'fields': ('status', 'format', 'generated_by', 'generated_at', 'completed_at')
        }),
        ('Data & Files', {
            'fields': ('data', 'file_path', 'file_size', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('expires_at', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'frequency', 'status', 'next_run', 'created_by']
    list_filter = ['status', 'frequency', 'delivery_method', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'last_run', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('template', 'name', 'description')
        }),
        ('Scheduling', {
            'fields': ('frequency', 'next_run', 'expires_at')
        }),
        ('Delivery', {
            'fields': ('recipients', 'delivery_method', 'delivery_config')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'last_error', 'consecutive_failures')
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportAnalytics)
class ReportAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['report', 'total_transactions', 'total_amount', 'calculated_at']
    list_filter = ['calculated_at']
    search_fields = ['report__title']
    readonly_fields = ['id', 'calculated_at']
    fieldsets = (
        ('Report', {
            'fields': ('report',)
        }),
        ('Transaction Metrics', {
            'fields': ('total_transactions', 'total_amount', 'average_transaction_amount')
        }),
        ('Breakdown', {
            'fields': ('deposits_count', 'withdrawals_count', 'transfers_count', 'fees_count',
                      'deposits_amount', 'withdrawals_amount', 'transfers_amount', 'fees_amount')
        }),
        ('Additional Data', {
            'fields': ('cashier_metrics', 'previous_period_comparison', 'trend_data',
                      'compliance_flags', 'risk_indicators'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('calculated_at',),
            'classes': ('collapse',)
        }),
    )
