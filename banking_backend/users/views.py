from rest_framework import serializers, views, permissions, status, authentication
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from rest_framework.throttling import AnonRateThrottle
from django.db.models import Q
from .models import UserProfile, User, OTPVerification, UserDocuments
from .serializers import (
    UserProfileSerializer, NotificationSettingsSerializer,
    RoleBasedDashboardSerializer, EmailTokenObtainPairSerializer,
    MemberDashboardSerializer, UserDocumentsSerializer,
    DocumentApprovalSerializer, EnhancedStaffRegistrationSerializer
)
from .permissions import (
    IsSuperuser, IsManagerOrHigher, IsMember
)
from .audit_utils import (
    log_audit_event, log_login_attempt
)
from .forms import (
    LoginForm, UserRegistrationForm, CustomUserCreationForm,
    CustomUserChangeForm, UserProfileForm, PasswordChangeForm
)
from banking.models import Account, Transaction, Loan
from banking_backend.utils.sms import send_otp_sms, send_notification_sms
import random
import logging

logger = logging.getLogger('banking_security')


# Custom throttle classes for sensitive operations
class PasswordResetThrottle(AnonRateThrottle):
    rate = '3/hour'  # Very restrictive for password reset


class OTPThrottle(AnonRateThrottle):
    rate = '5/minute'  # Restrictive for OTP operations


@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns user data along with tokens.

    Authenticates user credentials and returns JWT access/refresh tokens
    along with basic user information. Available to all valid user accounts.
    """
    serializer_class = EmailTokenObtainPairSerializer

    @extend_schema(
        summary="User Login",
        description="Authenticate user with email and password to obtain JWT tokens. Available to all valid user accounts. Progressive rate limiting with delays and account lockouts applied.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email', 'example': 'user@example.com', 'description': 'User email address'},
                    'password': {'type': 'string', 'format': 'password', 'example': 'securepassword123'}
                },
                'required': ['email', 'password']
            }
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'refresh': {'type': 'string', 'example': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'},
                    'access': {'type': 'string', 'example': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string', 'example': '123e4567-e89b-12d3-a456-426614174000'},
                            'email': {'type': 'string', 'format': 'email', 'example': 'spper@example.com'},
                            'first_name': {'type': 'string', 'example': 'John'},
                            'last_name': {'type': 'string', 'example': 'Doe'},
                            'role': {'type': 'string', 'enum': ['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager'], 'example': 'customer'},
                            'is_active': {'type': 'boolean', 'example': True},
                            'is_staff': {'type': 'boolean', 'example': False}
                        }
                    }
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'No active account found with the given credentials'}
                }
            },
            429: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Account temporarily locked due to multiple failed login attempts. Try again in 900 seconds.'}
                }
            }
        },
        tags=['Authentication']
    )
    def post(self, request, *args, **kwargs):
        email = None
        # logger.info(f"[DEBUG] Login attempt received: {request.data}") # REMOVED: Security Risk
        try:
            # Validate input data first
            email = request.data.get('email')
            # Email validation performed
            if not email or not request.data.get('password'):
                logger.warning(f"Missing login credentials: email={bool(email)}")
                return Response(
                    {'detail': 'Email and password are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate input data
            if not email or not request.data.get('password'):
                logger.warning(f"Missing login credentials: email={bool(email)}")
                return Response(
                    {'detail': 'Email and password are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Attempting authentication
            response = super().post(request, *args, **kwargs)
            # Authentication attempt completed
            if response.status_code == 200:
                # Processing authenticated user
                try:
                    # Get the authenticated user from the serializer
                    serializer = self.get_serializer(data=request.data)
                    serializer.is_valid(raise_exception=True)
                    user = serializer.validated_data['user']
                    logger.info(f"User authenticated successfully with role: {user.role}")

                    # Check if user has sufficient privileges (allow roles for development)
                    allowed_roles = ['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator', 'superuser']
                    if user.role not in allowed_roles:
                        logger.warning(f"Insufficient privileges login attempt: {user.email} (role: {user.role})")
                        from .audit_utils import get_client_ip
                        log_login_attempt(user.email, get_client_ip(request), 'blocked', user=user, request=request)
                        return Response({'detail': 'Access denied. Insufficient privileges.'}, status=403)

                    # Generate JWT tokens explicitly
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)

                    user_data = {
                        'id': str(user.id),
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'is_active': user.is_active,
                        'is_staff': user.is_staff,
                    }

                    # Set httpOnly cookies for secure token storage
                    response = Response({
                        'detail': 'Login successful',
                        'user': user_data
                    })

                    # Set secure httpOnly cookies
                    response.set_cookie(
                        'access_token',
                        access_token,
                        httponly=True,
                        secure=True,  # Always use secure in production
                        samesite='Strict',
                        max_age=60 * 60  # 1 hour
                    )
                    response.set_cookie(
                        'refresh_token',
                        str(refresh),
                        httponly=True,
                        secure=True,  # Always use secure in production
                        samesite='Strict',
                        max_age=24 * 60 * 60  # 24 hours
                    )

                    # Prevent session fixation attacks by regenerating session ID
                    request.session.cycle_key()

                    logger.info("Authentication tokens set successfully")

                    # Log successful login
                    from .audit_utils import get_client_ip
                    log_login_attempt(user.email, get_client_ip(request), 'success', user=user, request=request)
                    logger.info(f"Successful login for user: {user.email}")

                    return response

                except Exception as e:
                    logger.error(f"Error processing successful login response: {str(e)}")
                    # Return response without user data if processing fails
                    from .audit_utils import get_client_ip
                    log_login_attempt(email, get_client_ip(request), 'success', request=request)

            return response

        except serializers.ValidationError as e:
            logger.warning(f"Login validation error for {email}")
            from .audit_utils import get_client_ip
            log_login_attempt(email, get_client_ip(request), 'failure', request=request)
            # Generic error message to prevent account enumeration
            return Response({
                'detail': 'Invalid credentials. Please check your email and password.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            logger.error(f"Unexpected error during login for {email}: {str(e)}", exc_info=True)
            from .audit_utils import get_client_ip
            log_login_attempt(email or 'unknown', get_client_ip(request), 'failure', request=request)
            return Response(
                {'detail': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(views.APIView):
    """
    POST: Logout by blacklisting the refresh token.

    Invalidates the provided refresh token to log out the user.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="User Logout",
        description="Invalidate the refresh token to log out the authenticated user. Rate limiting applied to prevent abuse.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'refresh': {'type': 'string', 'example': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'}
                },
                'required': ['refresh']
            }
        },
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Successfully logged out.'}
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Invalid token.'}
                }
            },
            401: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Authentication credentials were not provided.'}
                }
            },
            429: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Transaction operations temporarily suspended due to excessive activity. Try again in 1800 seconds.'}
                }
            }
        },
        tags=['Authentication']
    )
    def post(self, request):
        try:
            # Clear httpOnly cookies
            response = Response({"detail": "Successfully logged out."}, status=200)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')

            # Also try to blacklist the refresh token if provided
            refresh_token = request.data.get("refresh")
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except Exception as e:
                    logger.warning(f"Logout token blacklist failed: {e}")

            return response
        except Exception as e:
            # Even if token blacklisting fails, return success
            # The cookies will be cleared
            logger.warning(f"Logout failed: {e}")
            response = Response({"detail": "Successfully logged out."}, status=200)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetRequestView(views.APIView):
    """POST: Request password reset by sending email with reset token."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]
    serializer_class = None  # No serializer needed for this view

    class EmailSerializer(serializers.Serializer):
        email = serializers.EmailField()

    def post(self, request):
        serializer = self.EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            reset_token = get_random_string(32)
            user.set_reset_token(reset_token)

            # Send email (in production,  # use proper email service)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
            send_mail(
                'Password Reset Request',
                f'Click here to reset your password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            # Send SMS notification if user has phone and SMS enabled
            try:
                if hasattr(user, 'profile') and user.profile.phone and user.profile.notify_sms:
                    sms_result = send_notification_sms(
                        user.profile.phone,
                        f"Password reset requested for your Coastal Banking account. "
                        f"Check your email for the reset link. "
                        f"If you didn't request this, contact support immediately."
                    )
                    if sms_result.get('success'):
                        logger.info(f"Password reset SMS sent to {user.email}")
                    else:
                        logger.warning(f"Failed to send password reset SMS to {user.email}: {sms_result.get('error')}")
            except Exception as e:
                # Don't fail the request if SMS fails
                logger.error(f"Error sending password reset SMS: {str(e)}")
            
            return Response({"detail": "Password reset email sent."})
        except User.DoesNotExist:
            return Response({"detail": "If the email exists, a reset link has been sent."})


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetConfirmView(views.APIView):
    """POST: Confirm password reset with token."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]
    serializer_class = None  # No serializer needed for this view

    class ResetSerializer(serializers.Serializer):
        token = serializers.CharField()
        new_password = serializers.CharField()

    def post(self, request):
        serializer = self.ResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        # Find all users with non-expired tokens
        current_time = timezone.now()
        users = User.objects.filter(
            reset_token__isnull=False,
            reset_token_created_at__isnull=False,
            reset_token_created_at__gte=current_time - timedelta(minutes=15)
        )

        # Check token for each user (constant time to prevent timing attacks)
        user_found = None
        for user in users:
            if user.check_reset_token(token):
                user_found = user
                # Don't break - continue checking to maintain constant time
        
        if user_found:
            user_found.set_password(new_password)
            user_found.clear_reset_token()
            
            # Send SMS confirmation if user has phone and SMS enabled
            try:
                if hasattr(user_found, 'profile') and user_found.profile.phone and user_found.profile.notify_sms:
                    timestamp = timezone.now().strftime('%Y-%m-%d at %H:%M')
                    sms_result = send_notification_sms(
                        user_found.profile.phone,
                        f"Your Coastal Banking password was successfully reset on {timestamp}. "
                        f"If you didn't make this change, contact support immediately."
                    )
                    if sms_result.get('success'):
                        logger.info(f"Password reset confirmation SMS sent to {user_found.email}")
                    else:
                        logger.warning(f"Failed to send password reset confirmation SMS: {sms_result.get('error')}")
            except Exception as e:
                # Don't fail the request if SMS fails
                logger.error(f"Error sending password reset confirmation SMS: {str(e)}")
            
            return Response({"detail": "Password reset successfully."})
        
        # Always return same error message to prevent user enumeration
        return Response({"detail": "Invalid or expired token."}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileSettingsView(views.APIView):
    """
    GET: Retrieve profile.
    PATCH: Update general profile details.
    """
    authentication_classes = [authentication.SessionAuthentication, authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None  # No serializer needed for this view

    def get_object(self):
        return self.request.user.profile

    def get(self, request):
        profile = self.get_object()
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = self.get_object()
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class NotificationSettingsView(views.APIView):
    """PATCH: Update notification preferences (notify_email, notify_sms, notify_push)."""
    authentication_classes = [authentication.SessionAuthentication, authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None  # No serializer needed for this view

    def patch(self, request):
        # Get or create profile for the user
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if created:
            logger.info(f"Created UserProfile for user {request.user.email}")
        
        serializer = NotificationSettingsSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Notification settings updated."})


@method_decorator(csrf_exempt, name='dispatch')
class PasswordChangeView(views.APIView):
    """POST: Change user password."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None  # No serializer needed for this view

    class PasswordSerializer(serializers.Serializer):
        old_password = serializers.CharField(required=True)
        new_password = serializers.CharField(required=True)

    def post(self, request):
        serializer = self.PasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response({"old_password": ["Wrong password."]}, status=400)

        user.set_password(new_password)
        user.save()
        
        # Send SMS confirmation if user has phone and SMS enabled
        try:
            if hasattr(user, 'profile') and user.profile.phone and user.profile.notify_sms:
                timestamp = timezone.now().strftime('%Y-%m-%d at %H:%M')
                sms_result = send_notification_sms(
                    user.profile.phone,
                    f"Your Coastal Banking password was successfully changed on {timestamp}. "
                    f"If you didn't make this change, contact support immediately."
                )
                if sms_result.get('success'):
                    logger.info(f"Password change confirmation SMS sent to {user.email}")
                else:
                    logger.warning(f"Failed to send password change confirmation SMS: {sms_result.get('error')}")
        except Exception as e:
            # Don't fail the request if SMS fails
            logger.error(f"Error sending password change confirmation SMS: {str(e)}")

        return Response({"detail": "Password updated successfully."})


class AuthCheckView(views.APIView):
    """
    GET: Check if the current user is authenticated and return user info.
    Returns authenticated: false for unauthenticated requests instead of 401.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Check Authentication Status",
        description="Returns the authenticated user's information if logged in, or authenticated: false if not. Rate limiting applied to prevent abuse.",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'authenticated': {'type': 'boolean', 'example': True},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string', 'example': '123e4567-e89b-12d3-a456-426614174000'},
                            'email': {'type': 'string', 'format': 'email', 'example': 'user@example.com'},
                            'first_name': {'type': 'string', 'example': 'John'},
                            'last_name': {'type': 'string', 'example': 'Doe'},
                            'role': {'type': 'string', 'enum': ['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager'], 'example': 'customer'},
                            'is_active': {'type': 'boolean', 'example': True},
                            'is_staff': {'type': 'boolean', 'example': False}
                        }
                    }
                }
            },
            429: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Transaction operations temporarily suspended due to excessive activity. Try again in 1800 seconds.'}
                }
            }
        },
        tags=['Authentication']
    )
    def get(self, request):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return Response({
                'authenticated': False,
                'user': None
            })
        
        user = request.user
        
        # Check if user has verified OTP
        otp_verified = False
        if user.role in ['superuser', 'administrator']:
            # Superusers and administrators bypass OTP verification
            otp_verified = True
        else:
            # Check OTPVerification table for verified records
            # Try to get phone from User model first, then UserProfile
            phone = getattr(user, 'phone', None)
            if not phone and hasattr(user, 'userprofile'):
                phone = getattr(user.userprofile, 'phone', None)
            
            # Also check the hardcoded phone number for manager account
            if not phone and user.email == 'snyper191@gmail.com':
                phone = '+233557155186'
            
            if phone:
                otp_verified = OTPVerification.objects.filter(
                    phone_number=phone,
                    is_verified=True
                ).exists()
        
        user_data = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'phone': phone,
            'otp_verified': otp_verified,
        }
        return Response({
            'authenticated': True,
            'user': user_data
        })


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(views.APIView):
    """
    POST: Register a new user account.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="User Registration",
        description="Create a new user account with email, password, and basic information. Rate limiting applied to prevent abuse.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email', 'example': 'newuser@example.com'},
                    'first_name': {'type': 'string', 'example': 'John'},
                    'last_name': {'type': 'string', 'example': 'Doe'},
                    'password': {'type': 'string', 'format': 'password', 'example': 'securepassword123'},
                    'password_confirm': {'type': 'string', 'format': 'password', 'example': 'securepassword123'}
                },
                'required': ['email', 'first_name', 'last_name', 'password', 'password_confirm']
            }
        },
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'User registered successfully.'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string', 'example': '123e4567-e89b-12d3-a456-426614174000'},
                            'email': {'type': 'string', 'format': 'email', 'example': 'newuser@example.com'},
                            'first_name': {'type': 'string', 'example': 'John'},
                            'last_name': {'type': 'string', 'example': 'Doe'},
                            'role': {'type': 'string', 'example': 'customer'}
                        }
                    }
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Validation error details'}
                }
            },
            429: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Transaction operations temporarily suspended due to excessive activity. Try again in 1800 seconds.'}
                }
            }
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        user_data = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
        }

        return Response({
            'detail': 'User registered successfully.',
            'user': user_data
        }, status=201)


class MemberDashboardView(views.APIView):
    """
    GET: Retrieve dashboard data for authenticated members.
    """
    permission_classes = [permissions.IsAuthenticated, IsMember]

    @extend_schema(
        summary="Member Dashboard",
        description="Returns dashboard data including account balances, recent transactions, and loan information for authenticated members.",
        responses={
            200: RoleBasedDashboardSerializer,
            401: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Authentication credentials were not provided.'}
                }
            },
            403: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string', 'example': 'Access denied. Members only.'}
                }
            }
        },
        tags=['Dashboard']
    )
    def get(self, request):
        user = request.user

        # Check if user is a member (customer)
        if user.role != 'customer':
            return Response({'detail': 'Access denied. Members only.'}, status=403)

        # Get user's accounts
        accounts = Account.objects.filter(owner=user)
        total_balance = sum(account.balance for account in accounts)

        # Get recent transactions (last 10)
        transactions = Transaction.objects.filter(account__owner=user).order_by('-timestamp')[:10]
        recent_transactions = [
            {
                'date': transaction.timestamp.strftime('%Y-%m-%d'),
                'description': transaction.description or transaction.type,
                'amount': float(transaction.amount)
            }
            for transaction in transactions
        ]

        # Get loan balance
        loans = Loan.objects.filter(account__owner=user, status='active')
        loan_balance = sum(loan.outstanding_balance for loan in loans)

        # Calculate savings balance (total balance minus loan balance)
        savings_balance = total_balance - loan_balance

        # Calculate dynamic tab availability based on user permissions and data
        available_tabs = self._get_available_tabs(user, accounts, transactions, loans)
        user_permissions = self._get_user_permissions(user)
        membership_status = self._get_membership_status(user, accounts, transactions)

        dashboard_data = {
            'account_balance': total_balance,
            'recent_transactions': recent_transactions,
            'loan_balance': loan_balance,
            'savings_balance': savings_balance,
            'available_tabs': available_tabs,
            'user_permissions': user_permissions,
            'membership_status': membership_status,
        }

        serializer = MemberDashboardSerializer(dashboard_data)
        return Response(serializer.data)

    def _get_available_tabs(self, user, accounts, transactions, loans):
        """Determine which tabs should be available based on user data and permissions."""
        tabs = []

        # Check service availability
        service_status = self._check_service_availability()

        # Overview tab - always available
        tabs.append({
            'id': 'overview',
            'name': 'Overview',
            'icon': '📊',
            'enabled': True,
            'description': 'Financial overview and quick stats'
        })

        # Account Balance tab - available if service is up
        tabs.append({
            'id': 'account_balance',
            'name': 'Account Balance',
            'icon': '💰',
            'enabled': service_status['account_balance'],
            'description': 'View your current account balance and transaction history' if service_status['account_balance'] else 'Account balance service temporarily unavailable'
        })

        # Account Types tab - available if service is up
        tabs.append({
            'id': 'account_types',
            'name': 'Account Types',
            'icon': '🏦',
            'enabled': service_status['account_types'],
            'description': 'Manage your different account types' if service_status['account_types'] else 'Account types service temporarily unavailable'
        })

        # Request Services tab - available if service is up
        tabs.append({
            'id': 'request_services',
            'name': 'Request Services',
            'icon': '📋',
            'enabled': service_status['request_services'],
            'description': 'Request statements, loans, and support' if service_status['request_services'] else 'Service request system temporarily unavailable'
        })

        # Change Password tab - available if service is up
        tabs.append({
            'id': 'change_password',
            'name': 'Change Password',
            'icon': '🔒',
            'enabled': service_status['change_password'],
            'description': 'Update your account password' if service_status['change_password'] else 'Password change service temporarily unavailable'
        })

        # Activate 2FA tab - available if service is up and user doesn't have 2FA enabled
        can_enable_2fa = service_status['activate_2fa'] and not user.two_factor_enabled
        tabs.append({
            'id': 'activate_2fa',
            'name': 'Activate 2FA',
            'icon': '🛡️',
            'enabled': can_enable_2fa,
            'description': 'Enable two-factor authentication' if can_enable_2fa else ('Two-factor authentication already enabled' if user.two_factor_enabled else '2FA service temporarily unavailable')
        })

        # Accounts tab - available if user has accounts
        has_accounts = len(accounts) > 0
        tabs.append({
            'id': 'accounts',
            'name': 'Accounts',
            'icon': '🏦',
            'enabled': has_accounts,
            'description': 'Manage your bank accounts' if has_accounts else 'No accounts available'
        })

        # Transactions tab - available if user has transaction history
        has_transactions = len(transactions) > 0
        tabs.append({
            'id': 'transactions',
            'name': 'Transactions',
            'icon': '💳',
            'enabled': has_transactions,
            'description': 'View transaction history' if has_transactions else 'No transactions yet'
        })

        # Transfers tab - available for active members with accounts
        can_transfer = has_accounts and user.is_active
        tabs.append({
            'id': 'transfers',
            'name': 'Transfers',
            'icon': '↗',
            'enabled': can_transfer,
            'description': 'Send money and manage transfers' if can_transfer else 'Account setup required'
        })

        # Loans tab - available if user has loan-related permissions or active loans
        has_loans = len(loans) > 0
        can_access_loans = has_loans or user.role in ['customer', 'manager', 'operations_manager']
        tabs.append({
            'id': 'loans',
            'name': 'Loans',
            'icon': '💰',
            'enabled': can_access_loans,
            'description': 'Loan applications and management' if can_access_loans else 'Loan services not available'
        })

        # Profile tab - always available for account management
        tabs.append({
            'id': 'profile',
            'name': 'Profile',
            'icon': '👤',
            'enabled': True,
            'description': 'Manage your account settings'
        })

        return tabs

    def _check_service_availability(self):
        """Check availability of various backend services."""
        service_status = {
            'account_balance': True,  # Always available
            'account_types': True,    # Always available
            'request_services': True, # Service request endpoint exists
            'change_password': True,  # Password change endpoint exists
            'activate_2fa': True,     # 2FA endpoint exists
        }

        # In a real implementation, you might check:
        # - Database connectivity
        # - External service health
        # - Feature flags
        # - Service maintenance status

        return service_status

    def _get_user_permissions(self, user):
        """Get user permissions for dashboard features."""
        return {
            'can_view_accounts': True,
            'can_make_transfers': user.is_active,
            'can_apply_loans': user.role == 'customer' and user.is_active,
            'can_view_reports': user.role in ['customer', 'manager', 'operations_manager'],
            'can_manage_profile': True,
            'can_access_support': True,
        }

    def _get_membership_status(self, user, accounts, transactions):
        """Get membership status information."""
        return {
            'is_active_member': user.is_active and user.role == 'customer',
            'account_count': len(accounts),
            'has_recent_activity': len(transactions) > 0,
            'membership_level': 'premium' if len(accounts) > 1 else 'standard',
            'days_since_join': (timezone.now().date() - user.date_joined.date()).days,
        }


@method_decorator(csrf_exempt, name='dispatch')
class SendOTPView(views.APIView):
    """
    POST: Send OTP code to phone number for verification.
    In test mode (DEBUG=True),  # the OTP is returned in the response.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPThrottle]
    
    class OTPRequestSerializer(serializers.Serializer):
        phone_number = serializers.CharField(max_length=20)
        verification_type = serializers.ChoiceField(
            choices=['user_creation', 'phone_verification', 'transaction', 'password_reset', 'staff_onboarding', '2fa_setup'],
            default='user_creation'
        )
    
    @extend_schema(
        summary="Send OTP",
        description="Send OTP code to phone number. In test mode, OTP is returned in response for testing.",
        request=OTPRequestSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'OTP sent successfully'},
                    'expires_in': {'type': 'integer', 'example': 300},
                    'test_mode': {'type': 'boolean', 'example': True},
                    'otp_code': {'type': 'string', 'example': '123456', 'description': 'Only in test mode'}
                }
            }
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = self.OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        verification_type = serializer.validated_data['verification_type']
        
        # Generate 6-digit OTP
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Set expiration (5 minutes)
        expires_at = timezone.now() + timedelta(minutes=5)
        
        # Invalidate any existing OTPs for this phone number and type
        OTPVerification.objects.filter(
            phone_number=phone_number,
            verification_type=verification_type,
            is_verified=False
        ).update(is_verified=True)  # Mark as used
        
        # Create new OTP
        otp = OTPVerification.objects.create(
            phone_number=phone_number,
            otp_code=otp_code,
            verification_type=verification_type,
            expires_at=expires_at
        )
        
        # Always send SMS, but also log in test mode for debugging
        test_mode = settings.DEBUG
        
        response_data = {
            'message': 'OTP sent successfully',
            'expires_in': 300,  # 5 minutes in seconds
        }
        
        # Send SMS regardless of mode (now that Sendexa is configured)
        sms_result = send_otp_sms(phone_number, otp_code)
        if not sms_result.get('success'):
            logger.error(f"Failed to send OTP SMS to {phone_number}: {sms_result.get('error')}")
            # Don't fail the request, just log the error
            # The OTP is still valid in the database
        else:
            logger.info(f"OTP sent to {phone_number}")
        
        if test_mode:
            # In debug mode, also log the OTP for testing convenience
            logger.info(f"TEST MODE: OTP for {phone_number}: {otp_code}")
            response_data['test_mode'] = True
            # Optionally return OTP in debug mode for testing
            response_data['otp_code'] = otp_code
        
        return Response(response_data)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyOTPView(views.APIView):
    """
    POST: Verify OTP code for phone number.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPThrottle]
    
    class OTPVerifySerializer(serializers.Serializer):
        phone_number = serializers.CharField(max_length=20)
        otp_code = serializers.CharField(max_length=6)
        verification_type = serializers.ChoiceField(
            choices=['user_creation', 'phone_verification', 'transaction', 'password_reset', 'staff_onboarding', '2fa_setup'],
            default='user_creation'
        )
    
    @extend_schema(
        summary="Verify OTP",
        description="Verify OTP code for phone number verification.",
        request=OTPVerifySerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Phone number verified successfully'},
                    'verified': {'type': 'boolean', 'example': True}
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Invalid or expired OTP'}
                }
            }
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = self.OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        phone_number = serializer.validated_data['phone_number']
        otp_code = serializer.validated_data['otp_code']
        verification_type = serializer.validated_data['verification_type']
        
        # Find the most recent OTP for this phone number and type
        try:
            otp = OTPVerification.objects.filter(
                phone_number=phone_number,
                verification_type=verification_type,
                is_verified=False
            ).order_by('-created_at').first()
            
            if not otp:
                return Response({
                    'error': 'No OTP found for this phone number. Please request a new one.'
                }, status=400)
            
            if not otp.is_valid():
                if otp.is_expired():
                    return Response({
                        'error': 'OTP has expired. Please request a new one.'
                    }, status=400)
                elif otp.attempts >= otp.max_attempts:
                    return Response({
                        'error': 'Maximum verification attempts exceeded. Please request a new OTP.'
                    }, status=400)
            
            # Verify the OTP
            if otp.verify(otp_code):
                return Response({
                    'message': 'Phone number verified successfully',
                    'verified': True
                })
            else:
                remaining_attempts = otp.max_attempts - otp.attempts
                return Response({
                    'error': f'Invalid OTP code. {remaining_attempts} attempts remaining.'
                }, status=400)
                
        except Exception as e:
            logger.error(f"OTP verification error: {e}")
            return Response({
                'error': 'Verification failed. Please try again.'
            }, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class CreateUserView(views.APIView):
    """
    POST: Create a new user (staff only - requires manager or operations_manager role).
    """
    permission_classes = [permissions.IsAuthenticated, IsManagerOrHigher]

    class UserCreationSerializer(serializers.Serializer):
        email = serializers.EmailField()
        first_name = serializers.CharField(max_length=30)
        last_name = serializers.CharField(max_length=30)
        phone = serializers.CharField(max_length=20)
        password = serializers.CharField(write_only=True)
        role = serializers.ChoiceField(choices=['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager'])

    @extend_schema(
        summary="Create New User",
        description="Create a new user account. Only accessible by managers and operations managers.",
        request=UserCreationSerializer,
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'User created successfully'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'email': {'type': 'string'},
                            'first_name': {'type': 'string'},
                            'last_name': {'type': 'string'},
                            'role': {'type': 'string'}
                        }
                    }
                }
            },
            403: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Only managers and operations managers can create users'}
                }
            }
        },
        tags=['User Management']
    )
    def post(self, request):
        # Check if user has permission (superuser can create any user)
        if request.user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
            return Response({
                'error': 'Insufficient permissions to create users'
            }, status=403)

        serializer = self.UserCreationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if user already exists
        if User.objects.filter(email=serializer.validated_data['email']).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=400)

        # Create user
        user = User.objects.create_user(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password'],
            first_name=serializer.validated_data['first_name'],
            last_name=serializer.validated_data['last_name'],
            role=serializer.validated_data['role']
        )

        # Create UserProfile
        UserProfile.objects.create(user=user)

        return Response({
            'message': 'User created successfully',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
            }
        }, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class EnhancedStaffRegistrationView(views.APIView):
    """
    POST: Create a new staff member with comprehensive registration including documents.
    """
    permission_classes = [permissions.IsAuthenticated, IsManagerOrHigher]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Enhanced Staff Registration",
        description="Create a new staff member with complete profile, banking details, and required documents. Only accessible by managers and operations managers.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'},
                    'first_name': {'type': 'string'},
                    'last_name': {'type': 'string'},
                    'phone': {'type': 'string'},
                    'role': {'type': 'string', 'enum': ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']},
                    'password': {'type': 'string', 'format': 'password'},
                    'house_address': {'type': 'string'},
                    'contact_address': {'type': 'string'},
                    'government_id': {'type': 'string'},
                    'ssnit_number': {'type': 'string'},
                    'bank_name': {'type': 'string'},
                    'account_number': {'type': 'string'},
                    'branch_code': {'type': 'string'},
                    'routing_number': {'type': 'string'},
                    'passport_picture': {'type': 'string', 'format': 'binary'},
                    'application_letter': {'type': 'string', 'format': 'binary'},
                    'appointment_letter': {'type': 'string', 'format': 'binary'}
                },
                'required': ['email', 'first_name', 'last_name', 'phone', 'role', 'password', 'house_address', 'government_id', 'ssnit_number', 'bank_name', 'account_number', 'branch_code', 'routing_number', 'passport_picture', 'application_letter', 'appointment_letter']
            }
        },
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Staff member registered successfully'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string'},
                            'email': {'type': 'string'},
                            'first_name': {'type': 'string'},
                            'last_name': {'type': 'string'},
                            'role': {'type': 'string'}
                        }
                    },
                    'documents_created': {'type': 'integer', 'example': 3}
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Validation error details'}
                }
            },
            403: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Insufficient permissions'}
                }
            }
        },
        tags=['Staff Registration']
    )
    def post(self, request):
        # Check permissions
        if request.user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
            return Response({
                'error': 'Insufficient permissions to register staff members'
            }, status=403)

        # Use the enhanced serializer
        serializer = EnhancedStaffRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()

                # Log the staff registration
                log_audit_event(
                    user=request.user,
                    action='staff_registered',
                    description=f"Staff member {user.email} registered by {request.user.email}",
                    metadata={
                        'new_user_id': str(user.id),
                        'new_user_email': user.email,
                        'new_user_role': user.role,
                        'registered_by': request.user.email
                    }
                )

                return Response({
                    'message': 'Staff member registered successfully',
                    'user': {
                        'id': str(user.id),
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    },
                    'documents_created': 3  # passport_picture, application_letter, appointment_letter
                }, status=201)

            except Exception as e:
                logger.error(f"Staff registration failed: {str(e)}")
                return Response({
                    'error': f'Registration failed: {str(e)}'
                }, status=500)
        else:
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=400)


class StaffListView(views.APIView):
    """
    GET: List all staff members (excluding regular members).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        summary="List Staff Members",
        description="Get a list of all staff members. Only accessible by managers and operations managers.",
        responses={
            200: {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'string'},
                        'email': {'type': 'string'},
                        'first_name': {'type': 'string'},
                        'last_name': {'type': 'string'},
                        'role': {'type': 'string'},
                        'is_active': {'type': 'boolean'},
                        'date_joined': {'type': 'string'},
                        'staff_id': {'type': 'string'}
                    }
                }
            }
        },
        tags=['User Management']
    )
    def get(self, request):
        # Check if user has permission (superuser and administrator can view all)
        if request.user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
            return Response({
                'error': 'Insufficient permissions to view staff list'
            }, status=403)
        
        # Get all users except regular members
        staff = User.objects.exclude(role='customer').order_by('-date_joined')
        
        staff_data = [
            {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                'staff_id': str(user.id)[:8]  # Use first 8 chars of UUID as staff ID
            }
            for user in staff
        ]
        
        return Response(staff_data)


class StaffIDListView(views.APIView):
    """
    GET: List all staff IDs with filtering, searching, and pagination.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List Staff IDs",
        description="Get a list of all staff IDs with advanced filtering and searching. Only accessible by managers and operations managers.",
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                description='Search by name, email, or staff ID',
                required=False
            ),
            OpenApiParameter(
                name='role',
                type=OpenApiTypes.STR,
                description='Filter by role',
                required=False,
                enum=['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                description='Filter by status',
                required=False,
                enum=['active', 'inactive']
            ),
            OpenApiParameter(
                name='employment_date_from',
                type=OpenApiTypes.DATE,
                description='Filter by employment date from',
                required=False
            ),
            OpenApiParameter(
                name='employment_date_to',
                type=OpenApiTypes.DATE,
                description='Filter by employment date to',
                required=False
            ),
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                description='Page number for pagination',
                required=False
            ),
            OpenApiParameter(
                name='page_size',
                type=OpenApiTypes.INT,
                description='Number of items per page',
                required=False
            ),
        ],
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'count': {'type': 'integer', 'example': 25},
                    'next': {'type': 'string', 'nullable': True, 'example': 'http://api.example.com/api/users/staff-ids/?page=2'},
                    'previous': {'type': 'string', 'nullable': True, 'example': None},
                    'results': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'id': {'type': 'string', 'example': '123e4567-e89b-12d3-a456-426614174000'},
                                'email': {'type': 'string', 'format': 'email', 'example': 'john.doe@example.com'},
                                'first_name': {'type': 'string', 'example': 'John'},
                                'last_name': {'type': 'string', 'example': 'Doe'},
                                'role': {'type': 'string', 'example': 'cashier'},
                                'staff_id': {'type': 'string', 'example': 'JD0323'},
                                'employment_date': {'type': 'string', 'format': 'date', 'example': '2023-03-15'},
                                'is_active': {'type': 'boolean', 'example': True},
                                'date_joined': {'type': 'string', 'format': 'date-time', 'example': '2023-03-15T10:30:00Z'}
                            }
                        }
                    }
                }
            },
            403: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Insufficient permissions to view staff IDs'}
                }
            }
        },
        tags=['Staff Management']
    )
    def get(self, request):
        # Check permissions - only managers and operations managers can view staff IDs
        if request.user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
            return Response({
                'error': 'Insufficient permissions to view staff IDs'
            }, status=403)

        # Get staff users (exclude customers)
        staff = User.objects.exclude(role='customer').select_related('profile')

        # Apply filters
        search_query = request.query_params.get('search', '')
        role_filter = request.query_params.get('role', '')
        status_filter = request.query_params.get('status', '')
        employment_date_from = request.query_params.get('employment_date_from', '')
        employment_date_to = request.query_params.get('employment_date_to', '')

        if search_query:
            staff = staff.filter(
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(profile__staff_id__icontains=search_query)  # This will search encrypted field - may not work as expected
            )

        if role_filter:
            staff = staff.filter(role=role_filter)

        if status_filter:
            if status_filter == 'active':
                staff = staff.filter(is_active=True)
            elif status_filter == 'inactive':
                staff = staff.filter(is_active=False)

        if employment_date_from:
            staff = staff.filter(profile__employment_date__gte=employment_date_from)

        if employment_date_to:
            staff = staff.filter(profile__employment_date__lte=employment_date_to)

        # Order by date joined (most recent first)
        staff = staff.order_by('-date_joined')

        # Pagination
        from django.core.paginator import Paginator
        page_size = int(request.query_params.get('page_size', 20))
        paginator = Paginator(staff, page_size)
        page_number = request.query_params.get('page', 1)

        try:
            page_obj = paginator.page(page_number)
        except:
            page_obj = paginator.page(1)

        # Prepare response data
        staff_data = []
        for user in page_obj:
            try:
                profile = user.profile
                staff_id = profile.get_decrypted_staff_id() if profile and profile.staff_id else None
            except:
                staff_id = None

            staff_data.append({
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'staff_id': staff_id,
                'employment_date': profile.employment_date.isoformat() if profile and profile.employment_date else None,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat()
            })

        response_data = {
            'count': paginator.count,
            'next': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'results': staff_data
        }

        # Log access for audit
        log_audit_event(
            user=request.user,
            action='staff_id_list_accessed',
            description=f"Staff ID list accessed by {request.user.email}",
            metadata={
                'filters_applied': {
                    'search': search_query,
                    'role': role_filter,
                    'status': status_filter,
                    'employment_date_from': employment_date_from,
                    'employment_date_to': employment_date_to
                },
                'results_count': len(staff_data),
                'page': page_number,
                'page_size': page_size
            }
        )

        return Response(response_data)


@method_decorator(csrf_exempt, name='dispatch')
class DeactivateStaffView(views.APIView):
    """
    POST: Deactivate a staff member.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    class DeactivateSerializer(serializers.Serializer):
        user_id = serializers.UUIDField()
        reason = serializers.CharField(required=False)
    
    @extend_schema(
        summary="Deactivate Staff",
        description="Deactivate a staff member. Only accessible by operations managers.",
        request=DeactivateSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Staff member deactivated successfully'}
                }
            }
        },
        tags=['User Management']
    )
    def post(self, request):
        # Check if user has permission (staff roles and superuser)
        staff_roles = ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator', 'superuser']
        if request.user.role not in staff_roles:
            return Response({
                'error': 'Insufficient permissions to deactivate staff'
            }, status=403)
        
        serializer = self.DeactivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = User.objects.get(id=serializer.validated_data['user_id'])
            
            # Prevent deactivating yourself
            if user.id == request.user.id:
                return Response({
                    'error': 'You cannot deactivate your own account'
                }, status=400)
            
            user.is_active = False
            user.save()
            
            logger.info(f"Staff member {user.email} deactivated by {request.user.email}")
            
            return Response({
                'message': f'Staff member {user.first_name} {user.last_name} deactivated successfully'
            })
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=404)


@method_decorator(csrf_exempt, name='dispatch')
class ReactivateStaffView(views.APIView):
    """
    POST: Reactivate a staff member.
    """
    permission_classes = [permissions.IsAuthenticated]

    class ReactivateSerializer(serializers.Serializer):
        user_id = serializers.UUIDField()

    @extend_schema(
        summary="Reactivate Staff",
        description="Reactivate a deactivated staff member. Only accessible by operations managers.",
        request=ReactivateSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Staff member reactivated successfully'}
                }
            }
        },
        tags=['User Management']
    )
    def post(self, request):
        # Check if user has permission (superuser and administrator can reactivate)
        if request.user.role not in ['operations_manager', 'administrator', 'superuser']:
            return Response({
                'error': 'Insufficient permissions to reactivate staff'
            }, status=403)

        serializer = self.ReactivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(id=serializer.validated_data['user_id'])
            user.is_active = True
            user.save()

            logger.info(f"Staff member {user.email} reactivated by {request.user.email}")

            return Response({
                'message': f'Staff member {user.first_name} {user.last_name} reactivated successfully'
            })
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=404)


class MembersListView(views.APIView):
    """
    GET: List all members (users with role='member').
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List Members",
        description="Get a list of all members. Accessible by staff users.",
        responses={
            200: {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'string'},
                        'email': {'type': 'string'},
                        'first_name': {'type': 'string'},
                        'last_name': {'type': 'string'},
                        'phone': {'type': 'string'},
                        'is_active': {'type': 'boolean'},
                        'date_joined': {'type': 'string'}
                    }
                }
            }
        },
        tags=['User Management']
    )
    def get(self, request):
        # Get all users with role='customer'
        members = User.objects.filter(role='customer').order_by('-date_joined')

        members_data = []
        for user in members:
            try:
                phone = user.profile.phone if user.profile else ''
            except ObjectDoesNotExist:
                phone = ''
            members_data.append({
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': phone,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%Y-%m-%d')
            })

        return Response(members_data)


@method_decorator(csrf_exempt, name='dispatch')
class ServiceRequestView(views.APIView):
    """
    POST: Create a service request.
    GET: List user's service requests.
    """
    permission_classes = [permissions.IsAuthenticated]

    class ServiceRequestSerializer(serializers.Serializer):
        request_type = serializers.ChoiceField(choices=[
            'statement', 'loan_application', 'support_ticket', 'account_closure',
            'address_change', 'name_change', 'card_replacement'
        ])
        description = serializers.CharField(required=False, allow_blank=True)
        delivery_method = serializers.ChoiceField(choices=['email', 'sms', 'mail'])

    @extend_schema(
        summary="Create Service Request",
        description="Create a new service request for the authenticated user.",
        request=ServiceRequestSerializer,
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Service request created successfully'},
                    'request_id': {'type': 'string', 'example': 'req_123456789'}
                }
            }
        },
        tags=['Service Requests']
    )
    def post(self, request):
        serializer = self.ServiceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        delivery_method = serializer.validated_data.get('delivery_method')
        user = request.user

        # Check if 2FA is required for SMS delivery
        if delivery_method == 'sms':
            # Check system setting for 2FA requirement on SMS delivery
            require_2fa_for_sms = self._get_system_setting('require_2fa_for_sms_delivery', True)

            logger.info(f"SMS delivery requested, 2FA status: {user.two_factor_enabled}")

            if require_2fa_for_sms and not user.two_factor_enabled:
                logger.warning(f"[DEBUG] User {user.email} attempting SMS delivery without 2FA enabled - blocking request")
                return Response({
                    'error': 'Two-factor authentication is required for SMS delivery. Please enable 2FA first.',
                    'requires_2fa': True
                }, status=400)

        # For now, just log the request and return success
        # In a real implementation, this would create a database record
        request_id = f"req_{timezone.now().strftime('%Y%m%d%H%M%S')}"

        logger.info(f"Service request created by {request.user.email}: {serializer.validated_data}")

        return Response({
            'message': 'Service request created successfully',
            'request_id': request_id
        }, status=201)

    def _get_system_setting(self, key, default_value=False):
        """Get a system setting value."""
        try:
            from settings.models import SystemSettings
            setting = SystemSettings.objects.filter(key=key, is_active=True).first()
            if setting:
                return setting.get_value()
        except Exception as e:
            logger.error(f"Error retrieving system setting {key}: {e}")
        return default_value

    @extend_schema(
        summary="List Service Requests",
        description="Get all service requests for the authenticated user.",
        responses={
            200: {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'string'},
                        'request_type': {'type': 'string'},
                        'description': {'type': 'string'},
                        'delivery_method': {'type': 'string'},
                        'status': {'type': 'string'},
                        'created_at': {'type': 'string'}
                    }
                }
            }
        },
        tags=['Service Requests']
    )
    def get(self, request):
        # For now, return empty array as we don't have a service request model
        # In a real implementation, this would query the database
        return Response([])


@method_decorator(csrf_exempt, name='dispatch')
class Enable2FAView(views.APIView):
    """
    POST: Enable two-factor authentication for the user.
    """
    permission_classes = [permissions.IsAuthenticated]

    class Enable2FASerializer(serializers.Serializer):
        phone_number = serializers.CharField(max_length=20)
        otp_code = serializers.CharField(max_length=6)

    @extend_schema(
        summary="Enable 2FA",
        description="Enable two-factor authentication for the authenticated user.",
        request=Enable2FASerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Two-factor authentication enabled successfully'}
                }
            }
        },
        tags=['Security']
    )
    def post(self, request):
        serializer = self.Enable2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data['phone_number']
        otp_code = serializer.validated_data['otp_code']

        # Verify the OTP first
        try:
            otp = OTPVerification.objects.filter(
                phone_number=phone_number,
                verification_type='2fa_setup',
                is_verified=False
            ).order_by('-created_at').first()

            if not otp:
                return Response({
                    'error': 'No OTP found for this phone number. Please request a new one.'
                }, status=400)

            if not otp.is_valid():
                if otp.is_expired():
                    return Response({
                        'error': 'OTP has expired. Please request a new one.'
                    }, status=400)
                elif otp.attempts >= otp.max_attempts:
                    return Response({
                        'error': 'Maximum verification attempts exceeded. Please request a new OTP.'
                    }, status=400)

            # Verify the OTP
            if not otp.verify(otp_code):
                remaining_attempts = otp.max_attempts - otp.attempts
                return Response({
                    'error': f'Invalid OTP code. {remaining_attempts} attempts remaining.'
                }, status=400)

            # Enable 2FA for the user
            user = request.user
            user.two_factor_enabled = True
            user.two_factor_phone = phone_number
            user.save()

            logger.info(f"2FA enabled for user {user.email}")
            
            # Send SMS confirmation
            try:
                sms_result = send_notification_sms(
                    phone_number,
                    "Two-factor authentication has been successfully enabled for your "
                    "Coastal Banking account. Your account is now more secure."
                )
                if sms_result.get('success'):
                    logger.info(f"2FA activation confirmation SMS sent to {user.email}")
                else:
                    logger.warning(f"Failed to send 2FA confirmation SMS: {sms_result.get('error')}")
            except Exception as e:
                # Don't fail the request if SMS fails
                logger.error(f"Error sending 2FA confirmation SMS: {str(e)}")

            return Response({
                'message': 'Two-factor authentication enabled successfully'
            })

        except Exception as e:
            logger.error(f"2FA enablement error: {e}")
            return Response({
                'error': 'Failed to enable 2FA. Please try again.'
            }, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class SuperuserOperationsView(views.APIView):
    """
    POST: Perform superuser operations.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperuser]

    class SuperuserOperationSerializer(serializers.Serializer):
        operation = serializers.ChoiceField(choices=[
            'bypass_security', 'emergency_access', 'system_reset', 'audit_bypass',
            'create_user', 'update_user', 'modify_user_role', 'activate_user', 'deactivate_user',
            'create_branch', 'system_health', 'backup_database', 'monitor_activity',
            'update_system_setting', 'get_system_settings', 'reset_system_setting'
        ])
        reason = serializers.CharField(required=True)
        target = serializers.CharField(required=False)
        # Additional fields for specific operations
        user_id = serializers.UUIDField(required=False)
        email = serializers.EmailField(required=False)
        first_name = serializers.CharField(required=False)
        last_name = serializers.CharField(required=False)
        role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)
        is_active = serializers.BooleanField(required=False)
        branch_name = serializers.CharField(required=False)
        branch_location = serializers.CharField(required=False)
        manager_id = serializers.UUIDField(required=False)
        setting_key = serializers.CharField(required=False)
        setting_value = serializers.CharField(required=False)

    @extend_schema(
        summary="Superuser Operations",
        description="Perform privileged operations available only to superusers.",
        request=SuperuserOperationSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string', 'example': 'Operation completed successfully'},
                    'operation_id': {'type': 'string', 'example': 'op_123456789'},
                    'data': {'type': 'object', 'description': 'Operation-specific data'}
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Invalid operation or missing parameters'}
                }
            },
            403: {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string', 'example': 'Superuser access required'}
                }
            }
        },
        tags=['Superuser Operations']
    )
    def post(self, request):
        serializer = self.SuperuserOperationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        operation = serializer.validated_data['operation']
        reason = serializer.validated_data['reason']
        target = serializer.validated_data.get('target')

        # Generate operation ID
        operation_id = f"op_{timezone.now().strftime('%Y%m%d%H%M%S')}"

        try:
            result = None

            if operation in ['bypass_security', 'emergency_access', 'system_reset', 'audit_bypass']:
                return Response({'error': 'This operation is disabled for security reasons.'}, status=403)
            # if operation == 'bypass_security':
            #     result = self._bypass_security(target, reason)
            # elif operation == 'emergency_access':
            #     result = self._emergency_access(target, reason)
            # elif operation == 'system_reset':
            #     result = self._system_reset(reason)
            # elif operation == 'audit_bypass':
            #     result = self._audit_bypass(target, reason)
            elif operation == 'create_user':
                result = self._create_user(serializer.validated_data, reason)
            elif operation == 'update_user':
                result = self._update_user(serializer.validated_data, reason)
            elif operation == 'modify_user_role':
                result = self._modify_user_role(target, serializer.validated_data.get('role'), reason)
            elif operation == 'activate_user':
                result = self._activate_user(target, reason)
            elif operation == 'deactivate_user':
                result = self._deactivate_user(target, reason)
            elif operation == 'create_branch':
                result = self._create_branch(serializer.validated_data, reason)
            elif operation == 'system_health':
                result = self._system_health()
            elif operation == 'backup_database':
                result = self._backup_database(reason)
            elif operation == 'monitor_activity':
                result = self._monitor_activity(target)
            elif operation == 'update_system_setting':
                result = self._update_system_setting(serializer.validated_data, reason)
            elif operation == 'get_system_settings':
                result = self._get_system_settings()
            elif operation == 'reset_system_setting':
                result = self._reset_system_setting(target, reason)
            else:
                return Response({'error': 'Invalid operation'}, status=status.HTTP_400_BAD_REQUEST)

            # Log the operation
            log_audit_event(
                user=request.user,
                action='superuser_operation',
                description=f"Superuser operation: {operation} - {reason}",
                metadata={
                    'operation_id': operation_id,
                    'operation': operation,
                    'target': target,
                    'reason': reason,
                    'result': result
                }
            )

            return Response({
                'message': 'Operation completed successfully',
                'operation_id': operation_id,
                'data': result
            })

        except Exception as e:
            logger.error(f"Superuser operation failed: {operation} - {str(e)}")
            return Response({'error': f'Operation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _bypass_security(self, target, reason):
        """Temporarily bypass security checks."""
        logger.warning(f"Security bypass initiated by {self.request.user.email}: {reason}")
        return {'status': 'bypassed', 'target': target}

    def _emergency_access(self, target, reason):
        """Grant emergency system access."""
        logger.warning(f"Emergency access granted by {self.request.user.email}: {reason}")
        return {'status': 'granted', 'target': target}

    def _system_reset(self, reason):
        """Initiate system reset."""
        logger.critical(f"System reset initiated by {self.request.user.email}: {reason}")
        return {'status': 'initiated'}

    def _audit_bypass(self, target, reason):
        """Temporarily bypass audit logging."""
        logger.warning(f"Audit bypass initiated by {self.request.user.email}: {reason}")
        return {'status': 'bypassed', 'target': target}

    def _create_user(self, data, reason):
        """Create a new user account."""
        from banking.models import Account

        # Generate a random secure password
        temp_password = get_random_string(12)

        user = User.objects.create_user(
            email=data['email'],
            password=temp_password,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=data.get('role', 'customer')
        )
        
        # In a real system, we would email this password to the user
        logger.info(f"User created by superuser. Temporary password generated.")

        # Create user profile
        UserProfile.objects.create(user=user)

        # Create default account for customers
        if user.role == 'customer':
            Account.objects.create(
                owner=user,
                account_number=f"ACC{user.id.hex[:8]}",
                type='savings'
            )

        logger.info(f"User created by superuser {self.request.user.email}: {user.email}")
        return {
            'user_id': str(user.id),
            'email': user.email,
            'role': user.role,
            'status': 'created'
        }

    def _update_user(self, data, reason):
        """Update an existing user account."""
        try:
            user_id = data.get('user_id')
            if not user_id:
                raise ValueError("user_id is required for update operation")
            
            user = User.objects.get(id=user_id)
            old_data = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active
            }
            
            # Update fields if provided
            if 'email' in data and data['email']:
                user.email = data['email']
            if 'first_name' in data and data['first_name']:
                user.first_name = data['first_name']
            if 'last_name' in data and data['last_name']:
                user.last_name = data['last_name']
            if 'role' in data and data['role']:
                user.role = data['role']
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            user.save()
            
            logger.info(f"User updated by superuser {self.request.user.email}: {user.email}")
            return {
                'user_id': str(user.id),
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'old_data': old_data,
                'status': 'updated'
            }
        except User.DoesNotExist:
            raise ValueError("User not found")

    def _modify_user_role(self, user_id, new_role, reason):
        """Modify user role."""
        try:
            user = User.objects.get(id=user_id)
            old_role = user.role
            user.role = new_role
            user.save()

            logger.info(f"User role modified by superuser {self.request.user.email}: {user.email} from {old_role} to {new_role}")
            return {
                'user_id': str(user.id),
                'email': user.email,
                'old_role': old_role,
                'new_role': new_role,
                'status': 'modified'
            }
        except User.DoesNotExist:
            raise ValueError("User not found")

    def _activate_user(self, user_id, reason):
        """Activate user account."""
        try:
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.save()

            logger.info(f"User activated by superuser {self.request.user.email}: {user.email}")
            return {
                'user_id': str(user.id),
                'email': user.email,
                'status': 'activated'
            }
        except User.DoesNotExist:
            raise ValueError("User not found")

    def _deactivate_user(self, user_id, reason):
        """Deactivate user account."""
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()

            logger.info(f"User deactivated by superuser {self.request.user.email}: {user.email}")
            return {
                'user_id': str(user.id),
                'email': user.email,
                'status': 'deactivated'
            }
        except User.DoesNotExist:
            raise ValueError("User not found")

    def _create_branch(self, data, reason):
        """Create a new branch."""
        from banking.models import Branch

        branch = Branch.objects.create(
            name=data['branch_name'],
            code=data.get('branch_code', data['branch_name'][:3].upper()),
            location=data.get('branch_location', ''),
            manager_id=data.get('manager_id')
        )

        logger.info(f"Branch created by superuser {self.request.user.email}: {branch.name}")
        return {
            'branch_id': str(branch.id),
            'name': branch.name,
            'code': branch.code,
            'status': 'created'
        }

    def _system_health(self):
        """Check system health."""
        import psutil
        from django.db import connections

        # Database health
        db_conn = connections['default']
        db_healthy = False
        db_stats = {}
        try:
            with db_conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM users_user;")
                user_count = cursor.fetchone()[0]
                db_healthy = True
                db_stats = {'user_count': user_count}
        except:
            db_healthy = False

        # System resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Server uptime
        uptime = psutil.boot_time()

        return {
            'database': {
                'healthy': db_healthy,
                'stats': db_stats
            },
            'system': {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_used': memory.used,
                'memory_total': memory.total,
                'disk_free_percent': 100 - disk.percent,
                'uptime': uptime
            },
            'timestamp': timezone.now().isoformat()
        }

    def _backup_database(self, reason):
        """Trigger database backup."""
        import subprocess
        from pathlib import Path

        try:
            # Run the SQLite backup script
            script_path = Path(settings.BASE_DIR) / 'scripts' / 'sqlite_backup.py'
            result = subprocess.run([
                sys.executable, str(script_path), 'create', '--compress'
            ], capture_output=True, text=True, cwd=settings.BASE_DIR)

            if result.returncode == 0:
                logger.info(f"Database backup completed by superuser {self.request.user.email}: {reason}")
                return {'status': 'success', 'output': result.stdout.strip()}
            else:
                raise ValueError(result.stderr.strip())
        except Exception as e:
            logger.error(f"Database backup failed: {str(e)}")
            raise

    def _monitor_activity(self, target=None):
        """Monitor user activities and system logs."""
        from .models import AuditLog, SecurityEvent

        # Get recent audit logs
        recent_logs = AuditLog.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-timestamp')[:50]

        # Get recent security events
        recent_events = SecurityEvent.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-timestamp')[:20]

        # Get active users count
        active_users = User.objects.filter(
            last_login__gte=timezone.now() - timedelta(hours=24)
        ).count()

        return {
            'active_users_24h': active_users,
            'recent_logs': [
                {
                    'timestamp': log.timestamp.isoformat(),
                    'user': log.user.email if log.user else 'Anonymous',
                    'action': log.action,
                    'description': log.description[:100]
                } for log in recent_logs
            ],
            'recent_security_events': [
                {
                    'timestamp': event.timestamp.isoformat(),
                    'event_type': event.event_type,
                    'severity': event.severity,
                    'description': event.description[:100]
                } for event in recent_events
            ],
            'timestamp': timezone.now().isoformat()
        }

    def _update_system_setting(self, data, reason):
        """Update a system setting."""
        from settings.models import SystemSettings

        setting_key = data.get('setting_key')
        setting_value = data.get('setting_value')

        if not setting_key or setting_value is None:
            raise ValueError("setting_key and setting_value are required")

        try:
            setting = SystemSettings.objects.get(key=setting_key)
            old_value = setting.get_value()
            setting.set_value(setting_value)
            setting.save()

            logger.info(f"System setting updated by superuser {self.request.user.email}: {setting_key} from {old_value} to {setting_value}")
            return {
                'setting_key': setting_key,
                'old_value': old_value,
                'new_value': setting_value,
                'status': 'updated'
            }
        except SystemSettings.DoesNotExist:
            raise ValueError("System setting not found")

    def _get_system_settings(self):
        """Get all system settings."""
        from settings.models import SystemSettings

        settings = SystemSettings.objects.all()
        settings_data = []

        for setting in settings:
            settings_data.append({
                'key': setting.key,
                'value': setting.get_value(),
                'value_type': setting.value_type,
                'description': setting.description,
                'is_public': setting.is_public,
                'is_active': setting.is_active,
                'category': setting.category
            })

        return {
            'settings': settings_data,
            'total_count': len(settings_data),
            'timestamp': timezone.now().isoformat()
        }

    def _reset_system_setting(self, setting_key, reason):
        """Reset a system setting to its default value."""
        from settings.models import SystemSettings

        if not setting_key:
            raise ValueError("setting_key is required")

        try:
            setting = SystemSettings.objects.get(key=setting_key)
            old_value = setting.get_value()
            default_value = setting.default_value

            setting.set_value(default_value)
            setting.save()

            logger.info(f"System setting reset by superuser {self.request.user.email}: {setting_key} from {old_value} to default {default_value}")
            return {
                'setting_key': setting_key,
                'old_value': old_value,
                'new_value': default_value,
                'status': 'reset'
            }
        except SystemSettings.DoesNotExist:
            raise ValueError("System setting not found")


# Web Views for User Interface

@csrf_protect
def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = form.cleaned_data['user']
            login(request, user)
            logger.info(f"Successful web login for user: {user.email}")
            return redirect('users:dashboard')
        else:
            # Form is invalid, render with errors
            return render(request, 'users/login.html', {'form': form})
    else:
        form = LoginForm()
    return render(request, 'users/login.html', {'form': form})


def logout_view(request):
    """Web view for user logout."""
    logout(request)
    messages.info(request, 'You have been logged out.')
    return redirect('users:login')


@login_required
def dashboard_view(request):
    """Dashboard view for authenticated users."""
    user = request.user
    context = {
        'user': user,
    }

    # Add role-specific context
    if user.role in ['manager', 'operations_manager', 'administrator', 'superuser']:
        # Staff dashboard
        context['is_staff'] = True
        context['total_users'] = User.objects.count()
        context['active_users'] = User.objects.filter(is_active=True).count()
        context['staff_users'] = User.objects.exclude(role='customer').count()

        # Superuser gets additional access
        if user.role == 'superuser':
            context['is_superuser'] = True
    else:
        # Member dashboard
        context['is_member'] = True

    return render(request, 'users/dashboard.html', context)


@login_required
def analytics_view(request):
    """Analytics view for web analytics functionality."""
    user = request.user

    # Check if user has permission to view analytics (staff and above)
    if user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
        messages.error(request, 'Access denied. Analytics view requires staff privileges.')
        return redirect('users:dashboard')

    context = {
        'user': user,
        'is_staff': True,
    }

    # Add analytics data
    try:
        from banking.models import Account, Transaction
        from django.db.models import Count, Sum
        from django.db.models.functions import TruncMonth

        # User registration analytics
        user_registrations = User.objects.annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Transaction analytics
        transaction_volume = Transaction.objects.annotate(
            month=TruncMonth('timestamp')
        ).values('month').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('month')

        # Account analytics
        account_stats = {
            'total_accounts': Account.objects.count(),
            'active_accounts': Account.objects.filter(is_active=True).count(),
            'total_balance': sum(account.balance for account in Account.objects.all()),
        }

        context.update({
            'user_registrations': list(user_registrations),
            'transaction_volume': list(transaction_volume),
            'account_stats': account_stats,
        })

    except Exception as e:
        logger.error(f"Error loading analytics data: {str(e)}")
        context['analytics_error'] = 'Unable to load analytics data at this time.'

    return render(request, 'users/analytics.html', context)


@csrf_protect
def register_view(request):
    """Web view for user registration."""
    if request.user.is_authenticated:
        return redirect('users:dashboard')

    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Account created successfully!')
            return redirect('users:dashboard')
    else:
        form = UserRegistrationForm()

    return render(request, 'users/register.html', {'form': form})


@login_required
@csrf_protect
def profile_view(request):
    """View and edit user profile."""
    user = request.user

    # Ensure user has a profile
    profile, created = UserProfile.objects.get_or_create(user=user)

    if request.method == 'POST':
        profile_form = UserProfileForm(request.POST, instance=profile)
        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('web_profile')
    else:
        profile_form = UserProfileForm(instance=profile)

    context = {
        'profile_form': profile_form,
        'user': user,
    }
    return render(request, 'users/profile.html', context)


@login_required
@csrf_protect
def change_password_view(request):
    """Change user password."""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            request.user.set_password(form.cleaned_data['new_password1'])
            request.user.save()
            login(request, request.user)  # Re-login to update session
            messages.success(request, 'Password changed successfully!')
            return redirect('profile')
    else:
        form = PasswordChangeForm(request.user)

    return render(request, 'users/change_password.html', {'form': form})


class StaffRequiredMixin(UserPassesTestMixin):
    """Mixin to require staff role."""

    def test_func(self):
        return self.request.user.role in ['manager', 'operations_manager', 'administrator', 'superuser']


class UserListView(LoginRequiredMixin, StaffRequiredMixin, ListView):
    """List all users for staff management."""
    model = User
    template_name = 'users/user_list.html'
    context_object_name = 'users'
    paginate_by = 20

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.GET.get('role')
        is_active = self.request.GET.get('is_active')

        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active == '1')

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['roles'] = User.ROLE_CHOICES
        return context


class UserCreateView(LoginRequiredMixin, StaffRequiredMixin, CreateView):
    """Create new user."""
    model = User
    form_class = CustomUserCreationForm
    template_name = 'users/user_form.html'
    success_url = reverse_lazy('users:user_list')

    def form_valid(self, form):
        response = super().form_valid(form)
        UserProfile.objects.create(user=self.object)
        messages.success(self.request, f'User {self.object.email} created successfully!')
        return response


class UserUpdateView(LoginRequiredMixin, StaffRequiredMixin, UpdateView):
    """Update existing user."""
    model = User
    form_class = CustomUserChangeForm
    template_name = 'users/user_form.html'
    success_url = reverse_lazy('users:user_list')

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, f'User {self.object.email} updated successfully!')
        return response


class UserDeleteView(LoginRequiredMixin, StaffRequiredMixin, DeleteView):
    """Delete user."""
    model = User
    template_name = 'users/user_confirm_delete.html'
    success_url = '/users/web/users/'

    def form_valid(self, form):
        user = self.get_object()
        email = user.email

        # Check for protected relationships that would prevent deletion
        from banking.models import (
            Account, AccountOpening, AccountClosure, IdentityVerification,
            KYCApplication, LoanApplication, CashAdvance, Refund, Complaint
        )
        from operations.models import Commission

        # Check for accounts
        if Account.objects.filter(owner=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has associated accounts that must be handled first.')
            return redirect('/users/web/users/')

        # Check for account openings
        if AccountOpening.objects.filter(applicant=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has pending account opening applications.')
            return redirect('/users/web/users/')

        # Check for account closures
        if AccountClosure.objects.filter(requested_by=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has account closure requests.')
            return redirect('/users/web/users/')

        # Check for identity verifications
        if IdentityVerification.objects.filter(user=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has identity verification records.')
            return redirect('/users/web/users/')

        # Check for KYC applications
        if KYCApplication.objects.filter(submitted_by=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has submitted KYC applications.')
            return redirect('/users/web/users/')

        # Check for loan applications
        if LoanApplication.objects.filter(applicant=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has loan applications.')
            return redirect('/users/web/users/')

        # Check for cash advances
        if CashAdvance.objects.filter(requested_by=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has cash advance requests.')
            return redirect('/users/web/users/')

        # Check for refunds
        if Refund.objects.filter(requested_by=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has refund requests.')
            return redirect('/users/web/users/')

        # Check for complaints
        if Complaint.objects.filter(submitted_by=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has submitted complaints.')
            return redirect('/users/web/users/')

        # Check for commissions
        if Commission.objects.filter(earned_by=user).exists():
            messages.error(self.request, f'Cannot delete user {email}. User has commission records that must be handled first.')
            return redirect('/users/web/users/')

        try:
            response = super().form_valid(form)
            messages.success(self.request, f'User {email} deleted successfully!')
            return response
        except Exception as e:
            logger.error(f"Error deleting user {email}: {str(e)}")
            messages.error(self.request, f'Error deleting user {email}: {str(e)}')
            return redirect('/users/web/users/')


# Superuser Dashboard Views
@login_required
def superuser_dashboard(request):
    """Superuser dashboard view with comprehensive system overview."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Get comprehensive system statistics
    from banking.models import Account, Transaction, Loan
    from fraud_detection.models import FraudAlert
    try:
        from transactions.models import Transaction as BankingTransaction
        logger.info("Successfully imported Transaction from transactions.models")
    except ImportError as e:
        logger.error(f"Failed to import Transaction from transactions.models: {e}")
        # Fallback to banking.models Transaction
        BankingTransaction = Transaction
        logger.info("Using Transaction from banking.models as fallback")

    # User statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    staff_users = User.objects.exclude(role='customer').count()

    # Calculate user growth (last 30 days vs previous 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    sixty_days_ago = timezone.now() - timedelta(days=60)
    recent_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    previous_users = User.objects.filter(date_joined__gte=sixty_days_ago, date_joined__lt=thirty_days_ago).count()
    user_growth = ((recent_users - previous_users) / max(previous_users, 1)) * 100

    # Banking statistics
    try:
        total_accounts = Account.objects.count()
        total_balance = sum(account.balance for account in Account.objects.all())
        active_loans = Loan.objects.filter(status='active').count()
    except:
        total_accounts = 0
        total_balance = 0
        active_loans = 0

    # Transaction statistics
    try:
        today_transactions = BankingTransaction.objects.filter(
            timestamp__date=timezone.now().date()
        ).count()
        week_transactions = BankingTransaction.objects.filter(
            timestamp__gte=timezone.now() - timedelta(days=7)
        ).count()
    except:
        today_transactions = 0
        week_transactions = 0

    # Fraud detection statistics
    try:
        active_fraud_alerts = FraudAlert.objects.filter(status='active').count()
        suspicious_activities = FraudAlert.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
    except:
        active_fraud_alerts = 0
        suspicious_activities = 0

    # System health (mock data for now)
    system_health = 98
    active_sessions = 45
    peak_sessions = 67
    active_alerts = active_fraud_alerts + 2  # Include system alerts
    critical_alerts = 1 if active_fraud_alerts > 5 else 0

    system_stats = {
        'total_users': total_users,
        'active_users': active_users,
        'staff_users': staff_users,
        'user_growth': round(user_growth, 1),
        'active_sessions': active_sessions,
        'peak_sessions': peak_sessions,
        'active_alerts': active_alerts,
        'critical_alerts': critical_alerts,
        'system_health': system_health,
        'total_accounts': total_accounts,
        'total_balance': total_balance,
        'active_loans': active_loans,
        'today_transactions': today_transactions,
        'week_transactions': week_transactions,
        'fraud_alerts': active_fraud_alerts,
        'suspicious_activities': suspicious_activities,
    }

    # Get recent activities from audit logs
    from .models import AuditLog
    recent_logs = AuditLog.objects.order_by('-timestamp')[:20]

    recent_activities = []
    for log in recent_logs:
        activity_type = 'system'
        icon = 'fas fa-cog'
        color = 'secondary'

        if 'login' in log.action.lower():
            activity_type = 'security'
            icon = 'fas fa-sign-in-alt'
            color = 'success'
        elif 'user' in log.action.lower():
            activity_type = 'users'
            icon = 'fas fa-user'
            color = 'primary'
        elif 'security' in log.action.lower() or 'violation' in log.action.lower():
            activity_type = 'security'
            icon = 'fas fa-shield-alt'
            color = 'danger'

        recent_activities.append({
            'user': log.user.email if log.user else 'System',
            'action': log.action.replace('_', ' ').title(),
            'target': log.description[:50] if len(log.description) > 50 else log.description,
            'timestamp': log.timestamp,
            'type': activity_type,
            'icon': icon,
            'color': color,
        })

    # Critical alerts (mock data for now)
    critical_alerts = [
        {
            'title': 'High CPU Usage',
            'message': 'Server CPU usage above 90% for 15 minutes'
        }
    ]

    context = {
        'system_stats': system_stats,
        'recent_activities': recent_activities,
        'critical_alerts': critical_alerts,
        'current_time': timezone.now().strftime('%H:%M:%S UTC'),
    }

    return render(request, 'users/superuser_dashboard.html', context)


@login_required
def superuser_users(request):
    """Superuser user management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Get all users with pagination and filtering
    users = User.objects.all().order_by('-date_joined')
    role_filter = request.GET.get('role')
    status_filter = request.GET.get('status')
    search_query = request.GET.get('search')

    if role_filter:
        users = users.filter(role=role_filter)
    if status_filter:
        if status_filter == 'active':
            users = users.filter(is_active=True)
        elif status_filter == 'inactive':
            users = users.filter(is_active=False)

    if search_query:
        users = users.filter(
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(users, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'role_choices': User.ROLE_CHOICES,
        'current_filters': {
            'role': role_filter,
            'status': status_filter,
            'search': search_query,
        }
    }

    return render(request, 'users/superuser_users.html', context)


@login_required
def superuser_settings(request):
    """Superuser system settings management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Get real system settings from database
    from settings.models import SystemSettings
    
    settings = SystemSettings.objects.filter(is_active=True).order_by('category', 'name')
    
    # Get unique categories for filtering
    categories = SystemSettings.objects.values_list('category', flat=True).distinct()

    context = {
        'settings': settings,
        'categories': list(categories) if categories else ['system', 'security', 'transactions', 'notifications']
    }

    return render(request, 'users/superuser_settings.html', context)


@login_required
def superuser_operations_page(request):
    """Superuser operations interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Available operations
    operations = [
        {
            'id': 'bypass_security',
            'name': 'Bypass Security',
            'description': 'Temporarily bypass security checks',
            'category': 'security',
            'risk_level': 'high'
        },
        {
            'id': 'emergency_access',
            'name': 'Emergency Access',
            'description': 'Grant emergency system access',
            'category': 'security',
            'risk_level': 'critical'
        },
        {
            'id': 'system_reset',
            'name': 'System Reset',
            'description': 'Initiate system reset',
            'category': 'system',
            'risk_level': 'critical'
        },
        {
            'id': 'backup_database',
            'name': 'Backup Database',
            'description': 'Create database backup',
            'category': 'maintenance',
            'risk_level': 'low'
        },
        {
            'id': 'create_branch',
            'name': 'Create Branch',
            'description': 'Create new bank branch',
            'category': 'management',
            'risk_level': 'medium'
        }
    ]

    context = {
        'operations': operations,
        'categories': ['security', 'system', 'maintenance', 'management']
    }

    return render(request, 'users/superuser_operations.html', context)


@login_required
def superuser_audit(request):
    """Superuser audit log viewer."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Get audit logs with filtering
    from .models import AuditLog
    logs = AuditLog.objects.all().order_by('-timestamp')

    action_filter = request.GET.get('action')
    user_filter = request.GET.get('user')
    priority_filter = request.GET.get('priority')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')

    if action_filter:
        logs = logs.filter(action=action_filter)
    if user_filter:
        logs = logs.filter(user__email__icontains=user_filter)
    if priority_filter:
        logs = logs.filter(priority=priority_filter)
    if date_from:
        logs = logs.filter(timestamp__date__gte=date_from)
    if date_to:
        logs = logs.filter(timestamp__date__lte=date_to)

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(logs, 50)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Get unique actions and priorities for filters
    actions = AuditLog.objects.values_list('action', flat=True).distinct()
    priorities = AuditLog.objects.values_list('priority', flat=True).distinct()

    context = {
        'page_obj': page_obj,
        'actions': actions,
        'priorities': priorities,
        'current_filters': {
            'action': action_filter,
            'user': user_filter,
            'priority': priority_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
    }

    return render(request, 'users/superuser_audit.html', context)


@login_required
def superuser_monitoring(request):
    """Superuser system monitoring interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required')
        return redirect('users:dashboard')

    # Real monitoring data using psutil
    import psutil
    from datetime import timedelta
    
    try:
        # Get real system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net_io = psutil.net_io_counters()
        
        # Calculate uptime
        boot_time = psutil.boot_time()
        uptime_seconds = timezone.now().timestamp() - boot_time
        uptime_delta = timedelta(seconds=int(uptime_seconds))
        uptime_str = f"{uptime_delta.days} days, {uptime_delta.seconds // 3600} hours"
        
        # Get active connections count
        try:
            connections = len(psutil.net_connections())
        except:
            connections = 0
        
        # Calculate network traffic in KB/s (approximate)
        network_traffic = (net_io.bytes_sent + net_io.bytes_recv) / 1024 / uptime_seconds if uptime_seconds > 0 else 0
        
        monitoring_data = {
            'cpu_usage': round(cpu_percent, 1),
            'memory_usage': round(memory.percent, 1),
            'disk_usage': round(disk.percent, 1),
            'network_traffic': round(network_traffic, 2),
            'active_connections': connections,
            'response_time': 120,  # This would need middleware tracking
            'error_rate': 0.02,  # This would need error tracking
            'uptime': uptime_str,
            'memory_available_gb': round(memory.available / (1024**3), 2),
            'disk_free_gb': round(disk.free / (1024**3), 2),
        }
    except Exception as e:
        logger.error(f"Error getting system metrics: {str(e)}")
        # Fallback to safe defaults
        monitoring_data = {
            'cpu_usage': 0,
            'memory_usage': 0,
            'disk_usage': 0,
            'network_traffic': 0,
            'active_connections': 0,
            'response_time': 0,
            'error_rate': 0,
            'uptime': 'Unknown',
            'memory_available_gb': 0,
            'disk_free_gb': 0,
        }

    # Recent alerts (keep for now, can be enhanced later)
    alerts = [
        {
            'level': 'warning' if monitoring_data['memory_usage'] > 80 else 'info',
            'message': f"Memory usage at {monitoring_data['memory_usage']}%" if monitoring_data['memory_usage'] > 80 else 'System running normally',
            'timestamp': timezone.now(),
            'resolved': monitoring_data['memory_usage'] <= 80
        },
    ]
    
    # Add CPU alert if high
    if monitoring_data['cpu_usage'] > 80:
        alerts.insert(0, {
            'level': 'warning',
            'message': f"High CPU usage detected: {monitoring_data['cpu_usage']}%",
            'timestamp': timezone.now(),
            'resolved': False
        })
    
    # Add disk alert if high
    if monitoring_data['disk_usage'] > 85:
        alerts.insert(0, {
            'level': 'critical',
            'message': f"Disk usage critical: {monitoring_data['disk_usage']}%",
            'timestamp': timezone.now(),
            'resolved': False
        })

    context = {
        'monitoring_data': monitoring_data,
        'alerts': alerts,
        'time_range': request.GET.get('range', '1h'),
        'last_updated': timezone.now(),
    }

    return render(request, 'users/superuser_monitoring.html', context)


@login_required
def superuser_security(request):
    """Superuser security management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Get detailed security data
    from .models import SecurityEvent, AuditLog, LoginAttempt

    # Security metrics - calculate from real data
    today = timezone.now().date()
    try:
        security_metrics = {
            'failed_logins_today': LoginAttempt.objects.filter(
                status='failure',
                timestamp__date=today
            ).count(),
            'suspicious_activities': AuditLog.objects.filter(
                is_suspicious=True,
                timestamp__date=today
            ).count(),
            'active_sessions': 45,  # This would need session tracking
            'blocked_ips': LoginAttempt.objects.filter(
                status='blocked',
                timestamp__date=today
            ).values('ip_address').distinct().count(),
            'security_events': SecurityEvent.objects.filter(
                timestamp__date=today
            ).count(),
            'encryption_status': 'Active',
            'last_security_scan': timezone.now() - timedelta(hours=6),
        }
    except Exception as e:
        logger.error(f"Error calculating security metrics: {str(e)}")
        # Fallback to safe defaults
        security_metrics = {
            'failed_logins_today': 0,
            'suspicious_activities': 0,
            'active_sessions': 0,
            'blocked_ips': 0,
            'security_events': 0,
            'encryption_status': 'Unknown',
            'last_security_scan': timezone.now(),
        }

    # Recent security events
    recent_events = SecurityEvent.objects.order_by('-timestamp')[:20]

    # Detailed failed login attempts
    failed_logins = LoginAttempt.objects.filter(
        status__in=['failure', 'blocked', 'locked']
    ).order_by('-timestamp')[:50]

    # Recent suspicious activities from audit logs
    suspicious_activities = AuditLog.objects.filter(
        is_suspicious=True
    ).order_by('-timestamp')[:30]

    # Account lockouts
    account_lockouts = AuditLog.objects.filter(
        action='account_locked'
    ).order_by('-timestamp')[:20]

    # Fraud detection statistics
    try:
        from fraud_detection.models import FraudRule, FraudAlert, FraudCase
        fraud_stats = {
            'active_rules': FraudRule.objects.filter(is_active=True).count(),
            'total_alerts': FraudAlert.objects.count(),
            'open_cases': FraudCase.objects.filter(status__in=['open', 'investigating']).count(),
            'high_priority_alerts': FraudAlert.objects.filter(priority='high').count(),
        }
    except ImportError:
        fraud_stats = {
            'active_rules': 0,
            'total_alerts': 0,
            'open_cases': 0,
            'high_priority_alerts': 0,
        }

    context = {
        'security_metrics': security_metrics,
        'recent_events': recent_events,
        'failed_logins': failed_logins,
        'suspicious_activities': suspicious_activities,
        'account_lockouts': account_lockouts,
        'fraud_stats': fraud_stats,
    }

    return render(request, 'users/superuser_security.html', context)


@login_required
@require_POST
@csrf_protect
def toggle_user_status(request, pk):
    """Toggle user active status."""
    if request.user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
        messages.error(request, 'Permission denied.')
        return redirect('users:user_list')
    
    

    user = get_object_or_404(User, pk=pk)

    # Prevent deactivating yourself
    if user == request.user:
        messages.error(request, 'You cannot deactivate your own account.')
        return redirect('users:user_list')

    user.is_active = not user.is_active
    user.save()

    action = 'activated' if user.is_active else 'deactivated'
    messages.success(request, f'User {user.email} {action} successfully!')
    return redirect('users:user_list')


# Document Management Views
@extend_schema(exclude=True)
class UserDocumentsListCreateView(views.APIView):
    """API view for listing and uploading user documents."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List User Documents",
        description="Retrieve all documents uploaded by the authenticated user.",
        responses={
            200: UserDocumentsSerializer(many=True),
            401: {'description': 'Authentication required'}
        },
        tags=['Documents']
    )
    def get(self, request):
        """List all documents for the authenticated user."""
        documents = UserDocuments.objects.filter(user=request.user)
        serializer = UserDocumentsSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Upload Document",
        description="Upload a new document for the authenticated user.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'document_type': {
                        'type': 'string',
                        'enum': ['passport_picture', 'application_letter', 'appointment_letter', 'id_card', 'utility_bill', 'bank_statement', 'other']
                    },
                    'file': {'type': 'string', 'format': 'binary'},
                    'expiry_date': {'type': 'string', 'format': 'date', 'nullable': True}
                },
                'required': ['document_type', 'file']
            }
        },
        responses={
            201: UserDocumentsSerializer,
            400: {'description': 'Validation error'},
            401: {'description': 'Authentication required'}
        },
        tags=['Documents']
    )
    def post(self, request):
        """Upload a new document."""
        # Check if user already has this type of document
        document_type = request.data.get('document_type')
        if UserDocuments.objects.filter(user=request.user, document_type=document_type).exists():
            return Response(
                {'error': f'You already have a {document_type.replace("_", " ")} uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserDocumentsSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDocumentsDetailView(views.APIView):
    """API view for retrieving, updating, and deleting specific user documents."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        """Get document object with ownership check."""
        try:
            return UserDocuments.objects.get(pk=pk, user=user)
        except UserDocuments.DoesNotExist:
            return None

    @extend_schema(
        summary="Get Document Details",
        description="Retrieve details of a specific document.",
        responses={
            200: UserDocumentsSerializer,
            404: {'description': 'Document not found'},
            401: {'description': 'Authentication required'}
        },
        tags=['Documents']
    )
    def get(self, request, pk):
        """Retrieve document details."""
        document = self.get_object(pk, request.user)
        if not document:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserDocumentsSerializer(document, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Delete Document",
        description="Delete a specific document.",
        responses={
            204: {'description': 'Document deleted successfully'},
            404: {'description': 'Document not found'},
            401: {'description': 'Authentication required'}
        },
        tags=['Documents']
    )
    def delete(self, request, pk):
        """Delete a document."""
        document = self.get_object(pk, request.user)
        if not document:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only allow deletion of unverified documents
        if document.is_verified:
            return Response(
                {'error': 'Cannot delete verified documents'},
                status=status.HTTP_400_BAD_REQUEST
            )

        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(exclude=True)
class DocumentApprovalView(views.APIView):
    """API view for document approval/rejection by managers and operations managers."""
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """Check if user has approval permissions."""
        # During schema generation, skip permission checks for anonymous users
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            if not self.request.user.has_role_permission('manager'):
                self.permission_denied(self.request, message="Insufficient permissions for document approval")
        return super().get_permissions()

    @extend_schema(
        summary="Approve/Reject Document",
        description="Approve or reject a document submission.",
        request=DocumentApprovalSerializer,
        responses={
            200: {'description': 'Document status updated successfully'},
            400: {'description': 'Validation error'},
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Document not found'}
        },
        tags=['Documents']
    )
    def post(self, request, pk):
        """Approve or reject a document."""
        try:
            document = UserDocuments.objects.get(pk=pk)
        except UserDocuments.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DocumentApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data['action']

        if action == 'approve':
            document.status = 'approved'
            document.is_verified = True
            document.verified_by = request.user
            document.verified_at = timezone.now()
        elif action == 'reject':
            document.status = 'rejected'
            document.is_verified = False
            document.verified_by = request.user
            document.verified_at = timezone.now()
            document.rejection_reason = serializer.validated_data.get('rejection_reason', '')

        document.save()

        # Log the approval action
        log_audit_event(
            user=request.user,
            action='document_approved' if action == 'approve' else 'document_rejected',
            description=f"Document {document.id} {action}d by {request.user.email}",
            metadata={
                'document_id': document.id,
                'document_type': document.document_type,
                'user_email': document.user.email,
                'rejection_reason': serializer.validated_data.get('rejection_reason', '')
            }
        )

        return Response({
            'message': f'Document {action}d successfully',
            'document_id': document.id,
            'status': document.status
        }, status=status.HTTP_200_OK)


@extend_schema(exclude=True)
class PendingDocumentsView(views.APIView):
    """API view for managers/operations managers to view pending document approvals."""
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """Check if user has approval permissions."""
        # During schema generation, skip permission checks for anonymous users
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            if not self.request.user.has_role_permission('manager'):
                self.permission_denied(self.request, message="Insufficient permissions to view pending documents")
        return super().get_permissions()

    @extend_schema(
        summary="List Pending Documents",
        description="Retrieve all documents pending approval.",
        responses={
            200: UserDocumentsSerializer(many=True),
            403: {'description': 'Insufficient permissions'}
        },
        tags=['Documents']
    )
    def get(self, request):
        """List all pending documents for approval."""
        serializer = UserDocumentsSerializer(pending_documents, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# Banking Management Views (Superuser)

@login_required
def superuser_accounts(request):
    """Superuser account management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    from banking.models import Account

    # Get all accounts with pagination and filtering
    accounts = Account.objects.all().order_by('-created_at')
    
    # Filtering
    type_filter = request.GET.get('type')
    status_filter = request.GET.get('status')
    search_query = request.GET.get('search')

    if type_filter:
        accounts = accounts.filter(type=type_filter)
    if status_filter:
        if status_filter == 'active':
            accounts = accounts.filter(is_active=True)
        elif status_filter == 'inactive':
            accounts = accounts.filter(is_active=False)
            
    if search_query:
        accounts = accounts.filter(
            Q(account_number__icontains=search_query) |
            Q(owner__email__icontains=search_query) |
            Q(owner__first_name__icontains=search_query) |
            Q(owner__last_name__icontains=search_query)
        )

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(accounts, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get choices
    account_types = [choice[0] for choice in Account.ACCOUNT_TYPES] if hasattr(Account, 'ACCOUNT_TYPES') else ['savings', 'checking', 'business']

    context = {
        'page_obj': page_obj,
        'account_types': account_types,
        'current_filters': {
            'type': type_filter,
            'status': status_filter,
            'search': search_query,
        }
    }

    return render(request, 'users/superuser_accounts.html', context)


@login_required
def superuser_transactions(request):
    """Superuser transaction management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    try:
        from transactions.models import Transaction
    except ImportError:
        from banking.models import Transaction

    # Get all transactions with pagination and filtering
    transactions = Transaction.objects.all().order_by('-timestamp')
    
    # Filtering
    type_filter = request.GET.get('type')
    status_filter = request.GET.get('status')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    search_query = request.GET.get('search')

    if type_filter:
        transactions = transactions.filter(transaction_type=type_filter)
    if status_filter:
        transactions = transactions.filter(status=status_filter)
    if date_from:
        transactions = transactions.filter(timestamp__date__gte=date_from)
    if date_to:
        transactions = transactions.filter(timestamp__date__lte=date_to)
            
    if search_query:
        transactions = transactions.filter(
            Q(description__icontains=search_query) |
            Q(account__account_number__icontains=search_query) |
            Q(account__owner__email__icontains=search_query)
        )

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(transactions, 50)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'current_filters': {
            'type': type_filter,
            'status': status_filter,
            'date_from': date_from,
            'date_to': date_to,
            'search': search_query,
        }
    }

    return render(request, 'users/superuser_transactions.html', context)


@login_required
def superuser_loans(request):
    """Superuser loan management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    from banking.models import Loan

    # Get all loans with pagination and filtering
    loans = Loan.objects.all().order_by('-applied_at')
    
    # Filtering
    status_filter = request.GET.get('status')
    search_query = request.GET.get('search')

    if status_filter:
        loans = loans.filter(status=status_filter)
            
    if search_query:
        loans = loans.filter(
            Q(account__owner__email__icontains=search_query) |
            Q(account__account_number__icontains=search_query)
        )

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(loans, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'current_filters': {
            'status': status_filter,
            'search': search_query,
        }
    }

    return render(request, 'users/superuser_loans.html', context)


@login_required
def superuser_complaints(request):
    """Superuser complaints management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    from banking.models import Complaint

    # Get all complaints
    complaints = Complaint.objects.all().order_by('-submitted_at')
    
    # Filtering
    status_filter = request.GET.get('status')
    priority_filter = request.GET.get('priority')
    search_query = request.GET.get('search')

    if status_filter:
        complaints = complaints.filter(status=status_filter)
    if priority_filter:
        complaints = complaints.filter(priority=priority_filter)
            
    if search_query:
        complaints = complaints.filter(
            Q(subject__icontains=search_query) |
            Q(submitted_by__email__icontains=search_query)
        )

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(complaints, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'current_filters': {
            'status': status_filter,
            'priority': priority_filter,
            'search': search_query,
        }
    }

    return render(request, 'users/superuser_complaints.html', context)


@login_required
def superuser_refunds(request):
    """Superuser refunds management interface."""
    if request.user.role != 'superuser':
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    from banking.models import Refund

    # Get all refunds
    refunds = Refund.objects.all().order_by('-requested_at')
    
    # Filtering
    status_filter = request.GET.get('status')
    search_query = request.GET.get('search')

    if status_filter:
        refunds = refunds.filter(status=status_filter)
            
    if search_query:
        refunds = refunds.filter(
            Q(transaction__id__icontains=search_query) |
            Q(requested_by__email__icontains=search_query)
        )

    # Pagination
    from django.core.paginator import Paginator
    paginator = Paginator(refunds, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'current_filters': {
            'status': status_filter,
            'search': search_query,
        }
    }

    return render(request, 'users/superuser_refunds.html', context)
