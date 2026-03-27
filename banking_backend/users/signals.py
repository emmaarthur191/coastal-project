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


# Thread-local storage for request context in signals
import threading

_thread_locals = threading.local()


def set_current_request(request):
    """Store current request in thread-local storage."""
    _thread_locals.request = request


def get_current_request():
    """Get current request from thread-local storage."""
    return getattr(_thread_locals, "request", None)


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
    Format: CA + 4 sequential digits (e.g., CA0001, CA0002, ...)
    """
    import logging

    logger = logging.getLogger(__name__)

    # Check if this user needs a staff ID (is staff role and doesn't have a staff_number yet)
    if instance.staff_number is None and instance.role in [
        "cashier",
        "mobile_banker",
        "manager",
        "operations_manager",
        "admin",
    ]:
        from django.db import IntegrityError, transaction

        prefix = "CA"
        logger.info(f"Generating staff ID for {instance.email} with prefix {prefix}")

        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                with transaction.atomic():
                    # Find the highest existing staff_number
                    latest_user = sender.objects.select_for_update().order_by("-staff_number").first()

                    new_seq = (latest_user.staff_number + 1) if (latest_user and latest_user.staff_number) else 1

                    # Set the numeric sequence
                    instance.staff_number = new_seq

                    # Format and set the encrypted/hashed ID via property
                    if new_seq > 9999:
                        instance.staff_id = f"{prefix}{new_seq:05d}"
                    else:
                        instance.staff_id = f"{prefix}{new_seq:04d}"

                    # Explicitly save the correct database fields
                    instance.save(update_fields=["staff_number", "staff_id_encrypted", "staff_id_hash"])

                    logger.info(f"Generated staff ID {instance.staff_id} (seq: {new_seq}) for {instance.email}")
                    return

            except IntegrityError:
                logger.warning(f"IntegrityError on staff ID attempt {attempt+1} for {instance.email}")
                if attempt == max_attempts - 1:
                    # Final fallback: use a very large number or just let it fail
                    pass
                continue
            except Exception as e:
                logger.error(f"Failed to generate staff ID for {instance.email}: {e}")
                return
