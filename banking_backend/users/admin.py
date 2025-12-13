"""
Enhanced Django Admin configuration for users app.
Features: Bulk actions, password reset, role-based display, CSV/JSON export, activity logs.
"""
import csv
import json
from datetime import datetime
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.http import HttpResponse
from django.utils.html import format_html
from django.utils import timezone
from django.contrib import messages

from .models import User, UserActivity, AuditLog, AdminNotification


# =============================================================================
# Utility Functions for Export
# =============================================================================

def export_to_csv(modeladmin, request, queryset):
    """Export selected items to CSV."""
    meta = modeladmin.model._meta
    field_names = [field.name for field in meta.fields]

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename={meta.model_name}_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

    writer = csv.writer(response)
    writer.writerow(field_names)

    for obj in queryset:
        row = []
        for field in field_names:
            value = getattr(obj, field)
            if callable(value):
                value = value()
            row.append(str(value) if value else '')
        writer.writerow(row)

    return response

export_to_csv.short_description = "Export selected to CSV"


def export_to_json(modeladmin, request, queryset):
    """Export selected items to JSON."""
    meta = modeladmin.model._meta
    field_names = [field.name for field in meta.fields]

    data = []
    for obj in queryset:
        item = {}
        for field in field_names:
            value = getattr(obj, field)
            if callable(value):
                value = value()
            # Handle datetime objects
            if hasattr(value, 'isoformat'):
                value = value.isoformat()
            item[field] = str(value) if value is not None else None
        data.append(item)

    response = HttpResponse(
        json.dumps(data, indent=2),
        content_type='application/json'
    )
    response['Content-Disposition'] = f'attachment; filename={meta.model_name}_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    return response

export_to_json.short_description = "Export selected to JSON"


# =============================================================================
# User Admin with Enhanced Features
# =============================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced User admin with bulk actions and improved display."""
    
    list_display = (
        'email', 'username', 'get_full_name_display', 'role', 'is_active_display', 
        'is_staff', 'last_login', 'date_joined'
    )
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    # Customize fieldsets for better organization
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role', 'is_staff', 'is_active'),
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined')
    
    # Add bulk actions
    actions = [
        'activate_users',
        'deactivate_users',
        'force_password_reset',
        'set_role_customer',
        'set_role_staff',
        export_to_csv,
        export_to_json,
    ]
    
    def get_full_name_display(self, obj):
        """Display full name or username."""
        full_name = obj.get_full_name()
        return full_name if full_name.strip() else obj.username
    get_full_name_display.short_description = 'Name'
    get_full_name_display.admin_order_field = 'first_name'
    
    def is_active_display(self, obj):
        """Display active status with color indicator."""
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Active</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Inactive</span>')
    is_active_display.short_description = 'Status'
    is_active_display.admin_order_field = 'is_active'
    
    # Bulk Actions
    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users activated successfully.', messages.SUCCESS)
        # Log the action
        for user in queryset:
            self._log_admin_action(request, user, 'account_unlocked')
    
    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users deactivated successfully.', messages.SUCCESS)
        for user in queryset:
            self._log_admin_action(request, user, 'account_locked')
    
    @admin.action(description='Force password reset for selected users')
    def force_password_reset(self, request, queryset):
        """Flag users for password reset (they'll need to reset on next login)."""
        count = 0
        for user in queryset:
            # Set unusable password - user must reset
            user.set_unusable_password()
            user.save()
            self._log_admin_action(request, user, 'password_reset')
            count += 1
        self.message_user(
            request, 
            f'{count} users flagged for password reset. They will need to reset their password.',
            messages.WARNING
        )
    
    @admin.action(description='Set role to Customer')
    def set_role_customer(self, request, queryset):
        updated = queryset.update(role='customer')
        self.message_user(request, f'{updated} users set to Customer role.', messages.SUCCESS)
    
    @admin.action(description='Set role to Cashier')
    def set_role_staff(self, request, queryset):
        updated = queryset.update(role='cashier')
        self.message_user(request, f'{updated} users set to Cashier role.', messages.SUCCESS)
    
    def _log_admin_action(self, request, user, action):
        """Log admin action to UserActivity."""
        try:
            UserActivity.objects.create(
                user=user,
                action=action,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                details={'admin_user': request.user.email, 'admin_action': True}
            )
        except Exception:
            pass  # Don't fail if logging fails
    
    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


# =============================================================================
# User Activity Admin
# =============================================================================

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """Admin for viewing user activity logs."""
    
    list_display = ('user', 'action', 'ip_address', 'created_at', 'details_preview')
    list_filter = ('action', 'created_at')
    search_fields = ('user__email', 'user__username', 'ip_address')
    ordering = ('-created_at',)
    readonly_fields = ('user', 'action', 'ip_address', 'user_agent', 'details', 'created_at')
    date_hierarchy = 'created_at'
    
    actions = [export_to_csv, export_to_json]
    
    def details_preview(self, obj):
        """Show preview of details JSON."""
        if obj.details:
            preview = str(obj.details)[:50]
            return preview + '...' if len(str(obj.details)) > 50 else preview
        return '-'
    details_preview.short_description = 'Details'
    
    def has_add_permission(self, request):
        """Activity logs are created automatically, not manually."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Activity logs are read-only."""
        return False


# =============================================================================
# Audit Log Admin
# =============================================================================

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin for viewing system-wide audit logs."""
    
    list_display = ('created_at', 'user', 'action', 'model_name', 'object_repr', 'ip_address')
    list_filter = ('action', 'model_name', 'created_at')
    search_fields = ('user__email', 'model_name', 'object_repr', 'object_id')
    ordering = ('-created_at',)
    readonly_fields = ('user', 'action', 'model_name', 'object_id', 'object_repr', 'changes', 'ip_address', 'created_at')
    date_hierarchy = 'created_at'
    
    actions = [export_to_csv, export_to_json]
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


# =============================================================================
# Admin Notification Admin
# =============================================================================

@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    """Admin for managing admin notifications."""
    
    list_display = ('title', 'notification_type', 'priority_display', 'is_read', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'created_at')
    search_fields = ('title', 'message')
    ordering = ('-created_at',)
    filter_horizontal = ('target_users',)
    
    actions = ['mark_as_read', 'mark_as_unread', export_to_csv, export_to_json]
    
    def priority_display(self, obj):
        """Display priority with color coding."""
        colors = {
            'low': 'gray',
            'medium': 'blue',
            'high': 'orange',
            'critical': 'red',
        }
        color = colors.get(obj.priority, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.priority.upper()
        )
    priority_display.short_description = 'Priority'
    priority_display.admin_order_field = 'priority'
    
    @admin.action(description='Mark selected as read')
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{queryset.count()} notifications marked as read.', messages.SUCCESS)
    
    @admin.action(description='Mark selected as unread')
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{queryset.count()} notifications marked as unread.', messages.SUCCESS)


# =============================================================================
# Admin Site Customization
# =============================================================================

admin.site.site_header = 'Coastal Banking Administration'
admin.site.site_title = 'Coastal Banking Admin'
admin.site.index_title = 'Welcome to Coastal Banking Administration Portal'
