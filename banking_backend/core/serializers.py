from django.utils import timezone
from rest_framework import serializers

from .models import (
    Account,
    AccountClosureRequest,
    AccountOpeningRequest,
    AccountStatement,
    BankingMessage,
    Device,
    FraudAlert,
    Loan,
    Message,
    MessageThread,
    Payslip,
    ServiceRequest,
    Transaction,
)


class AccountSerializer(serializers.ModelSerializer):
    calculated_balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    account_type_display = serializers.CharField(source="get_account_type_display", read_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "user",
            "account_number",
            "account_type",
            "account_type_display",
            "balance",
            "calculated_balance",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at", "calculated_balance"]

    def validate_balance(self, value):
        if value < 0:
            raise serializers.ValidationError("Balance cannot be negative.")
        return value


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "from_account",
            "to_account",
            "amount",
            "transaction_type",
            "description",
            "status",
            "timestamp",
            "processed_at",
        ]
        read_only_fields = ["id", "timestamp", "processed_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs):
        transaction_type = attrs.get("transaction_type")
        from_account = attrs.get("from_account")
        to_account = attrs.get("to_account")

        if transaction_type == "transfer":
            if not from_account or not to_account:
                raise serializers.ValidationError("Transfer requires both from_account and to_account.")
            if from_account == to_account:
                raise serializers.ValidationError("Cannot transfer to the same account.")
        elif transaction_type in ["withdrawal", "payment"]:
            if not from_account:
                raise serializers.ValidationError(f"{transaction_type} requires from_account.")
        elif transaction_type == "deposit":
            if not to_account:
                raise serializers.ValidationError("Deposit requires to_account.")

        return attrs


class LoanSerializer(serializers.ModelSerializer):
    borrower_name = serializers.SerializerMethodField()
    borrower_email = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "user",
            "borrower_name",
            "borrower_email",
            "amount",
            "interest_rate",
            "term_months",
            "purpose",
            "date_of_birth",
            "id_type",
            "id_number",
            "digital_address",
            "town",
            "city",
            "next_of_kin_1_name",
            "next_of_kin_1_relationship",
            "next_of_kin_1_phone",
            "next_of_kin_1_address",
            "next_of_kin_2_name",
            "next_of_kin_2_relationship",
            "next_of_kin_2_phone",
            "next_of_kin_2_address",
            "guarantor_1_name",
            "guarantor_1_id_type",
            "guarantor_1_id_number",
            "guarantor_1_phone",
            "guarantor_1_address",
            "guarantor_2_name",
            "guarantor_2_id_type",
            "guarantor_2_id_number",
            "guarantor_2_phone",
            "guarantor_2_address",
            "monthly_income",
            "employment_status",
            "outstanding_balance",
            "status",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "outstanding_balance",
            "approved_at",
            "created_at",
            "updated_at",
            "borrower_name",
            "borrower_email",
        ]

    def get_borrower_name(self, obj):
        return obj.user.get_full_name() if obj.user else "Unknown"

    def get_borrower_email(self, obj):
        return obj.user.email if obj.user else ""

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Loan amount must be positive.")
        return value

    def validate_interest_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Interest rate must be between 0 and 100.")
        return value

    def validate_term_months(self, value):
        if value <= 0:
            raise serializers.ValidationError("Term must be positive.")
        return value


class FraudAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudAlert
        fields = ["id", "user", "message", "severity", "is_resolved", "resolved_at", "created_at"]
        read_only_fields = ["id", "resolved_at", "created_at"]

    def update(self, instance, validated_data):
        if validated_data.get("is_resolved") and not instance.is_resolved:
            validated_data["resolved_at"] = timezone.now()
        return super().update(instance, validated_data)


class FraudRuleSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import FraudRule

        model = FraudRule
        fields = [
            "id",
            "name",
            "description",
            "rule_type",
            "severity",
            "field",
            "operator",
            "value",
            "additional_conditions",
            "is_active",
            "auto_block",
            "require_approval",
            "escalation_threshold",
            "trigger_count",
            "false_positive_count",
            "last_triggered",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "trigger_count", "false_positive_count", "last_triggered", "created_at", "updated_at"]


class BankingMessageSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BankingMessage
        fields = [
            "id",
            "user",
            "subject",
            "body",
            "is_read",
            "read_at",
            "thread_id",
            "parent_message",
            "replies",
            "created_at",
        ]
        read_only_fields = ["id", "read_at", "created_at", "thread_id"]

    def get_replies(self, obj):
        if obj.replies.exists():
            return BankingMessageSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def update(self, instance, validated_data):
        if validated_data.get("is_read") and not instance.is_read:
            validated_data["read_at"] = timezone.now()
        return super().update(instance, validated_data)


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = [
            "id",
            "user",
            "request_type",
            "description",
            "delivery_method",
            "status",
            "admin_notes",
            "processed_by",
            "processed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "admin_notes",
            "processed_by",
            "processed_at",
            "created_at",
            "updated_at",
        ]

    def validate_request_type(self, value):
        valid_types = [choice[0] for choice in ServiceRequest.REQUEST_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid request type. Must be one of: {valid_types}")
        return value


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Refund

        model = Refund
        fields = [
            "id",
            "user",
            "transaction",
            "amount",
            "reason",
            "description",
            "status",
            "admin_notes",
            "processed_by",
            "processed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "admin_notes",
            "processed_by",
            "processed_at",
            "created_at",
            "updated_at",
        ]


class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Complaint

        model = Complaint
        fields = [
            "id",
            "user",
            "category",
            "priority",
            "subject",
            "description",
            "status",
            "resolution",
            "assigned_to",
            "resolved_by",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "resolution",
            "assigned_to",
            "resolved_by",
            "resolved_at",
            "created_at",
            "updated_at",
        ]


class AccountOpeningRequestSerializer(serializers.ModelSerializer):
    """Serializer for account opening requests."""

    class Meta:
        model = AccountOpeningRequest
        fields = [
            "id",
            "account_type",
            "card_type",
            "id_type",
            "id_number",
            "first_name",
            "last_name",
            "date_of_birth",
            "nationality",
            "address",
            "phone_number",
            "email",
            "occupation",
            "work_address",
            "position",
            "digital_address",
            "location",
            "next_of_kin_data",
            "photo",
            "status",
            "processed_by",
            "submitted_by",
            "created_account",
            "credentials_approved_by",
            "credentials_sent_at",
            "rejection_reason",
            "notes",
            "created_at",
            "updated_at",
            "approved_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "processed_by",
            "submitted_by",
            "created_account",
            "credentials_approved_by",
            "credentials_sent_at",
            "rejection_reason",
            "notes",
            "created_at",
            "updated_at",
            "approved_at",
        ]

    def validate_phone_number(self, value):
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        return value


class AccountClosureRequestSerializer(serializers.ModelSerializer):
    """Serializer for account closure requests."""

    account_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = AccountClosureRequest
        fields = [
            "id",
            "account",
            "account_id",
            "closure_reason",
            "other_reason",
            "phone_number",
            "otp_verified",
            "status",
            "processed_by",
            "submitted_by",
            "rejection_reason",
            "notes",
            "final_balance",
            "created_at",
            "updated_at",
            "closed_at",
        ]
        read_only_fields = [
            "id",
            "account",
            "status",
            "processed_by",
            "submitted_by",
            "rejection_reason",
            "notes",
            "final_balance",
            "created_at",
            "updated_at",
            "closed_at",
        ]

    def create(self, validated_data):
        account_id = validated_data.pop("account_id")
        try:
            account = Account.objects.get(id=account_id)
            validated_data["account"] = account
            validated_data["final_balance"] = account.balance
            return super().create(validated_data)
        except Account.DoesNotExist:
            raise serializers.ValidationError({"account_id": "Account not found."})


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages."""

    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()
    is_read_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "thread",
            "sender",
            "sender_name",
            "sender_email",
            "content",
            "encrypted_content",
            "iv",
            "auth_tag",
            "message_type",
            "is_system_message",
            "attachment_url",
            "attachment_name",
            "created_at",
            "edited_at",
            "is_read_by_me",
        ]
        read_only_fields = ["id", "sender", "created_at", "edited_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else "System"

    def get_sender_email(self, obj):
        return obj.sender.email if obj.sender else None

    def get_is_read_by_me(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return request.user in obj.read_by.all()
        return False


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for message threads."""

    messages = serializers.SerializerMethodField()
    participant_list = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    participant_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = MessageThread
        fields = [
            "id",
            "subject",
            "thread_type",
            "participants",
            "participant_list",
            "participant_ids",
            "created_by",
            "created_by_name",
            "is_archived",
            "is_pinned",
            "last_message_at",
            "created_at",
            "updated_at",
            "messages",
            "unread_count",
            "last_message_preview",
        ]
        read_only_fields = ["id", "created_by", "last_message_at", "created_at", "updated_at"]

    def get_messages(self, obj):
        # Return last 50 messages
        messages = obj.messages.order_by("-created_at")[:50][::-1]
        return [
            {
                "id": m.id,
                "sender": m.sender.id if m.sender else None,
                "sender_name": m.sender.get_full_name() if m.sender else "System",
                "content": m.content or m.encrypted_content or "",
                "encrypted_content": m.encrypted_content,
                "iv": m.iv,
                "auth_tag": m.auth_tag,
                "message_type": m.message_type,
                "created_at": m.created_at.isoformat(),
                "is_system_message": m.is_system_message,
            }
            for m in messages
        ]

    def get_participant_list(self, obj):
        return [
            {"id": p.id, "name": p.get_full_name(), "email": p.email, "role": p.role} for p in obj.participants.all()
        ]

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request and request.user:
            return obj.messages.exclude(read_by=request.user).count()
        return 0

    def get_last_message_preview(self, obj):
        last = obj.last_message
        if last:
            content_preview = (last.content or last.encrypted_content or "")[:100]
            # Ensure we return a string prefix if needed, or stick to object but ensure Swagger docs are clear
            return f"{last.sender.get_full_name() if last.sender else 'System'}: {content_preview}"
        return ""

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for registered devices."""

    class Meta:
        model = Device
        fields = ["id", "user", "device_token", "device_type", "device_name", "is_active", "last_used_at", "created_at"]
        read_only_fields = ["id", "user", "last_used_at", "created_at"]


# ============================================
# CASHIER DASHBOARD SERIALIZERS
# ============================================


class CashAdvanceSerializer(serializers.ModelSerializer):
    """Serializer for cash advance requests."""

    user_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        from .models import CashAdvance

        model = CashAdvance
        fields = [
            "id",
            "user",
            "user_name",
            "amount",
            "reason",
            "status",
            "approved_by",
            "approved_by_name",
            "repayment_date",
            "repaid_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "approved_by", "repaid_at", "created_at", "updated_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None


class CashDrawerDenominationSerializer(serializers.ModelSerializer):
    """Serializer for cash drawer denominations."""

    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        from .models import CashDrawerDenomination

        model = CashDrawerDenomination
        fields = ["id", "denomination", "count", "is_opening", "total"]


class CashDrawerSerializer(serializers.ModelSerializer):
    """Serializer for cash drawer management."""

    cashier_name = serializers.SerializerMethodField()
    denominations = CashDrawerDenominationSerializer(many=True, read_only=True)
    opening_denominations = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    closing_denominations = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        from .models import CashDrawer

        model = CashDrawer
        fields = [
            "id",
            "cashier",
            "cashier_name",
            "drawer_number",
            "opening_balance",
            "current_balance",
            "closing_balance",
            "expected_balance",
            "variance",
            "status",
            "opened_at",
            "closed_at",
            "notes",
            "denominations",
            "opening_denominations",
            "closing_denominations",
        ]
        read_only_fields = ["id", "cashier", "opened_at", "closed_at", "variance"]

    def get_cashier_name(self, obj):
        return obj.cashier.get_full_name() if obj.cashier else None

    def create(self, validated_data):
        from .models import CashDrawer, CashDrawerDenomination

        opening_denoms = validated_data.pop("opening_denominations", [])
        drawer = CashDrawer.objects.create(**validated_data)

        for denom in opening_denoms:
            CashDrawerDenomination.objects.create(
                cash_drawer=drawer, denomination=denom.get("denomination"), count=denom.get("count", 0), is_opening=True
            )
        return drawer


class CheckDepositSerializer(serializers.ModelSerializer):
    """Serializer for check deposits."""

    account_number = serializers.CharField(source="account.id", read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        from .models import CheckDeposit

        model = CheckDeposit
        fields = [
            "id",
            "account",
            "account_number",
            "amount",
            "check_number",
            "bank_name",
            "routing_number",
            "front_image",
            "back_image",
            "status",
            "rejection_reason",
            "processed_by",
            "processed_by_name",
            "created_at",
            "processed_at",
            "cleared_at",
        ]
        read_only_fields = ["id", "processed_by", "processed_at", "cleared_at", "created_at"]

    def get_processed_by_name(self, obj):
        return obj.processed_by.get_full_name() if obj.processed_by else None


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for bank products."""

    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)

    class Meta:
        from .models import Product

        model = Product
        fields = [
            "id",
            "name",
            "product_type",
            "product_type_display",
            "description",
            "interest_rate",
            "minimum_balance",
            "maximum_balance",
            "features",
            "terms_and_conditions",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PromotionSerializer(serializers.ModelSerializer):
    """Serializer for promotions."""

    is_currently_active = serializers.BooleanField(read_only=True)
    eligible_product_names = serializers.SerializerMethodField()

    class Meta:
        from .models import Promotion

        model = Promotion
        fields = [
            "id",
            "name",
            "description",
            "discount_percentage",
            "bonus_amount",
            "start_date",
            "end_date",
            "is_active",
            "is_currently_active",
            "eligible_products",
            "eligible_product_names",
            "terms_and_conditions",
            "max_enrollments",
            "current_enrollments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "current_enrollments", "created_at", "updated_at"]

    def get_eligible_product_names(self, obj):
        return [p.name for p in obj.eligible_products.all()]


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for report templates."""

    report_type_display = serializers.CharField(source="get_report_type_display", read_only=True)
    type = serializers.CharField(source="report_type", read_only=True)

    class Meta:
        from .models import ReportTemplate

        model = ReportTemplate
        fields = [
            "id",
            "name",
            "report_type",
            "type",
            "report_type_display",
            "description",
            "default_parameters",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for generated reports."""

    template_name = serializers.CharField(source="template.name", read_only=True)
    generated_by_name = serializers.SerializerMethodField()
    format_display = serializers.CharField(source="get_format_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    report_url = serializers.CharField(source="file_url", read_only=True)
    type = serializers.CharField(source="report_type", read_only=True)
    generated_at = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        from .models import Report

        model = Report
        fields = [
            "id",
            "template",
            "template_name",
            "title",
            "report_type",
            "format",
            "format_display",
            "status",
            "status_display",
            "file_url",
            "report_url",
            "type",
            "generated_at",
            "file_path",
            "file_size",
            "generated_by",
            "generated_by_name",
            "parameters",
            "error_message",
            "created_at",
            "completed_at",
        ]
        read_only_fields = [
            "id",
            "generated_by",
            "file_url",
            "file_path",
            "file_size",
            "error_message",
            "created_at",
            "completed_at",
        ]

    def get_generated_by_name(self, obj):
        return obj.generated_by.get_full_name() if obj.generated_by else None


class ReportScheduleSerializer(serializers.ModelSerializer):
    """Serializer for report schedules."""

    template_name = serializers.CharField(source="template.name", read_only=True)
    frequency_display = serializers.CharField(source="get_frequency_display", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        from .models import ReportSchedule

        model = ReportSchedule
        fields = [
            "id",
            "template",
            "template_name",
            "name",
            "frequency",
            "frequency_display",
            "day_of_week",
            "day_of_month",
            "time_of_day",
            "format",
            "parameters",
            "email_recipients",
            "is_active",
            "last_run",
            "next_run",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "last_run", "next_run", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class PerformanceMetricSerializer(serializers.ModelSerializer):
    """Serializer for performance metrics."""

    metric_type_display = serializers.CharField(source="get_metric_type_display", read_only=True)

    class Meta:
        from .models import PerformanceMetric

        model = PerformanceMetric
        fields = ["id", "metric_type", "metric_type_display", "value", "unit", "endpoint", "recorded_at"]
        read_only_fields = ["id", "recorded_at"]


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for system health records."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        from .models import SystemHealth

        model = SystemHealth
        fields = ["id", "service_name", "status", "status_display", "response_time_ms", "details", "checked_at"]
        read_only_fields = ["id", "checked_at"]


class UserMessagePreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user message preferences."""

    class Meta:
        from .models import UserMessagePreference

        model = UserMessagePreference
        fields = [
            "id",
            "user",
            "sound_enabled",
            "notification_sound",
            "read_receipts_enabled",
            "typing_indicators_enabled",
            "last_seen_visible",
            "auto_delete_enabled",
            "auto_delete_days",
            "markdown_enabled",
            "emoji_shortcuts_enabled",
            "font_size",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class BlockedUserSerializer(serializers.ModelSerializer):
    """Serializer for blocked users."""

    blocker_username = serializers.CharField(source="blocker.username", read_only=True)
    blocked_username = serializers.CharField(source="blocked.username", read_only=True)
    blocked_full_name = serializers.SerializerMethodField()

    class Meta:
        from .models import BlockedUser

        model = BlockedUser
        fields = [
            "id",
            "blocker",
            "blocked",
            "blocker_username",
            "blocked_username",
            "blocked_full_name",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "blocker", "created_at"]

    def get_blocked_full_name(self, obj):
        return obj.blocked.get_full_name() if obj.blocked else None


class ClientAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for client assignments to mobile bankers."""

    mobile_banker_name = serializers.SerializerMethodField()
    amount_due_formatted = serializers.SerializerMethodField()
    next_visit_formatted = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        from .models import ClientAssignment

        model = ClientAssignment
        fields = [
            "id",
            "mobile_banker",
            "mobile_banker_name",
            "client",
            "client_name",
            "location",
            "status",
            "status_display",
            "amount_due",
            "amount_due_formatted",
            "next_visit",
            "next_visit_formatted",
            "priority",
            "priority_display",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        # Disable built-in unique_together validators so we can provide a custom message
        validators = []

    def validate(self, attrs):
        """Check for duplicate assignment and return a user-friendly error."""
        from .models import ClientAssignment

        mobile_banker = attrs.get("mobile_banker")
        client = attrs.get("client")

        # Only check on create (self.instance is None)
        if self.instance is None and mobile_banker and client:
            if ClientAssignment.objects.filter(mobile_banker=mobile_banker, client=client).exists():
                client_name = client.get_full_name() or client.email
                banker_name = mobile_banker.get_full_name() or mobile_banker.email
                raise serializers.ValidationError(
                    f"Client '{client_name}' is already assigned to banker '{banker_name}'. "
                    "Please reassign instead of creating a new assignment."
                )
        return attrs

    def get_mobile_banker_name(self, obj):
        return obj.mobile_banker.get_full_name() if obj.mobile_banker else None

    def get_amount_due_formatted(self, obj):
        if obj.amount_due:
            return f"GHS {obj.amount_due:,.2f}"
        return None

    def get_next_visit_formatted(self, obj):
        if obj.next_visit:
            from django.utils import timezone

            now = timezone.now()
            if obj.next_visit.date() == now.date():
                return f"Today {obj.next_visit.strftime('%I:%M %p')}"
            elif obj.next_visit.date() == (now + timezone.timedelta(days=1)).date():
                return f"Tomorrow {obj.next_visit.strftime('%I:%M %p')}"
            return obj.next_visit.strftime("%b %d, %I:%M %p")
        return "ASAP"


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


class AccountStatementSerializer(serializers.ModelSerializer):
    """Serializer for auto-generated account statements."""

    account_number = serializers.CharField(source="account.account_number", read_only=True)
    account_type_display = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = AccountStatement
        fields = [
            "id",
            "account",
            "account_number",
            "account_type_display",
            "requested_by",
            "requested_by_name",
            "start_date",
            "end_date",
            "status",
            "status_display",
            "pdf_file",
            "download_url",
            "transaction_count",
            "opening_balance",
            "closing_balance",
            "created_at",
            "generated_at",
        ]
        read_only_fields = [
            "id",
            "transaction_count",
            "opening_balance",
            "closing_balance",
            "created_at",
            "generated_at",
        ]

    def get_account_type_display(self, obj):
        return obj.account.get_account_type_display() if obj.account else None

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() if obj.requested_by else None

    def get_download_url(self, obj):
        if obj.pdf_file:
            return obj.pdf_file.url
        return None
