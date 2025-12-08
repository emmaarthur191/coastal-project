from rest_framework import serializers
from .models import ServiceRequest, CheckbookRequest, StatementRequest, LoanInfoRequest


class ServiceRequestSerializer(serializers.ModelSerializer):
    """Base serializer for service requests."""

    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, allow_null=True)
    fulfilled_by_name = serializers.CharField(source='fulfilled_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'member', 'member_name', 'requested_by', 'requested_by_name',
            'request_type', 'status', 'priority', 'notes', 'created_at', 'updated_at',
            'approved_by', 'approved_by_name', 'approved_at',
            'fulfilled_by', 'fulfilled_by_name', 'fulfilled_at',
            'fee_amount', 'fee_paid', 'fee_paid_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'approved_at', 'fulfilled_at',
            'approved_by', 'fulfilled_by', 'fee_paid_at'
        ]

    def validate_fee_amount(self, value):
        """Validate fee amount is not negative."""
        if value < 0:
            raise serializers.ValidationError("Fee amount cannot be negative.")
        return value


class CheckbookRequestSerializer(ServiceRequestSerializer):
    """Serializer for checkbook requests."""

    class Meta(ServiceRequestSerializer.Meta):
        model = CheckbookRequest
        fields = ServiceRequestSerializer.Meta.fields + [
            'quantity', 'delivery_method', 'delivery_address', 'special_instructions',
            'order_number', 'tracking_number', 'estimated_delivery_date'
        ]
        read_only_fields = ServiceRequestSerializer.Meta.read_only_fields + [
            'order_number', 'tracking_number', 'estimated_delivery_date'
        ]

    def validate_quantity(self, value):
        """Validate quantity is positive."""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        if value > 10:  # Reasonable limit
            raise serializers.ValidationError("Maximum quantity is 10 checkbooks per request.")
        return value

    def validate(self, attrs):
        """Cross-field validation."""
        if attrs.get('delivery_method') in ['mail', 'courier'] and not attrs.get('delivery_address'):
            raise serializers.ValidationError("Delivery address is required for mail or courier delivery.")
        return attrs


class StatementRequestSerializer(ServiceRequestSerializer):
    """Serializer for statement requests."""

    class Meta(ServiceRequestSerializer.Meta):
        model = StatementRequest
        fields = ServiceRequestSerializer.Meta.fields + [
            'statement_type', 'delivery_method', 'start_date', 'end_date', 'account_number',
            'email_sent', 'email_sent_at', 'mailed', 'mailed_at', 'tracking_number'
        ]
        read_only_fields = ServiceRequestSerializer.Meta.read_only_fields + [
            'email_sent', 'email_sent_at', 'mailed', 'mailed_at', 'tracking_number'
        ]

    def validate(self, attrs):
        """Cross-field validation."""
        statement_type = attrs.get('statement_type')
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if statement_type == 'custom':
            if not start_date or not end_date:
                raise serializers.ValidationError("Start date and end date are required for custom statements.")
            if start_date >= end_date:
                raise serializers.ValidationError("End date must be after start date.")
            if (end_date - start_date).days > 365:  # Limit to 1 year
                raise serializers.ValidationError("Custom date range cannot exceed 365 days.")
        elif statement_type in ['monthly', 'quarterly', 'annual']:
            # Clear custom dates for standard types
            attrs['start_date'] = None
            attrs['end_date'] = None

        return attrs


class LoanInfoRequestSerializer(ServiceRequestSerializer):
    """Serializer for loan information requests."""

    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True, allow_null=True)

    class Meta(ServiceRequestSerializer.Meta):
        model = LoanInfoRequest
        fields = ServiceRequestSerializer.Meta.fields + [
            'info_type', 'delivery_method', 'loan_account_number',
            'authorization_verified', 'verified_by', 'verified_by_name', 'verified_at',
            'info_delivered', 'delivered_at', 'delivery_notes'
        ]
        read_only_fields = ServiceRequestSerializer.Meta.read_only_fields + [
            'authorization_verified', 'verified_by', 'verified_at',
            'info_delivered', 'delivered_at'
        ]

    def validate_loan_account_number(self, value):
        """Validate loan account number format."""
        if not value:
            raise serializers.ValidationError("Loan account number is required.")
        # Basic validation - should be alphanumeric with possible hyphens
        import re
        if not re.match(r'^[A-Za-z0-9\-]+$', value):
            raise serializers.ValidationError("Invalid loan account number format.")
        return value


class ServiceRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating service requests - determines which type to create."""

    request_type = serializers.ChoiceField(choices=[
        ('checkbook', 'Checkbook Request'),
        ('statement', 'Statement Request'),
        ('loan_info', 'Loan Information Request'),
    ])
    member_id = serializers.UUIDField()
    priority = serializers.ChoiceField(choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], default='normal')
    notes = serializers.CharField(required=False, allow_blank=True)

    # Checkbook specific fields
    quantity = serializers.IntegerField(min_value=1, max_value=10, required=False)
    delivery_method = serializers.ChoiceField(choices=[
        ('pickup', 'Pickup at Branch'),
        ('mail', 'Mail Delivery'),
        ('courier', 'Courier Delivery'),
    ], required=False)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)

    # Statement specific fields
    statement_type = serializers.ChoiceField(choices=[
        ('monthly', 'Monthly Statement'),
        ('quarterly', 'Quarterly Statement'),
        ('annual', 'Annual Statement'),
        ('custom', 'Custom Date Range'),
    ], required=False)
    delivery_method_statement = serializers.ChoiceField(choices=[
        ('digital', 'Digital (Email)'),
        ('physical', 'Physical (Mail)'),
        ('both', 'Both Digital and Physical'),
    ], required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    account_number = serializers.CharField(required=False, allow_blank=True)

    # Loan info specific fields
    info_type = serializers.ChoiceField(choices=[
        ('balance', 'Current Balance'),
        ('payment_history', 'Payment History'),
        ('terms', 'Loan Terms and Conditions'),
        ('amortization', 'Amortization Schedule'),
        ('full_details', 'Full Loan Details'),
    ], required=False)
    delivery_method_loan = serializers.ChoiceField(choices=[
        ('digital', 'Digital (Email)'),
        ('physical', 'Physical (Mail)'),
        ('in_person', 'In Person Review'),
    ], required=False)
    loan_account_number = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate based on request type."""
        request_type = attrs['request_type']

        if request_type == 'checkbook':
            required_fields = ['quantity', 'delivery_method']
            for field in required_fields:
                if field not in attrs or attrs[field] is None:
                    raise serializers.ValidationError(f"{field} is required for checkbook requests.")

            if attrs['delivery_method'] in ['mail', 'courier'] and not attrs.get('delivery_address'):
                raise serializers.ValidationError("Delivery address is required for mail or courier delivery.")

        elif request_type == 'statement':
            required_fields = ['statement_type', 'delivery_method_statement']
            for field in required_fields:
                if field not in attrs or attrs[field] is None:
                    raise serializers.ValidationError(f"{field} is required for statement requests.")

            if attrs['statement_type'] == 'custom':
                if not attrs.get('start_date') or not attrs.get('end_date'):
                    raise serializers.ValidationError("Start date and end date are required for custom statements.")
                if attrs['start_date'] >= attrs['end_date']:
                    raise serializers.ValidationError("End date must be after start date.")

        elif request_type == 'loan_info':
            required_fields = ['info_type', 'delivery_method_loan', 'loan_account_number']
            for field in required_fields:
                if field not in attrs or attrs[field] is None:
                    raise serializers.ValidationError(f"{field} is required for loan information requests.")

        return attrs


class ServiceRequestUpdateSerializer(serializers.Serializer):
    """Serializer for updating service request status and notes."""

    status = serializers.ChoiceField(choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('in_progress', 'In Progress'),
        ('fulfilled', 'Fulfilled'),
        ('cancelled', 'Cancelled'),
    ], required=False)
    priority = serializers.ChoiceField(choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate status transitions."""
        status = attrs.get('status')
        rejection_reason = attrs.get('rejection_reason')

        if status == 'rejected' and not rejection_reason:
            raise serializers.ValidationError("Rejection reason is required when rejecting a request.")

        return attrs