"""Account-related serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.accounts import Account, AccountClosureRequest, AccountOpeningRequest


class AccountSerializer(serializers.ModelSerializer):
    """Serializer for existing banking accounts."""

    customer_name = serializers.SerializerMethodField()
    calculated_balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    account_type_display = serializers.CharField(source="get_account_type_display", read_only=True)

    class Meta:
        """Metadata for AccountSerializer."""

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
            "customer_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "account_number",
            "balance",
            "created_at",
            "updated_at",
            "calculated_balance",
            "customer_name",
        ]

    def get_customer_name(self, obj):
        """Return the customer's full name."""
        if obj.user:
            return obj.user.get_full_name()
        return "Unknown"

    def validate_balance(self, value):
        """Ensure balance remains non-negative."""
        if value < 0:
            raise serializers.ValidationError("Balance cannot be negative.")
        return value


class AccountOpeningRequestSerializer(serializers.ModelSerializer):
    """Serializer for account opening requests."""

    full_name = serializers.SerializerMethodField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=True, allow_blank=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    id_type = serializers.CharField(required=False, allow_blank=True)
    id_number = serializers.CharField(required=False, allow_blank=True)

    def to_internal_value(self, data):
        """Handle nested account_data and field aliases."""
        if "account_data" in data and isinstance(data["account_data"], dict):
            # Merge nested account_data into top level if present
            account_data = data["account_data"]
            for key, value in account_data.items():
                if key not in data:
                    data[key] = value

        # Handle common aliases used in tests and legacy flows
        mapping = {
            "firstName": "first_name",
            "lastName": "last_name",
            "phoneNumber": "phone_number",
            "idType": "id_type",
            "idNumber": "id_number",
            "accountType": "account_type",
            "identification_type": "id_type",
            "identification_number": "id_number",
        }
        for old_key, new_key in mapping.items():
            if old_key in data and new_key not in data:
                data[new_key] = data[old_key]

        return super().to_internal_value(data)

    class Meta:
        """Metadata for AccountOpeningRequestSerializer."""

        model = AccountOpeningRequest
        fields = [
            "id",
            "existing_member",
            "account_type",
            "card_type",
            "id_type",
            "id_number",
            "first_name",
            "last_name",
            "date_of_birth",
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
            "full_name",
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
            "full_name",
            "processed_by",
            "submitted_by",
            "created_account",
            "credentials_approved_by",
            "credentials_sent_at",
            "rejection_reason",
            "notes",
            "created_at",
            "approved_at",
        ]

    def validate(self, data):
        """Ensure either existing_member is provided or all PII fields are present."""
        existing_member = data.get("existing_member")
        if not existing_member:
            required_pii = ["first_name", "last_name", "phone_number", "id_type", "id_number"]
            errors = {}
            for field in required_pii:
                if not data.get(field):
                    errors[field] = "This field is required for new member registration."
            if errors:
                raise serializers.ValidationError(errors)
        return data

    def get_full_name(self, obj):
        """Return the full name of the applicant."""
        if obj.first_name or obj.last_name:
            return f"{obj.first_name or ''} {obj.last_name or ''}".strip()
        return "Unknown"

    def validate_phone_number(self, value):
        """Ensure phone number is provided."""
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
            mask_email,
            mask_generic,
            mask_id_number,
            mask_phone_number,
        )

        data = super().to_representation(instance)
        request = self.context.get("request")
        user = request.user if request else None

        # Determine if user has permission to view full PII
        # Authorized roles: operations_manager, manager, admin (and superusers/staff)
        is_staff_gate = user and (user.is_superuser or getattr(user, "is_staff", False))
        user_role = str(getattr(user, "role", "customer")).lower()
        AUTHORIZED_ROLES = ["admin", "manager", "operations_manager"]
        
        can_view_pii = is_staff_gate or (user_role in AUTHORIZED_ROLES)

        if not can_view_pii:
            # Mask ID number
            data["id_number"] = mask_id_number(data.get("id_number"))
            # Mask phone number
            data["phone_number"] = mask_phone_number(data.get("phone_number"))
            # Mask email
            data["email"] = mask_email(data.get("email"))
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
    account_number = serializers.CharField(source="account.account_number", read_only=True)
    customer_name = serializers.CharField(source="account.user.get_full_name", read_only=True)

    class Meta:
        """Metadata for AccountClosureRequestSerializer."""

        model = AccountClosureRequest
        fields = [
            "id",
            "account",
            "account_id",
            "account_number",
            "customer_name",
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
        """Create a closure request and verify account ownership."""
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
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Account not found or access denied.")

class StaffAccountListSerializer(serializers.ModelSerializer):
    """Serializer for staff dashboard account listing with PII masking."""

    user = serializers.SerializerMethodField()
    account_type_display = serializers.CharField(source="get_account_type_display", read_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "account_number",
            "account_type",
            "account_type_display",
            "balance",
            "is_active",
            "created_at",
            "user",
        ]

    def get_user(self, obj):
        if not obj.user:
            return None
        from core.utils import mask_email, mask_phone_number
        return {
            "id": str(obj.user.id),
            "email": mask_email(obj.user.email),
            "full_name": obj.user.get_full_name(),
            "phone": mask_phone_number(obj.user.phone_number),
        }
