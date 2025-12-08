from rest_framework import serializers
from .models import User, UserProfile, UserDocuments
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
import re
import logging

logger = logging.getLogger('banking_security')

class UserProfileSerializer(serializers.ModelSerializer):
    # Include user fields for profile display
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    # Decrypted fields for authorized users
    decrypted_ssnit_number = serializers.SerializerMethodField()
    decrypted_staff_id = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        exclude = ['ssnit_number', 'staff_id']  # Exclude encrypted sensitive fields
        extra_kwargs = {
            'user': {'read_only': True}
        }

    def get_decrypted_ssnit_number(self, obj):
        """Return decrypted SSNIT number only for authorized users."""
        request = self.context.get('request')
        if request and request.user.has_role_permission('manager'):
            return obj.get_decrypted_ssnit_number()
        return None

    def get_decrypted_staff_id(self, obj):
        """Return decrypted staff ID."""
        return obj.get_decrypted_staff_id()

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['notify_email', 'notify_sms', 'notify_push']

class EnhancedUserRegistrationSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'customer')
        )
        return user

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff']

class RoleBasedDashboardSerializer(serializers.Serializer):
    account_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    recent_transactions = serializers.ListField(child=serializers.DictField())
    loan_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    savings_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    available_tabs = serializers.ListField(child=serializers.DictField())
    user_permissions = serializers.DictField()
    membership_status = serializers.DictField()

class UserManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class SecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['two_factor_enabled', 'two_factor_phone', 'security_question', 'security_answer']

class OTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6)
    verification_type = serializers.ChoiceField(
        choices=['user_creation', 'phone_verification', 'transaction', 'password_reset'],
        default='user_creation'
    )

class OTPVerificationSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6)
    verification_type = serializers.ChoiceField(
        choices=['user_creation', 'phone_verification', 'transaction', 'password_reset'],
        default='user_creation'
    )

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise AuthenticationFailed('Email and password are required.')

        # Validate email format
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            raise AuthenticationFailed('Invalid email format.')

        # Authenticate user
        user = authenticate(email=email, password=password)
        if not user:
            raise AuthenticationFailed('No active account found with the given credentials.')

        if not user.is_active:
            raise AuthenticationFailed('Account is inactive.')

        # Check if user has sufficient privileges
        allowed_roles = ['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator', 'superuser']
        if user.role not in allowed_roles:
            raise AuthenticationFailed('Access denied. Insufficient privileges.')

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user
        }

class MemberDashboardSerializer(serializers.Serializer):
    account_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    recent_transactions = serializers.ListField(child=serializers.DictField())
    loan_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    savings_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    available_tabs = serializers.ListField(child=serializers.DictField())
    user_permissions = serializers.DictField()
    membership_status = serializers.DictField()


class UserDocumentsSerializer(serializers.ModelSerializer):
    """Serializer for user document management."""
    uploaded_by_name = serializers.CharField(source='user.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()

    class Meta:
        model = UserDocuments
        fields = [
            'id', 'user', 'document_type', 'file', 'file_url', 'uploaded_at',
            'file_size', 'file_size_mb', 'file_name', 'mime_type', 'status',
            'is_verified', 'verified_by', 'verified_by_name', 'verified_at',
            'rejection_reason', 'review_priority', 'expiry_date', 'checksum',
            'uploaded_by_name'
        ]
        read_only_fields = ['id', 'uploaded_at', 'verified_at', 'file_url', 'file_size_mb']

    def get_file_url(self, obj):
        """Get the full URL for the uploaded file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_mb(self, obj):
        """Return file size in MB."""
        return obj.get_file_size_mb()

    def validate_file(self, value):
        """Validate uploaded file."""
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 10MB.")

        # Check file type
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]

        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"File type {value.content_type} is not allowed. "
                "Allowed types: JPEG, PNG, GIF, PDF, DOC, DOCX."
            )

        return value

    def create(self, validated_data):
        """Create document with additional metadata."""
        user = self.context['request'].user
        validated_data['user'] = user

        # Set file metadata
        file = validated_data.get('file')
        if file:
            validated_data['file_size'] = file.size
            validated_data['file_name'] = file.name
            validated_data['mime_type'] = getattr(file, 'content_type', 'application/octet-stream')

            # Generate checksum for integrity
            import hashlib
            file.seek(0)
            checksum = hashlib.sha256(file.read()).hexdigest()
            validated_data['checksum'] = checksum
            file.seek(0)  # Reset file pointer

        return super().create(validated_data)


class DocumentApprovalSerializer(serializers.Serializer):
    """Serializer for document approval/rejection actions."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    review_notes = serializers.CharField(required=False, allow_blank=True)


class EnhancedStaffRegistrationSerializer(serializers.Serializer):
    """Enhanced serializer for staff registration with document uploads."""

    # User fields
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    phone = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=[
        'cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator'
    ])
    password = serializers.CharField(write_only=True, min_length=8)

    # Profile fields
    house_address = serializers.CharField(max_length=500)
    contact_address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    government_id = serializers.CharField(max_length=50)
    ssnit_number = serializers.CharField(max_length=20)
    date_of_birth = serializers.DateField()
    employment_date = serializers.DateField()

    # Bank account details
    bank_name = serializers.CharField(max_length=100)
    account_number = serializers.CharField(max_length=50)
    branch_code = serializers.CharField(max_length=20)
    routing_number = serializers.CharField(max_length=20)

    # File uploads
    passport_picture = serializers.FileField(required=True)
    application_letter = serializers.FileField(required=True)
    appointment_letter = serializers.FileField(required=True)

    def validate_password(self, value):
        """Validate password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")

        if not any(c.isupper() for c in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter")

        if not any(c.islower() for c in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter")

        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one digit")

        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in value):
            raise serializers.ValidationError("Password must contain at least one special character")

        # Check for common passwords
        common_passwords = ['password', '123456', 'qwerty', 'admin', 'letmein']
        if value.lower() in common_passwords:
            raise serializers.ValidationError("Password cannot be a commonly used password")

        return value

    def validate_government_id(self, value):
        """Validate government ID format."""
        import re
        clean_id = re.sub(r'[\s-]', '', value).upper()
        if not clean_id:
            raise serializers.ValidationError("Government ID is required")
        if not re.match(r'^[A-Z0-9]+$', clean_id):
            raise serializers.ValidationError("Government ID must contain only letters and numbers")
        if len(clean_id) < 6 or len(clean_id) > 20:
            raise serializers.ValidationError("Government ID must be between 6 and 20 characters long")
        return clean_id

    def validate_ssnit_number(self, value):
        """Validate SSNIT number format."""
        import re
        clean_ssnit = re.sub(r'[\s-]', '', value)
        if not clean_ssnit:
            raise serializers.ValidationError("SSNIT number is required")
        if not re.match(r'^\d{12}$', clean_ssnit):
            raise serializers.ValidationError("SSNIT number must be exactly 12 digits, e.g., 123456789012")
        return clean_ssnit

    def validate_account_number(self, value):
        """Validate account number format."""
        if not value:
            raise serializers.ValidationError("Account number is required")
        if not re.match(r'^[A-Z0-9]+$', value):
            raise serializers.ValidationError("Account number must contain only letters and numbers")
        if len(value) < 8 or len(value) > 20:
            raise serializers.ValidationError("Account number must be between 8 and 20 characters long")
        return value

    def validate_branch_code(self, value):
        """Validate branch code format."""
        if not value:
            raise serializers.ValidationError("Branch code is required")
        if not re.match(r'^[A-Z0-9]+$', value):
            raise serializers.ValidationError("Branch code must contain only letters and numbers")
        if len(value) < 3 or len(value) > 10:
            raise serializers.ValidationError("Branch code must be between 3 and 10 characters long")
        return value

    def validate_routing_number(self, value):
        """Validate routing number format."""
        import re
        clean_routing = re.sub(r'[\s-]', '', value)
        if not clean_routing:
            raise serializers.ValidationError("Routing number is required")
        if not re.match(r'^\d{9}$', clean_routing):
            raise serializers.ValidationError("Routing number must be 9 digits")
        return clean_routing

    def validate_passport_picture(self, value):
        """Validate passport picture file."""
        # Size validation (max 2MB)
        max_size = 2 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Passport picture file size cannot exceed 2MB")

        # Type validation
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError("Only JPEG/JPG/PNG files are allowed for passport pictures")

        return value

    def validate_application_letter(self, value):
        """Validate application letter file."""
        # Size validation (max 5MB)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Application letter file size cannot exceed 5MB")

        # Type validation
        allowed_types = ['application/pdf']
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF files are allowed for application letters")

        return value

    def validate_appointment_letter(self, value):
        """Validate appointment letter file."""
        # Size validation (max 5MB)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Appointment letter file size cannot exceed 5MB")

        # Type validation
        allowed_types = ['application/pdf']
        if hasattr(value, 'content_type') and value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF files are allowed for appointment letters")

        return value

    def validate_email(self, value):
        """Check if user already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value

    def create(self, validated_data):
        """Create user with profile and documents."""
        from django.db import transaction

        with transaction.atomic():
            # Extract file data
            passport_picture = validated_data.pop('passport_picture')
            application_letter = validated_data.pop('application_letter')
            appointment_letter = validated_data.pop('appointment_letter')

            # Extract profile data
            ssnit_number = validated_data.pop('ssnit_number')
            profile_data = {
                'house_address': validated_data.pop('house_address'),
                'contact_address': validated_data.pop('contact_address', ''),
                'government_id': validated_data.pop('government_id'),
                'date_of_birth': validated_data.pop('date_of_birth'),
                'employment_date': validated_data.pop('employment_date'),
                'bank_name': validated_data.pop('bank_name'),
                'account_number': validated_data.pop('account_number'),
                'branch_code': validated_data.pop('branch_code'),
                'routing_number': validated_data.pop('routing_number'),
            }

            # Create user
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                role=validated_data['role']
            )

            # Create profile
            profile = UserProfile.objects.create(user=user, **profile_data)
            # Set SSNIT number with encryption
            profile.set_ssnit_number(ssnit_number)
            profile.save()

            # Generate staff ID
            profile.generate_staff_id()

            # Create documents
            UserDocuments.objects.create(
                user=user,
                document_type='passport_picture',
                file=passport_picture,
                file_size=passport_picture.size,
                file_name=passport_picture.name,
                mime_type=getattr(passport_picture, 'content_type', 'application/octet-stream')
            )

            UserDocuments.objects.create(
                user=user,
                document_type='application_letter',
                file=application_letter,
                file_size=application_letter.size,
                file_name=application_letter.name,
                mime_type=getattr(application_letter, 'content_type', 'application/octet-stream')
            )

            UserDocuments.objects.create(
                user=user,
                document_type='appointment_letter',
                file=appointment_letter,
                file_size=appointment_letter.size,
                file_name=appointment_letter.name,
                mime_type=getattr(appointment_letter, 'content_type', 'application/octet-stream')
            )

            return user