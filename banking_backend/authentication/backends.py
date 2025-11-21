from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class FrontendAuthBackend(ModelBackend):
    """
    Custom authentication backend that blocks superusers from frontend login
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # First, authenticate the user normally using the parent class
        user = super().authenticate(request, username=username, password=password, **kwargs)

        # If authentication failed, return None
        if user is None:
            return None

        # If the user is a superuser, block frontend login
        if user.is_superuser:
            return None

        # Return the user for regular users
        return user