"""Account-related serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.accounts import Account, AccountClosureRequest, AccountOpeningRequest


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
        read_only_fields = ["id", "user", "balance", "created_at", "updated_at", "calculated_balance"]

    def validate_balance(self, value):
        if value < 0:
            raise serializers.ValidationError("Balance cannot be negative.")
        return value


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

    def validate_email(self, value):
        """Validate that email is provided for customer login credentials."""
        if not value:
            raise serializers.ValidationError("Customer email is required for login credentials.")
        return value

    def to_representation(self, instance):
        """Apply PII masking to sensitive fields in API responses based on user role."""
        from core.utils.pii_masking import (
            mask_date_of_birth,
            mask_generic,
            mask_id_number,
            mask_phone_number,
        )

        data = super().to_representation(instance)
        request = self.context.get("request")
        user = request.user if request else None

        # Determine if user has permission to view full PII
        # Roles: 'admin', 'manager', 'operations_manager' can view PII
        can_view_pii = user and (user.role in ["admin", "manager", "operations_manager"] or user.is_superuser)

        if not can_view_pii:
            # Mask ID number
            data["id_number"] = mask_id_number(data.get("id_number"))
            # Mask phone number
            data["phone_number"] = mask_phone_number(data.get("phone_number"))
            # Mask date of birth
            data["date_of_birth"] = mask_date_of_birth(data.get("date_of_birth"))
            # Mask address/location/employment info
            data["address"] = mask_generic(data.get("address"))
            data["occupation"] = mask_generic(data.get("occupation"))
            data["work_address"] = mask_generic(data.get("work_address"))
            data["position"] = mask_generic(data.get("position"))
            data["digital_address"] = mask_generic(data.get("digital_address"))
            data["location"] = mask_generic(data.get("location"))
            # Mask next of kin
            if data.get("next_of_kin_data"):
                data["next_of_kin_data"] = {"relationship": "REDACTED", "contact": mask_phone_number(None)}
            # Mask photo
            if data.get("photo"):
                data["photo"] = "[ENCRYPTED_PII_PHOTO]"

        return data


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
        user = self.context["request"].user
        try:
            # SECURITY FIX: Ensure the account belongs to the authenticated user
            account = Account.objects.get(id=account_id, user=user)
            validated_data["account"] = account
            validated_data["final_balance"] = account.balance
            validated_data["submitted_by"] = user
            return super().create(validated_data)
        except Account.DoesNotExist:
            raise serializers.ValidationError({"account_id": "Account not found or access denied."})
