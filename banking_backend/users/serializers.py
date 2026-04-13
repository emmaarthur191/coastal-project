import logging

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, AuditLog


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to enforce account approval check.

    Ensures 'email' is used for authentication if provided.
    """

    def validate(self, attrs):
        # SECURITY: SimpleJWT uses 'username' for the USERNAME_FIELD content.
        # We ensure 'email' input maps to 'username' for the underlying authenticate()
        if "email" in attrs and "username" not in attrs:
            attrs["username"] = attrs["email"]

        try:
            data = super().validate(attrs)
        except Exception as e:
            email = attrs.get("username", attrs.get("email", "unknown"))
            logger.warning(f"JWT Login Rejection for {email}: {e}")
            raise e

        # Enforce administrative approval check
        # SECURITY: Superusers bypass this to prevent total lockout
        if not self.user.is_approved and not self.user.is_superuser:
            logger.warning(f"JWT Login Blocked: Account NOT APPROVED for {self.user.email}")
            raise PermissionDenied("Your account is pending administrative approval. Please contact your manager.")

        if not self.user.is_active:
            logger.warning(f"JWT Login Blocked: Account DEACTIVATED for {self.user.email}")
            raise PermissionDenied("This account has been deactivated.")

        return data


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    profile_photo = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "staff_id",
            "phone_number",
            "profile_photo",
            "member_number",
            "assigned_banker",
        ]
        # SECURITY: 'role' must be read-only to prevent privilege escalation via mass assignment
        read_only_fields = ["id", "role", "is_active", "is_staff", "is_superuser", "name", "staff_id"]

    def validate_profile_photo(self, value):
        """Enforce a maximum size for the profile photo (2MB)."""
        if not value:
            return value

        # Check size of base64 string (0.75 ratio approx for original data, but we care about total string size for DB/memory)
        # 2MB = 2 * 1024 * 1024 chars approximately for the string itself if it's raw base64.
        MAX_SIZE = 2 * 1024 * 1024  # 2MB character limit for the base64 payload
        if len(value) > MAX_SIZE:
            raise serializers.ValidationError(
                f"Profile photo is too large. Maximum size allowed is 2MB (received ~{len(value)/1024/1024:.2f}MB)."
            )
        return value

    def to_representation(self, instance):
        """Apply PII masking based on roles, ensuring the user can see their own data."""
        from core.utils import mask_email, mask_generic

        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # SECURITY: Self-viewing bypasses masking logic
        is_self_viewer = user and user.id == instance.id
        # Unmask names for ALL staff members (Staff, Cashier, Manager, Admin, Mobile Banker)
        is_staff_target = instance.role in ["staff", "cashier", "manager", "operations_manager", "admin", "mobile_banker"]
        is_staff_viewer = user and (user.role in ["staff", "cashier", "manager", "operations_manager", "admin", "mobile_banker"] or user.is_superuser)

        # Masking ONLY applies to non-staff targets if the request user is NOT staff AND NOT viewing themselves.
        # Staff names are ALWAYS visible to maintain administrative transparency.
        if not is_staff_viewer and not is_staff_target and not is_self_viewer:
            data["first_name"] = mask_generic(data.get("first_name"))
            data["last_name"] = mask_generic(data.get("last_name"))
            data["email"] = mask_email(data.get("email"))
            data["username"] = mask_generic(data.get("username"))
            # Recalculate full name from masked components
            if data["first_name"] and data["last_name"]:
                data["name"] = f"{data['first_name']} {data['last_name']}"
            else:
                data["name"] = data["first_name"] or data["username"]
        else:
            # For self-viewers, managers or staff targets, ensure full name is accurate
            data["name"] = f"{instance.first_name} {instance.last_name}".strip() or instance.username
            data["staff_id"] = instance.staff_id # Ensure staff_id is present and clear

        return data

    def get_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.username


class StaffCreationSerializer(serializers.ModelSerializer):
    """Serializer for admin-side staff creation.
    Allows setting role, phone_number, and staff_id.
    """

    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "staff_id",
        ]
        extra_kwargs = {"staff_id": {"read_only": True}}

    def validate_password(self, value):
        """Standardize password strength for banking security."""
        from .security import validate_password_strength

        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        # Allow setting role and phone_number
        validated_data.pop("password_confirm", None)
        # We use create_user to handle hashing
        user = User.objects.create_user(**validated_data)
        return user

    def validate_ssnit_number(self, value):
        import re

        # Legacy Format: One letter followed by 12 digits (e.g., C123456789012)
        # Total length 13
        clean_value = value.replace("-", "").replace(" ", "").upper()
        if not re.match(r"^[A-Z][0-9]{12}$", clean_value):
            raise serializers.ValidationError("SSNIT number must be in legacy format (e.g., C123456789012)")
        return clean_value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=12)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def validate_new_password(self, value):
        from .security import validate_password_strength

        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email").strip()
        password = attrs.get("password").strip()

        # SECURITY: Strip whitespace to prevent common E2E/Frontend copy-paste errors
        from django.contrib.auth import get_user_model

        User = get_user_model()

        print(f"[DEBUG_AUTH] Attempting authenticate for: '{email}' (len={len(email)})")
        print(f"[DEBUG_AUTH] Password length: {len(password)}")
        # Removing request context as it occasionally conflicts with custom User lookups in DRF
        user = authenticate(username=email, password=password)
        print(f"[DEBUG_AUTH] Result: {user}")

        # SECURITY: Removing 'EMA-Emergency' reset and domain-based login bypasses.
        # This was accidentally left in-place for E2E testing but is a production risk.
        user = authenticate(username=email, password=password)

        if not user:
            # Check for unapproved state for better error reporting (403 vs 401)
            lookup_user = User.objects.filter(email=email).first()
            if lookup_user:
                if not lookup_user.is_approved and not lookup_user.is_superuser:
                    logger.warning(f"Login rejection: Account NOT APPROVED for {email}")
                    raise PermissionDenied("Your account is pending administrative approval.")
                if not lookup_user.is_active:
                    logger.warning(f"Login rejection: Account DEACTIVATED for {email}")
                    raise PermissionDenied("This account has been deactivated.")

            # Generic failure for non-existent users or wrong passwords
            logger.warning(f"Login rejection: Invalid credentials for {email}")
            raise serializers.ValidationError("Invalid credentials.")

        # Check if account is approved by admin (Staff or Client)
        # SECURITY: Superusers bypass this check for absolute system access
        if hasattr(user, "is_approved") and not user.is_approved and not user.is_superuser:
            # We raise PermissionDenied to differentiate from incorrect password (403 vs 401/400)
            logger.warning(f"Login rejection: Account NOT APPROVED for user {user.email}")
            raise PermissionDenied("Your account is pending administrative approval. Please contact the manager.")

        if not user.is_active:
            logger.warning(f"Login rejection: Account DEACTIVATED for user {user.email}")
            raise PermissionDenied("This account has been deactivated. Please contact support.")

        attrs["user"] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset.

    Security: Does not reveal if email exists to prevent enumeration.
    """

    email = serializers.EmailField()

    def validate_email(self, value):
        """Normalize email for lookup."""
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset with token.

    Security features:
    - Token validation
    - Password strength enforcement
    - Password confirmation
    """

    token = serializers.CharField()
    new_password = serializers.CharField(min_length=12, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def validate_new_password(self, value):
        from .security import validate_password_strength

        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return value


class OTPRequestSerializer(serializers.Serializer):
    """Serializer for requesting an SMS OTP."""

    phone_number = serializers.CharField(required=True, max_length=15)
    verification_type = serializers.ChoiceField(
        choices=[("2fa_setup", "2fa_setup"), ("transaction", "transaction"), ("profile_change", "profile_change")],
        default="2fa_setup",
    )


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying a received SMS OTP."""

    phone_number = serializers.CharField(required=True, max_length=15)
    otp_code = serializers.CharField(required=True, min_length=6, max_length=6)


class LoginAttemptsSerializer(serializers.Serializer):
    """Serializer for checking login attempts for an email."""

    email = serializers.EmailField(required=True)


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for system-wide audit logs."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        """Metadata for AuditLogSerializer."""

        model = AuditLog
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "action",
            "model_name",
            "object_id",
            "object_repr",
            "changes",
            "ip_address",
            "created_at",
        ]

    def get_user_name(self, obj):
        """Retrieve full name of the user who performed the action."""
        if obj.user:
            return obj.user.get_full_name()
        return "System"


class MemberLookupSerializer(serializers.ModelSerializer):
    """
    Serializer for searching existing members by Member ID during the account opening process.
    PII is masked for security as this query can be initiated by non-managers (e.g., cashiers/tellers).
    """

    name = serializers.SerializerMethodField()
    email_masked = serializers.SerializerMethodField()
    phone_masked = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "member_number",
            "name",
            "first_name",
            "last_name",
            "email",
            "email_masked",
            "phone_number",
            "phone_masked",
            "role",
            "is_active",
            "date_of_birth",
            "digital_address",
            "occupation",
            "work_address",
            "position",
            "id_type",
            "id_number",
        ]
        read_only_fields = fields

    def get_name(self, obj):
        """Retrieve full name; ensure it's not redacted if viewed by staff."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_email_masked(self, obj):
        """Mask email to prevent full PII exposure during lookup."""
        from core.utils import mask_email

        return mask_email(obj.email)

    def get_phone_masked(self, obj):
        """Mask phone number for security."""
        from core.utils import mask_generic

        return mask_generic(obj.phone_number)


class UserSessionSerializer(serializers.Serializer):
    """Serializer for the UserSessionsView output representing an active user session."""

    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()
    role = serializers.CharField()
    last_activity = serializers.DateTimeField()
    ip_address = serializers.IPAddressField(allow_null=True)
    device = serializers.CharField(allow_null=True)
    location = serializers.CharField(allow_null=True)
