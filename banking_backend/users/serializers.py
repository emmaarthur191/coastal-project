from rest_framework import serializers
from .models import User, UserProfile, OTPVerification
from banking.models import Account, Transaction, Loan
from banking_backend.utils.masking import mask_email, mask_phone_number
from .audit_utils import validate_password_strength
from django.utils import timezone
from django.contrib.auth import authenticate
import re


class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Handles updating notification preferences."""
    class Meta:
        model = UserProfile
        fields = ['notify_email', 'notify_sms', 'notify_push']


class UserProfileSerializer(serializers.ModelSerializer):
    """Handles updating basic profile details (name and email)."""
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    role = serializers.CharField(source='user.role', read_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = ['first_name', 'last_name', 'email', 'role', 'phone', 'notify_email', 'notify_sms', 'notify_push']
        read_only_fields = ['role']

    def update(self, instance, validated_data):
        # Update fields in the linked User model
        user_data = validated_data.pop('user', {})
        user = instance.user

        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.email = user_data.get('email', user.email)
        user.save()

        # Update fields in UserProfile model
        return super().update(instance, validated_data)


class EnhancedUserRegistrationSerializer(serializers.ModelSerializer):
    """Enhanced serializer for user registration with comprehensive validation."""
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    agree_to_terms = serializers.BooleanField(required=True, write_only=True)
    marketing_consent = serializers.BooleanField(required=False, write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'password_confirm', 
            'phone', 'agree_to_terms', 'marketing_consent'
        ]

    def validate_email(self, value):
        """Validate email format and uniqueness."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Validate password strength."""
        is_valid, message, score = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(f"Password validation failed: {message}")
        return value

    def validate_phone(self, value):
        """Validate phone number format."""
        if value:
            # Basic phone number validation (you might want to use a library like phonenumbers)
            phone_pattern = r'^\+?1?\d{9,15}$'
            if not re.match(phone_pattern, value.replace(' ', '').replace('-', '')):
                raise serializers.ValidationError("Please enter a valid phone number.")
        return value

    def validate(self, attrs):
        """Cross-field validation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        
        if not attrs.get('agree_to_terms', False):
            raise serializers.ValidationError("You must agree to the terms and conditions.")
        
        return attrs

    def create(self, validated_data):
        """Create user with comprehensive validation."""
        validated_data.pop('password_confirm')
        validated_data.pop('agree_to_terms')
        validated_data.pop('marketing_consent', None)  # Optional field
        
        # Create user with default customer role
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role='customer'
        )
        
        # Create UserProfile
        profile_data = {
            'phone': validated_data.get('phone', ''),
            'notify_email': True,
            'notify_sms': False,
            'notify_push': True
        }
        UserProfile.objects.create(user=user, **profile_data)
        
        return user


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for user management operations (admin/staff only)."""
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(source='profile.phone', required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff',
            'password', 'password_confirm', 'phone'
        ]
        read_only_fields = ['id']

    def validate_role(self, value):
        """Validate role assignment based on current user's permissions."""
        current_user = self.context['request'].user
        if current_user.role == 'superuser':
            # Superuser can assign any role
            return value
        elif current_user.role == 'administrator':
            # Administrators can assign all roles except superuser
            if value == 'superuser':
                raise serializers.ValidationError("Only superusers can assign superuser role.")
            return value
        elif current_user.role == 'operations_manager':
            # Operations managers can assign all roles except administrator and superuser
            if value in ['administrator', 'superuser']:
                raise serializers.ValidationError("Only administrators and superusers can assign administrator/superuser roles.")
            return value
        elif current_user.role == 'manager':
            # Managers can only create customer and cashier roles
            if value not in ['customer', 'cashier']:
                raise serializers.ValidationError("Managers can only create customer and cashier accounts.")
            return value
        else:
            raise serializers.ValidationError("Insufficient permissions to assign roles.")

    def validate(self, attrs):
        """Cross-field validation for password updates."""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password:
            if not password_confirm:
                raise serializers.ValidationError("Please confirm the password.")
            if password != password_confirm:
                raise serializers.ValidationError("Passwords do not match.")
            
            # Validate password strength
            is_valid, message, score = validate_password_strength(password)
            if not is_valid:
                raise serializers.ValidationError(f"Password validation failed: {message}")
        
        return attrs

    def create(self, validated_data):
        """Create user with proper role-based restrictions."""
        password = validated_data.pop('password', None)
        password_confirm = validated_data.pop('password_confirm', None)
        phone = validated_data.pop('profile', {}).get('phone', '')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password or 'temp_password_123',
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
            is_active=validated_data.get('is_active', True),
            is_staff=validated_data.get('is_staff', False)
        )
        
        # Create profile if phone provided
        if phone:
            UserProfile.objects.create(user=user, phone=phone)
        
        return user

    def update(self, instance, validated_data):
        """Update user with proper restrictions."""
        password = validated_data.pop('password', None)
        password_confirm = validated_data.pop('password_confirm', None)
        phone_data = validated_data.pop('profile', {})
        
        # Update user fields
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.role = validated_data.get('role', instance.role)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update profile
        if phone_data.get('phone') is not None:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            profile.phone = phone_data['phone']
            profile.save()
        
        return instance


class SecuritySettingsSerializer(serializers.Serializer):
    """Serializer for user security settings."""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)
    enable_2fa = serializers.BooleanField(required=False)
    session_timeout_minutes = serializers.IntegerField(required=False, min_value=15, max_value=480)

    def validate_current_password(self, value):
        """Validate current password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        """Validate new password strength."""
        is_valid, message, score = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(f"Password validation failed: {message}")
        return value

    def validate(self, attrs):
        """Cross-field validation."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords do not match.")
        
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError("New password must be different from current password.")
        
        return attrs


class OTPSerializer(serializers.Serializer):
    """Serializer for OTP operations."""
    phone_number = serializers.CharField(required=True)
    verification_type = serializers.ChoiceField(
        choices=[
            ('user_creation', 'User Creation'),
            ('phone_verification', 'Phone Verification'),
            ('transaction', 'Transaction Verification'),
            ('password_reset', 'Password Reset'),
            ('security_change', 'Security Change'),
        ],
        default='phone_verification'
    )


class OTPVerificationSerializer(serializers.Serializer):
    """Serializer for OTP verification."""
    phone_number = serializers.CharField(required=True)
    otp_code = serializers.CharField(max_length=6, required=True)
    verification_type = serializers.ChoiceField(
        choices=[
            ('user_creation', 'User Creation'),
            ('phone_verification', 'Phone Verification'),
            ('transaction', 'Transaction Verification'),
            ('password_reset', 'Password Reset'),
            ('security_change', 'Security Change'),
        ],
        default='phone_verification'
    )


class UserInfoSerializer(serializers.ModelSerializer):
    """Serializer for returning user information."""
    email = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    security_status = serializers.SerializerMethodField()

    def get_email(self, obj):
        return mask_email(obj.email)

    def get_phone_number(self, obj):
        if hasattr(obj, 'profile') and obj.profile.phone:
            return mask_phone_number(obj.profile.phone)
        return None

    def get_permissions(self, obj):
        """Get user permissions based on role."""
        return obj.get_permissions_by_role() if hasattr(obj, 'get_permissions_by_role') else []

    def get_security_status(self, obj):
        """Get user security status."""
        if hasattr(obj, 'is_account_locked'):
            return {
                'account_locked': obj.is_account_locked(),
                'failed_login_attempts': getattr(obj, 'failed_login_attempts', 0),
                'last_login': obj.last_login.isoformat() if obj.last_login else None,
                'password_age_days': (timezone.now() - obj.password_changed_at).days if hasattr(obj, 'password_changed_at') else None
            }
        return {}

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 
            'is_active', 'is_staff', 'date_joined', 'permissions', 'security_status'
        ]


class RoleBasedDashboardSerializer(serializers.Serializer):
    """Role-based dashboard serializer."""
    
    def __init__(self, *args, **kwargs):
        user = kwargs.get('context', {}).get('request').user if 'request' in kwargs.get('context', {}) else None
        super().__init__(*args, **kwargs)
        
        if user:
            if user.role == 'customer':
                self.fields.update(self._get_customer_fields())
            elif user.role == 'cashier':
                self.fields.update(self._get_cashier_fields())
            elif user.role == 'mobile_banker':
                self.fields.update(self._get_mobile_banker_fields())
            elif user.role == 'manager':
                self.fields.update(self._get_manager_fields())
            elif user.role == 'operations_manager':
                self.fields.update(self._get_operations_manager_fields())
            elif user.role == 'administrator':
                self.fields.update(self._get_administrator_fields())
            elif user.role == 'superuser':
                self.fields.update(self._get_superuser_fields())

    def _get_customer_fields(self):
        """Fields for customer dashboard."""
        return {
            'account_balance': serializers.DecimalField(max_digits=15, decimal_places=2),
            'recent_transactions': serializers.ListField(child=serializers.DictField()),
            'loan_balance': serializers.DecimalField(max_digits=12, decimal_places=2),
            'savings_balance': serializers.DecimalField(max_digits=15, decimal_places=2),
        }

    def _get_cashier_fields(self):
        """Fields for cashier dashboard."""
        return {
            'daily_transactions_processed': serializers.IntegerField(),
            'pending_approvals': serializers.IntegerField(),
            'customer_service_metrics': serializers.DictField(),
            'shift_summary': serializers.DictField(),
        }

    def _get_mobile_banker_fields(self):
        """Fields for mobile banker dashboard."""
        return {
            'remote_sessions_active': serializers.IntegerField(),
            'pending_mobile_requests': serializers.ListField(child=serializers.DictField()),
            'client_communications': serializers.ListField(child=serializers.DictField()),
            'mobile_transactions_today': serializers.IntegerField(),
        }

    def _get_manager_fields(self):
        """Fields for manager dashboard."""
        return {
            'team_performance': serializers.DictField(),
            'workflow_approvals_pending': serializers.ListField(child=serializers.DictField()),
            'team_member_status': serializers.ListField(child=serializers.DictField()),
            'operational_metrics': serializers.DictField(),
        }

    def _get_operations_manager_fields(self):
        """Fields for operations manager dashboard."""
        return {
            'system_health': serializers.DictField(),
            'operational_oversight': serializers.DictField(),
            'process_metrics': serializers.DictField(),
            'staff_performance': serializers.ListField(child=serializers.DictField()),
            'risk_indicators': serializers.DictField(),
        }

    def _get_administrator_fields(self):
        """Fields for administrator dashboard."""
        return {
            'system_overview': serializers.DictField(),
            'security_status': serializers.DictField(),
            'user_management': serializers.DictField(),
            'system_configuration': serializers.DictField(),
            'audit_summary': serializers.DictField(),
            'infrastructure_status': serializers.DictField(),
        }

    def _get_superuser_fields(self):
        """Fields for superuser dashboard."""
        return {
            'unlimited_system_access': serializers.DictField(),
            'bypass_all_restrictions': serializers.BooleanField(),
            'system_administration': serializers.DictField(),
            'security_override': serializers.DictField(),
            'emergency_access': serializers.DictField(),
            'full_audit_bypass': serializers.BooleanField(),
            'configuration_override': serializers.DictField(),
            'all_permissions': serializers.ListField(),
        }


class MemberDashboardSerializer(serializers.Serializer):
    """Serializer for member dashboard data."""
    account_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    recent_transactions = serializers.ListField(child=serializers.DictField())
    loan_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    savings_balance = serializers.DecimalField(max_digits=15, decimal_places=2)


class EmailTokenObtainPairSerializer(serializers.Serializer):
    """Custom serializer for JWT token obtain that uses email instead of username."""
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Use email as username for authentication
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    attrs['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('No active account found with the given credentials.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        return attrs


# Backward compatibility - alias for the old serializer name
UserRegistrationSerializer = EnhancedUserRegistrationSerializer