from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class FrontendAuthBackend(BaseBackend):
    """
    Custom authentication backend for frontend login with role-based access control.

    This backend enforces strict role-based access control, allowing only specific
    user roles to authenticate through the frontend interface.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user with role-based access control.

        Args:
            request: HTTP request object
            username: Username (email) for authentication
            password: Password for authentication

        Returns:
            User object if authentication successful and role allowed, None otherwise
        """
        if not username or not password:
            return None

        try:
            # Get user by email (username field in our custom User model)
            user = User.objects.get(email=username)

            # Check password
            if user.check_password(password):
                # Validate user account status
                if not self._validate_user_account(user):
                    logger.warning(f"Authentication failed: Invalid account status for {username}")
                    return None

                # Check role-based access
                if not self._validate_role_access(user):
                    logger.warning(f"Authentication failed: Insufficient privileges for {username} (role: {user.role})")
                    return None

                logger.info(f"Authentication successful for {username} (role: {user.role})")
                return user
            else:
                logger.warning(f"Authentication failed: Invalid password for {username}")
                return None

        except User.DoesNotExist:
            logger.warning(f"Authentication failed: User {username} does not exist")
            return None
        except Exception as e:
            logger.error(f"Authentication error for {username}: {str(e)}")
            return None

    def get_user(self, user_id):
        """
        Get user by ID for session management.

        Args:
            user_id: User ID

        Returns:
            User object or None
        """
        try:
            user = User.objects.get(pk=user_id)
            if self._validate_user_account(user):
                return user
            return None
        except User.DoesNotExist:
            return None

    def _validate_user_account(self, user):
        """
        Validate user account status.

        Args:
            user: User object

        Returns:
            bool: True if account is valid
        """
        if not user.is_active:
            return False

        # Check for account lockout if implemented
        if hasattr(user, 'is_account_locked') and user.is_account_locked():
            return False

        return True

    def _validate_role_access(self, user):
        """
        Validate role-based access for frontend login.

        Args:
            user: User object

        Returns:
            bool: True if role is allowed
        """
        allowed_roles = ['customer', 'cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']

        # Superusers are blocked from frontend login (admin panel only)
        if user.is_superuser:
            return False

        return user.role in allowed_roles