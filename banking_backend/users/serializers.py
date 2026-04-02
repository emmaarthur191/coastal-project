import logging

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


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
        ]
        # SECURITY: 'role' must be read-only to prevent privilege escalation via mass assignment
        read_only_fields = ["id", "role", "is_active", "is_staff", "is_superuser", "name"]

    def to_representation(self, instance):
        """Apply PII masking based on roles."""
        from core.utils import mask_email, mask_generic

        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Standard staff (non-managers/non-admins) see masked names
        is_manager = user and (user.role in ["manager", "operations_manager", "admin"] or user.is_superuser)

        if not is_manager:
            data["first_name"] = mask_generic(data.get("first_name"))
            data["last_name"] = mask_generic(data.get("last_name"))
            data["email"] = mask_email(data.get("email"))
            data["username"] = mask_generic(data.get("username"))
            # Recalculate full name from masked components
            if data["first_name"] and data["last_name"]:
                data["name"] = f"{data['first_name']} {data['last_name']}"
            else:
                data["name"] = data["first_name"] or data["username"]

        return data

    def get_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.username


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=True, max_length=15)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "first_name", "last_name", "phone_number"]

    def validate_phone_number(self, value):
        """Standardize and validate phone number format."""
        import re

        # Basic regex for international format (+ followed by digits)
        if not re.match(r"^\+[1-9]\d{1,14}$", value):
            raise serializers.ValidationError("Phone number must be in international format (e.g. +233244123456).")
        return value

    def validate_password(self, value):
        """Validate password strength for banking security."""
        from .security import validate_password_strength

        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class StaffCreationSerializer(UserRegistrationSerializer):
    """Serializer for admin-side staff creation.
    Allows setting role, phone_number, and staff_id.
    """

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
        extra_kwargs = {
            "staff_id": {
                "read_only": True
            }  # generated in logic if needed, or by model default? No, usually model default is null.
        }

    phone_number = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        # Allow setting role and phone_number
        validated_data.pop("password_confirm")
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
        email = attrs.get("email")
        password = attrs.get("password")

        # SECURITY: USERNAME_FIELD='email', but pass as 'username=' to ensure 100%
        # compatibility with all Auth Backends (some older ones only look for 'username').
        user = authenticate(request=self.context.get("request"), username=email, password=password)

        if not user:
            # Check for unapproved state for better error reporting (403 vs 401)
            from django.contrib.auth import get_user_model

            User = get_user_model()
            lookup_user = User.objects.filter(email=email).first()
            if lookup_user:
                if not lookup_user.is_approved and not lookup_user.is_superuser:
                    logger.warning(f"Login rejection: Account NOT APPROVED for {email}")
                    raise PermissionDenied(
                        "Your account is pending administrative approval. Please contact the manager."
                    )
                if not lookup_user.is_active:
                    logger.warning(f"Login rejection: Account DEACTIVATED for {email}")
                    raise PermissionDenied("This account has been deactivated. Please contact support.")

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
