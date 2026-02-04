"""HR and Expense serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.hr import Expense, Payslip


class PayslipSerializer(serializers.ModelSerializer):
    """Serializer for staff payslips."""

    staff_name = serializers.SerializerMethodField()
    staff_id_display = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()
    month_name = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            "id",
            "staff",
            "staff_name",
            "staff_id_display",
            "month",
            "year",
            "month_name",
            "pay_period_start",
            "pay_period_end",
            "base_pay",
            "allowances",
            "overtime_pay",
            "bonuses",
            "gross_pay",
            "ssnit_contribution",
            "tax_deduction",
            "other_deductions",
            "total_deductions",
            "net_salary",
            "pdf_file",
            "download_url",
            "generated_by",
            "generated_by_name",
            "notes",
            "is_paid",
            "paid_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "gross_pay",
            "ssnit_contribution",
            "total_deductions",
            "net_salary",
            "created_at",
            "updated_at",
        ]

    def get_staff_name(self, obj):
        try:
            return obj.staff.get_full_name() if obj.staff else "Unknown Staff"
        except Exception:
            return "Error Loading Name"

    def get_staff_id_display(self, obj):
        try:
            return obj.staff.staff_id if obj.staff else "N/A"
        except Exception:
            return "N/A"

    def get_generated_by_name(self, obj):
        try:
            return obj.generated_by.get_full_name() if obj.generated_by else "System"
        except Exception:
            return "System"

    def get_month_name(self, obj):
        import calendar

        try:
            if obj.month and 1 <= obj.month <= 12:
                return f"{calendar.month_name[obj.month]} {obj.year or ''}"
        except (AttributeError, TypeError, IndexError, KeyError):
            pass
        return f"Month {obj.month} ({obj.year})" if obj.month else "Invalid Date"

    def get_download_url(self, obj):
        try:
            if obj.pdf_file:
                return obj.pdf_file.url
        except (AttributeError, ValueError):
            pass
        return None


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for operational expenses."""

    class Meta:
        model = Expense
        fields = [
            "id",
            "category",
            "description",
            "amount",
            "date",
            "status",
            "transaction",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
