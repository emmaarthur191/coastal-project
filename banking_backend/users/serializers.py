from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'name', 'role', 'is_active', 'is_staff', 'is_superuser']
        # SECURITY: 'role' must be read-only to prevent privilege escalation via mass assignment
        read_only_fields = ['id', 'role', 'is_active', 'is_staff', 'is_superuser', 'name']
    
    def get_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.username

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate_password(self, value):
        """Validate password strength for banking security."""
        from .security import validate_password_strength
        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise serializers.ValidationError(errors)
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class StaffCreationSerializer(UserRegistrationSerializer):
    """
    Serializer for admin-side staff creation.
    Allows setting role, phone_number, and staff_id.
    """
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role', 'phone_number', 'staff_id']
        extra_kwargs = {
            'staff_id': {'read_only': True}  # generated in logic if needed, or by model default? No, usually model default is null.
        }

    def create(self, validated_data):
        # Allow setting role and phone_number
        validated_data.pop('password_confirm')
        # We use create_user to handle hashing
        user = User.objects.create_user(**validated_data)
        
        # Ensure staff_id is generated if not provided?
        # Model default handles it? No.
        # But CreateStaffView handles password.
        # The serializer.save() in view calls this create().
        
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
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
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated. Please contact support.")
        attrs['user'] = user
        return attrs