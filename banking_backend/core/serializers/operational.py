"""Operational-related serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.operational import (
    CashAdvance,
    CashDrawer,
    CashDrawerDenomination,
    ClientAssignment,
    Complaint,
    Device,
    ServiceRequest,
)


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


class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
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


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for registered devices."""

    class Meta:
        model = Device
        fields = ["id", "user", "device_token", "device_type", "device_name", "is_active", "last_used_at", "created_at"]
        read_only_fields = ["id", "user", "last_used_at", "created_at"]


class CashAdvanceSerializer(serializers.ModelSerializer):
    """Serializer for cash advance requests."""

    user_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
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
        model = CashDrawerDenomination
        fields = ["id", "denomination", "count", "is_opening", "total"]


class CashDrawerSerializer(serializers.ModelSerializer):
    """Serializer for cash drawer management."""

    cashier_name = serializers.SerializerMethodField()
    denominations = CashDrawerDenominationSerializer(many=True, read_only=True)
    opening_denominations = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    closing_denominations = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
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
        opening_denoms = validated_data.pop("opening_denominations", [])
        drawer = CashDrawer.objects.create(**validated_data)

        for denom in opening_denoms:
            CashDrawerDenomination.objects.create(
                cash_drawer=drawer, denomination=denom.get("denomination"), count=denom.get("count", 0), is_opening=True
            )
        return drawer


class ClientAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for client assignments to mobile bankers."""

    mobile_banker_name = serializers.SerializerMethodField()
    amount_due_formatted = serializers.SerializerMethodField()
    next_visit_formatted = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
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
        validators = []

    def validate(self, attrs):
        """Check for duplicate assignment and return a user-friendly error."""
        mobile_banker = attrs.get("mobile_banker")
        client = attrs.get("client")

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
