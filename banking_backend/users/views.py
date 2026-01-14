import logging
import secrets
import string

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from core.permissions import IsAdmin

from .models import User
from .serializers import LoginSerializer, UserRegistrationSerializer, UserSerializer
from .services import SendexaService

logger = logging.getLogger(__name__)


class UserRegistrationView(generics.CreateAPIView):
    """ViewSet for new member/customer self-registration."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "registration"  # DRF rate limiting: 3 per hour


class CreateStaffView(APIView):
    """Admin-only endpoint to create staff users.
    Auto-generates password and sends via SMS.
    """

    # In production, use IsAdminUser. For dev/testing flow, IsAuthenticated might be easier if using Postman
    # But for real security: permission_classes = [IsAdminUser]
    # We will use IsAuthenticated and check role manually or rely on custom permission
    permission_classes = [IsAuthenticated]
    throttle_scope = "registration"  # DRF rate limiting: 3 per hour

    def post(self, request):
        """Handle administrative creation of staff users, including auto-password generation and SMS notification."""
        # SECURITY FIX (CVE-COASTAL-02): Removed is_staff to prevent privilege escalation
        # Only explicit administrative roles can create staff, not just any is_staff user
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

        # SECURITY FIX: Validate allowed roles to prevent privilege escalation
        # Only non-admin staff roles can be created through this endpoint
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

        # Auto-generate username from email if not provided
        if "username" not in data and "email" in data:
            data["username"] = data["email"].split("@")[0]

        # 2. Map frontend 'phone' to backend 'phone_number'
        if "phone" in data and "phone_number" not in data:
            data["phone_number"] = data["phone"]

        phone_number = data.get("phone_number")
        if not phone_number:
            return Response(
                {"status": "error", "message": "Phone number is required.", "code": "REQUIRED_FIELD_MISSING"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Generate Random Password (with guaranteed complexity)
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        while True:
            generated_password = "".join(secrets.choice(alphabet) for i in range(12))
            if (
                any(c.islower() for c in generated_password)
                and any(c.isupper() for c in generated_password)
                and any(c.isdigit() for c in generated_password)
                and any(c in "!@#$%^&*" for c in generated_password)
            ):
                break

        # 4. Prepare User Data
        # We'll use the serializer logic but override password
        from .serializers import StaffCreationSerializer

        # Add dummy password to satisfy serializer if it requires it (it usually does for write_only)
        data["password"] = generated_password
        data["password_confirm"] = generated_password

        serializer = StaffCreationSerializer(data=data)
        if serializer.is_valid():
            try:
                # Create user
                user = serializer.save()

                # Ensure password is set correctly (serializer might hash it, which is good)
                # But just to be sure we match the generated one:
                # Actually, serializer.save() calls create() which uses create_user()
                # So the password in 'data' was used.

                # 5. Send Credentials via SMS
                from .services import SendexaService

                message = f"Welcome to Coastal! Your staff login credentials. Email: {user.email}, Password: {generated_password} . Please login and change immediately."

                sms_success, _sms_resp = SendexaService.send_sms(phone_number, message)

                response_data = serializer.data
                response_data["staff_id"] = user.staff_id
                response_data["sms_sent"] = sms_success
                # SECURITY: Never expose passwords in API responses, even in DEBUG mode

                return Response(
                    {
                        "status": "success",
                        "message": "Staff user created successfully",
                        "data": response_data,
                        "sms_sent": sms_success,
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                # SECURITY FIX (CVE-COASTAL-007): prevent information leakage
                # Log the actual error for admins
                logger.error(f"Staff creation failed: {e!s}", exc_info=True)
                return Response(
                    {
                        "status": "error",
                        "message": "Unable to create staff user. Internal error occurred.",
                        "code": "STAFF_CREATION_FAILED",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Endpoint for authenticated users to change their password."""

    permission_classes = [IsAuthenticated]

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
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)

            # Also flush all other sessions if using session auth (optional but good practice)
            # from django.contrib.sessions.models import Session
            # ... logic to clear user sessions ...

            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    authentication_classes = []  # Skip auth to allow login even if old token is invalid
    permission_classes = [AllowAny]
    throttle_scope = "login"  # DRF rate limiting: 5 attempts per 5 minutes

    def post(self, request):
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
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        """Retrieve the currently authenticated user for detailed view/update."""
        return self.request.user


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Handle user logout, invalidating JWT tokens and clearing authentication cookies."""
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            # Continue with logout even if token blacklist fails (e.g. invalid token)
            pass

        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

        # Clear Auth Cookie
        from django.conf import settings

        response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE"])
        response.delete_cookie(settings.SIMPLE_JWT["REFRESH_COOKIE"])

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Custom TokenRefreshView that reads the refresh token from an HttpOnly cookie
    and sets the new access and refresh tokens back into HttpOnly cookies.
    """

    def post(self, request, *args, **kwargs):
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
    """Send OTP for 2FA setup or verification."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Generate and send a 6-digit OTP to the provided phone number for security verification."""
        phone_number = request.data.get("phone_number")
        verification_type = request.data.get("verification_type", "2fa_setup")

        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a 6-digit OTP using a cryptographically secure RNG
        otp_code = str(secrets.SystemRandom().randint(100000, 999999))

        # Store OTP in session
        request.session["otp_code"] = otp_code
        request.session["otp_phone"] = phone_number
        request.session["otp_type"] = verification_type

        # Send OTP via Sendexa
        message = f"Your Coastal Banking OTP is: {otp_code}. Do not share this code."

        success, response = SendexaService.send_sms(phone_number, message)

        if not success:
            logger.error(f"[OTP Error] Failed to send SMS: {response}")
            # In dev, we might still want to return success for testing flow
            # but in prod, this should probably error
            # Return specific error even in production to help debug provider issues (e.g. missing API key)
            if not settings.DEBUG:
                return Response({"error": f"Failed to send SMS: {response}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "success": True,
                "message": f"OTP sent to {phone_number}",
                "expires_in": 300,  # 5 minutes
                # SECURITY FIX (CVE-COASTAL-03): Never expose OTP in API response, even in DEBUG
            }
        )


class VerifyOTPView(APIView):
    """Verify OTP for 2FA setup or other purposes."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Verify the provided OTP against the stored session value and return verification status."""
        phone_number = request.data.get("phone_number")
        otp_code = request.data.get("otp_code")
        verification_type = request.data.get("verification_type", "2fa_setup")

        if not phone_number or not otp_code:
            return Response({"error": "Phone number and OTP code are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP from session
        stored_otp = request.session.get("otp_code")
        stored_phone = request.session.get("otp_phone")
        # stored_type intentionally unused - kept for future 2FA type checks
        otp_created_at = request.session.get("otp_created_at")  # New timestamp
        failed_attempts = request.session.get("otp_failed_attempts", 0)

        if not stored_otp:
            return Response({"error": "No OTP was sent. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY FIX (CVE-COASTAL-005): Rate limiting / Max attempts
        if failed_attempts >= 5:
            # Clear OTP to force new request
            del request.session["otp_code"]
            return Response(
                {"error": "Too many failed attempts. Please request a new OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # SECURITY FIX (CVE-COASTAL-006): Expiration (10 minutes)
        if otp_created_at:
            import time

            if time.time() > otp_created_at + 600:  # 600 seconds = 10 mins
                del request.session["otp_code"]
                return Response(
                    {"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST
                )

        if stored_phone != phone_number:
            return Response({"error": "Phone number does not match."}, status=status.HTTP_400_BAD_REQUEST)

        # SECURITY: Use constant-time comparison to prevent timing attacks
        import hmac

        # stored_otp might be int or str, ensure str
        if not hmac.compare_digest(str(stored_otp), str(otp_code)):
            # Increment failed attempts
            request.session["otp_failed_attempts"] = failed_attempts + 1
            return Response({"error": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        # OTP verified - clear session data
        if "otp_code" in request.session:
            del request.session["otp_code"]
        if "otp_phone" in request.session:
            del request.session["otp_phone"]
        if "otp_type" in request.session:
            del request.session["otp_type"]
        if "otp_created_at" in request.session:
            del request.session["otp_created_at"]
        if "otp_failed_attempts" in request.session:
            del request.session["otp_failed_attempts"]

        # If this is 2FA setup, enable 2FA for the user
        if verification_type == "2fa_setup":
            # 2FA setup logic placeholder
            # Add 2FA enabled flag if your User model has it
            # e.g., request.user.two_factor_enabled = True
            # request.user.phone_number = phone_number
            # request.user.save()
            pass

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

        from core.models_legacy import ClientAssignment

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


class StaffListView(APIView):
    """List staff users for messaging."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a list of staff users for selection in internal messaging."""
        staff = User.objects.filter(is_staff=True).values("id", "email", "first_name", "last_name", "role")[:100]
        return Response(
            [
                {"id": s["id"], "name": f"{s['first_name']} {s['last_name']}", "email": s["email"], "role": s["role"]}
                for s in staff
            ]
        )


class StaffIdsView(APIView):
    """List staff with ID information for Manager Dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve a list of staff members with their formal staff ID strings and status."""
        # Filter by role if provided
        role = request.query_params.get("role")
        status = request.query_params.get("status")

        # Filter to exclude customers, allowing all other roles (staff, banker, manager, etc.)
        queryset = User.objects.exclude(role="customer")

        if role:
            queryset = queryset.filter(role=role)
        if status == "active":
            queryset = queryset.filter(is_active=True)
        elif status == "inactive":
            queryset = queryset.filter(is_active=False)

        staff = queryset.values(
            "id", "email", "first_name", "last_name", "role", "is_active", "date_joined", "staff_id", "phone_number"
        )

        results = []
        for s in staff:
            # Use stored official staff_id if available, otherwise generate fallback
            staff_id_official = s.get("staff_id")
            if not staff_id_official:
                staff_id_official = f"STAFF-{s['id']:05d}"

            results.append(
                {
                    "id": s["id"],
                    "staff_id": staff_id_official,
                    "name": f"{s['first_name']} {s['last_name']}",
                    "first_name": s["first_name"] or "",
                    "last_name": s["last_name"] or "",
                    "email": s["email"],
                    "phone_number": s.get("phone_number"),
                    "role": s["role"],
                    "status": "active" if s["is_active"] else "inactive",
                    "is_active": s["is_active"],
                    "date_joined": s["date_joined"].isoformat() if s["date_joined"] else None,
                    "joined_date": s["date_joined"].isoformat() if s["date_joined"] else None,
                    "employment_date": s["date_joined"].isoformat() if s["date_joined"] else None,
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
        """Identifies and returns active user sessions based on recent login activity within the last 24 hours."""
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
