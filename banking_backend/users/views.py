from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.utils import timezone
from .serializers import UserSerializer, UserRegistrationSerializer, LoginSerializer
from .models import User
from core.permissions import IsAdmin
from django.conf import settings
from .services import SendexaService
from django.utils.crypto import get_random_string
import string
import secrets

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    permission_classes = [AllowAny]


class CreateStaffView(APIView):
    """
    Admin-only endpoint to create staff users.
    Auto-generates password and sends via SMS.
    """
    # In production, use IsAdminUser. For dev/testing flow, IsAuthenticated might be easier if using Postman
    # But for real security: permission_classes = [IsAdminUser] 
    # We will use IsAuthenticated and check role manually or rely on custom permission
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        # 1. Check Permissions (ensure caller is manager/admin)
        if request.user.role not in ['admin', 'manager', 'operations_manager']:
            return Response(
                {"error": "You do not have permission to create staff users."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        
        # 2. Map frontend 'phone' to backend 'phone_number'
        if 'phone' in data and 'phone_number' not in data:
            data['phone_number'] = data['phone']
            
        phone_number = data.get('phone_number')
        if not phone_number:
            return Response({"phone": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Generate Random Password (with guaranteed complexity)
        alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
        while True:
            generated_password = ''.join(secrets.choice(alphabet) for i in range(12))
            if (any(c.islower() for c in generated_password)
                    and any(c.isupper() for c in generated_password)
                    and any(c.isdigit() for c in generated_password)
                    and any(c in '!@#$%^&*' for c in generated_password)):
                break
        
        # 4. Prepare User Data
        # We'll use the serializer logic but override password
        from .serializers import StaffCreationSerializer
        
        # Add dummy password to satisfy serializer if it requires it (it usually does for write_only)
        data['password'] = generated_password
        data['password_confirm'] = generated_password
        
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
                
                sms_success, sms_resp = SendexaService.send_sms(phone_number, message)
                
                response_data = serializer.data
                response_data['staff_id'] = user.staff_id
                response_data['sms_sent'] = sms_success
                # SECURITY: Never expose passwords in API responses, even in DEBUG mode
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Endpoint for authenticated users to change their password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import ChangePasswordSerializer
        
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            # Verify old password
            if not user.check_password(old_password):
                return Response(
                    {"old_password": ["Wrong password."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Update session/token if needed, but for JWT usually client just gets new token next time
            # Or we can invalidate old tokens (Blacklist) if strict security is needed.
            # For now, just keeping it simple.
            
            return Response(
                {"message": "Password updated successfully."}, 
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .security import SecurityService
        
        # Security: Check rate limiting by IP
        if SecurityService.is_rate_limited(request):
            return Response({
                'error': 'Too many login attempts. Please try again later.',
                'code': 'RATE_LIMITED'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Record this attempt for rate limiting
        SecurityService.record_login_attempt(request)
        
        # Get email to check account lockout before full validation
        email = request.data.get('email', '')
        try:
            user = User.objects.get(email=email)
            
            # Security: Check if account is locked
            if user.is_locked():
                remaining = (user.locked_until - timezone.now()).seconds // 60
                return Response({
                    'error': f'Account locked due to too many failed attempts. Try again in {remaining} minutes.',
                    'code': 'ACCOUNT_LOCKED'
                }, status=status.HTTP_403_FORBIDDEN)
        except User.DoesNotExist:
            pass  # Continue with normal flow - don't reveal if user exists
        
        # Validate credentials
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            # If we found the user earlier, record failed attempt
            if 'user' in dir() and user:
                is_locked = SecurityService.handle_failed_login(user, request)
                if is_locked:
                    return Response({
                        'error': 'Account locked due to too many failed attempts.',
                        'code': 'ACCOUNT_LOCKED'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        
        # Security: Log successful login and reset failed attempts
        SecurityService.handle_successful_login(user, request)
        
        refresh = RefreshToken.for_user(user)
        
        # SECURITY: Do NOT expose tokens in response body - only set in HTTP-only cookies
        # This prevents XSS attacks from stealing tokens
        response = Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        })
        
        # Set Cookies
        from django.conf import settings
        
        # Access Token Cookie
        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'], 
            value=str(refresh.access_token),
            expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )
        
        # Refresh Token Cookie
        response.set_cookie(
            key=settings.SIMPLE_JWT['REFRESH_COOKIE'], 
            value=str(refresh),
            expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )
        
        return response

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
            
        # Clear cookies
        from django.conf import settings
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['REFRESH_COOKIE'])
        
        return response


class AuthCheckView(APIView):
    """Check if the user is authenticated."""
    authentication_classes = []  # Skip JWT auth to prevent 401 errors
    permission_classes = [AllowAny]

    def get(self, request):
        # Manually try to authenticate using JWT
        from rest_framework_simplejwt.authentication import JWTAuthentication
        
        try:
            jwt_auth = JWTAuthentication()
            result = jwt_auth.authenticate(request)
            if result:
                user, token = result
                return Response({
                    'authenticated': True,
                    'user': UserSerializer(user).data
                })
        except Exception:
            pass
        
        return Response({'authenticated': False})


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class MemberDashboardView(APIView):
    """Get dashboard data for the authenticated member/customer."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Import here to avoid circular imports
        from core.models import Account, Transaction
        from decimal import Decimal
        
        # Get user's accounts
        accounts = Account.objects.filter(user=user, is_active=True)
        
        # Calculate totals
        total_balance = sum(acc.balance for acc in accounts) if accounts else Decimal('0.00')
        total_daily_susu = sum(acc.balance for acc in accounts if acc.account_type == 'daily_susu') if accounts else Decimal('0.00')
        
        # Get recent transactions (last 10) - use Q objects instead of union to avoid ORDER BY in subquery
        from django.db.models import Q
        recent_transactions = Transaction.objects.filter(
            Q(from_account__user=user) | Q(to_account__user=user)
        ).order_by('-timestamp')[:10]
        
        # Build response
        accounts_data = [
            {
                'id': acc.id,
                'account_number': acc.account_number,
                'account_type': acc.account_type,
                'balance': str(acc.balance),
                'is_active': acc.is_active,
            }
            for acc in accounts
        ]
        
        transactions_data = [
            {
                'id': tx.id,
                'amount': str(tx.amount),
                'transaction_type': tx.transaction_type,
                'description': tx.description,
                'status': tx.status,
                'timestamp': tx.timestamp.isoformat() if tx.timestamp else None,
            }
            for tx in recent_transactions
        ]
        
        return Response({
            'total_balance': str(total_balance),
            'total_daily_susu': str(total_daily_susu),
            'available_balance': str(total_balance),
            'accounts': accounts_data,
            'recent_transactions': transactions_data,
            'user': UserSerializer(user).data,
        })


class SendOTPView(APIView):
    """Send OTP for 2FA setup or verification."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        verification_type = request.data.get('verification_type', '2fa_setup')
        
        if not phone_number:
            return Response(
                {'error': 'Phone number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate a 6-digit OTP using a cryptographically secure RNG
        otp_code = str(secrets.SystemRandom().randint(100000, 999999))
        
        # Store OTP in session
        request.session['otp_code'] = otp_code
        request.session['otp_phone'] = phone_number
        request.session['otp_type'] = verification_type
        
        # Send OTP via Sendexa
        from .services import SendexaService
        message = f"Your Coastal Banking OTP is: {otp_code}. Do not share this code."
        
        success, response = SendexaService.send_sms(phone_number, message)
        
        if not success:
            print(f"[OTP Error] Failed to send SMS: {response}")
            # In dev, we might still want to return success for testing flow
            # but in prod, this should probably error
            if not settings.DEBUG:
                return Response({'error': 'Failed to send SMS.'}, status=500)
        
        return Response({
            'success': True,
            'message': f'OTP sent to {phone_number}',
            'expires_in': 300,  # 5 minutes
            # Remove this in production - only for testing
            'debug_otp': otp_code if settings.DEBUG else None
        })



class VerifyOTPView(APIView):
    """Verify OTP for 2FA setup or other purposes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp_code = request.data.get('otp_code')
        verification_type = request.data.get('verification_type', '2fa_setup')
        
        if not phone_number or not otp_code:
            return Response(
                {'error': 'Phone number and OTP code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP from session
        stored_otp = request.session.get('otp_code')
        stored_phone = request.session.get('otp_phone')
        stored_type = request.session.get('otp_type')
        
        if not stored_otp:
            return Response(
                {'error': 'No OTP was sent. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if stored_phone != phone_number:
            return Response(
                {'error': 'Phone number does not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # SECURITY: Use constant-time comparison to prevent timing attacks
        import hmac
        if not hmac.compare_digest(stored_otp, otp_code):
            return Response(
                {'error': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # OTP verified - clear session data
        del request.session['otp_code']
        del request.session['otp_phone']
        del request.session['otp_type']
        
        # If this is 2FA setup, enable 2FA for the user
        if verification_type == '2fa_setup':
            user = request.user
            # Add 2FA enabled flag if your User model has it
            # user.two_factor_enabled = True
            # user.phone_number = phone_number
            # user.save()
            pass
        
        return Response({
            'success': True,
            'message': 'OTP verified successfully.',
            'verified': True
        })


class MembersListView(APIView):
    """List customer members for cashier lookup. Staff only."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # SECURITY: Only staff can enumerate customer PII
        if not (request.user.is_staff or request.user.role in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'admin']):
            return Response({'error': 'Access denied. Staff only.'}, status=403)
        
        members = User.objects.filter(role='customer').values('id', 'email', 'first_name', 'last_name')[:100]
        return Response([
            {'id': m['id'], 'name': f"{m['first_name']} {m['last_name']}", 'email': m['email']}
            for m in members
        ])


class StaffListView(APIView):
    """List staff users for messaging."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        staff = User.objects.filter(is_staff=True).values('id', 'email', 'first_name', 'last_name', 'role')[:100]
        return Response([
            {'id': s['id'], 'name': f"{s['first_name']} {s['last_name']}", 'email': s['email'], 'role': s['role']}
            for s in staff
        ])


class StaffIdsView(APIView):
    """List staff with ID information for Manager Dashboard."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Filter by role if provided
        role = request.query_params.get('role')
        status = request.query_params.get('status')
        
        queryset = User.objects.filter(is_staff=True)
        
        if role:
            queryset = queryset.filter(role=role)
        if status == 'active':
            queryset = queryset.filter(is_active=True)
        elif status == 'inactive':
            queryset = queryset.filter(is_active=False)
        
        staff = queryset.values('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
        
        results = []
        for s in staff:
            # Generate staff ID based on user ID
            staff_id = f"STAFF-{s['id']:05d}"
            results.append({
                'id': s['id'],
                'staff_id': staff_id,
                'name': f"{s['first_name']} {s['last_name']}",
                'email': s['email'],
                'role': s['role'],
                'status': 'active' if s['is_active'] else 'inactive',
                'joined_date': s['date_joined'].isoformat() if s['date_joined'] else None
            })
        
        return Response({
            'results': results,
            'count': len(results)
        })



class LoginAttemptsView(APIView):
    """List recent login attempts (successful and failed)."""
    # Manager and Ops Manager should be able to see security logs
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check permissions manually if not using IsManager/IsAdmin
        if not (request.user.role in ['admin', 'manager', 'operations_manager'] or request.user.is_superuser):
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)

        from .models import UserActivity
        
        # Get recent 100 login activities
        activities = UserActivity.objects.filter(
            action__in=['login', 'failed_login']
        ).select_related('user').order_by('-created_at')[:100]
        
        results = []
        for activity in activities:
            details = activity.details or {}
            
            # Construct friendly device name
            device_name = details.get('device', 'Unknown Device')
            if device_name == 'Unknown Device':
                 # Fallback
                 if 'Mobile' in activity.user_agent: device_name = "Mobile"
                 elif 'Windows' in activity.user_agent: device_name = "PC"
                 else: device_name = "Other"

            results.append({
                'id': activity.id,
                'email': activity.user.email,
                'success': activity.action == 'login',
                'ip_address': activity.ip_address,
                'location': details.get('location', 'Unknown'),
                'device': device_name,
                'timestamp': activity.created_at.isoformat(),
                'user_agent': activity.user_agent # Keep full UA for debug if needed
            })
            
        return Response(results)


class UserSessionsView(APIView):
    """List active user sessions (simulated via recent activity)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.role in ['admin', 'manager', 'operations_manager'] or request.user.is_superuser):
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)

        from .models import UserActivity
        from django.utils import timezone
        import datetime
        
        # Find recent logins in the last 24 hours to simulate "active sessions"
        last_24h = timezone.now() - datetime.timedelta(hours=24)
        recent_logins = UserActivity.objects.filter(
            action='login',
            created_at__gte=last_24h
        ).select_related('user').order_by('-created_at')
        
        # Deduplicate by user to show only latest session per user
        sessions = {}
        for login in recent_logins:
            if login.user.id not in sessions:
                # Extract device and location from stored activity details
                details = login.details or {}
                device_name = details.get('device', 'Unknown Device')
                os_info = details.get('os', '')
                browser_info = details.get('browser', '')
                location = details.get('location', 'Unknown Location')
                
                # Fallback to User-Agent parsing if details are empty (for old logs)
                if device_name == 'Unknown Device':
                    ua = login.user_agent
                    if 'Mobile' in ua:
                        device_name = "Mobile Device"
                    elif 'Macintosh' in ua:
                        device_name = "Mac"
                    elif 'Windows' in ua:
                        device_name = "PC"
                    else:
                         device_name = ua[:30] + '...'

                full_device_string = f"{device_name}"
                if os_info:
                    full_device_string += f" ({os_info})"
                
                sessions[login.user.id] = {
                    'id': login.id,
                    'user': login.user.email,
                    'ip_address': login.ip_address,
                    'device': full_device_string,
                    'location': location, 
                    'last_active': login.created_at.isoformat(),
                    'status': 'Active'
                }
        
        return Response(list(sessions.values()))


class SessionTerminateView(APIView):
    """Terminate a user session (simulated)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not (request.user.role in ['admin', 'manager', 'operations_manager'] or request.user.is_superuser):
            return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
        
        from .models import UserActivity, User
        
        try:
            # We are using the "login" activity ID as the session ID
            activity = UserActivity.objects.get(pk=pk, action='login')
            user = activity.user
            
            # Log the forced logout
            UserActivity.objects.create(
                user=user,
                action='force_logout',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent='Admin Terminated',
                details={'terminated_by': request.user.email, 'original_login_id': pk}
            )
            
            # In a real JWT setup with blacklisting, we would blacklist all outstanding tokens for this user here.
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            for token in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=token)
            
            # Return success
            return Response({'status': 'success', 'message': 'Session terminated successfully'})
            
        except UserActivity.DoesNotExist:
            return Response({'detail': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

