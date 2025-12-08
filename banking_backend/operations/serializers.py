from rest_framework import serializers
from .models import Workflow, WorkflowStep, ClientKYC, FieldCollection, Commission, Expense, VisitSchedule, Message
from banking_backend.utils.sanitizer import Sanitizer


class WorkflowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStep
        fields = ['id', 'name', 'description', 'order', 'required_role', 'is_required']
        read_only_fields = ['id']


class WorkflowSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = Workflow
        fields = ['id', 'name', 'description', 'created_by', 'created_by_email', 'created_at', 'updated_at', 'is_active', 'steps']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        return Sanitizer.validate_and_sanitize_name(value, max_length=100)

    def validate_description(self, value):
        return Sanitizer.validate_and_sanitize_description(value, max_length=500)


class ClientKYCSerializer(serializers.ModelSerializer):
    submitted_by_email = serializers.CharField(source='submitted_by.email', read_only=True)
    reviewed_by_email = serializers.CharField(source='reviewed_by.email', read_only=True)
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)

    class Meta:
        model = ClientKYC
        fields = ['id', 'client_name', 'client_id', 'status', 'submitted_by', 'submitted_by_email', 'submitted_at', 'reviewed_by', 'reviewed_by_email', 'reviewed_at', 'documents', 'geotag', 'workflow', 'workflow_name']
        read_only_fields = ['id', 'submitted_at', 'reviewed_at', 'status']

    def validate_client_name(self, value):
        return Sanitizer.validate_and_sanitize_name(value, max_length=100)


class FieldCollectionSerializer(serializers.ModelSerializer):
    collected_by_email = serializers.CharField(source='collected_by.email', read_only=True)
    client_name = serializers.CharField(source='client_kyc.client_name', read_only=True)

    class Meta:
        model = FieldCollection
        fields = ['id', 'client_kyc', 'client_name', 'collected_by', 'collected_by_email', 'collected_at', 'location', 'data', 'status', 'notes']
        read_only_fields = ['id', 'collected_at']

    def validate_notes(self, value):
        return Sanitizer.validate_and_sanitize_description(value, max_length=1000)


class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'category', 'description', 'amount', 'date_incurred', 'recorded_by',
                  'recorded_by_name', 'created_at', 'updated_at', 'receipt_url', 'approved_by',
                  'approved_by_name', 'is_approved']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_recorded_by_name(self, obj):
        return f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}"

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}"
        return None

    def validate_description(self, value):
        return Sanitizer.validate_and_sanitize_description(value, max_length=500)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value


class VisitScheduleSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    scheduled_datetime = serializers.SerializerMethodField()

    class Meta:
        model = VisitSchedule
        fields = ['id', 'client_name', 'location', 'scheduled_date', 'scheduled_time', 'scheduled_datetime',
                  'purpose', 'status', 'assigned_to', 'assigned_to_name', 'created_by', 'created_by_name',
                  'created_at', 'updated_at', 'notes', 'actual_start_time', 'actual_end_time',
                  'completion_notes', 'geotag']
        read_only_fields = ['id', 'created_at', 'updated_at', 'actual_start_time', 'actual_end_time']

    def get_assigned_to_name(self, obj):
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}"

    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"

    def get_scheduled_datetime(self, obj):
        """Combine date and time for easier frontend handling."""
        from datetime import datetime
        if obj.scheduled_date and obj.scheduled_time:
            combined = datetime.combine(obj.scheduled_date, obj.scheduled_time)
            return combined.isoformat()
        return None

    def validate_scheduled_date(self, value):
        """Ensure scheduled date is not in the past."""
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("Cannot schedule visits in the past.")
        return value


class CommissionSerializer(serializers.ModelSerializer):
    earned_by_name = serializers.SerializerMethodField()
    transaction_id = serializers.UUIDField(source='transaction.id', read_only=True)

    class Meta:
        model = Commission
        fields = ['id', 'transaction', 'transaction_id', 'commission_type', 'amount', 'percentage',
                  'base_amount', 'earned_by', 'earned_by_name', 'created_at', 'description']
        read_only_fields = ['id', 'created_at']

    def get_earned_by_name(self, obj):
        return f"{obj.earned_by.first_name} {obj.earned_by.last_name}"


class OperationsMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'recipient', 'recipient_name', 'subject', 'content',
                  'priority', 'is_read', 'created_at', 'read_at', 'loan_application']
        read_only_fields = ['id', 'created_at', 'read_at', 'sender_name', 'recipient_name']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    def get_recipient_name(self, obj):
        if obj.recipient:
            return f"{obj.recipient.first_name} {obj.recipient.last_name}"
        return None

    def validate_subject(self, value):
        return Sanitizer.validate_and_sanitize_name(value, max_length=255)

    def validate_content(self, value):
        return Sanitizer.validate_and_sanitize_description(value, max_length=2000)