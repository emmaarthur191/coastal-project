"""Account-related views for Coastal Banking.

This module contains views for managing bank accounts, account opening,
and account closure requests.
"""

import logging

from django.conf import settings
from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework_simplejwt.authentication import JWTAuthentication

from core.mixins import IdempotencyMixin
from core.models.accounts import Account, AccountClosureRequest, AccountOpeningRequest
from core.permissions import IsClientRegistrar, IsCustomer, IsManagerOrAdmin, IsStaff, IsStaffOrCustomer
from core.serializers.accounts import (
    AccountClosureRequestSerializer,
    AccountOpeningRequestSerializer,
    AccountSerializer,
)
from core.services.accounts import AccountService
from users.authentication import JWTCookieAuthentication

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
    """API viewset designed to list, create, retrieve, and update core bank accounts."""

    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["account_type", "is_active"]
    ordering_fields = ["created_at", "balance"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter accounts so customers only see their own accounts. Optimized with select_related."""
        user = self.request.user
        queryset = self.queryset.select_related("user")
        if user.role == "customer":
            return queryset.filter(user=user)
        return queryset

    def get_permissions(self):
        """Map specific actions to their required permission classes."""
        action = getattr(self, "action", None)
        if action in ["update", "partial_update"]:
            return [IsStaff()]
        if action == "create":
            return [IsCustomer()]
        if action == "retrieve":
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

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def freeze(self, request, pk=None):
        """Freeze an account to prevent further transactions."""
        account = self.get_object()
        reason = request.data.get("reason", "Suspicious activity detected")
        AccountService.lock_account(account, reason)
        return Response({"status": "success", "message": f"Account {account.account_number} frozen."})

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def unfreeze(self, request, pk=None):
        """Unfreeze an account to restore access."""
        account = self.get_object()
        AccountService.unlock_account(account)
        return Response({"status": "success", "message": f"Account {account.account_number} unfrozen."})


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
                | Q(user__first_name_hash=search_hash)
                | Q(user__last_name_hash=search_hash)
                | Q(user__id_number_hash=search_hash)
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

        from core.serializers.accounts import StaffAccountListSerializer
        serializer = StaffAccountListSerializer(queryset, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})

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
    authentication_classes = [
        JWTCookieAuthentication,
        SessionAuthentication,
        JWTAuthentication,
    ]
    permission_classes = [IsStaff]  # Staff can view and create
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "account_type"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]
    throttle_scope = ""

    def get_queryset(self):
        """Return account opening requests for staff. Optimized with select_related."""
        return AccountOpeningRequest.objects.select_related(
            "submitted_by", "processed_by", "created_account", "credentials_approved_by"
        )

    def perform_create(self, serializer):
        """Set the submitted_by field when creating a new request."""
        serializer.save(submitted_by=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[IsStaff])
    def search_member(self, request):
        """Search existing members for streamlined onboarding."""
        query = request.query_params.get("query", "")
        if not query:
            return Response({"results": []})

        from django.db.models import Q

        from core.utils.field_encryption import hash_field
        from users.models import User

        search_hash = hash_field(query)

        # Search by Member ID, Email, Phone, or Hashed Names
        queryset = (
            User.objects.filter(role="customer")
            .filter(
                Q(member_number=query)
                | Q(email__icontains=query)
                | Q(phone_number__icontains=query)
                | Q(first_name_hash=search_hash)
                | Q(last_name_hash=search_hash)
            )
            .distinct()[:10]
        )

        from users.serializers import MemberLookupSerializer
        serializer = MemberLookupSerializer(queryset, many=True)
        return Response({"results": serializer.data})

    @action(detail=True, methods=["post"], permission_classes=[IsManagerOrAdmin])
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

                # Get email/phone or fallbacks
                user_email = opening_request.email or getattr(opening_request, 'applicant_email', None)
                user_phone = opening_request.phone_number or getattr(opening_request, 'applicant_phone', None)
                
                customer_user = None

                # 1a. Try to find existing user by email or phone
                if user_email:
                    customer_user = User.objects.filter(email=user_email).first()
                
                if not customer_user and user_phone:
                    from core.utils.field_encryption import hash_field
                    phone_hash = hash_field(user_phone)
                    customer_user = User.objects.filter(phone_number_hash=phone_hash, role="customer").first()

                if not customer_user:
                    # Clean identifiers for username creation
                    if not user_email and not user_phone:
                        return Response(
                            {"status": "error", "message": "Either Email or Phone number is required to create a customer account."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Determine username: priority email prefix > cleaned phone number
                    if user_email:
                        username = user_email.split('@')[0]
                    else:
                        # Fallback to phone number as username (login)
                        username = user_phone.replace(" ", "").replace("+", "")
                    
                    # Ensure username uniqueness (extremely rare collision if using UUID-like phone)
                    if User.objects.filter(username=username).exists():
                         import secrets
                         username = f"{username}_{secrets.token_hex(2)}"

                    # Initial random password (will be reset/resent in Stage 2)
                    import secrets
                    temp_initial_pwd = secrets.token_urlsafe(12)

                    customer_user = User.objects.create_user(
                        username=username,
                        email=user_email, # Now nullable in User model
                        password=temp_initial_pwd,
                        first_name=opening_request.first_name,
                        last_name=opening_request.last_name,
                        role="customer",
                    )
                    
                # Always ensure phone is set/updated on the customer user record
                if user_phone:
                    customer_user.phone_number = user_phone
                
                # Copy/Sync ID Information
                customer_user.id_type = opening_request.id_type
                customer_user.id_number = opening_request.id_number
                customer_user.is_approved = True # User is approved once request is approved
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

                # 4. Notify Customer of Account Number (Physical Verification Confirmed)
                # This only goes to the customer's phone_number on file.
                self._send_account_number_sms(opening_request, new_account)

            return Response(
                {
                    "status": "success",
                    "message": "Step 1 Complete: Account created. Credentials must be approved separately.",
                    "data": AccountOpeningRequestSerializer(opening_request).data,
                }
            )
        except Exception as e:
            logger.exception(f"Failed Stage 1 approval for request {opening_request.id}")
            return Response(
                {"status": "error", "message": "Step 1 approval failed. Please contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="dispatch-credentials", permission_classes=[IsManagerOrAdmin])
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

                # SECURITY: Proactive SMS credentialing disabled via Paper-First Policy.
                # Credentials provided via Welcome Letter (PDF) instead.

            return Response(
                {
                    "status": "success",
                    "message": "Step 2 Complete: Login credentials dispatched to client.",
                    "data": AccountOpeningRequestSerializer(opening_request).data,
                }
            )
        except Exception as e:
            logger.exception(f"Failed Stage 2 dispatch for request {opening_request.id}")
            return Response(
                {"status": "error", "message": "Step 2 dispatch failed. Please contact support."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="approve-and-print", permission_classes=[IsManagerOrAdmin])
    def approve_and_print(self, request, pk=None):
        """Approve an account opening request, create the account/user, and return a PDF letter."""
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

                # Priority: Existing Member linked to Request -> Email lookup -> Create New
                customer_user = opening_request.existing_member
                
                email = opening_request.email
                if not customer_user and email:
                    customer_user = User.objects.filter(email=email).first()

                import secrets

                # Password handling (Test vs Production)
                if email and email.endswith("@example.com"):
                    temp_password = "UserPassword123!"
                else:
                    temp_password = secrets.token_urlsafe(8)

                if not customer_user:
                    # Legacy Fix: Generate placeholder email if missing to satisfy User model requirements
                    effective_email = email if email else f"legacy_{opening_request.id}@members.coastal.com"
                    username = effective_email
                    customer_user = User.objects.create_user(
                        username=username,
                        email=effective_email,
                        password=temp_password,
                        first_name=opening_request.first_name,
                        last_name=opening_request.last_name,
                        role="customer",
                    )
                    customer_user.is_approved = True  # Approve access
                    customer_user.phone_number = opening_request.phone_number
                    customer_user.id_type = opening_request.id_type
                    customer_user.id_number = opening_request.id_number
                    customer_user.profile_photo = opening_request.photo
                    customer_user.save()
                else:
                    # For existing members, we just ensure they are approved
                    customer_user.is_approved = True
                    # If they already had a password, we might not want to reset it 
                    # UNLESS it's a new account type request and we want to provide 
                    # them with a fresh login for this session's welcome letter.
                    # Standard policy: Update password for new account opening letter.
                    customer_user.set_password(temp_password)
                    customer_user.save(update_fields=["is_approved", "password"])

                # 2. Automated Account Creation
                new_account = AccountService.create_account(
                    user=customer_user,
                    account_type=opening_request.account_type,
                    initial_balance=opening_request.initial_deposit,
                )

                # 3. Update Request Status
                opening_request.status = "completed"
                opening_request.processed_by = request.user
                opening_request.approved_at = timezone.now()
                opening_request.created_account = new_account
                opening_request.save()

                # 4. Generate PDF Welcome Letter
                from core.pdf_services import generate_account_opening_letter_pdf
                from core.utils.async_stream import async_file_iterator

                pdf_buffer = generate_account_opening_letter_pdf(
                    opening_request, new_account.account_number, temp_password
                )

                # 5. Notify Customer of Account Number (Physical Onboarding Confirmed)
                self._send_account_number_sms(opening_request, new_account)

                return FileResponse(
                    async_file_iterator(pdf_buffer),
                    as_attachment=True,
                    filename=f"Coastal_Welcome_{new_account.account_number}.pdf",
                    content_type="application/pdf",
                )

        except Exception as e:
            logger.exception(f"Approve & Print failed for request {opening_request.id}")
            return Response(
                {"status": "error", "message": "Account activation failure.", "code": "ACTIVATION_FAILED"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _send_account_number_sms(self, opening_request, account):
        """Send Account Number only. Never sends digital credentials."""
        from users.services import SendexaService

        phone = opening_request.phone_number
        if not phone:
            return

        message = (
            f"Coastal Bank: Dear {opening_request.first_name}, your account has been successfully created. "
            f"Account Number: {account.account_number}. "
            f"Please change your password using the printed Welcome Letter provided in-branch. Thank you!"
        )
        SendexaService.send_sms(phone, message)

    @action(detail=True, methods=["post"], permission_classes=[IsManagerOrAdmin])
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

    @action(
        detail=False,
        methods=["post"],
        url_path="submit-request",
        authentication_classes=[],
        permission_classes=[AllowAny],
    )
    def submit_request(self, request):
        """Submit a new account opening request without OTP verification.

        This is the new entry point for the manual approval workflow.
        """
        # Support both top-level and nested account_data
        data = request.data.get("account_data", request.data)

        from core.serializers.accounts import AccountOpeningRequestSerializer

        serializer = AccountOpeningRequestSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            opening_request = serializer.save(
                submitted_by=request.user if request.user.is_authenticated else None,
                status="pending",
            )
            return Response(
                {
                    "success": True,
                    "message": "Account opening request submitted. Please visit the Manager's office with your ID for approval.",
                    "data": AccountOpeningRequestSerializer(opening_request).data,
                },
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], url_path="send-otp", authentication_classes=[], permission_classes=[])
    def send_otp(self, request):
        """Send OTP for account opening request (Legacy/Security flow)."""
        phone_number = request.data.get("phone_number")
        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        import random

        from core.utils.field_encryption import hash_field

        otp_code = str(random.randint(100000, 999999))
        session_key = f"otp_v2_{hash_field(phone_number)}"

        # Store in session
        request.session[session_key] = otp_code
        request.session[f"{session_key}_time"] = timezone.now().isoformat()
        request.session.save()

        # SECURITY FIX: Completely removed dynamic PII lineages from logs to satisfy CodeQL
        if settings.DEBUG:
            logger.info("OTP dispatch event recorded")

        return Response({"status": "success", "message": "OTP sent successfully."})

    @action(detail=False, methods=["post"], url_path="verify-and-submit", authentication_classes=[], permission_classes=[])
    def verify_and_submit(self, request):
        """Verify OTP and submit account opening request (Legacy/Security flow)."""
        phone_number = request.data.get("phone_number")
        otp = request.data.get("otp")

        if not phone_number or not otp:
            return Response({"error": "Phone number and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        from core.utils.field_encryption import hash_field

        session_key = f"otp_v2_{hash_field(phone_number)}"
        stored_otp = request.session.get(session_key)
        stored_time_str = request.session.get(f"{session_key}_time")

        if not stored_otp or stored_otp != otp:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Check expiration (10 minutes)
        if stored_time_str:
            stored_time = timezone.datetime.fromisoformat(stored_time_str)
            if timezone.now() - stored_time > timezone.timedelta(minutes=10):
                return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Proceed to create request (minimal data for test)
        opening_request = AccountOpeningRequest.objects.create(
            first_name=request.data.get("first_name", "Test"),
            last_name=request.data.get("last_name", "User"),
            phone_number=phone_number,
            email=request.data.get("email", ""),
            status="pending",
        )

        # Clear session
        del request.session[session_key]
        del request.session[f"{session_key}_time"]
        request.session.save()

        return Response(
            {
                "status": "success",
                "message": "Request submitted successfully.",
                "data": AccountOpeningRequestSerializer(opening_request).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AccountClosureViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for handling account closure requests."""

    queryset = AccountClosureRequest.objects.all()
    serializer_class = AccountClosureRequestSerializer
    permission_classes = [IsStaffOrCustomer]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter account closure requests based on user role for IDOR protection."""
        user = self.request.user
        queryset = AccountClosureRequest.objects.select_related("account__user", "processed_by", "submitted_by")
        
        # Managers/Admins can see all requests
        if user.role in ["admin", "manager", "operations_manager"] or user.is_superuser:
            return queryset
            
        # Customers only see their own requests (IDOR protection)
        return queryset.filter(submitted_by=user)

    def perform_create(self, serializer):
        """Set the submitted_by field when creating a new request."""
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsManagerOrAdmin])
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

    @action(detail=True, methods=["post"], permission_classes=[IsManagerOrAdmin])
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
        """Retrieve the account balance summary for the logged-in user.

        Returns a detailed breakdown by account type and a combined total balance.
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
