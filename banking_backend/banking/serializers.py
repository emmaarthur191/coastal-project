from rest_framework import serializers
from .models import CashAdvance, Refund, Complaint, Notification, CheckDeposit, Loan, LoanApplication, LoanRepayment, FeeStructure, FeeTransaction, Account, Transaction


class CashAdvanceSerializer(serializers.ModelSerializer):
    """Serializer for CashAdvance model."""
    account_number = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    disbursed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CashAdvance
        fields = [
            'id', 'account', 'account_number', 'amount', 'purpose', 'priority', 'status',
            'requested_by', 'requested_by_name', 'requested_at', 'request_notes',
            'approved_by', 'approved_by_name', 'approved_at', 'approval_notes',
            'disbursed_by', 'disbursed_by_name', 'disbursed_at', 'disbursement_transaction',
            'repayment_due_date', 'interest_rate', 'outstanding_balance',
            'daily_limit', 'monthly_limit', 'audit_trail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'audit_trail', 'created_at', 'updated_at']

    def get_account_number(self, obj):
        return obj.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_requested_by_name(self, obj):
        return f"{obj.requested_by.first_name} {obj.requested_by.last_name}"

    def get_approved_by_name(self, obj):
        return f"{obj.approved_by.first_name} {obj.approved_by.last_name}" if obj.approved_by else None

    def get_disbursed_by_name(self, obj):
        return f"{obj.disbursed_by.first_name} {obj.disbursed_by.last_name}" if obj.disbursed_by else None


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund model."""
    original_transaction_ref = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Refund
        fields = [
            'id', 'original_transaction', 'original_transaction_ref', 'refund_type',
            'requested_amount', 'approved_amount', 'reason', 'refund_notes', 'status',
            'requested_by', 'requested_by_name', 'requested_at',
            'approved_by', 'approved_by_name', 'approved_at', 'approval_notes',
            'processed_by', 'processed_by_name', 'processed_at', 'refund_transaction',
            'requires_supervisor_approval', 'compliance_flags', 'risk_score',
            'audit_trail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'audit_trail', 'created_at', 'updated_at']

    def get_original_transaction_ref(self, obj):
        return obj.original_transaction.reference_number or f"TXN-{obj.original_transaction.id.hex[:8].upper()}"

    def get_requested_by_name(self, obj):
        return f"{obj.requested_by.first_name} {obj.requested_by.last_name}"

    def get_approved_by_name(self, obj):
        return f"{obj.approved_by.first_name} {obj.approved_by.last_name}" if obj.approved_by else None

    def get_processed_by_name(self, obj):
        return f"{obj.processed_by.first_name} {obj.processed_by.last_name}" if obj.processed_by else None


class AccountSummarySerializer(serializers.Serializer):
    """Serializer for account summary data."""
    total_savings = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_loans = serializers.DecimalField(max_digits=15, decimal_places=2)
    available_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_contributions = serializers.DecimalField(max_digits=15, decimal_places=2)
    account_count = serializers.IntegerField()
    loan_count = serializers.IntegerField()


class LoanApplicationSerializer(serializers.ModelSerializer):
    """Serializer for LoanApplication model."""
    applicant_name = serializers.SerializerMethodField()
    amount_requested = serializers.DecimalField(max_digits=12, decimal_places=2)
    term_months = serializers.IntegerField()
    interest_rate = serializers.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'applicant', 'applicant_name', 'amount_requested', 'term_months',
            'interest_rate', 'purpose', 'status', 'submitted_at', 'reviewed_by',
            'reviewed_at', 'approval_notes'
        ]
        read_only_fields = ['id', 'submitted_at', 'reviewed_at']

    def get_applicant_name(self, obj):
        return f"{obj.applicant.first_name} {obj.applicant.last_name}"


class LoanSerializer(serializers.ModelSerializer):
    """Serializer for Loan model."""
    account_number = serializers.SerializerMethodField()
    borrower_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            'id', 'account', 'account_number', 'borrower_name', 'principal_amount', 'interest_rate',
            'term_months', 'outstanding_balance', 'status', 'purpose', 'approved_by',
            'approved_by_name', 'approved_at', 'disbursed_at', 'due_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_account_number(self, obj):
        return obj.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_borrower_name(self, obj):
        return f"{obj.account.owner.first_name} {obj.account.owner.last_name}"

    def get_approved_by_name(self, obj):
        return f"{obj.approved_by.first_name} {obj.approved_by.last_name}" if obj.approved_by else None


class LoanRepaymentSerializer(serializers.ModelSerializer):
    """Serializer for LoanRepayment model."""
    loan_account_number = serializers.SerializerMethodField()
    borrower_name = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LoanRepayment
        fields = [
            'id', 'loan', 'loan_account_number', 'borrower_name', 'amount', 'payment_date',
            'processed_by', 'processed_by_name', 'payment_method', 'reference_number',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_loan_account_number(self, obj):
        return obj.loan.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_borrower_name(self, obj):
        return f"{obj.loan.account.owner.first_name} {obj.loan.account.owner.last_name}"

    def get_processed_by_name(self, obj):
        return f"{obj.processed_by.first_name} {obj.processed_by.last_name}" if obj.processed_by else None


class AccountListSerializer(serializers.Serializer):
    """Serializer for account list display with frontend-compatible format."""
    id = serializers.UUIDField()
    name = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.type

    def get_balance(self, obj):
        return float(obj.balance)


class TransactionListSerializer(serializers.Serializer):
    """Serializer for transaction list display with date formatting."""
    id = serializers.UUIDField()
    date = serializers.SerializerMethodField()
    description = serializers.CharField()
    amount = serializers.SerializerMethodField()

    def get_date(self, obj):
        return obj.timestamp.strftime('%Y-%m-%d')

    def get_amount(self, obj):
        return float(obj.amount)


class FrontendAccountSummarySerializer(serializers.Serializer):
    """Serializer for account summary with decimal to float conversion."""
    total_savings = serializers.FloatField()
    total_loans = serializers.FloatField()
    available_balance = serializers.FloatField()
    monthly_contributions = serializers.FloatField()
    account_count = serializers.IntegerField()
    loan_count = serializers.IntegerField()


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure model."""

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'name', 'transaction_type', 'fee_type', 'rate', 'fixed_amount',
            'min_fee', 'max_fee', 'is_active', 'effective_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FeeTransactionSerializer(serializers.ModelSerializer):
    """Serializer for FeeTransaction model."""
    transaction_ref = serializers.SerializerMethodField()
    fee_structure_name = serializers.SerializerMethodField()

    class Meta:
        model = FeeTransaction
        fields = [
            'id', 'transaction', 'transaction_ref', 'fee_structure', 'fee_structure_name',
            'amount', 'calculated_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_transaction_ref(self, obj):
        return obj.transaction.reference_number or f"TXN-{obj.transaction.id.hex[:8].upper()}"

    def get_fee_structure_name(self, obj):
        return obj.fee_structure.name


class ComplaintSerializer(serializers.ModelSerializer):
    """Serializer for Complaint model."""
    account_number = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()
    escalated_by_name = serializers.SerializerMethodField()
    related_transaction_ref = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'account', 'account_number', 'related_transaction', 'related_transaction_ref',
            'complaint_type', 'priority', 'subject', 'description', 'status', 'escalation_level',
            'submitted_by', 'submitted_by_name', 'submitted_at',
            'assigned_to', 'assigned_to_name', 'assigned_at',
            'resolved_by', 'resolved_by_name', 'resolved_at', 'resolution', 'resolution_satisfaction',
            'escalated_at', 'escalated_by', 'escalated_by_name', 'escalation_reason',
            'customer_contacted', 'contact_attempts', 'last_contact_date',
            'follow_up_required', 'follow_up_date', 'attachments', 'evidence',
            'audit_trail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'audit_trail', 'created_at', 'updated_at']

    def get_account_number(self, obj):
        return obj.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_submitted_by_name(self, obj):
        return f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}"

    def get_assigned_to_name(self, obj):
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}" if obj.assigned_to else None

    def get_resolved_by_name(self, obj):
        return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}" if obj.resolved_by else None

    def get_escalated_by_name(self, obj):
        return f"{obj.escalated_by.first_name} {obj.escalated_by.last_name}" if obj.escalated_by else None

    def get_related_transaction_ref(self, obj):
        if obj.related_transaction:
            return obj.related_transaction.reference_number or f"TXN-{obj.related_transaction.id.hex[:8].upper()}"
        return None


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'priority', 'status', 'recipient',
            'sender', 'sender_name', 'title', 'message', 'action_url',
            'cash_advance', 'refund', 'complaint', 'transaction',
            'created_at', 'read_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}" if obj.sender else None


class CashAdvanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating CashAdvance requests."""

    class Meta:
        model = CashAdvance
        fields = ['account', 'amount', 'purpose', 'priority']


class RefundCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Refund requests."""

    transaction_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Refund
        fields = ['transaction_id', 'refund_type', 'requested_amount', 'reason', 'refund_notes']


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Complaint requests."""

    account_id = serializers.UUIDField(write_only=True)
    related_transaction_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Complaint
        fields = [
            'account_id', 'related_transaction_id', 'complaint_type', 'priority',
            'subject', 'description', 'follow_up_required', 'follow_up_date'
        ]


class CheckDepositSerializer(serializers.ModelSerializer):
    """Serializer for CheckDeposit model."""
    transaction_amount = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CheckDeposit
        fields = [
            'id', 'transaction', 'transaction_amount', 'status', 'processed_at',
            'processed_by', 'processed_by_name', 'extracted_amount', 'extracted_account_number',
            'extracted_routing_number', 'extracted_payee', 'extracted_date',
            'confidence_score', 'validation_errors', 'fraud_flags', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_transaction_amount(self, obj):
        return float(obj.transaction.amount) if obj.transaction else None

    def get_processed_by_name(self, obj):
        return f"{obj.processed_by.first_name} {obj.processed_by.last_name}" if obj.processed_by else None