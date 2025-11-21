from rest_framework import serializers
from .models import UserSettings, SystemSettings, APIUsage, APIRateLimit, HealthCheck


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer for comprehensive user settings."""

    class Meta:
        model = UserSettings
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for system-wide settings."""

    current_value = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = SystemSettings
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_current_value(self, obj):
        return obj.get_value()

    def get_is_valid(self, obj):
        return obj.is_valid_value(obj.get_value())

    def validate_value(self, value):
        """Validate the setting value based on its type and constraints."""
        instance = self.instance
        if instance and not instance.is_valid_value(value):
            raise serializers.ValidationError("Invalid value for this setting type.")
        return value


class APIUsageSerializer(serializers.ModelSerializer):
    """Serializer for API usage tracking."""

    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = APIUsage
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class APIRateLimitSerializer(serializers.ModelSerializer):
    """Serializer for API rate limiting configuration."""

    class Meta:
        model = APIRateLimit
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class HealthCheckSerializer(serializers.ModelSerializer):
    """Serializer for health check results."""

    is_healthy = serializers.SerializerMethodField()
    should_alert = serializers.SerializerMethodField()

    class Meta:
        model = HealthCheck
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_healthy(self, obj):
        return obj.is_healthy()

    def get_should_alert(self, obj):
        return obj.should_alert()


class APIAnalyticsSerializer(serializers.Serializer):
    """Serializer for API analytics data."""

    total_requests = serializers.IntegerField()
    unique_users = serializers.IntegerField()
    average_response_time = serializers.DecimalField(max_digits=8, decimal_places=3)
    error_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    top_endpoints = serializers.ListField(child=serializers.DictField())
    requests_by_method = serializers.DictField()
    requests_by_status = serializers.DictField()
    requests_over_time = serializers.ListField(child=serializers.DictField())


class SystemHealthOverviewSerializer(serializers.Serializer):
    """Serializer for system health overview."""

    overall_status = serializers.CharField()
    total_components = serializers.IntegerField()
    healthy_components = serializers.IntegerField()
    warning_components = serializers.IntegerField()
    critical_components = serializers.IntegerField()
    components = HealthCheckSerializer(many=True)
    last_updated = serializers.DateTimeField()