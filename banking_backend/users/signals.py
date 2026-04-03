"""Django signals for automatic activity and audit logging."""

from django.conf import settings
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.db.models.signals import post_save
from django.dispatch import receiver


def get_user_agent(request):
    """Extract user agent from request."""
    if request is None:
        return ""
    return request.META.get("HTTP_USER_AGENT", "")[:500]


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log successful user login."""
    from .models import UserActivity
    from .security import SecurityService

    try:
        UserActivity.objects.create(
            user=user,
            action="login",
            ip_address=SecurityService.get_client_ip(request),
            user_agent=get_user_agent(request),
            details={"method": "login"},
        )
    except Exception:
        pass  # Don't fail authentication if logging fails


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout."""
    from .models import UserActivity
    from .security import SecurityService

    if user and user.is_authenticated:
        try:
            UserActivity.objects.create(
                user=user,
                action="logout",
                ip_address=SecurityService.get_client_ip(request),
                user_agent=get_user_agent(request),
                details={"method": "logout"},
            )
        except Exception:
            pass


@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    """Log failed login attempts."""
    from .models import User, UserActivity
    from .security import SecurityService

    email = credentials.get("email") or credentials.get("username", "")
    try:
        user = User.objects.filter(email=email).first()
        if user:
            UserActivity.objects.create(
                user=user,
                action="failed_login",
                ip_address=SecurityService.get_client_ip(request),
                user_agent=get_user_agent(request),
                details={"attempted_email": email},
            )
    except Exception:
        pass


# ContextVar for request context in signals (Async-safe alternative to threading.local)
import contextvars

_request_ctx = contextvars.ContextVar("current_request", default=None)


def set_current_request(request):
    """Store current request in context-local storage."""
    return _request_ctx.set(request)


def get_current_request():
    """Get current request from context-local storage."""
    return _request_ctx.get()


def get_current_user():
    """Get current user from request."""
    request = get_current_request()
    if request and hasattr(request, "user") and request.user.is_authenticated:
        return request.user
    return None


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def generate_staff_id(sender, instance, created, **kwargs):
    """Generate Staff ID for staff members if they don't have one.

    Uses staff_number (integer) to track the sequence, and the staff_id property
    to handle Zero-Plaintext encryption/hashing.
    Format: CA + 5 sequential digits (e.g., CA00001, CA00002, ...)
    """
    import logging

    logger = logging.getLogger(__name__)

    # Check if this user needs a staff ID (is staff role and doesn't have a staff_number or staff_id yet)
    # We use a broad check for staff roles to ensure all relevant users get an ID
    STAFF_ROLES = ["cashier", "mobile_banker", "manager", "operations_manager", "admin"]

    if (instance.staff_number is None or not instance.staff_id) and instance.role in STAFF_ROLES:
        from core.models.reliability import GlobalSequence

        prefix = "CA"
        logger.info(f"Generating staff ID for {instance.email}")

        # SECURITY: Use GlobalSequence for atomic, row-locked increment
        try:
            # We initialize at 1, but GlobalSequence tracks the 'last_value'
            new_seq = GlobalSequence.get_next_value("staff_id", initial_value=1)

            # Set the numeric sequence
            instance.staff_number = new_seq

            # Format and set the encrypted/hashed ID via property (CA prefix)
            # Use CA00001 format (5 digits)
            instance.staff_id = f"{prefix}{new_seq:05d}"

            # Explicitly save the correct database fields to minimize lock duration
            instance.save(update_fields=["staff_number", "staff_id_encrypted", "staff_id_hash"])

            logger.info(f"Generated staff ID {instance.staff_id} (seq: {new_seq}) for {instance.email}")
        except Exception as e:
            logger.error(f"Failed to generate staff ID for {instance.email}: {e!s}")
