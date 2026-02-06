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
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from core.mixins import IdempotencyMixin
from core.models.accounts import Account, AccountClosureRequest, AccountOpeningRequest
from core.permissions import IsCustomer, IsManagerOrAdmin, IsStaff
from core.serializers.accounts import (
    AccountClosureRequestSerializer,
    AccountOpeningRequestSerializer,
    AccountSerializer,
)
from core.services.accounts import AccountService

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
        """Return accounts for staff management. Mobile Bankers only see assigned clients."""
        user = self.request.user
        if user.role == "mobile_banker":
            # Filter by client assignment (assuming ClientAssignment model exists and has 'client' and 'mobile_banker' fields)
            # and that User model has a related name 'assignments' or we filter ClientAssignment directly
            from core.models.operational import ClientAssignment

            assigned_client_ids = ClientAssignment.objects.filter(mobile_banker=user, is_active=True).values_list(
                "client_id", flat=True
            )
            return Account.objects.filter(user_id__in=assigned_client_ids)
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
            from core.utils.field_encryption import hash_field

            search_hash = hash_field(search)

            queryset = queryset.filter(
                Q(account_number__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__id_number_hash=search_hash)
                | Q(opening_request__id_number_hash=search_hash)
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

    @action(detail=False, methods=["get"], url_path="summary")
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
class AccountOpeningViewSet(
    IdempotencyMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet
):
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
        """Stage 1: Approve an account opening request and create client account."""
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
                # 1. Find or Create Client User
                from django.contrib.auth import get_user_model

                User = get_user_model()

                user_email = opening_request.email
                customer_user = None

                if user_email:
                    customer_user = User.objects.filter(email=user_email).first()

                if not customer_user:
                    # Generate username from email or a random suffix (never raw PII)
                    if user_email:
                        username = user_email
                    else:
                        import uuid

                        username = f"user_{uuid.uuid4().hex[:8]}"

                    # Initial random password (will be reset/resent in Stage 2)
                    import secrets

                    temp_initial_pwd = secrets.token_urlsafe(12)

                    customer_user = User.objects.create_user(
                        username=username,
                        email=user_email or "",
                        password=temp_initial_pwd,
                        first_name=opening_request.first_name,
                        last_name=opening_request.last_name,
                        role="customer",
                    )
                    if hasattr(customer_user, "phone_number"):
                        customer_user.phone_number = opening_request.phone_number

                    # Copy ID Information
                    customer_user.id_type = opening_request.id_type
                    customer_user.id_number = opening_request.id_number
                    customer_user.save()

                # 2. Automated Account Creation for the CLIENT
                new_account = AccountService.create_account(
                    user=customer_user,
                    account_type=opening_request.account_type,
                    initial_balance=opening_request.initial_deposit,
                )

                # 3. Update Request Status
                opening_request.status = "approved"
                opening_request.processed_by = request.user
                opening_request.approved_at = timezone.now()
                opening_request.created_account = new_account
                opening_request.save()

                # 4. Send ONLY Account Number via SMS
                self._send_account_number_sms(opening_request, new_account)

            return Response(
                {
                    "status": "success",
                    "message": "Step 1 Complete: Account created. Credentials must be approved separately.",
                    "data": AccountOpeningRequestSerializer(opening_request).data,
                }
            )
        except Exception as e:
            logger.error(f"Failed Stage 1 approval for request {opening_request.id}: {e}")
            return Response(
                {"status": "error", "message": f"Step 1 failed: {e!s}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="dispatch-credentials")
    def dispatch_credentials(self, request, pk=None):
        """Stage 2: Approve and dispatch login credentials to the client."""
        opening_request = self.get_object()

        if opening_request.status != "approved":
            return Response(
                {"status": "error", "message": "Credentials can only be dispatched for approved requests."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Maker-Checker: Credentials dispatch should be approved by someone other than the submitter
        if opening_request.submitted_by == request.user:
            return Response(
                {
                    "status": "error",
                    "message": "Maker-Checker Violation: You cannot dispatch credentials for a request you initiated.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                account = opening_request.created_account
                if not account or not account.user:
                    return Response({"status": "error", "message": "No associated client user found."}, status=404)

                client_user = account.user

                # Generate new temporary password for dispatch
                import secrets

                temp_password = secrets.token_urlsafe(6)
                client_user.set_password(temp_password)
                client_user.save()

                # Update tracking
                opening_request.status = "completed"
                opening_request.credentials_approved_by = request.user
                opening_request.credentials_sent_at = timezone.now()
                opening_request.save()

                # Send credentials via SMS
                self._send_credentials_sms(opening_request, client_user.username, temp_password)

            return Response(
                {
                    "status": "success",
                    "message": "Step 2 Complete: Login credentials dispatched to client.",
                    "data": AccountOpeningRequestSerializer(opening_request).data,
                }
            )
        except Exception as e:
            logger.error(f"Failed Stage 2 dispatch for request {opening_request.id}: {e}")
            return Response(
                {"status": "error", "message": f"Step 2 failed: {e!s}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _send_account_number_sms(self, opening_request, account):
        """Step 1: Send Account Number only."""
        from users.services import SendexaService

        phone = opening_request.phone_number
        if not phone:
            return

        message = (
            f"Dear {opening_request.first_name}, your account at Coastal Credit Union has been created. "
            f"Account Number: {account.account_number}. "
            f"Login credentials will be sent separately once approved. Thank you!"
        )
        SendexaService.send_sms(phone, message)

    def _send_credentials_sms(self, opening_request, username, password):
        """Step 2: Send Login Credentials."""
        from users.services import SendexaService

        phone = opening_request.phone_number
        if not phone:
            return

        # Include email in the message so customer knows they can login with it
        email_note = f" (or your email: {opening_request.email})" if opening_request.email else ""
        message = (
            f"Dear {opening_request.first_name}, your login credentials for Coastal CU are ready. "
            f"Username: {username}{email_note} "
            f"Temporary Password: {password} "
            f"Please change your password upon first login."
        )
        SendexaService.send_sms(phone, message)

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

    @action(detail=False, methods=["post"], url_path="send-otp")
    def send_otp(self, request):
        """Send OTP to customer phone number for account opening verification."""
        phone_number = request.data.get("phone_number")

        if not phone_number:
            return Response({"error": "Phone number is required"}, status=400)

        # SECURITY FIX: Use hashed session keys for privacy
        from core.utils.field_encryption import hash_field

        session_key = f"otp_v2_{hash_field(phone_number)}"

        # SECURITY FIX: Use cryptographically secure random for OTP generation
        otp = str(secrets.randbelow(900000) + 100000)  # 6-digit OTP

        request.session[session_key] = otp
        request.session[f"{session_key}_time"] = timezone.now().isoformat()

        # SECURITY FIX: Don't log the actual OTP - only log that it was sent
        logger.info(f"OTP sent to phone ending in ...{phone_number[-4:]}")

        # Mask phone in response
        masked_phone = f"***-***-{phone_number[-4:]}"
        return Response({"success": True, "message": "OTP sent successfully", "phone_number": masked_phone})

    @action(detail=False, methods=["post"], url_path="verify-and-submit")
    def verify_and_submit(self, request):
        """Verify OTP and submit account opening request."""
        phone_number = request.data.get("phone_number")
        submitted_otp = request.data.get("otp")

        if not phone_number or not submitted_otp:
            return Response({"error": "Phone number and OTP are required"}, status=400)

        # Verify OTP using hashed session key
        from core.utils.field_encryption import hash_field

        session_key = f"otp_v2_{hash_field(phone_number)}"

        stored_otp = request.session.get(session_key)
        otp_time_str = request.session.get(f"{session_key}_time")

        # SECURITY FIX: Check OTP expiration (5 minute validity)
        if otp_time_str:
            try:
                from datetime import datetime

                otp_time = datetime.fromisoformat(otp_time_str)
                if timezone.is_naive(otp_time):
                    otp_time = timezone.make_aware(otp_time)
                if timezone.now() - otp_time > timedelta(minutes=5):
                    # Clear expired OTP
                    del request.session[session_key]
                    del request.session[f"{session_key}_time"]
                    return Response({"error": "OTP has expired. Please request a new one."}, status=400)
            except (ValueError, TypeError):
                pass

        if not stored_otp or stored_otp != submitted_otp:
            return Response({"error": "Invalid or expired OTP"}, status=400)

        # Clear OTP from session
        del request.session[session_key]
        del request.session[f"{session_key}_time"]

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

    def get_permissions(self):
        """Allow only managers/admins to approve or reject closures."""
        if self.action in ["approve", "reject"]:
            return [IsManagerOrAdmin()]
        return super().get_permissions()

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

        # SECURITY FIX: Maker-Checker Enforcement
        if closure_request.submitted_by == request.user:
            return Response(
                {
                    "status": "error",
                    "message": "Maker-Checker Violation: You cannot approve a closure request you submitted.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

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


class AccountBalanceView(APIView):
    """Returns aggregated account balance summary for the authenticated user.

    This endpoint provides:
    - total_balance: Sum of all active account balances
    - available_balance: Balance available for transactions (same as total for now)
    - accounts_count: Number of active accounts

    Permissions:
        - Any authenticated user can view their own balance
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/accounts/balance/

        Returns account balance summary for the currently logged-in user.
        """
        from decimal import Decimal

        from django.db.models import Sum

        # Only get active accounts for the authenticated user
        accounts = Account.objects.filter(user=request.user, is_active=True)

        # Calculate totals using database aggregation for efficiency
        total = accounts.aggregate(total=Sum("balance"))["total"] or Decimal("0.00")

        return Response(
            {
                "success": True,
                "data": {
                    "total_balance": str(total),
                    "available_balance": str(total),  # Can add holds/pending logic later
                    "accounts_count": accounts.count(),
                    "currency": "GHS",
                },
            }
        )
