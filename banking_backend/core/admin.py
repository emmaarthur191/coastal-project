"""Django Admin configuration for core banking models.
Features: Enhanced displays, filters, export capabilities.
"""

import csv
import json
from datetime import datetime
from decimal import Decimal

from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html

from .models import Account, BankingMessage, FraudAlert, Loan, Transaction

# =============================================================================
# Export Utilities
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
            # Handle Decimal and datetime
            if isinstance(value, Decimal):
                value = str(value)
            elif hasattr(value, "isoformat"):
                value = value.isoformat()
            row.append(str(value) if value is not None else "")
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
            if isinstance(value, Decimal):
                value = str(value)
            elif hasattr(value, "isoformat"):
                value = value.isoformat()
            item[field] = value if value is not None else None
        data.append(item)

    response = HttpResponse(json.dumps(data, indent=2, default=str), content_type="application/json")
    response["Content-Disposition"] = (
        f'attachment; filename={meta.model_name}_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    )
    return response


export_to_json.short_description = "Export selected to JSON"


# =============================================================================
# Account Admin
# =============================================================================


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    """Admin for managing bank accounts."""

    list_display = ("account_number", "user", "account_type", "balance_display", "is_active_display", "created_at")
    list_filter = ("account_type", "is_active", "created_at")
    search_fields = ("account_number", "user__email", "user__username")
    ordering = ("-created_at",)
    readonly_fields = ("account_number", "created_at", "updated_at")
    date_hierarchy = "created_at"

    actions = [
        "activate_accounts",
        "deactivate_accounts",
        export_to_csv,
        export_to_json,
    ]

    def balance_display(self, obj):
        """Display balance with currency formatting."""
        balance = float(obj.balance) if obj.balance is not None else 0.0
        return format_html("<strong>GH₵ {:,.2f}</strong>", balance)

    balance_display.short_description = "Balance"
    balance_display.admin_order_field = "balance"

    def is_active_display(self, obj):
        """Display active status with color."""
        if obj.is_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')

    is_active_display.short_description = "Status"

    @admin.action(description="Activate selected accounts")
    def activate_accounts(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected accounts")
    def deactivate_accounts(self, request, queryset):
        queryset.update(is_active=False)


# =============================================================================
# Transaction Admin
# =============================================================================


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin for viewing transactions."""

    list_display = (
        "id",
        "transaction_type",
        "amount_display",
        "from_account",
        "to_account",
        "status_display",
        "timestamp",
    )
    list_filter = ("transaction_type", "status", "timestamp")
    search_fields = ("from_account__account_number", "to_account__account_number", "description")
    ordering = ("-timestamp",)
    readonly_fields = ("timestamp", "processed_at")
    date_hierarchy = "timestamp"

    actions = [
        "mark_completed",
        "mark_failed",
        export_to_csv,
        export_to_json,
    ]

    def amount_display(self, obj):
        """Display amount with currency formatting."""
        amount = float(obj.amount) if obj.amount is not None else 0.0
        return format_html("GH₵ {:,.2f}", amount)

    amount_display.short_description = "Amount"
    amount_display.admin_order_field = "amount"

    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            "pending": "orange",
            "completed": "green",
            "failed": "red",
            "cancelled": "gray",
        }
        color = colors.get(obj.status, "gray")
        return format_html('<span style="color: {};">{}</span>', color, obj.status.title())

    status_display.short_description = "Status"
    status_display.admin_order_field = "status"

    @admin.action(description="Mark selected as Completed")
    def mark_completed(self, request, queryset):
        from django.utils import timezone

        queryset.filter(status="pending").update(status="completed", processed_at=timezone.now())

    @admin.action(description="Mark selected as Failed")
    def mark_failed(self, request, queryset):
        from django.utils import timezone

        queryset.filter(status="pending").update(status="failed", processed_at=timezone.now())


# =============================================================================
# Loan Admin
# =============================================================================


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    """Admin for managing loans."""

    list_display = (
        "id",
        "user",
        "amount_display",
        "interest_rate",
        "term_months",
        "outstanding_display",
        "status_display",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("user__email", "user__username")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "approved_at")
    date_hierarchy = "created_at"

    actions = [
        "approve_loans",
        "reject_loans",
        export_to_csv,
        export_to_json,
    ]

    def amount_display(self, obj):
        amount = float(obj.amount) if obj.amount is not None else 0.0
        return format_html("GH₵ {:,.2f}", amount)

    amount_display.short_description = "Amount"
    amount_display.admin_order_field = "amount"

    def outstanding_display(self, obj):
        outstanding = float(obj.outstanding_balance) if obj.outstanding_balance is not None else 0.0
        return format_html("GH₵ {:,.2f}", outstanding)

    outstanding_display.short_description = "Outstanding"
    outstanding_display.admin_order_field = "outstanding_balance"

    def status_display(self, obj):
        colors = {
            "pending": "orange",
            "approved": "blue",
            "active": "green",
            "paid_off": "darkgreen",
            "defaulted": "red",
            "rejected": "gray",
        }
        color = colors.get(obj.status, "gray")
        return format_html('<span style="color: {};">{}</span>', color, obj.status.title())

    status_display.short_description = "Status"

    @admin.action(description="Approve selected loans")
    def approve_loans(self, request, queryset):
        from django.utils import timezone

        queryset.filter(status="pending").update(status="approved", approved_at=timezone.now())

    @admin.action(description="Reject selected loans")
    def reject_loans(self, request, queryset):
        queryset.filter(status="pending").update(status="rejected")


# =============================================================================
# Fraud Alert Admin
# =============================================================================


@admin.register(FraudAlert)
class FraudAlertAdmin(admin.ModelAdmin):
    """Admin for managing fraud alerts."""

    list_display = ("id", "user", "severity_display", "message_preview", "is_resolved", "created_at")
    list_filter = ("severity", "is_resolved", "created_at")
    search_fields = ("user__email", "message")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "resolved_at")
    date_hierarchy = "created_at"

    actions = [
        "resolve_alerts",
        "unresolve_alerts",
        export_to_csv,
        export_to_json,
    ]

    def severity_display(self, obj):
        colors = {
            "low": "gray",
            "medium": "orange",
            "high": "darkorange",
            "critical": "red",
        }
        color = colors.get(obj.severity, "gray")
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.severity.upper())

    severity_display.short_description = "Severity"
    severity_display.admin_order_field = "severity"

    def message_preview(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message

    message_preview.short_description = "Message"

    @admin.action(description="Mark selected as resolved")
    def resolve_alerts(self, request, queryset):
        from django.utils import timezone

        queryset.update(is_resolved=True, resolved_at=timezone.now())

    @admin.action(description="Mark selected as unresolved")
    def unresolve_alerts(self, request, queryset):
        queryset.update(is_resolved=False, resolved_at=None)


# =============================================================================
# Banking Message Admin
# =============================================================================


@admin.register(BankingMessage)
class BankingMessageAdmin(admin.ModelAdmin):
    """Admin for managing banking messages."""

    list_display = ("id", "user", "subject", "is_read", "thread_id", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("user__email", "subject", "body", "thread_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "read_at", "thread_id")
    date_hierarchy = "created_at"

    actions = [
        "mark_as_read",
        "mark_as_unread",
        export_to_csv,
        export_to_json,
    ]

    @admin.action(description="Mark selected as read")
    def mark_as_read(self, request, queryset):
        from django.utils import timezone

        queryset.update(is_read=True, read_at=timezone.now())

    @admin.action(description="Mark selected as unread")
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False, read_at=None)
