"""
Security services for Coastal Banking Application.

This module provides security-related utilities including:
- Login attempt tracking and account lockout
- Rate limiting helpers
- Transaction limit enforcement
- IP address logging
"""
from django.utils import timezone
from django.core.cache import cache
from datetime import date, timedelta
from decimal import Decimal
import logging

from .models import User, UserActivity

logger = logging.getLogger(__name__)


class SecurityService:
    """
    Service class for security-related operations.
    """
    
    # Rate limiting settings
    LOGIN_RATE_LIMIT_KEY = "login_attempts:{}"
    LOGIN_RATE_LIMIT_MAX = 10  # Max attempts per window
    LOGIN_RATE_LIMIT_WINDOW = 300  # 5 minutes in seconds
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP from request, handling proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip
    
    @staticmethod
    def is_rate_limited(request) -> bool:
        """
        Check if the IP address has exceeded the login rate limit.
        Returns True if rate limited, False otherwise.
        """
        ip = SecurityService.get_client_ip(request)
        cache_key = SecurityService.LOGIN_RATE_LIMIT_KEY.format(ip)
        
        attempts = cache.get(cache_key, 0)
        if attempts >= SecurityService.LOGIN_RATE_LIMIT_MAX:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return True
        return False
    
    @staticmethod
    def record_login_attempt(request):
        """Increment the login attempt counter for this IP."""
        ip = SecurityService.get_client_ip(request)
        cache_key = SecurityService.LOGIN_RATE_LIMIT_KEY.format(ip)
        
        attempts = cache.get(cache_key, 0)
        cache.set(cache_key, attempts + 1, SecurityService.LOGIN_RATE_LIMIT_WINDOW)
    
    @staticmethod
    def log_activity(user: User, action: str, request, details: dict = None):
        """Log a user activity with IP and user agent."""
        UserActivity.objects.create(
            user=user,
            action=action,
            ip_address=SecurityService.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            details=details or {}
        )
    
    @staticmethod
    def handle_successful_login(user: User, request):
        """Handle post-login cleanup and logging."""
        user.reset_failed_attempts()
        SecurityService.log_activity(user, 'login', request)
        logger.info(f"Successful login for user {user.email} from {SecurityService.get_client_ip(request)}")
    
    @staticmethod
    def handle_failed_login(user: User, request):
        """Handle failed login attempt - increment counter and potentially lock."""
        is_locked = user.record_failed_attempt()
        SecurityService.log_activity(user, 'failed_login', request, {
            'attempts': user.failed_login_attempts
        })
        
        if is_locked:
            SecurityService.log_activity(user, 'account_locked', request, {
                'locked_until': user.locked_until.isoformat()
            })
            logger.warning(f"Account locked for user {user.email} after {user.failed_login_attempts} failed attempts")
        
        return is_locked
    
    @staticmethod
    def check_transaction_limit(user: User, amount: Decimal) -> tuple[bool, str]:
        """
        Check if a transaction exceeds the user's daily limit.
        Returns (is_allowed, error_message).
        """
        today = date.today()
        
        # Reset daily total if it's a new day
        if user.daily_limit_reset_date != today:
            user.daily_transaction_total = Decimal('0.00')
            user.daily_limit_reset_date = today
            user.save(update_fields=['daily_transaction_total', 'daily_limit_reset_date'])
        
        # Check if this transaction would exceed the limit
        projected_total = user.daily_transaction_total + amount
        if projected_total > user.daily_transaction_limit:
            remaining = user.daily_transaction_limit - user.daily_transaction_total
            return False, f"Transaction exceeds daily limit. Remaining: {remaining}"
        
        return True, ""
    
    @staticmethod
    def record_transaction(user: User, amount: Decimal):
        """Record a transaction against the user's daily limit."""
        today = date.today()
        
        if user.daily_limit_reset_date != today:
            user.daily_transaction_total = amount
            user.daily_limit_reset_date = today
        else:
            user.daily_transaction_total += amount
        
        user.save(update_fields=['daily_transaction_total', 'daily_limit_reset_date'])


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength for banking application.
    Returns (is_valid, list_of_errors).
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")
    
    special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
    if not any(c in special_chars for c in password):
        errors.append("Password must contain at least one special character (!@#$%^&*...)")
    
    return len(errors) == 0, errors
