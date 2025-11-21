from rest_framework import serializers
from decimal import Decimal
from django.core.exceptions import ValidationError
from banking.models import Transaction, Account
from banking_backend.utils.sanitizer import Sanitizer
from banking_backend.utils.masking import mask_account_number, mask_email


class TransactionSerializer(serializers.ModelSerializer):
    account_number = serializers.SerializerMethodField()
    cashier_email = serializers.SerializerMethodField()
    related_account_number = serializers.SerializerMethodField()

    def get_account_number(self, obj):
        return mask_account_number(obj.account.get_decrypted_account_number())

    def get_cashier_email(self, obj):
        return mask_email(obj.cashier.email) if obj.cashier else None

    def get_related_account_number(self, obj):
        if obj.related_account:
            return mask_account_number(obj.related_account.get_decrypted_account_number())
        return None

    class Meta:
        model = Transaction
        fields = [
            'id', 'account', 'account_number', 'type', 'amount', 'timestamp',
            'cashier', 'cashier_email', 'related_account', 'related_account_number', 'description',
            'category', 'tags', 'status', 'reference_number'
        ]
        read_only_fields = ['id', 'timestamp', 'reference_number']

    def validate_amount(self, value):
        """Validate transaction amount - should always be positive."""
        if value <= 0:
            raise serializers.ValidationError("Transaction amount must be positive.")
        if value > Decimal('1000000.00'):  # Max transaction limit
            raise serializers.ValidationError("Transaction amount exceeds maximum limit.")
        return value

    def validate_type(self, value):
        """Validate transaction type."""
        valid_types = [choice[0] for choice in Transaction.TRANSACTION_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid transaction type. Must be one of: {', '.join(valid_types)}")
        return value

    def validate_description(self, value):
        """Validate and sanitize description."""
        return Sanitizer.validate_and_sanitize_description(value, max_length=500)


class TransactionListSerializer(serializers.ModelSerializer):
    """
    Frontend-specific serializer for transaction list endpoints.
    Maps 'timestamp' to 'date' with YYYY-MM-DD formatting and includes enhanced fields.
    """
    date = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'date', 'description', 'amount', 'type', 'category', 'category_display', 'status', 'status_display', 'tags', 'reference_number']
        read_only_fields = ['id', 'date', 'description', 'amount', 'type', 'category', 'category_display', 'status', 'status_display', 'tags', 'reference_number']

    def get_date(self, obj):
        """
        Convert timestamp to YYYY-MM-DD format for frontend compatibility.
        """
        if obj.timestamp:
            return obj.timestamp.strftime('%Y-%m-%d')
        return None

    def get_category_display(self, obj):
        """
        Return human-readable category name.
        """
        return dict(Transaction.TRANSACTION_CATEGORIES).get(obj.category, obj.category)

    def get_status_display(self, obj):
        """
        Return human-readable status name.
        """
        return dict(Transaction.TRANSACTION_STATUSES).get(obj.status, obj.status)

    def to_representation(self, instance):
        """Custom representation to ensure proper data format for frontend"""
        representation = super().to_representation(instance)

        # Ensure amount is a proper number (not Decimal) for frontend compatibility
        representation['amount'] = float(representation['amount'])

        return representation


class AccountSerializer(serializers.ModelSerializer):
    owner_email = serializers.SerializerMethodField()
    decrypted_account_number = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = ['id', 'owner', 'owner_email', 'account_number', 'decrypted_account_number', 'type', 'balance', 'status']
        read_only_fields = ['id', 'balance', 'decrypted_account_number']

    def get_decrypted_account_number(self, obj):
        """Return decrypted account number for display."""
        return mask_account_number(obj.get_decrypted_account_number())

    def get_owner_email(self, obj):
        """Return masked owner email."""
        return mask_email(obj.owner.email)

    def validate_account_number(self, value):
        """Validate account number format."""
        return Sanitizer.validate_account_number(value)

    def validate_balance(self, value):
        """Validate balance is not negative."""
        if value < 0:
            raise serializers.ValidationError("Balance cannot be negative.")
        return value


class AccountListSerializer(serializers.ModelSerializer):
    """
    Frontend-specific serializer for account list endpoints.
    Maps 'type' to 'name' and only includes fields needed by frontend.
    """
    name = serializers.CharField(source='type', read_only=True)
    
    class Meta:
        model = Account
        fields = ['id', 'name', 'balance']
        read_only_fields = ['id', 'name', 'balance']
    
    def to_representation(self, instance):
        """Custom representation to ensure proper data format for frontend"""
        representation = super().to_representation(instance)
        
        # Ensure balance is a proper number (not Decimal) for frontend compatibility
        representation['balance'] = float(representation['balance'])
        
        return representation


class FrontendAccountSummarySerializer(serializers.Serializer):
    """
    Frontend-specific serializer for account summary data.
    Handles decimal precision and proper numeric formatting.
    """
    total_savings = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_loans = serializers.DecimalField(max_digits=15, decimal_places=2)
    available_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_contributions = serializers.DecimalField(max_digits=15, decimal_places=2)
    account_count = serializers.IntegerField()
    loan_count = serializers.IntegerField()
    
    def to_representation(self, instance):
        """Ensure all numeric fields are properly formatted for frontend"""
        representation = super().to_representation(instance)
        
        # Convert all decimal fields to float for frontend compatibility
        decimal_fields = ['total_savings', 'total_loans', 'available_balance', 'monthly_contributions']
        for field in decimal_fields:
            if field in representation and representation[field] is not None:
                representation[field] = float(representation[field])
        
        return representation


class FastTransferSerializer(serializers.Serializer):
    from_account = serializers.UUIDField()
    to_account = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False)

    def validate_amount(self, value):
        return Sanitizer.validate_amount(value)

    def validate_description(self, value):
        return Sanitizer.validate_and_sanitize_description(value, max_length=255)

    def validate(self, data):
        from_account_id = data['from_account']
        to_account_id = data['to_account']
        amount = data['amount']

        try:
            from_account = Account.objects.get(id=from_account_id)
            to_account = Account.objects.get(id=to_account_id)
        except Account.DoesNotExist:
            raise serializers.ValidationError("One or both accounts do not exist.")

        if from_account == to_account:
            raise serializers.ValidationError("Cannot transfer to the same account.")

        if from_account.balance < amount:
            raise serializers.ValidationError("Insufficient funds in source account.")

        data['from_account_obj'] = from_account
        data['to_account_obj'] = to_account
        return data