"""Transaction-related views for Coastal Banking.

This module contains views for managing financial transactions.
"""

import logging
from decimal import Decimal, DecimalException

from django.db import models, transaction
from django.db.models import Q
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.exceptions import BankingException, InsufficientFundsError, InvalidTransactionError
from core.models import Account, Transaction
from core.permissions import IsCustomer, IsStaff
from core.serializers import TransactionSerializer
from core.services import AccountService, TransactionService

logger = logging.getLogger(__name__)


class TransactionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["transaction_type", "status"]
    ordering_fields = ["timestamp", "amount"]
    ordering = ["-timestamp"]

    def get_queryset(self):
        """Filter transactions based on user involvement (sender or receiver)."""
        user = self.request.user
        if user.role == "customer":
            # Show transactions where user is involved
            return self.queryset.filter(models.Q(from_account__user=user) | models.Q(to_account__user=user)).distinct()
        return self.queryset

    def get_permissions(self):
        """Map transaction-related actions to their required permission levels."""
        if self.action == "create":
            return [IsCustomer()]
        # Allow both staff and customers to view transactions
        from core.permissions import IsStaffOrCustomer

        return [IsStaffOrCustomer()]

    def perform_create(self, serializer):
        """Handle transaction creation with validation and atomicity."""
        from_account = serializer.validated_data.get("from_account")
        to_account = serializer.validated_data.get("to_account")
        amount = serializer.validated_data.get("amount")
        transaction_type = serializer.validated_data.get("transaction_type")
        description = serializer.validated_data.get("description", "")

        try:
            with transaction.atomic():
                # Validate transaction
                TransactionService.validate_transaction(from_account, to_account, amount, transaction_type)

                # Create transaction
                tx = TransactionService.create_transaction(
                    from_account, to_account, amount, transaction_type, description
                )
                serializer.instance = tx
        except InsufficientFundsError as e:
            raise ValidationError({"status": "error", "message": str(e), "code": "INSUFFICIENT_FUNDS"})
        except (InvalidTransactionError, BankingException) as e:
            raise ValidationError({"status": "error", "message": str(e), "code": "INVALID_TRANSACTION"})
        except Exception as e:
            logger.error(f"Unexpected error during transaction creation: {e}")
            raise ValidationError({"status": "error", "message": "An unexpected error occurred during processing."})

    @action(detail=False, methods=["get"], permission_classes=[IsStaff])
    def search(self, request):
        """Search transactions with filters for cashier dashboard."""
        queryset = Transaction.objects.all()

        # Filter by reference number
        reference = request.query_params.get("reference")
        if reference:
            queryset = queryset.filter(reference_number__icontains=reference)

        # Filter by date range
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            try:
                queryset = queryset.filter(timestamp__gte=date_from)
            except (ValueError, TypeError):
                pass
        if date_to:
            try:
                queryset = queryset.filter(timestamp__lte=date_to)
            except (ValueError, TypeError):
                pass

        # Filter by member (user email or ID)
        member = request.query_params.get("member")
        if member:
            queryset = queryset.filter(
                Q(from_account__user__email__icontains=member)
                | Q(to_account__user__email__icontains=member)
                | Q(from_account__user__id__icontains=member)
                | Q(to_account__user__id__icontains=member)
            )

        # Filter by transaction type
        tx_type = request.query_params.get("type")
        if tx_type:
            queryset = queryset.filter(transaction_type__iexact=tx_type)

        # Filter by status
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        # Filter by amount range
        min_amount = request.query_params.get("min_amount")
        max_amount = request.query_params.get("max_amount")
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=min_amount)
            except (ValueError, TypeError, DecimalException):
                pass
        if max_amount:
            try:
                queryset = queryset.filter(amount__lte=max_amount)
            except (ValueError, TypeError, DecimalException):
                pass

        # Order by timestamp desc
        queryset = queryset.order_by("-timestamp")[:100]  # Limit to 100 results

        # Serialize results
        data = []
        for tx in queryset:
            data.append(
                {
                    "id": str(tx.id),
                    "reference_number": tx.reference_number,
                    "transaction_type": tx.transaction_type,
                    "amount": str(tx.amount),
                    "status": tx.status,
                    "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
                    "description": tx.description,
                    "from_account": {
                        "id": str(tx.from_account.id) if tx.from_account else None,
                        "account_number": tx.from_account.account_number if tx.from_account else None,
                        "user_email": tx.from_account.user.email if tx.from_account else None,
                    }
                    if tx.from_account
                    else None,
                    "to_account": {
                        "id": str(tx.to_account.id) if tx.to_account else None,
                        "account_number": tx.to_account.account_number if tx.to_account else None,
                        "user_email": tx.to_account.user.email if tx.to_account else None,
                    }
                    if tx.to_account
                    else None,
                }
            )

        return Response({"count": len(data), "results": data})

    @action(detail=False, methods=["post"], permission_classes=[IsStaff])
    def process(self, request):
        """Process a deposit or withdrawal from cashier dashboard."""
        from users.models import User

        # Get and validate inputs
        member_id = request.data.get("member_id")
        amount = request.data.get("amount")
        tx_type = request.data.get("type", "Deposit").lower()
        account_type = request.data.get("account_type", "daily_susu").lower()

        if not member_id or not amount:
            return Response({"error": "member_id and amount are required"}, status=400)

        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({"error": "Amount must be positive"}, status=400)
        except (ValueError, TypeError, Exception):
            return Response({"error": "Invalid amount"}, status=400)

        # Get member
        try:
            member = User.objects.get(id=member_id)
        except User.DoesNotExist:
            return Response({"error": "Member not found"}, status=404)

        try:
            with transaction.atomic():
                # Get or create account using proper service for unique account_number generation
                account = Account.objects.filter(user=member, account_type=account_type).first()
                if not account:
                    # Use AccountService to properly generate account_number
                    account = AccountService.create_account(member, account_type)

                # Process transaction using ACID-compliant TransactionService
                if tx_type == "deposit":
                    tx = TransactionService.create_transaction(
                        from_account=None,
                        to_account=account,
                        amount=amount,
                        transaction_type="deposit",
                        description=f"Deposit by {request.user.email}",
                    )
                elif tx_type == "withdrawal":
                    tx = TransactionService.create_transaction(
                        from_account=account,
                        to_account=None,
                        amount=amount,
                        transaction_type="withdrawal",
                        description=f"Withdrawal by {request.user.email}",
                    )
                else:
                    return Response({"error": "Invalid transaction type"}, status=400)

                # Refresh account to get updated balance
                account.refresh_from_db()
                return Response(
                    {
                        "status": "success",
                        "transaction_id": tx.id,
                        "new_balance": str(account.balance),
                        "message": f"{tx_type.capitalize()} of GHS {amount} successful",
                    }
                )

        except InsufficientFundsError as e:
            return Response(
                {"status": "error", "message": e.message, "code": e.code or "INSUFFICIENT_FUNDS"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except InvalidTransactionError as e:
            return Response(
                {"status": "error", "message": e.message, "code": e.code or "INVALID_TRANSACTION"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except BankingException as e:
            return Response(
                {"status": "error", "message": e.message, "code": e.code or "BANKING_ERROR"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            logger.error(f"Cashier transaction processing failed: {e!s}")
            return Response(
                {
                    "status": "error",
                    "message": "An unexpected error occurred during processing.",
                    "code": "SERVER_ERROR",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
