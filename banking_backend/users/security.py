"""Security services for Coastal Banking Application.

This module provides security-related utilities including:
- Login attempt tracking and account lockout
- Rate limiting helpers
- Transaction limit enforcement
- IP address logging
"""

import logging
from datetime import date
from decimal import Decimal

from django.core.cache import cache

from .models import User, UserActivity

logger = logging.getLogger(__name__)


class SecurityService:
    """Service class for security-related operations."""

    # Rate limiting settings
    LOGIN_RATE_LIMIT_KEY = "login_attempts:{}"
    LOGIN_RATE_LIMIT_MAX = 10  # Max attempts per window
    LOGIN_RATE_LIMIT_WINDOW = 300  # 5 minutes in seconds

    @staticmethod
    def get_client_ip(request):
        """Extract client IP from request, handling proxies."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "0.0.0.0")
        return ip

    @staticmethod
    def is_rate_limited(request) -> bool:
        """Check if the IP address has exceeded the login rate limit.
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
    def get_location_info(ip):
        """Get location info from IP address using a public API.
        Fails gracefully if API is unreachable or rate limited.
        """
        if ip in ["127.0.0.1", "localhost", "0.0.0.0"]:
            return "Localhost"

        try:
            import requests

            # Using ip-api.com (free for non-commercial use, no key required)
            # Timeout set to 2 seconds to avoid blocking login flow
            response = requests.get(f"http://ip-api.com/json/{ip}", timeout=2)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    city = data.get("city", "")
                    country = data.get("country", "")
                    return f"{city}, {country}"
        except Exception as e:
            logger.warning(f"Failed to resolve location for IP {ip}: {e!s}")

        return "Unknown Location"

    @staticmethod
    def parse_user_agent(ua_string):
        """Parse User-Agent string to get device, OS, and browser info."""
        try:
            from user_agents import parse

            user_agent = parse(ua_string)

            device_family = user_agent.device.family
            device_brand = user_agent.device.brand
            device_model = user_agent.device.model

            os_family = user_agent.os.family
            os_version = user_agent.os.version_string

            browser_family = user_agent.browser.family

            # Construct a friendly device name
            if device_brand and device_model:
                device_name = f"{device_brand} {device_model}"
            elif device_family != "Other":
                device_name = device_family
            else:
                device_name = "Unknown Device"

            return {
                "device": device_name,
                "os": f"{os_family} {os_version}".strip(),
                "browser": browser_family,
                "is_mobile": user_agent.is_mobile,
                "is_tablet": user_agent.is_tablet,
                "is_pc": user_agent.is_pc,
                "is_bot": user_agent.is_bot,
            }
        except ImportError:
            logger.error("user_agents library not installed")
            return {}
        except Exception as e:
            logger.error(f"Error parsing user agent: {e!s}")
            return {}

    @staticmethod
    def log_activity(user: User, action: str, request, details: dict = None):
        """Log a user activity with comprehensive device and location info."""
        ip = SecurityService.get_client_ip(request)
        ua_string = request.META.get("HTTP_USER_AGENT", "")

        # Enrich details with device and location info
        activity_details = details or {}

        # Parse Device Info
        device_info = SecurityService.parse_user_agent(ua_string)
        activity_details.update(device_info)

        # Get Location (only for meaningful actions like login/failed_login to verify security)
        if action in ["login", "failed_login", "account_locked"]:
            activity_details["location"] = SecurityService.get_location_info(ip)

        UserActivity.objects.create(
            user=user, action=action, ip_address=ip, user_agent=ua_string[:500], details=activity_details
        )

    @staticmethod
    def handle_successful_login(user: User, request):
        """Handle post-login cleanup and logging."""
        user.reset_failed_attempts()
        SecurityService.log_activity(user, "login", request)
        logger.info(f"Successful login for user {user.email} from {SecurityService.get_client_ip(request)}")

    @staticmethod
    def handle_failed_login(user: User, request):
        """Handle failed login attempt - increment counter and potentially lock."""
        is_locked = user.record_failed_attempt()
        SecurityService.log_activity(user, "failed_login", request, {"attempts": user.failed_login_attempts})

        if is_locked:
            SecurityService.log_activity(
                user, "account_locked", request, {"locked_until": user.locked_until.isoformat()}
            )
            logger.warning(f"Account locked for user {user.email} after {user.failed_login_attempts} failed attempts")

        return is_locked

    @staticmethod
    def check_transaction_limit(user: User, amount: Decimal) -> tuple[bool, str]:
        """Check if a transaction exceeds the user's daily limit.
        Returns (is_allowed, error_message).
        """
        today = date.today()

        # Reset daily total if it's a new day
        if user.daily_limit_reset_date != today:
            user.daily_transaction_total = Decimal("0.00")
            user.daily_limit_reset_date = today
            user.save(update_fields=["daily_transaction_total", "daily_limit_reset_date"])

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

        user.save(update_fields=["daily_transaction_total", "daily_limit_reset_date"])


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Validate password strength for banking application.
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
