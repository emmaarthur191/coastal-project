"""
Django signals for automatic activity and audit logging.
"""
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings


def get_client_ip(request):
    """Extract client IP from request."""
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    """Extract user agent from request."""
    if request is None:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')[:500]


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log successful user login."""
    from .models import UserActivity
    try:
        UserActivity.objects.create(
            user=user,
            action='login',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            details={'method': 'login'}
        )
    except Exception:
        pass  # Don't fail authentication if logging fails


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout."""
    from .models import UserActivity
    if user and user.is_authenticated:
        try:
            UserActivity.objects.create(
                user=user,
                action='logout',
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request),
                details={'method': 'logout'}
            )
        except Exception:
            pass


@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    """Log failed login attempts."""
    from .models import UserActivity, User
    
    email = credentials.get('email') or credentials.get('username', '')
    try:
        user = User.objects.filter(email=email).first()
        if user:
            UserActivity.objects.create(
                user=user,
                action='failed_login',
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request),
                details={'attempted_email': email}
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
    return getattr(_thread_locals, 'request', None)


def get_current_user():
    """Get current user from request."""
    request = get_current_request()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def generate_staff_id(sender, instance, created, **kwargs):
    """Generate Staff ID for staff members if they don't have one.
    
    Uses retry logic to handle race conditions and ensure uniqueness.
    Format: CA-MMYY-NN (e.g., CA-1224-01)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not instance.staff_id and instance.role in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'admin']:
        import datetime
        from django.db import IntegrityError
        from django.db import transaction
        
        now = datetime.datetime.now()
        month = now.strftime('%m')
        year = now.strftime('%y')  # Last 2 digits
        prefix = f"CA-{month}{year}"
        
        logger.info(f"Generating staff ID for {instance.email} with prefix {prefix}")
        
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                with transaction.atomic():
                    # Lock the query to prevent race conditions
                    User = sender
                    latest_user = User.objects.select_for_update().filter(
                        staff_id__startswith=prefix
                    ).order_by('staff_id').last()
                    
                    if latest_user and latest_user.staff_id:
                        try:
                            current_seq = int(latest_user.staff_id.split('-')[-1])
                            new_seq = current_seq + 1
                        except ValueError:
                            new_seq = 1
                    else:
                        new_seq = 1
                    
                    # Ensure sequence doesn't exceed 2 digits, roll to next format if needed
                    if new_seq > 99:
                        # Add extra digit for overflow
                        instance.staff_id = f"{prefix}-{new_seq:03d}"
                    else:
                        instance.staff_id = f"{prefix}-{new_seq:02d}"
                    
                    instance.save(update_fields=['staff_id'])
                    logger.info(f"Generated staff ID {instance.staff_id} for {instance.email}")
                    return  # Success, exit the retry loop
                    
            except IntegrityError:
                # Duplicate key, retry with next sequence
                logger.warning(f"IntegrityError on staff ID attempt {attempt+1} for {instance.email}")
                if attempt == max_attempts - 1:
                    # Last attempt, use UUID fallback
                    import uuid
                    instance.staff_id = f"{prefix}-{uuid.uuid4().hex[:6].upper()}"
                    instance.save(update_fields=['staff_id'])
                    logger.warning(f"Used UUID fallback for staff ID: {instance.staff_id}")
                continue
            except Exception as e:
                logger.error(f"Failed to generate staff ID for {instance.email}: {e}")
                return  # Don't crash user creation

