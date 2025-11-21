from rest_framework import serializers, views, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy, reverse
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from rest_framework.decorators import throttle_classes
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from .models import UserProfile, User, OTPVerification
from .serializers import (
    UserProfileSerializer, NotificationSettingsSerializer,
    EnhancedUserRegistrationSerializer, UserInfoSerializer,
    RoleBasedDashboardSerializer, UserManagementSerializer,
    SecuritySettingsSerializer, OTPSerializer, OTPVerificationSerializer,
    EmailTokenObtainPairSerializer
)
from .permissions import (
    IsCustomer, IsCashier, IsMobileBanker, IsManager,
    IsOperationsManager, IsAdministrator, IsSuperuser, IsManagerOrHigher,
    CanManageUsers, CanAccessSecurityFeatures, CanPerformOperationalOversight
)
from .audit_utils import (
    log_audit_event, log_login_attempt, log_security_event,
    get_client_ip, rate_limit_check, check_suspicious_activity
)
from .forms import (
    LoginForm, UserRegistrationForm, CustomUserCreationForm,
    CustomUserChangeForm, UserProfileForm, PasswordChangeForm
)
from banking.models import Account, Transaction, Loan
from decimal import Decimal
import random
import logging
import json

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
                            'role': {'type': 'string', 'enum': ['member', 'cashier', 'mobile_banker', 'manager', 'operations_manager'], 'example': 'member'},
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
        logger.info(f"[DEBUG] Login attempt received: {request.data}")
        try:
            # Validate input data first
            email = request.data.get('email')
            logger.info(f"[DEBUG] Email from request: {email}")
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

            logger.info(f"[DEBUG] Calling super().post() for authentication")
            response = super().post(request, *args, **kwargs)
            logger.info(f"[DEBUG] super().post() returned status: {response.status_code}")
            if response.status_code == 200:
                logger.info(f"[DEBUG] Authentication successful, processing user data")
                try:
                    # Get the authenticated user from the serializer
                    serializer = self.get_serializer(data=request.data)
                    serializer.is_valid(raise_exception=True)
                    user = serializer.validated_data['user']
                    logger.info(f"[DEBUG] Authenticated user: {user.email}, role: {user.role}")

                    # Check if user has sufficient privileges (manager and above)
                    allowed_roles = ['manager', 'operations_manager', 'administrator', 'superuser']
                    if user.role not in allowed_roles:
                        logger.warning(f"Insufficient privileges login attempt: {user.email} (role: {user.role})")
                        log_login_attempt(user.email, False, 'Access denied. Insufficient privileges.')
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

                    # Return both tokens and user data
                    response.data = {
                        'refresh': str(refresh),
                        'access': access_token,
                        'user': user_data
                    }
                    logger.info(f"[DEBUG] Login successful, tokens and user data added to response")

                    # Log successful login
                    log_login_attempt(user.email, True, 'API login successful')
                    logger.info(f"Successful login for user: {user.email}")

                except Exception as e:
                    logger.error(f"Error processing successful login response: {str(e)}")
                    # Return response without user data if processing fails
                    log_login_attempt(email, True, 'Login successful but user data processing failed')

            return response

        except serializers.ValidationError as e:
            logger.warning(f"Login validation error for {email}: {str(e)}")
            log_login_attempt(email, False, f'Validation error: {str(e)}')
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error during login for {email}: {str(e)}", exc_info=True)
            log_login_attempt(email or 'unknown', False, f'Unexpected error: {str(e)}')
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
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                # If no refresh token provided,  # just return success# The frontend will clear local storage anyway
                return Response({"detail": "Successfully logged out."}, status=200)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=200)
        except Exception as e:
            # Even if token blacklisting fails, return success
            # The frontend will clear tokens locally
            logger.warning(f"Logout token blacklist failed: {e}")
            return Response({"detail": "Successfully logged out."}, status=200)


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetRequestView(views.APIView):
    """POST: Request password reset by sending email with reset token."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

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
            return Response({"detail": "Password reset email sent."})
        except User.DoesNotExist:
            return Response({"detail": "If the email exists, a reset link has been sent."})


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetConfirmView(views.APIView):
    """POST: Confirm password reset with token."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

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
            return Response({"detail": "Password reset successfully."})
        
        # Always return same error message to prevent user enumeration
        return Response({"detail": "Invalid or expired token."}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileSettingsView(views.APIView):
    """
    GET: Retrieve profile.
    PATCH: Update general profile details.
    """
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        profile = self.request.user.profile
        serializer = NotificationSettingsSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Notification settings updated."})


@method_decorator(csrf_exempt, name='dispatch')
class PasswordChangeView(views.APIView):
    """POST: Change user password."""
    permission_classes = [permissions.IsAuthenticated]

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

        return Response({"detail": "Password updated successfully."})


class AuthCheckView(views.APIView):
    """
    GET: Check if the current user is authenticated and return user info.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Check Authentication Status",
        description="Returns the authenticated user's information if logged in. Rate limiting applied to prevent abuse.",
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
                            'role': {'type': 'string', 'enum': ['member', 'cashier', 'mobile_banker', 'manager', 'operations_manager'], 'example': 'member'},
                            'is_active': {'type': 'boolean', 'example': True},
                            'is_staff': {'type': 'boolean', 'example': False}
                        }
                    }
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
    def get(self, request):
        user = request.user
        user_data = {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
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
                            'role': {'type': 'string', 'example': 'member'}
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
    permission_classes = [permissions.IsAuthenticated]

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

        # Check if user is a member
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

        dashboard_data = {
            'account_balance': total_balance,
            'recent_transactions': recent_transactions,
            'loan_balance': loan_balance,
            'savings_balance': savings_balance,
        }

        serializer = MemberDashboardSerializer(dashboard_data)
        return Response(serializer.data)


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
            choices=['user_creation', 'phone_verification', 'transaction', 'password_reset'],
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
        
        # In test mode (DEBUG=True),  # return the OTP in the response
        test_mode = settings.DEBUG
        
        response_data = {
            'message': 'OTP sent successfully',
            'expires_in': 300,  # minutes in seconds
            'test_mode': test_mode
        }
        
        if test_mode:
            response_data['otp_code'] = otp_code
            logger.info(f"TEST MODE: OTP for {phone_number}: {otp_code}")
        else:
            # In production, send actual SMS here
            # Example: send_sms(phone_number, f"Your verification code is: {otp_code}")
            logger.info(f"OTP sent to {phone_number}")
        
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
            choices=['user_creation', 'phone_verification', 'transaction', 'password_reset'],
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
    permission_classes = [permissions.IsAuthenticated]
    
    class UserCreationSerializer(serializers.Serializer):
        email = serializers.EmailField()
        first_name = serializers.CharField(max_length=30)
        last_name = serializers.CharField(max_length=30)
        phone = serializers.CharField(max_length=20)
        password = serializers.CharField(write_only=True)
        role = serializers.ChoiceField(choices=['member', 'cashier', 'mobile_banker', 'manager', 'operations_manager'])
    
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
class SuperuserOperationsView(views.APIView):
    """
    POST: Perform superuser operations.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperuser]

    class SuperuserOperationSerializer(serializers.Serializer):
        operation = serializers.ChoiceField(choices=[
            'bypass_security', 'emergency_access', 'system_reset', 'audit_bypass',
            'create_user', 'modify_user_role', 'activate_user', 'deactivate_user',
            'create_branch', 'system_health', 'backup_database', 'monitor_activity',
            'update_system_setting', 'get_system_settings', 'reset_system_setting'
        ])
        reason = serializers.CharField(required=True)
        target = serializers.CharField(required=False)
        # Additional fields for specific operations
        email = serializers.EmailField(required=False)
        first_name = serializers.CharField(required=False)
        last_name = serializers.CharField(required=False)
        role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)
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

            if operation == 'bypass_security':
                result = self._bypass_security(target, reason)
            elif operation == 'emergency_access':
                result = self._emergency_access(target, reason)
            elif operation == 'system_reset':
                result = self._system_reset(reason)
            elif operation == 'audit_bypass':
                result = self._audit_bypass(target, reason)
            elif operation == 'create_user':
                result = self._create_user(serializer.validated_data, reason)
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

        user = User.objects.create_user(
            email=data['email'],
            password='temp_password_123',  # Should be changed by user
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=data.get('role', 'customer')
        )

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

    if request.method == 'POST':
        profile_form = UserProfileForm(request.POST, instance=user.profile)
        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('profile')
    else:
        profile_form = UserProfileForm(instance=user.profile)

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

    # Get system settings (mock data for now)
    settings = [
        {
            'key': 'max_daily_transactions',
            'value': '1000',
            'type': 'integer',
            'description': 'Maximum transactions per day',
            'category': 'transactions',
            'is_active': True,
        },
        {
            'key': 'session_timeout',
            'value': '3600',
            'type': 'integer',
            'description': 'Session timeout in seconds',
            'category': 'security',
            'is_active': True,
        },
        {
            'key': 'maintenance_mode',
            'value': 'false',
            'type': 'boolean',
            'description': 'Enable maintenance mode',
            'category': 'system',
            'is_active': True,
        }
    ]

    context = {
        'settings': settings,
        'categories': ['system', 'security', 'transactions', 'notifications']
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
        messages.error(request, 'Access denied. Superuser privileges required.')
        return redirect('users:dashboard')

    # Mock monitoring data
    monitoring_data = {
        'cpu_usage': 45,
        'memory_usage': 62,
        'disk_usage': 78,
        'network_traffic': 1250,  # KB/s
        'active_connections': 89,
        'response_time': 120,  # ms
        'error_rate': 0.02,  # %
        'uptime': '15 days, 8 hours',
    }

    # Recent alerts
    alerts = [
        {
            'level': 'warning',
            'message': 'High memory usage detected',
            'timestamp': timezone.now() - timedelta(minutes=30),
            'resolved': False
        },
        {
            'level': 'info',
            'message': 'Scheduled backup completed',
            'timestamp': timezone.now() - timedelta(hours=2),
            'resolved': True
        }
    ]

    context = {
        'monitoring_data': monitoring_data,
        'alerts': alerts,
        'time_range': request.GET.get('range', '1h')
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
