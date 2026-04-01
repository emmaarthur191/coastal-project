"""Views and API endpoints for user authentication, registration, and management."""

import logging
import secrets

from django.conf import settings
from django.db import transaction
from django.db.models import Max
from django.http import FileResponse
from django.utils import timezone
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from core.permissions import IsAdmin, IsManagerOrAdmin, IsStaff

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    StaffCreationSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from .services import SendexaService

logger = logging.getLogger(__name__)


class UserRegistrationView(generics.CreateAPIView):
    """ViewSet for new member/customer self-registration."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "registration"  # DRF rate limiting: 3 per hour


class CreateStaffView(APIView):
    """Admin-only endpoint to create staff users via secure invitations.

    Creates an inactive user and sends a secure enrollment link via SMS.
    """

    permission_classes = [IsAuthenticated]
    throttle_scope = "registration"

    @extend_schema(request=StaffCreationSerializer, responses={201: UserSerializer})
    def post(self, request):
        """Handle administrative creation of staff users via secure invitation flow."""
        if not (request.user.role in ["admin", "manager", "operations_manager"] or request.user.is_superuser):
            return Response(
                {
                    "status": "error",
                    "message": "You do not have permission to create staff users.",
                    "code": "PERMISSION_DENIED",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()

        # SECURITY FIX: Validate allowed roles
        ALLOWED_STAFF_ROLES = [
            "cashier",
            "mobile_banker",
            "accountant",
            "loan_officer",
            "customer_service",
            "teller",
            "operations_manager",
        ]
        requested_role = data.get("role", "cashier")
        if requested_role not in ALLOWED_STAFF_ROLES:
            return Response(
                {
                    "status": "error",
                    "message": f"Invalid role. Allowed roles: {', '.join(ALLOWED_STAFF_ROLES)}",
                    "code": "INVALID_ROLE",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "username" not in data and "email" in data:
            data["username"] = data["email"].split("@")[0]

        if "phone" in data and "phone_number" not in data:
            data["phone_number"] = data["phone"]

        phone_number = data.get("phone_number")
        if not phone_number:
            return Response(
                {"status": "error", "message": "Phone number is required.", "code": "REQUIRED_FIELD_MISSING"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import UserInvitation
        from .serializers import StaffCreationSerializer

        # Use a temporary secure password - user will change it via invitation
        # Ensure it meets the strict password strength tests (Upper, Lower, Number, Special)
        temp_password = f"Temp{secrets.token_urlsafe(16)}!1"
        data["password"] = temp_password
        data["password_confirm"] = temp_password

        serializer = StaffCreationSerializer(data=data)
        if serializer.is_valid():
            try:
                # Create user in PENDING state
                user = serializer.save()
                user.is_active = False
                user.is_approved = False
                user.save(update_fields=["is_active", "is_approved"])

                # Create the enrollment invitation (letter)
                UserInvitation.create_for_user(user)

                response_data = serializer.data
                response_data["staff_id_status"] = "Pending Approval"
                response_data["approval_required"] = True

                return Response(
                    {
                        "status": "success",
                        "message": "Staff registration submitted. Please contact the Manager for approval and credentials.",
                        "data": response_data,
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Staff registration failed: {e!s}", exc_info=True)
                return Response(
                    {
                        "status": "error",
                        "message": "Unable to register staff user. Internal error occurred.",
                        "code": "STAFF_REGISTRATION_FAILED",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffInvitationVerifyView(APIView):
    """Verify staff invitation token and set initial password."""

    permission_classes = [AllowAny]
    throttle_scope = "registration"

    def post(self, request):
        """Handle invitation verification and account activation."""
        from .models import UserInvitation
        from .security import validate_password_strength

        token = request.data.get("token")
        password = request.data.get("password")
        password_confirm = request.data.get("password_confirm")

        if not token or not password:
            return Response({"error": "Token and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if password != password_confirm:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate password strength
        is_valid, errors = validate_password_strength(password)
        if not is_valid:
            return Response({"error": errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = UserInvitation.objects.get(token=token)
            if not invitation.is_valid():
                return Response(
                    {"error": "Invitation token is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST
                )

            user = invitation.user
            user.set_password(password)
            user.is_active = True
            user.save()

            invitation.is_used = True
            invitation.used_at = timezone.now()
            invitation.save()

            return Response(
                {"status": "success", "message": "Account activated successfully. You can now login."},
                status=status.HTTP_200_OK,
            )

        except UserInvitation.DoesNotExist:
            return Response({"error": "Invalid invitation token."}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Endpoint for authenticated users to change their password."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        """Handle password change requests for the authenticated user, validating old password and updating security tokens."""
        from .serializers import ChangePasswordSerializer

        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data["old_password"]
            new_password = serializer.validated_data["new_password"]

            # Verify old password
            if not user.check_password(old_password):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

            # Set new password
            user.set_password(new_password)
            user.save()

            # Update session/token if needed, but for JWT usually client just gets new token next time
            # Or we can invalidate old tokens (Blacklist) if strict security is needed.
            # SECURITY FIX (CVE-COASTAL-003): Invalidate all existing tokens
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)

            # Also flush all other sessions if using session auth (optional but good practice)
            # from django.contrib.sessions.models import Session
            # ... logic to clear user sessions ...

            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Endpoint for user authentication and login."""

    authentication_classes = []  # Skip auth to allow login even if old token is invalid
    permission_classes = [AllowAny]
    throttle_scope = "login"  # DRF rate limiting: 5 attempts per 5 minutes

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        """Authenticate user credentials and return JWT tokens and user details."""
        from .security import SecurityService

        # Security: Check rate limiting by IP
        if SecurityService.is_rate_limited(request):
            return Response(
                {
                    "status": "error",
                    "message": "Too many login attempts. Please try again later.",
                    "code": "RATE_LIMITED",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Record this attempt for rate limiting
        SecurityService.record_login_attempt(request)

        # Get email to check account lockout before full validation
        email = request.data.get("email", "")
        lookup_user = None  # Use a separate variable for the pre-lookup user
        try:
            lookup_user = User.objects.get(email=email)

            # Security: Check if account is locked
            if lookup_user.is_locked():
                remaining = (lookup_user.locked_until - timezone.now()).seconds // 60
                return Response(
                    {
                        "status": "error",
                        "message": f"Account locked due to too many failed attempts. Try again in {remaining} minutes.",
                        "code": "ACCOUNT_LOCKED",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        except User.DoesNotExist:
            pass  # Continue with normal flow - don't reveal if user exists

        # Validate credentials
        serializer = LoginSerializer(data=request.data)

        try:
            if not serializer.is_valid():
                # If we found the user earlier, record failed attempt
                if lookup_user:
                    is_locked = SecurityService.handle_failed_login(lookup_user, request)
                    if is_locked:
                        return Response(
                            {"error": "Account locked due to too many failed attempts.", "code": "ACCOUNT_LOCKED"},
                            status=status.HTTP_403_FORBIDDEN,
                        )

                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)

        user = serializer.validated_data["user"]

        # Security: Log successful login and reset failed attempts
        SecurityService.handle_successful_login(user, request)

        refresh = RefreshToken.for_user(user)

        # SECURITY: Do NOT expose tokens in response body - only set in HTTP-only cookies
        # This prevents XSS attacks from stealing tokens
        response = Response({"message": "Login successful", "user": UserSerializer(user).data})

        # Set Cookies
        from django.conf import settings

        # Access Token Cookie
        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE"],
            value=str(refresh.access_token),
            expires=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        )

        # Refresh Token Cookie
        response.set_cookie(
            key=settings.SIMPLE_JWT["REFRESH_COOKIE"],
            value=str(refresh),
            expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        )

        return response


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Endpoint for retrieving and updating user profile details."""

    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        """Retrieve the currently authenticated user for detailed view/update."""
        return self.request.user


class LogoutView(APIView):
    """Endpoint for user logout and token revocation."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Handle user logout, invalidating JWT tokens and clearing authentication cookies."""
        from django.conf import settings

        try:
            # SECURITY FIX (CVE-COASTAL-009): Extract refresh token from cookie
            # when not provided in body. Cookie-based auth means the body is
            # typically empty, so the server must read from the HttpOnly cookie.
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get("REFRESH_COOKIE", "refresh_token"))
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            # Continue with logout even if token blacklist fails (e.g. invalid token)
            pass

        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

        # Clear Auth Cookies
        response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
        response.delete_cookie(settings.SIMPLE_JWT["REFRESH_COOKIE"])

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Custom TokenRefreshView that reads the refresh token from an HttpOnly cookie.

    Sets the new access and refresh tokens back into HttpOnly cookies.
    """

    def post(self, request, *args, **kwargs):
        """Exchange a valid refresh token for a new access token."""
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["REFRESH_COOKIE"])

        if refresh_token and "refresh" not in request.data:
            # We need to inject the refresh token into request.data for TokenRefreshView
            if hasattr(request.data, "_mutable"):
                request.data["refresh"] = refresh_token
            else:
                try:
                    request.data._mutable = True
                    request.data["refresh"] = refresh_token
                    request.data._mutable = False
                except (AttributeError, TypeError):
                    # If data is a dict or otherwise doesn't support _mutable
                    if isinstance(request.data, dict):
                        request.data["refresh"] = refresh_token
                    else:
                        # Fallback for other immutable types
                        _data = request.data.copy()
                        _data["refresh"] = refresh_token
                        request._data = _data

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")

            if access_token:
                response.set_cookie(
                    key=settings.SIMPLE_JWT["AUTH_COOKIE"],
                    value=access_token,
                    expires=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
                    secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                    httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                    samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                )

            if refresh_token:
                response.set_cookie(
                    key=settings.SIMPLE_JWT["REFRESH_COOKIE"],
                    value=refresh_token,
                    expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                    secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                    httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                    samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                )

        return response


from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie


@method_decorator(ensure_csrf_cookie, name="dispatch")
class GetCSRFToken(APIView):
    """Endpoint to issue a CSRF cookie for subsequent requests."""

    authentication_classes = []  # Skip auth to prevent 401s
    permission_classes = [AllowAny]

    def get(self, request):
        """Return a fresh CSRF token for frontend security."""
        return Response({"csrfToken": get_token(request)})


class AuthCheckView(APIView):
    """Check if the user is authenticated."""

    authentication_classes = []  # Skip JWT auth to prevent 401 errors
    permission_classes = [AllowAny]

    def get(self, request):
        """Implicitly check if the user is authenticated via JWT cookies without triggering a 401 response."""
        # Manually try to authenticate using JWT (Cookie or Header)
        from users.authentication import JWTCookieAuthentication

        try:
            jwt_auth = JWTCookieAuthentication()
            result = jwt_auth.authenticate(request)
            if result:
                user, _token = result
                return Response({"status": "success", "authenticated": True, "user": UserSerializer(user).data})
        except Exception as e:
            logger.debug(f"Auth check silent failure: {e}")
            pass

        return Response({"status": "success", "authenticated": False, "message": "User is not authenticated"})


class UserListView(generics.ListAPIView):
    """Admin-only view to list all registered users."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class MemberDashboardView(APIView):
    """Get dashboard data for the authenticated member/customer."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a summary of account balances and recent transactions for the member dashboard."""
        user = request.user

        # Import here to avoid circular imports
        from decimal import Decimal

        from core.models import Account, Transaction

        # Get user's accounts
        accounts = Account.objects.filter(user=user, is_active=True)

        # Calculate totals
        total_balance = sum(acc.balance for acc in accounts) if accounts else Decimal("0.00")
        total_daily_susu = (
            sum(acc.balance for acc in accounts if acc.account_type == "daily_susu") if accounts else Decimal("0.00")
        )

        # Get recent transactions (last 10) - use Q objects instead of union to avoid ORDER BY in subquery
        from django.db.models import Q

        recent_transactions = Transaction.objects.filter(
            Q(from_account__user=user) | Q(to_account__user=user)
        ).order_by("-timestamp")[:10]

        # Build response
        accounts_data = [
            {
                "id": acc.id,
                "account_number": acc.account_number,
                "account_type": acc.account_type,
                "balance": str(acc.balance),
                "is_active": acc.is_active,
            }
            for acc in accounts
        ]

        transactions_data = [
            {
                "id": tx.id,
                "amount": str(tx.amount),
                "transaction_type": tx.transaction_type,
                "description": tx.description,
                "status": tx.status,
                "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
            }
            for tx in recent_transactions
        ]

        return Response(
            {
                "total_balance": str(total_balance),
                "total_daily_susu": str(total_daily_susu),
                "available_balance": str(total_balance),
                "accounts": accounts_data,
                "recent_transactions": transactions_data,
                "user": UserSerializer(user).data,
            }
        )


class SendOTPView(APIView):
    """Send OTP for 2FA setup or verification with database-backed security."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "otp_request"

    @extend_schema(request=OTPRequestSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        """Generate and send a 6-digit OTP to the provided phone number for security verification."""
        from core.utils.field_encryption import hash_field

        from .models import OTPVerification

        phone_number = request.data.get("phone_number")
        verification_type = request.data.get("verification_type", "2fa_setup")

        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY FIX: Prevent OTP spamming (Replaces session-based cooldown)
        # Check for any active, unverified OTP sent in the last 60 seconds
        phone_hash = hash_field(phone_number)
        cooldown_cutoff = timezone.now() - timezone.timedelta(seconds=60)
        recent_otp = OTPVerification.objects.filter(
            phone_number_hash=phone_hash, is_verified=False, created_at__gt=cooldown_cutoff
        ).exists()

        if recent_otp:
            return Response(
                {"error": "Please wait 60 seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # NEW: use persistent OTPVerification model for generation and hashing
        otp_obj, otp_code = OTPVerification.create_otp(phone_number, request=request)

        # Send OTP via Sendexa
        message = f"Your Coastal Banking OTP is: {otp_code}. Do not share this code."

        success, response = SendexaService.send_sms(phone_number, message)

        if not success:
            logger.error(f"[OTP Error] Failed to send SMS: {response}")
            # If Sendexa fails (e.g. Cloudflare block), return a specific error to help diagnosis
            if not settings.DEBUG:
                return Response({"error": f"Failed to send SMS code. {response}"}, status=status.HTTP_502_BAD_GATEWAY)

        response_data = {
            "success": True,
            "message": f"OTP sent to {phone_number}",
            "expires_in": 600,
        }
        if settings.DEBUG:
            response_data["debug_otp"] = otp_code

        return Response(response_data, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """Verify OTP for 2FA setup or other purposes using persistent storage."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "otp_verify"

    @extend_schema(request=OTPVerifySerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        """Verify the provided OTP against the database and return verification status."""
        from core.utils.field_encryption import hash_field

        from .models import OTPVerification

        phone_number = request.data.get("phone_number")
        otp_code = request.data.get("otp_code")
        verification_type = request.data.get("verification_type", "2fa_setup")

        if not phone_number or not otp_code:
            return Response({"error": "Phone number and OTP code are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch latest unverified OTP for this phone
        phone_hash = hash_field(phone_number)
        otp_record = (
            OTPVerification.objects.filter(phone_number_hash=phone_hash, is_verified=False)
            .order_by("-created_at")
            .first()
        )

        if not otp_record:
            return Response(
                {"error": "No OTP was sent or it has already been used."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Use model-level verification logic (handles hashing, expiry, and attempts)
        success, verify_message = otp_record.verify(otp_code)

        if not success:
            status_code = (
                status.HTTP_429_TOO_MANY_REQUESTS if "Too many" in verify_message else status.HTTP_400_BAD_REQUEST
            )
            return Response({"error": verify_message}, status=status_code)

        # OTP verified - If this is 2FA setup, we could mark the user's phone as verified here
        if verification_type == "2fa_setup":
            user = request.user
            user.phone_number = phone_number
            # user.is_phone_verified = True # Add this field to User model if needed
            user.save()

        return Response({"success": True, "message": "OTP verified successfully.", "verified": True})


class MembersListView(APIView):
    """List customer members for cashier lookup. Staff only."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a list of registered members (customers) for staff-level lookups."""
        # SECURITY: Only staff can enumerate customer PII
        if not (
            request.user.is_staff
            or request.user.role in ["cashier", "mobile_banker", "manager", "operations_manager", "admin"]
        ):
            return Response({"error": "Access denied. Staff only."}, status=403)

        from django.db.models import Prefetch

        from core.models.operational import ClientAssignment

        # Prefetch active assignments with banker details in a single query
        active_assignment_prefetch = Prefetch(
            "assigned_to_bankers",
            queryset=ClientAssignment.objects.filter(is_active=True).select_related("mobile_banker"),
            to_attr="active_assignments_list",
        )

        members_queryset = User.objects.filter(role="customer").prefetch_related(active_assignment_prefetch)[:100]

        results = []
        for m in members_queryset:
            banker_info = None
            assignment_id = None

            # Get the first active assignment from the prefetched list
            if hasattr(m, "active_assignments_list") and m.active_assignments_list:
                assignment = m.active_assignments_list[0]
                assignment_id = assignment.id
                banker = assignment.mobile_banker
                banker_info = {"id": banker.id, "name": banker.get_full_name() or banker.email}

            results.append(
                {
                    "id": m.id,
                    "name": f"{m.first_name} {m.last_name}".strip() or m.email,
                    "email": m.email,
                    "current_assignment": {"id": assignment_id, "banker": banker_info} if assignment_id else None,
                }
            )

        return Response(results)


class StaffSerializer(serializers.ModelSerializer):
    """Serializer for staff users with decrypted name."""

    name = serializers.SerializerMethodField()

    class Meta:
        """Metadata for StaffSerializer."""

        model = User
        fields = ["id", "email", "name", "role"]

    def get_name(self, obj):
        """Retrieve full name by decrypting first and last names."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class StaffListView(APIView):
    """List staff users for messaging."""

    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        """Retrieve a list of staff users for selection in internal messaging."""
        staff = User.objects.filter(is_staff=True)[:100]
        serializer = StaffSerializer(staff, many=True)
        return Response(serializer.data)


class StaffIdsView(APIView):
    """List staff with ID information for Manager Dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a list of staff members with their formal staff ID strings and status."""
        # SECURITY FIX: Restrict staff PII enumeration to roles with legitimate business need (Manager+)
        if not (request.user.role in ["admin", "manager", "operations_manager"] or request.user.is_superuser):
            return Response(
                {
                    "status": "error",
                    "message": "You do not have permission to view staff PII.",
                    "code": "PERMISSION_DENIED",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Filter by role if provided
        role = request.query_params.get("role")
        status_param = request.query_params.get("status")

        # Filter to exclude customers, allowing all other roles (staff, banker, manager, etc.)
        queryset = User.objects.exclude(role="customer")

        if role:
            queryset = queryset.filter(role=role)
        if status_param == "active":
            queryset = queryset.filter(is_active=True)
        elif status_param == "inactive":
            queryset = queryset.filter(is_active=False)

        # Pull objects to allow property-based PII decryption
        staff = queryset.only(
            "id",
            "email",
            "role",
            "is_active",
            "date_joined",
            "first_name_encrypted",
            "last_name_encrypted",
            "staff_id_encrypted",
            "phone_number_encrypted",
        )[:100]

        results = []
        for s in staff:
            # Use stored official staff_id if available, otherwise generate fallback
            staff_id_official = s.staff_id
            if not staff_id_official:
                staff_id_official = f"STAFF-{s.id:05d}"

            # Decrypt names via property with fallback to email for display
            first_name = s.first_name or ""
            last_name = s.last_name or ""
            full_name = f"{first_name} {last_name}".strip() or s.email

            results.append(
                {
                    "id": s.id,
                    "staff_id": staff_id_official,
                    "name": full_name,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": s.email,
                    "phone_number": s.phone_number,  # Decrypted via property
                    "role": s.role,
                    "status": "active" if s.is_active else "inactive",
                    "is_active": s.is_active,
                    "date_joined": s.date_joined.isoformat() if s.date_joined else None,
                    "joined_date": s.date_joined.isoformat() if s.date_joined else None,
                    "employment_date": s.date_joined.isoformat() if s.date_joined else None,
                }
            )

        return Response({"results": results, "count": len(results)})


class LoginAttemptsView(APIView):
    """List recent login attempts (successful and failed)."""

    # Manager and Ops Manager should be able to see security logs
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a log of recent login and failed login activities for security auditing."""
        # Check permissions manually if not using IsManager/IsAdmin
        if not (request.user.role in ["admin", "manager", "operations_manager"] or request.user.is_superuser):
            return Response(
                {"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN
            )

        from .models import UserActivity

        # Get recent 100 login activities
        activities = (
            UserActivity.objects.filter(action__in=["login", "failed_login"])
            .select_related("user")
            .order_by("-created_at")[:100]
        )

        results = []
        for activity in activities:
            details = activity.details or {}

            # Construct friendly device name
            device_name = details.get("device", "Unknown Device")
            if device_name == "Unknown Device":
                # Fallback
                if "Mobile" in activity.user_agent:
                    device_name = "Mobile"
                elif "Windows" in activity.user_agent:
                    device_name = "PC"
                else:
                    device_name = "Other"

            results.append(
                {
                    "id": activity.id,
                    "email": activity.user.email,
                    "success": activity.action == "login",
                    "ip_address": activity.ip_address,
                    "location": details.get("location", "Unknown"),
                    "device": device_name,
                    "timestamp": activity.created_at.isoformat(),
                    "user_agent": activity.user_agent,  # Keep full UA for debug if needed
                }
            )

        return Response(results)


class UserSessionsView(APIView):
    """List active user sessions (simulated via recent activity)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Identify and return active user sessions based on recent login activity within the last 24 hours."""
        if not (request.user.role in ["admin", "manager", "operations_manager"] or request.user.is_superuser):
            return Response(
                {"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN
            )

        import datetime

        from django.utils import timezone

        from .models import UserActivity

        # Find recent logins in the last 24 hours to simulate "active sessions"
        last_24h = timezone.now() - datetime.timedelta(hours=24)
        recent_logins = (
            UserActivity.objects.filter(action="login", created_at__gte=last_24h)
            .select_related("user")
            .order_by("-created_at")
        )

        # Deduplicate by user to show only latest session per user
        sessions = {}
        for login in recent_logins:
            if login.user.id not in sessions:
                # Extract device and location from stored activity details
                details = login.details or {}
                device_name = details.get("device", "Unknown Device")
                os_info = details.get("os", "")
                # browser_info available via details.get('browser', '') if needed
                location = details.get("location", "Unknown Location")

                # Fallback to User-Agent parsing if details are empty (for old logs)
                if device_name == "Unknown Device":
                    ua = login.user_agent
                    if "Mobile" in ua:
                        device_name = "Mobile Device"
                    elif "Macintosh" in ua:
                        device_name = "Mac"
                    elif "Windows" in ua:
                        device_name = "PC"
                    else:
                        device_name = ua[:30] + "..."

                full_device_string = f"{device_name}"
                if os_info:
                    full_device_string += f" ({os_info})"

                sessions[login.user.id] = {
                    "id": login.id,
                    "user": login.user.email,
                    "ip_address": login.ip_address,
                    "device": full_device_string,
                    "location": location,
                    "last_active": login.created_at.isoformat(),
                    "status": "Active",
                }

        return Response(list(sessions.values()))


class SessionTerminateView(APIView):
    """Terminate a user session (simulated)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def post(self, request, pk):
        """Terminate a specific user session, invalidating all associated JWT tokens."""
        if not (request.user.role in ["admin", "manager", "operations_manager"] or request.user.is_superuser):
            return Response(
                {"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN
            )

        from .models import UserActivity

        try:
            # We are using the "login" activity ID as the session ID
            activity = UserActivity.objects.get(pk=pk, action="login")
            user = activity.user

            # Log the forced logout
            UserActivity.objects.create(
                user=user,
                action="force_logout",
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent="Admin Terminated",
                details={"terminated_by": request.user.email, "original_login_id": pk},
            )

            # In a real JWT setup with blacklisting, we would blacklist all outstanding tokens for this user here.
            from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)

            # Return success
            return Response({"status": "success", "message": "Session terminated successfully"})

        except UserActivity.DoesNotExist:
            return Response({"detail": "Session not found"}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetRequestView(APIView):
    """Request a password reset link.

    Security features:
    - Rate limited (3 requests per hour)
    - Does not reveal if email exists (prevents enumeration)
    - Sends email/SMS with secure token
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "password_reset"

    @extend_schema(request=PasswordResetRequestSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        """Handle request for a password reset token."""
        from .models import PasswordResetToken
        from .serializers import PasswordResetRequestSerializer
        from .services import SendexaService

        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]

        # Always return success to prevent email enumeration
        success_response = {
            "message": "If an account exists with this email, you will receive a password reset link.",
            "expires_in": 900,  # 15 minutes
        }

        try:
            user = User.objects.get(email=email)

            # Create token
            reset_token = PasswordResetToken.create_for_user(user, request)

            # Send reset link via SMS (as this is a banking app with SMS)
            if user.phone_number:
                reset_url = (
                    f"{settings.FRONTEND_URL or 'https://app.coastalbank.com'}/reset-password?token={reset_token.token}"
                )
                message = f"Coastal Banking: Your password reset link (valid for 15 min): {reset_url}"
                SendexaService.send_sms(user.phone_number, message)
                logger.info(f"Password reset token sent to user {user.id}")

            # Also log for audit
            from users.models import AuditLog

            AuditLog.objects.create(
                user=user,
                action="password_reset_requested",
                resource_type="User",
                resource_id=str(user.id),
                ip_address=request.META.get("REMOTE_ADDR"),
                changes={"email": email},
            )

        except User.DoesNotExist:
            # Log attempt but don't reveal to user
            logger.warning(f"Password reset attempted for non-existent email: {email}")

        return Response(success_response)


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token.

    Security features:
    - Token validation (one-time use, expiration)
    - Password strength enforcement
    - All existing tokens blacklisted after reset
    - User notified of password change
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        """Handle the confirmation of a new password using a reset token."""
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

        from .models import PasswordResetToken

        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_str = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            reset_token = PasswordResetToken.objects.get(token=token_str)

            if not reset_token.is_valid():
                return Response(
                    {"error": "This reset link has expired or already been used. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = reset_token.user

            # Update password
            user.set_password(new_password)
            user.save()

            # Mark token as used
            reset_token.mark_used()

            # Invalidate all existing JWT tokens
            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)

            # Notify user via SMS
            from .services import SendexaService

            if user.phone_number:
                message = "Coastal Banking: Your password has been changed. If you did not do this, contact support immediately."
                SendexaService.send_sms(user.phone_number, message)

            # Audit log
            from users.models import AuditLog

            AuditLog.objects.create(
                user=user,
                action="password_reset_completed",
                resource_type="User",
                resource_id=str(user.id),
                ip_address=request.META.get("REMOTE_ADDR"),
            )

            logger.info(f"Password reset completed for user {user.id}")

            return Response(
                {"message": "Password has been reset successfully. You can now log in with your new password."}
            )

        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Invalid reset token. Please request a new password reset."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class StaffManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for Manager-level staff management actions."""

    queryset = User.objects.exclude(role="customer")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Restrict to Manager/Admin/Ops Manager."""
        return [IsManagerOrAdmin()]

    @action(detail=True, methods=["post"], url_path="approve-and-print")
    def approve_and_print(self, request, pk=None):
        """Approve a staff member, generate staff ID, and return a welcome letter."""
        user = self.get_object()

        if user.is_approved:
            return Response(
                {"status": "error", "message": "This staff member is already approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # SECURITY: Prevent approving self
        if user == request.user:
            return Response(
                {"status": "error", "message": "You cannot self-approve staff registration."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                # 1. Generate Staff ID if not exists (CA prefix)
                if not user.staff_number:
                    max_staff = User.objects.aggregate(Max("staff_number"))["staff_number__max"] or 0
                    user.staff_number = max_staff + 1
                    prefix = "CA"
                    if user.staff_number > 9999:
                        user.staff_id = f"{prefix}{user.staff_number:05d}"
                    else:
                        user.staff_id = f"{prefix}{user.staff_number:04d}"

                # 2. Activate Account
                import secrets

                temp_password = secrets.token_urlsafe(8)
                user.set_password(temp_password)
                user.is_approved = True
                user.is_active = True
                user.save()

                # 3. Generate Welcome Letter
                from core.pdf_services import generate_staff_welcome_letter_pdf

                pdf_buffer = generate_staff_welcome_letter_pdf(user, temp_password)

                # 4. Optional SMS Fallback
                message = (
                    f"Coastal Banking: Welcome {user.first_name}! Your staff account is approved. "
                    f"ID: {user.staff_id}. Credentials handover via Manager. Login with your email."
                )
                from users.services import SendexaService

                SendexaService.send_sms(user.phone_number, message)

                return FileResponse(
                    pdf_buffer,
                    as_attachment=True,
                    filename=f"Coastal_Staff_Welcome_{user.staff_id}.pdf",
                    content_type="application/pdf",
                )

        except Exception as e:
            logger.error(f"Staff Approve & Print failed: {e}")
            return Response(
                {"status": "error", "message": f"Approval failed: {e!s}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
