from rest_framework import serializers
from .models import FraudRule, FraudAlert, FraudCase
from .audit_trail import FraudAuditTrail


class FraudRuleSerializer(serializers.ModelSerializer):
    """Serializer for FraudRule model."""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FraudRule
        fields = [
            'id', 'name', 'description', 'rule_type', 'severity',
            'field', 'operator', 'value', 'additional_conditions',
            'is_active', 'auto_block', 'require_approval', 'escalation_threshold',
            'created_by_name', 'created_at', 'updated_at',
            'trigger_count', 'false_positive_count', 'last_triggered'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'trigger_count', 'false_positive_count', 'last_triggered']


class FraudRuleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating FraudRule."""

    class Meta:
        model = FraudRule
        fields = [
            'name', 'description', 'rule_type', 'severity',
            'field', 'operator', 'value', 'additional_conditions',
            'is_active', 'auto_block', 'require_approval', 'escalation_threshold'
        ]

    def validate(self, data):
        """Validate rule configuration."""
        rule_type = data.get('rule_type')
        field = data.get('field')
        operator = data.get('operator')
        value = data.get('value')

        # Basic validation
        if not field:
            raise serializers.ValidationError("Field is required")

        if not operator:
            raise serializers.ValidationError("Operator is required")

        if not value:
            raise serializers.ValidationError("Value is required")

        # Validate operator for rule type
        if rule_type == 'amount_threshold':
            if operator not in ['gt', 'gte', 'lt', 'lte']:
                raise serializers.ValidationError("Invalid operator for amount threshold rule")
            try:
                float(value)
            except ValueError:
                raise serializers.ValidationError("Value must be numeric for amount threshold")

        elif rule_type == 'velocity_check':
            if operator not in ['gt', 'gte', 'lt', 'lte', 'eq']:
                raise serializers.ValidationError("Invalid operator for velocity check rule")
            try:
                int(value)
            except ValueError:
                raise serializers.ValidationError("Value must be integer for velocity check")

        return data


class FraudAlertSerializer(serializers.ModelSerializer):
    """Serializer for FraudAlert model."""
    transaction_details = serializers.SerializerMethodField()
    account_details = serializers.SerializerMethodField()
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    escalated_to_name = serializers.CharField(source='escalated_to.get_full_name', read_only=True)

    class Meta:
        model = FraudAlert
        fields = [
            'id', 'alert_type', 'priority', 'status', 'title', 'description',
            'fraud_score', 'risk_level', 'transaction', 'account', 'user',
            'transaction_details', 'account_details', 'rule_details',
            'assigned_to', 'assigned_to_name', 'investigation_notes', 'resolution',
            'resolution_action', 'escalated_at', 'escalated_to', 'escalated_to_name',
            'created_at', 'updated_at', 'resolved_at',
            'source_ip', 'user_agent'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at']

    def get_transaction_details(self, obj):
        """Get transaction details if available."""
        if obj.transaction:
            return {
                'id': str(obj.transaction.id),
                'type': obj.transaction.type,
                'amount': float(obj.transaction.amount),
                'timestamp': obj.transaction.timestamp.isoformat(),
                'description': obj.transaction.description,
                'reference_number': obj.transaction.reference_number
            }
        return None

    def get_account_details(self, obj):
        """Get account details if available."""
        if obj.account:
            return {
                'id': str(obj.account.id),
                'account_number': obj.account.get_decrypted_account_number()[-4:],  # Last 4 digits
                'type': obj.account.type,
                'balance': float(obj.account.balance),
                'owner_name': obj.account.owner.get_full_name()
            }
        return None


class FraudAlertUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating FraudAlert."""

    class Meta:
        model = FraudAlert
        fields = [
            'status', 'assigned_to', 'investigation_notes', 'resolution',
            'resolution_action', 'escalated_to', 'escalated_at'
        ]

    def validate(self, data):
        """Validate alert update."""
        status = data.get('status')
        assigned_to = data.get('assigned_to')
        resolution = data.get('resolution')

        if status == 'resolved' and not resolution:
            raise serializers.ValidationError("Resolution notes are required when resolving an alert")

        if status == 'investigating' and not assigned_to:
            raise serializers.ValidationError("Assigned user is required when investigating")

        return data


class FraudAuditTrailSerializer(serializers.ModelSerializer):
    """Serializer for FraudAuditTrail model."""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    reverted_by_name = serializers.CharField(source='reverted_by.get_full_name', read_only=True)
    decision_data_decrypted = serializers.SerializerMethodField()

    class Meta:
        model = FraudAuditTrail
        fields = [
            'id', 'correlation_id', 'transaction_id', 'user_id',
            'decision_type', 'severity', 'status', 'created_at', 'updated_at',
            'expires_at', 'created_by', 'created_by_name', 'reverted_by',
            'reverted_by_name', 'reverted_at', 'revert_reason',
            'compliance_standard', 'data_classification', 'decision_hash',
            'decision_data_decrypted'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'decision_hash']

    def get_decision_data_decrypted(self, obj):
        """Get decrypted decision data if accessible."""
        try:
            return obj.get_decrypted_data()
        except Exception:
            return {'error': 'Unable to decrypt data'}


class FraudCaseSerializer(serializers.ModelSerializer):
    """Serializer for FraudCase model."""
    assigned_investigator_name = serializers.CharField(source='assigned_investigator.get_full_name', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.get_full_name', read_only=True)
    primary_transaction_details = serializers.SerializerMethodField()
    primary_account_details = serializers.SerializerMethodField()
    related_alerts_count = serializers.SerializerMethodField()
    related_transactions_count = serializers.SerializerMethodField()

    class Meta:
        model = FraudCase
        fields = [
            'id', 'case_number', 'case_type', 'priority', 'status',
            'title', 'description', 'summary', 'assigned_investigator',
            'assigned_investigator_name', 'supervisor', 'supervisor_name',
            'primary_transaction', 'primary_account', 'primary_user',
            'primary_transaction_details', 'primary_account_details',
            'estimated_loss', 'actual_loss', 'recovered_amount',
            'investigation_notes', 'evidence', 'timeline',
            'resolution_type', 'resolution_details', 'resolution_date',
            'escalated_at', 'escalated_to', 'escalation_reason',
            'created_at', 'updated_at', 'closed_at',
            'created_by', 'tags', 'related_alerts_count', 'related_transactions_count'
        ]
        read_only_fields = ['id', 'case_number', 'created_at', 'updated_at', 'closed_at']

    def get_primary_transaction_details(self, obj):
        """Get primary transaction details."""
        if obj.primary_transaction:
            return {
                'id': str(obj.primary_transaction.id),
                'type': obj.primary_transaction.type,
                'amount': float(obj.primary_transaction.amount),
                'timestamp': obj.primary_transaction.timestamp.isoformat(),
                'description': obj.primary_transaction.description
            }
        return None

    def get_primary_account_details(self, obj):
        """Get primary account details."""
        if obj.primary_account:
            return {
                'id': str(obj.primary_account.id),
                'account_number': obj.primary_account.get_decrypted_account_number()[-4:],
                'type': obj.primary_account.type,
                'balance': float(obj.primary_account.balance),
                'owner_name': obj.primary_account.owner.get_full_name()
            }
        return None

    def get_related_alerts_count(self, obj):
        """Get count of related alerts."""
        return obj.related_alerts.count()

    def get_related_transactions_count(self, obj):
        """Get count of related transactions."""
        return obj.related_transactions.count()


class FraudCaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating FraudCase."""

    class Meta:
        model = FraudCase
        fields = [
            'case_type', 'priority', 'title', 'description',
            'primary_transaction', 'primary_account', 'primary_user',
            'estimated_loss', 'assigned_investigator', 'supervisor',
            'tags'
        ]

    def validate(self, data):
        """Validate case creation."""
        # Ensure at least one primary entity is specified
        if not any([data.get('primary_transaction'), data.get('primary_account'), data.get('primary_user')]):
            raise serializers.ValidationError(
                "At least one primary entity (transaction, account, or user) must be specified"
            )

        return data