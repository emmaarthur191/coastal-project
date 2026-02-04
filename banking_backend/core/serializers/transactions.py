"""Transaction-related serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.transactions import AccountStatement, CheckDeposit, Refund, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "from_account",
            "to_account",
            "amount",
            "transaction_type",
            "description",
            "status",
            "timestamp",
            "processed_at",
        ]
        read_only_fields = ["id", "timestamp", "processed_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs):
        transaction_type = attrs.get("transaction_type")
        from_account = attrs.get("from_account")
        to_account = attrs.get("to_account")

        if transaction_type == "transfer":
            if not from_account or not to_account:
                raise serializers.ValidationError("Transfer requires both from_account and to_account.")
            if from_account == to_account:
                raise serializers.ValidationError("Cannot transfer to the same account.")
        elif transaction_type in ["withdrawal", "payment"]:
            if not from_account:
                raise serializers.ValidationError(f"{transaction_type} requires from_account.")
        elif transaction_type == "deposit":
            if not to_account:
                raise serializers.ValidationError("Deposit requires to_account.")

        return attrs


class CheckDepositSerializer(serializers.ModelSerializer):
    """Serializer for check deposits."""

    account_number = serializers.CharField(source="account.id", read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CheckDeposit
        fields = [
            "id",
            "account",
            "account_number",
            "amount",
            "check_number",
            "bank_name",
            "routing_number",
            "front_image",
            "back_image",
            "status",
            "rejection_reason",
            "processed_by",
            "processed_by_name",
            "created_at",
            "processed_at",
            "cleared_at",
        ]
        read_only_fields = ["id", "processed_by", "processed_at", "cleared_at", "created_at"]

    def get_processed_by_name(self, obj):
        return obj.processed_by.get_full_name() if obj.processed_by else None


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = [
            "id",
            "user",
            "transaction",
            "amount",
            "reason",
            "description",
            "status",
            "admin_notes",
            "processed_by",
            "processed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "admin_notes",
            "processed_by",
            "processed_at",
            "created_at",
            "updated_at",
        ]


class AccountStatementSerializer(serializers.ModelSerializer):
    """Serializer for auto-generated account statements."""

    account_number = serializers.CharField(source="account.account_number", read_only=True)
    account_type_display = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = AccountStatement
        fields = [
            "id",
            "account",
            "account_number",
            "account_type_display",
            "requested_by",
            "requested_by_name",
            "start_date",
            "end_date",
            "status",
            "status_display",
            "pdf_file",
            "download_url",
            "transaction_count",
            "opening_balance",
            "closing_balance",
            "created_at",
            "generated_at",
        ]
        read_only_fields = [
            "id",
            "transaction_count",
            "opening_balance",
            "closing_balance",
            "created_at",
            "generated_at",
        ]

    def get_account_type_display(self, obj):
        return obj.account.get_account_type_display() if obj.account else None

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() if obj.requested_by else None

    def get_download_url(self, obj):
        if obj.pdf_file:
            return obj.pdf_file.url
        return None
