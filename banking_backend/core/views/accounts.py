"""Account-related views for Coastal Banking.

This module contains views for managing bank accounts, account opening,
and account closure requests.
"""

import logging
import secrets
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.models import Account, AccountClosureRequest, AccountOpeningRequest
from core.permissions import IsCustomer, IsStaff
from core.serializers import (
    AccountClosureRequestSerializer,
    AccountOpeningRequestSerializer,
    AccountSerializer,
)
from core.services import AccountService

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(summary="List all bank accounts", tags=["Accounts"]),
    retrieve=extend_schema(summary="Retrieve account details", tags=["Accounts"]),
    create=extend_schema(summary="Create a new bank account", tags=["Accounts"]),
    update=extend_schema(summary="Update account information", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update account information", tags=["Accounts"]),
)
class AccountViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["account_type", "is_active"]
    ordering_fields = ["created_at", "balance"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter the queryset so that customers only see their own accounts."""
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        """Map specific actions to their required permission classes."""
        if self.action in ["update", "partial_update"]:
            return [IsStaff()]
        if self.action == "create":
            return [IsCustomer()]
        if self.action == "retrieve":
            # Object-level permission: only owner or staff can view individual account
            from core.permissions import IsOwnerOrStaff

            return [IsOwnerOrStaff()]
        # Allow both staff and customers to list accounts (queryset filtering applies)
        from core.permissions import IsStaffOrCustomer

        return [IsStaffOrCustomer()]

    def perform_create(self, serializer):
        """Create a new account using the AccountService."""
        account_type = serializer.validated_data.get("account_type", "daily_susu")
        account = AccountService.create_account(self.request.user, account_type)
        serializer.instance = account


class StaffAccountsViewSet(mixins.ListModelMixin, GenericViewSet):
    """ViewSet for staff to view and manage customer accounts."""

    from rest_framework.permissions import IsAuthenticated

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["account_type", "is_active"]
    ordering_fields = ["created_at", "balance"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return all accounts for staff management."""
        return Account.objects.all()

    def get_serializer_class(self):
        """Return the serializer class for account monitoring."""
        return AccountSerializer

    def get_permissions(self):
        """Enforce staff-only access for this ViewSet."""
        return [IsStaff()]

    def list(self, request):
        """List all accounts with user details for staff dashboard."""
        from django.db.models import Q

        queryset = self.get_queryset()

        # Apply search filter
        search = request.query_params.get("search", "")
        if search:
            queryset = queryset.filter(
                Q(account_number__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        # Apply account type filter
        account_type = request.query_params.get("account_type")
        if account_type:
            queryset = queryset.filter(account_type=account_type)

        # Apply status filter
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        # Order and limit
        queryset = queryset.select_related("user").order_by("-created_at")[:100]

        data = []
        for account in queryset:
            data.append(
                {
                    "id": str(account.id),
                    "account_number": account.account_number,
                    "account_type": account.account_type,
                    "balance": str(account.balance),
                    "is_active": account.is_active,
                    "created_at": account.created_at.isoformat() if account.created_at else None,
                    "user": {
                        "id": str(account.user.id),
                        "email": account.user.email,
                        "full_name": account.user.get_full_name(),
                        "phone": getattr(account.user, "phone", ""),
                    },
                }
            )

        return Response({"count": len(data), "results": data})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get summary statistics for all accounts."""
        from django.db.models import Count, Sum

        total_accounts = Account.objects.count()
        active_accounts = Account.objects.filter(is_active=True).count()
        total_balance = Account.objects.aggregate(total=Sum("balance"))["total"] or 0
        by_type = Account.objects.values("account_type").annotate(count=Count("id"))

        return Response(
            {
                "total_accounts": total_accounts,
                "active_accounts": active_accounts,
                "total_balance": str(total_balance),
                "by_type": list(by_type),
            }
        )


@extend_schema_view(
    list=extend_schema(summary="List all account opening requests", tags=["Account Openings"]),
    retrieve=extend_schema(summary="Retrieve a specific opening request", tags=["Account Openings"]),
    create=extend_schema(summary="Submit a new account opening request", tags=["Account Openings"]),
    approve=extend_schema(summary="Approve an account opening request", tags=["Account Openings"]),
    reject=extend_schema(summary="Reject an account opening request", tags=["Account Openings"]),
)
class AccountOpeningViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for handling account opening requests."""

    queryset = AccountOpeningRequest.objects.all()
    serializer_class = AccountOpeningRequestSerializer
    permission_classes = [IsStaff]  # Staff can view and create
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "account_type"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """Override permissions based on action - only managers/admins can approve/reject."""
        if self.action in ["approve", "reject"]:
            from core.permissions import IsManagerOrAdmin

            return [IsManagerOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Set the submitted_by field when creating a new request."""
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve an account opening request."""
        opening_request = self.get_object()

        if opening_request.status != "pending":
            return Response(
                {"status": "error", "message": "Only pending requests can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Maker-Checker Enforcement
        if opening_request.submitted_by == request.user:
            return Response(
                {
                    "status": "error",
                    "message": "Maker-Checker Violation: You cannot approve a request you initiated.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                opening_request.status = "approved"
                opening_request.approved_by = request.user
                opening_request.processed_at = timezone.now()
                opening_request.save()

                # Automated Account Creation upon approval
                new_account = AccountService.create_account(
                    user=opening_request.submitted_by,
                    account_type=opening_request.account_type,
                    initial_balance=opening_request.initial_deposit,
                )

                # Send welcome message with account number to the account owner
                self._send_account_welcome_message(
                    user=opening_request.submitted_by,
                    account=new_account,
                    approved_by=request.user,
                )

            return Response(
                {
                    "status": "success",
                    "message": "Account opening request approved and account created successfully",
                    "data": AccountOpeningRequestSerializer(opening_request).data,
                }
            )
        except Exception as e:
            logger.error(f"Failed to process account approval for request {opening_request.id}: {e}")
            return Response(
                {
                    "status": "error",
                    "message": f"Processing failed: {e!s}",
                    "code": "APPROVAL_FAILED",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _send_account_welcome_message(self, user, account, approved_by):
        """Send a welcome message with account number to the new account owner."""
        from core.models import BankingMessage

        try:
            # Create welcome message
            account_type_display = dict(Account.ACCOUNT_TYPES).get(account.account_type, account.account_type)
            
            welcome_message = f"""🎉 Welcome to Coastal Credit Union!

Your {account_type_display} account has been successfully created.

📋 Account Details:
━━━━━━━━━━━━━━━━━━━━━
Account Number: {account.account_number}
Account Type: {account_type_display}
Opening Balance: GHS {account.balance:,.2f}
━━━━━━━━━━━━━━━━━━━━━

You can now use this account for deposits, withdrawals, and transfers.

Thank you for choosing Coastal Credit Union!

Best regards,
Coastal Credit Union Team"""

            BankingMessage.objects.create(
                user=user,
                subject=f"Welcome! Your {account_type_display} Account is Ready",
                body=welcome_message,
                is_read=False,
            )
            logger.info(f"Sent welcome message to {user.email} for account {account.account_number}")
        except Exception as e:
            # Don't fail account creation if message sending fails
            logger.error(f"Failed to send welcome message to {user.email}: {e}")

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject an account opening request."""
        from django.utils import timezone

        opening_request = self.get_object()
        rejection_reason = request.data.get("reason", "")

        if opening_request.status != "pending":
            return Response({"error": "Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        opening_request.status = "rejected"
        opening_request.rejection_reason = rejection_reason
        opening_request.processed_at = timezone.now()
        opening_request.save()

        return Response(
            {
                "status": "success",
                "message": "Account opening request rejected",
                "data": AccountOpeningRequestSerializer(opening_request).data,
            }
        )

    @action(detail=False, methods=["post"])
    def send_otp(self, request):
        """Send OTP to customer phone number for account opening verification."""
        phone_number = request.data.get("phone_number")

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=400)

        # SECURITY FIX: Use cryptographically secure random for OTP generation
        otp = str(secrets.randbelow(900000) + 100000)  # 6-digit OTP

        # Store OTP in session or cache for verification
        request.session[f"otp_{phone_number}"] = otp
        request.session[f"otp_time_{phone_number}"] = timezone.now().isoformat()

        # SECURITY FIX: Don't log the actual OTP - only log that it was sent
        logger.info(f"OTP sent to phone ending in ...{phone_number[-4:]}")

        return Response({"success": True, "message": "OTP sent successfully", "phone_number": phone_number})

    @action(detail=False, methods=["post"])
    def verify_and_submit(self, request):
        """Verify OTP and submit account opening request."""
        phone_number = request.data.get("phone_number")
        submitted_otp = request.data.get("otp")

        if not phone_number or not submitted_otp:
            return Response({"error": "Phone number and OTP are required"}, status=400)

        # Verify OTP
        stored_otp = request.session.get(f"otp_{phone_number}")
        otp_time_str = request.session.get(f"otp_time_{phone_number}")

        # SECURITY FIX: Check OTP expiration (5 minute validity)
        if otp_time_str:
            try:
                from datetime import datetime

                otp_time = datetime.fromisoformat(otp_time_str)
                if timezone.is_naive(otp_time):
                    otp_time = timezone.make_aware(otp_time)
                if timezone.now() - otp_time > timedelta(minutes=5):
                    # Clear expired OTP
                    del request.session[f"otp_{phone_number}"]
                    del request.session[f"otp_time_{phone_number}"]
                    return Response({"error": "OTP has expired. Please request a new one."}, status=400)
            except (ValueError, TypeError):
                pass  # If parsing fails, continue with normal validation

        if not stored_otp or stored_otp != submitted_otp:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        # Clear OTP from session
        del request.session[f"otp_{phone_number}"]

        # Create account opening request
        opening_request = AccountOpeningRequest.objects.create(
            first_name=request.data.get("first_name", ""),
            last_name=request.data.get("last_name", ""),
            email=request.data.get("email", ""),
            phone_number=phone_number,
            date_of_birth=request.data.get("date_of_birth"),
            id_type=request.data.get("id_type", "ghana_card"),
            id_number=request.data.get("id_number", ""),
            account_type=request.data.get("account_type", "daily_susu"),
            submitted_by=request.user,
            status="pending",
        )

        return Response(
            {
                "success": True,
                "message": "Account opening request submitted successfully",
                "data": AccountOpeningRequestSerializer(opening_request).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AccountClosureViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for handling account closure requests."""

    queryset = AccountClosureRequest.objects.all()
    serializer_class = AccountClosureRequestSerializer
    permission_classes = [IsStaff]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        """Set the submitted_by field when creating a new request."""
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve an account closure request and close the account."""
        from django.utils import timezone

        closure_request = self.get_object()

        if closure_request.status != "pending":
            return Response({"error": "Only pending requests can be approved."}, status=status.HTTP_400_BAD_REQUEST)

        # Close the associated account
        if closure_request.account:
            closure_request.account.is_active = False
            closure_request.account.save()

        closure_request.status = "approved"
        closure_request.approved_by = request.user
        closure_request.processed_at = timezone.now()
        closure_request.save()

        return Response(
            {
                "status": "success",
                "message": "Account closure request approved and account closed",
                "data": AccountClosureRequestSerializer(closure_request).data,
            }
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject an account closure request."""
        from django.utils import timezone

        closure_request = self.get_object()
        rejection_reason = request.data.get("reason", "")

        if closure_request.status != "pending":
            return Response({"error": "Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        closure_request.status = "rejected"
        closure_request.rejection_reason = rejection_reason
        closure_request.processed_at = timezone.now()
        closure_request.save()

        return Response(
            {
                "status": "success",
                "message": "Account closure request rejected",
                "data": AccountClosureRequestSerializer(closure_request).data,
            }
        )
