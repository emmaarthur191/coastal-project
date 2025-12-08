from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class EmailAuthenticationBackend(BaseBackend):
    """
    Authentication backend that allows authentication using email for all valid users.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate a user using email and password for all valid user accounts.
        """
        if username is None or password is None:
            return None

        try:
            # Find user by email (case-insensitive)
            user = User.objects.get(email__iexact=username, is_active=True)
        except User.DoesNotExist:
            # Log the failed attempt
            logger.warning(f"Login attempt for non-existent user: {username}")
            return None

        # Check password using Django's password hashing
        if user.check_password(password):
            logger.info(f"Successful login for user: {username}")
            return user

        # Log failed password attempt
        logger.warning(f"Failed password attempt for user: {username}")
        return None

    def get_user(self, user_id):
        """
        Get user by ID.
        """
        try:
            return User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist:
            return None

