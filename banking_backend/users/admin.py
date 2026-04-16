"""Enhanced Django Admin configuration for users app.
Features: Bulk actions, password reset, role-based display, CSV/JSON export, activity logs.
"""

import csv
import json
from datetime import datetime

from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import format_html

from .models import AdminNotification, AuditLog, User, UserActivity

# =============================================================================
# Utility Functions for Export
# =============================================================================


def export_to_csv(modeladmin, request, queryset):
    """Export selected items to CSV."""
    meta = modeladmin.model._meta
    field_names = [field.name for field in meta.fields]

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename={meta.model_name}_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

    writer = csv.writer(response)
    writer.writerow(field_names)

    for obj in queryset:
        row = []
        for field in field_names:
            value = getattr(obj, field)
            if callable(value):
                value = value()
            row.append(str(value) if value else "")
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
            if hasattr(value, "isoformat"):
                value = value.isoformat()
            item[field] = str(value) if value is not None else None
        data.append(item)

    response = HttpResponse(json.dumps(data, indent=2), content_type="application/json")
    response["Content-Disposition"] = (
        f'attachment; filename={meta.model_name}_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    )
    return response


export_to_json.short_description = "Export selected to JSON"


# =============================================================================
# User Admin with Enhanced Features
# =============================================================================


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced User admin with bulk actions and improved display."""

    list_display = (
        "email",
        "username",
        "get_full_name_display",
        "role",
        "is_active_display",
        "is_staff",
        "last_login",
        "date_joined",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser", "date_joined")
    # first_name / last_name are encrypted @property accessors, NOT DB columns.
    # Searching on them is not supported; use email and username instead.
    search_fields = ("email", "username")
    ordering = ("-date_joined",)

    # Customize fieldsets for better organization.
    # NOTE: first_name / last_name are encrypted @property accessors – they are NOT
    # real database columns.  Including them in fieldsets causes Django's ModelForm
    # factory to raise FieldError.  We expose them as read-only admin methods below.
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        (
            "Personal Info",
            {"fields": ("display_first_name", "display_last_name"), "description": "Decrypted PII (read-only)"},
        ),
        (
            "Role & Permissions",
            {
                "fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
                "classes": ("collapse",),
            },
        ),
        (
            "Important Dates",
            {
                "fields": ("last_login", "date_joined"),
                "classes": ("collapse",),
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "role", "is_staff", "is_active"),
            },
        ),
    )

    # display_first_name & display_last_name are listed in fieldsets as read-only
    # so they appear in the admin form but don't participate in form saving.
    readonly_fields = ("last_login", "date_joined", "display_first_name", "display_last_name")

    # Add bulk actions
    actions = [
        "activate_users",
        "deactivate_users",
        "approve_and_print_staff_letter",
        "force_password_reset",
        "set_role_customer",
        "set_role_staff",
        export_to_csv,
        export_to_json,
    ]

    def get_full_name_display(self, obj):
        """Display full name or username."""
        full_name = obj.get_full_name()
        return full_name if full_name.strip() else obj.username

    get_full_name_display.short_description = "Name"
    # first_name is an encrypted property – we cannot order by it in the DB.
    # Order by the reliable date_joined column instead.
    get_full_name_display.admin_order_field = "date_joined"

    def display_first_name(self, obj):
        """Read-only decrypted first name for the admin change form."""
        return obj.first_name or "—"

    display_first_name.short_description = "First Name"

    def display_last_name(self, obj):
        """Read-only decrypted last name for the admin change form."""
        return obj.last_name or "—"

    display_last_name.short_description = "Last Name"

    def is_active_display(self, obj):
        """Display active status with color indicator."""
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Active</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ Inactive</span>')

    is_active_display.short_description = "Status"
    is_active_display.admin_order_field = "is_active"

    # Bulk Actions
    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} users activated successfully.", messages.SUCCESS)
        # Log the action
        for user in queryset:
            self._log_admin_action(request, user, "account_unlocked")

    @admin.action(description="Deactivate selected users")
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} users deactivated successfully.", messages.SUCCESS)
        for user in queryset:
            self._log_admin_action(request, user, "account_locked")

    @admin.action(description="Force password reset for selected users")
    def force_password_reset(self, request, queryset):
        """Flag users for password reset (they'll need to reset on next login)."""
        count = 0
        for user in queryset:
            # Set unusable password - user must reset
            user.set_unusable_password()
            user.save()
            self._log_admin_action(request, user, "password_reset")
            count += 1
        self.message_user(
            request,
            f"{count} users flagged for password reset. They will need to reset their password.",
            messages.WARNING,
        )

    @admin.action(description="Set role to Customer")
    def set_role_customer(self, request, queryset):
        updated = queryset.update(role="customer")
        self.message_user(request, f"{updated} users set to Customer role.", messages.SUCCESS)

    @admin.action(description="Set role to Cashier")
    def set_role_staff(self, request, queryset):
        updated = queryset.update(role="cashier")
        self.message_user(request, f"{updated} users set to Cashier role.", messages.SUCCESS)

    def _log_admin_action(self, request, user, action):
        """Log admin action to UserActivity."""
        try:
            UserActivity.objects.create(
                user=user,
                action=action,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                details={"admin_user": request.user.email, "admin_action": True},
            )
        except Exception:
            pass  # Don't fail if logging fails

    @admin.action(description="Approve & Print Staff Welcome Letter")
    def approve_and_print_staff_letter(self, request, queryset):
        """Finalize staff registration and return a printable welcome letter."""
        import secrets

        from django.http import FileResponse

        from core.pdf_services import generate_staff_welcome_letter_pdf

        # Only process staff who are not yet approved
        pending_staff = queryset.filter(is_approved=False, is_staff=True)
        if not pending_staff.exists():
            self.message_user(request, "No pending staff users selected.", messages.WARNING)
            return None

        # For printing, we process one at a time via this action to return a single PDF
        # If multiple are selected, we process the first one and notify the user
        user = pending_staff.first()

        try:
            # 1. Generate random temporary password
            temp_password = secrets.token_urlsafe(8)
            user.set_password(temp_password)

            # 2. Approve and Activate
            user.is_approved = True
            user.is_active = True
            user.save()

            # 3. Log the action
            self._log_admin_action(request, user, "staff_approved_and_printed")

            # 4. Generate PDF
            pdf_buffer = generate_staff_welcome_letter_pdf(user, temp_password)

            filename = f"Staff_Welcome_{user.staff_id or user.username}.pdf"
            return FileResponse(pdf_buffer, as_attachment=False, filename=filename)

        except Exception as e:
            self.message_user(request, f"Error approving staff: {e!s}", messages.ERROR)
            return None

    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")


# =============================================================================
# User Activity Admin
# =============================================================================


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """Admin for viewing user activity logs."""

    list_display = ("user", "action", "ip_address", "get_location_display", "get_device_display", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("user__email", "user__username", "ip_address")
    ordering = ("-created_at",)
    readonly_fields = (
        "user",
        "action",
        "ip_address",
        "get_location_display",
        "get_device_display",
        "user_agent",
        "details",
        "created_at",
    )
    date_hierarchy = "created_at"

    actions = [export_to_csv, export_to_json]

    def get_device_display(self, obj):
        """Extract device name from details or user agent."""
        if obj.details and "device" in obj.details:
            return obj.details["device"]
        # Fallback to simple parser if not in details
        ua = obj.user_agent
        if "Mobile" in ua:
            return "Mobile Device"
        if "Windows" in ua:
            return "Windows PC"
        if "Macintosh" in ua:
            return "Mac"
        if "Linux" in ua:
            return "Linux PC"
        return "Unknown"

    get_device_display.short_description = "Device"

    def get_location_display(self, obj):
        """Extract location from details."""
        if obj.details and "location" in obj.details:
            return obj.details["location"]
        return "-"

    get_location_display.short_description = "Location"

    def details_preview(self, obj):
        """Show preview of details JSON."""
        if obj.details:
            preview = str(obj.details)[:50]
            return preview + "..." if len(str(obj.details)) > 50 else preview
        return "-"

    details_preview.short_description = "Details"

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

    list_display = ("created_at", "user", "action", "model_name", "object_repr", "ip_address")
    list_filter = ("action", "model_name", "created_at")
    search_fields = ("user__email", "model_name", "object_repr", "object_id")
    ordering = ("-created_at",)
    readonly_fields = (
        "user",
        "action",
        "model_name",
        "object_id",
        "object_repr",
        "changes",
        "ip_address",
        "created_at",
    )
    date_hierarchy = "created_at"

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

    list_display = ("title", "notification_type", "priority_display", "is_read", "created_at")
    list_filter = ("notification_type", "priority", "is_read", "created_at")
    search_fields = ("title", "message")
    ordering = ("-created_at",)
    filter_horizontal = ("target_users",)

    actions = ["mark_as_read", "mark_as_unread", export_to_csv, export_to_json]

    def priority_display(self, obj):
        """Display priority with color coding."""
        colors = {
            "low": "gray",
            "medium": "blue",
            "high": "orange",
            "critical": "red",
        }
        color = colors.get(obj.priority, "gray")
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.priority.upper())

    priority_display.short_description = "Priority"
    priority_display.admin_order_field = "priority"

    @admin.action(description="Mark selected as read")
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f"{queryset.count()} notifications marked as read.", messages.SUCCESS)

    @admin.action(description="Mark selected as unread")
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False, read_at=None)
        self.message_user(request, f"{queryset.count()} notifications marked as unread.", messages.SUCCESS)


# =============================================================================
# Admin Site Customization
# =============================================================================

admin.site.site_header = "Coastal Banking Administration"
admin.site.site_title = "Coastal Banking Admin"
admin.site.index_title = "Welcome to Coastal Banking Administration Portal"
