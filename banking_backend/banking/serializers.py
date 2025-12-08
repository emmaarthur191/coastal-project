from rest_framework import serializers
from .models import CashAdvance, Refund, Complaint, Notification, CheckDeposit, Loan, LoanApplication, LoanRepayment, FeeStructure, FeeTransaction, Account, Transaction, MessageThread, Message, UserEncryptionKey, NextOfKin, ClientRegistration


class FloatDecimalField(serializers.DecimalField):
    """Custom field to convert Decimal to float for JSON serialization."""
    def to_representation(self, value):
        return float(super().to_representation(value))


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

    def validate_amount(self, value):
        """Validate cash advance amount."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        if value > 50000:  # Max cash advance limit
            raise serializers.ValidationError("Amount exceeds maximum cash advance limit.")
        return value

    def validate_purpose(self, value):
        """Validate purpose field for security."""
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("Purpose must be at least 10 characters long.")
        # Check for potentially dangerous content
        dangerous_patterns = ['<script', 'javascript:', 'onerror', 'onload']
        for pattern in dangerous_patterns:
            if pattern.lower() in value.lower():
                raise serializers.ValidationError("Invalid characters in purpose field.")
        return value.strip()

    def get_account_number(self, obj) -> str:
        return obj.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_requested_by_name(self, obj) -> str:
        return f"{obj.requested_by.first_name} {obj.requested_by.last_name}"

    def get_approved_by_name(self, obj) -> str:
        return f"{obj.approved_by.first_name} {obj.approved_by.last_name}" if obj.approved_by else None

    def get_disbursed_by_name(self, obj) -> str:
        return f"{obj.disbursed_by.first_name} {obj.disbursed_by.last_name}" if obj.disbursed_by else None


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund model."""
    original_transaction_ref = serializers.SerializerMethodField()
    original_transaction_details = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Refund
        fields = [
            'id', 'original_transaction', 'original_transaction_ref', 'original_transaction_details', 'refund_type',
            'requested_amount', 'approved_amount', 'reason', 'refund_notes', 'status',
            'requested_by', 'requested_by_name', 'requested_at',
            'approved_by', 'approved_by_name', 'approved_at', 'approval_notes',
            'processed_by', 'processed_by_name', 'processed_at', 'refund_transaction',
            'requires_supervisor_approval', 'compliance_flags', 'risk_score',
            'audit_trail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'audit_trail', 'created_at', 'updated_at']

    def get_original_transaction_ref(self, obj) -> str:
        return obj.original_transaction.reference_number or f"TXN-{obj.original_transaction.id.hex[:8].upper()}"

    def get_original_transaction_details(self, obj) -> dict:
        return {
            'id': str(obj.original_transaction.id),
            'reference_number': obj.original_transaction.reference_number or f"TXN-{obj.original_transaction.id.hex[:8].upper()}",
            'amount': float(obj.original_transaction.amount),
            'timestamp': obj.original_transaction.timestamp.isoformat(),
            'type': obj.original_transaction.type
        }

    def get_requested_by_name(self, obj) -> str:
        return f"{obj.requested_by.first_name} {obj.requested_by.last_name}"

    def get_approved_by_name(self, obj) -> str:
        return f"{obj.approved_by.first_name} {obj.approved_by.last_name}" if obj.approved_by else None

    def get_processed_by_name(self, obj) -> str:
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
    application_date = serializers.SerializerMethodField()
    purpose = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            'id', 'account', 'account_number', 'borrower_name', 'principal_amount', 'interest_rate',
            'term_months', 'outstanding_balance', 'status', 'disbursement_date', 'maturity_date', 'total_paid',
            'application_date', 'purpose'
        ]
        read_only_fields = ['id', 'created_at']

    def get_account_number(self, obj) -> str:
        return obj.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_borrower_name(self, obj) -> str:
        return f"{obj.account.owner.first_name} {obj.account.owner.last_name}"

    def get_application_date(self, obj) -> str:
        return obj.application.submitted_at.date().isoformat() if obj.application else None

    def get_purpose(self, obj) -> str:
        return obj.application.purpose if obj.application else None



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

    def get_loan_account_number(self, obj) -> str:
        return obj.loan.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_borrower_name(self, obj) -> str:
        return f"{obj.loan.account.owner.first_name} {obj.loan.account.owner.last_name}"

    def get_processed_by_name(self, obj) -> str:
        return f"{obj.processed_by.first_name} {obj.processed_by.last_name}" if obj.processed_by else None


class NextOfKinSerializer(serializers.ModelSerializer):
    """Serializer for NextOfKin model."""

    class Meta:
        model = NextOfKin
        fields = [
            'id', 'name', 'relationship', 'address', 'stake_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClientRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for ClientRegistration model."""
    next_of_kin = NextOfKinSerializer(many=True, read_only=True)
    next_of_kin_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of next of kin data (max 4)"
    )
    passport_picture_url = serializers.SerializerMethodField()
    id_document_url = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    total_stake_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ClientRegistration
        fields = [
            'id', 'status', 'first_name', 'last_name', 'date_of_birth', 'phone_number', 'email',
            'id_type', 'id_number', 'occupation', 'work_address', 'position',
            'passport_picture', 'passport_picture_url', 'id_document', 'id_document_url',
            'next_of_kin', 'next_of_kin_data', 'total_stake_percentage',
            'otp_sent_at', 'otp_verified_at', 'otp_attempts',
            'submitted_at', 'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'approval_notes',
            'user_account', 'bank_account', 'ip_address', 'user_agent',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'otp_sent_at', 'otp_verified_at', 'otp_attempts',
            'submitted_at', 'reviewed_by', 'reviewed_at', 'user_account', 'bank_account',
            'ip_address', 'user_agent', 'created_at', 'updated_at'
        ]

    def get_passport_picture_url(self, obj) -> str:
        if obj.passport_picture:
            return obj.passport_picture.url
        return None

    def get_id_document_url(self, obj) -> str:
        if obj.id_document:
            return obj.id_document.url
        return None

    def get_reviewed_by_name(self, obj) -> str:
        return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}" if obj.reviewed_by else None

    def get_total_stake_percentage(self, obj) -> float:
        return obj.get_total_stake_percentage()

    def validate_next_of_kin_data(self, value):
        """Validate next of kin data."""
        if len(value) > 4:
            raise serializers.ValidationError("Maximum 4 next of kin allowed.")

        total_percentage = sum(item.get('stake_percentage', 0) for item in value)
        if total_percentage > 100:
            raise serializers.ValidationError("Total stake percentage cannot exceed 100%.")

        return value

    def validate_date_of_birth(self, value):
        """Validate date of birth (must be at least 18 years old)."""
        from datetime import date
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("Client must be at least 18 years old.")
        return value

    def create(self, validated_data):
        next_of_kin_data = validated_data.pop('next_of_kin_data', [])
        registration = super().create(validated_data)

        # Create next of kin entries
        for kin_data in next_of_kin_data:
            NextOfKin.objects.create(client_registration=registration, **kin_data)

        return registration


class ClientRegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new client registrations."""
    next_of_kin_data = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of next of kin data (max 4)"
    )

    class Meta:
        model = ClientRegistration
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'phone_number', 'email',
            'id_type', 'id_number', 'occupation', 'work_address', 'position',
            'next_of_kin_data'
        ]

    def validate_next_of_kin_data(self, value):
        """Validate next of kin data."""
        if len(value) > 4:
            raise serializers.ValidationError("Maximum 4 next of kin allowed.")

        total_percentage = sum(item.get('stake_percentage', 0) for item in value)
        if total_percentage > 100:
            raise serializers.ValidationError("Total stake percentage cannot exceed 100%.")

        return value

    def validate_date_of_birth(self, value):
        """Validate date of birth (must be at least 18 years old)."""
        from datetime import date
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("Client must be at least 18 years old.")
        return value

    def create(self, validated_data):
        next_of_kin_data = validated_data.pop('next_of_kin_data', [])
        registration = super().create(validated_data)

        # Create next of kin entries
        for kin_data in next_of_kin_data:
            NextOfKin.objects.create(client_registration=registration, **kin_data)

        return registration


class OTPSendSerializer(serializers.Serializer):
    """Serializer for sending OTP."""
    phone_number = serializers.CharField(max_length=20)


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying OTP."""
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6, min_length=6)


class UserEncryptionKeySerializer(serializers.ModelSerializer):
    """Serializer for UserEncryptionKey model."""

    class Meta:
        model = UserEncryptionKey
        fields = ['user', 'public_key', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class BankingMessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for MessageThread model."""
    participants = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = [
            'id', 'participants', 'subject', 'created_at', 'updated_at',
            'unread_count', 'last_message_preview', 'last_message_at',
            'shared_secret', 'public_keys'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_message_at']

    def get_participants(self, obj) -> list:
        participants = obj.participants.all()
        return [{
            'id': p.id,
            'name': f"{p.first_name} {p.last_name}",
            'email': p.email,
            'role': p.role
        } for p in participants]

    def get_unread_count(self, obj) -> int:
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0

    def get_last_message_preview(self, obj) -> dict:
        last_message = obj.messages.first()
        if last_message:
            return {
                'sender': f"{last_message.sender.first_name} {last_message.sender.last_name}",
                'timestamp': last_message.timestamp,
                'preview': last_message.encrypted_content[:50] + '...' if len(last_message.encrypted_content) > 50 else last_message.encrypted_content
            }
        return None

    def get_last_message_at(self, obj) -> str:
        return obj.last_message_at.isoformat() if obj.last_message_at else None

    def get_shared_secret(self, obj) -> str:
        return obj.shared_secret if obj.shared_secret else ""

    def get_public_keys(self, obj) -> dict:
        return obj.public_keys if obj.public_keys else {}


class BankingMessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    sender_name = serializers.SerializerMethodField()
    is_from_current_user = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'thread', 'sender', 'sender_name', 'encrypted_content',
            'iv', 'auth_tag', 'timestamp', 'is_read', 'read_at',
            'message_type', 'is_from_current_user'
        ]
        read_only_fields = ['id', 'timestamp', 'read_at']

    def get_sender_name(self, obj) -> str:
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    def get_is_from_current_user(self, obj) -> bool:
        request = self.context.get('request')
        return request and request.user == obj.sender


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new messages."""

    class Meta:
        model = Message
        fields = ['thread', 'encrypted_content', 'iv', 'auth_tag', 'message_type']

    def validate_thread(self, value):
        """Ensure user is participant in the thread."""
        request = self.context.get('request')
        if request and request.user not in value.participants.all():
            raise serializers.ValidationError("You are not a participant in this thread.")
        return value


class MessageThreadCreateSerializer(serializers.Serializer):
    """Serializer for creating new message threads."""
    participants = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of user IDs to include in the thread"
    )
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    initial_message = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    def validate_participants(self, value):
        """Validate that participants exist and include current user."""
        from users.models import User
        request = self.context.get('request')

        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        # Check if all participants exist
        existing_users = User.objects.filter(id__in=value).values_list('id', flat=True)
        missing_users = set(value) - set(existing_users)
        if missing_users:
            raise serializers.ValidationError(f"Users not found: {list(missing_users)}")

        # Ensure current user is included
        if request.user.id not in value:
            value.append(request.user.id)

        # Limit to staff roles only
        staff_roles = ['manager', 'operations_manager', 'cashier', 'mobile_banker']
        participants = User.objects.filter(id__in=value)
        invalid_roles = participants.exclude(role__in=staff_roles)
        if invalid_roles.exists():
            raise serializers.ValidationError("Only staff members can participate in messaging.")

        return value

    def create(self, validated_data):
        """Create a new MessageThread with the current user as creator."""
        from users.models import User

        # Get the current user from context
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        # Create the MessageThread with created_by set to current user
        message_thread = MessageThread.objects.create(
            subject=validated_data.get('subject', ''),
            created_by=request.user
        )

        # Add participants to the thread
        participant_ids = validated_data['participants']
        participants = User.objects.filter(id__in=participant_ids)
        message_thread.participants.set(participants)

        # Create initial message if provided
        if validated_data.get('initial_message'):
            from .models import Message
            Message.objects.create(
                thread=message_thread,
                sender=request.user,
                content=validated_data['initial_message'],
                message_type='text'
            )

        return message_thread


class AccountListSerializer(serializers.ModelSerializer):
    """Serializer for account list display with frontend-compatible format."""
    name = serializers.CharField(source='type')  # Map 'type' to 'name'
    balance = FloatDecimalField(max_digits=12, decimal_places=2)
    # Add nested owner information for frontend display
    owner = serializers.SerializerMethodField()
    account_number = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S.%fZ')

    class Meta:
        model = Account
        fields = [
            'id', 
            'account_number', 
            'name', 
            'balance', 
            'status', 
            'created_at', 
            'owner'
        ]

    def get_owner(self, obj) -> dict[str, str]:
        """Return owner information in frontend-compatible format."""
        return {
            'id': str(obj.owner.id),
            'first_name': obj.owner.first_name,
            'last_name': obj.owner.last_name,
            'email': obj.owner.email
        }

    def get_account_number(self, obj) -> str:
        """Return the full account number for display."""
        return obj.get_decrypted_account_number()


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer for transaction list display with date formatting."""
    date = serializers.DateField(source='timestamp')  # Auto-formats to YYYY-MM-DD
    amount = FloatDecimalField(max_digits=12, decimal_places=2)

    class Meta:
        model = Transaction
        fields = ['id', 'date', 'amount', 'description']  # Exact match


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

    def get_transaction_ref(self, obj) -> str:
        return obj.transaction.reference_number or f"TXN-{obj.transaction.id.hex[:8].upper()}"

    def get_fee_structure_name(self, obj) -> str:
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

    def get_account_number(self, obj) -> str:
        return obj.account.get_decrypted_account_number()[-4:]  # Last 4 digits

    def get_submitted_by_name(self, obj) -> str:
        return f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}"

    def get_assigned_to_name(self, obj) -> str:
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}" if obj.assigned_to else None

    def get_resolved_by_name(self, obj) -> str:
        return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}" if obj.resolved_by else None

    def get_escalated_by_name(self, obj) -> str:
        return f"{obj.escalated_by.first_name} {obj.escalated_by.last_name}" if obj.escalated_by else None

    def get_related_transaction_ref(self, obj) -> str:
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

    def get_sender_name(self, obj) -> str | None:
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

    def get_transaction_amount(self, obj) -> float | None:
        return float(obj.transaction.amount) if obj.transaction else None

    def get_processed_by_name(self, obj) -> str | None:
        return f"{obj.processed_by.first_name} {obj.processed_by.last_name}" if obj.processed_by else None