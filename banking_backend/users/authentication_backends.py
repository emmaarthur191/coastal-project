from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in using their email address.
    This is necessary for legacy users whose 'username' field does not match their email.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        
        try:
            # Attempt to find the user by email
            user = UserModel.objects.get(email=username)
        except UserModel.DoesNotExist:
            # Fallback to standard username search if email doesn't match
            try:
                user = UserModel.objects.get(username=username)
            except UserModel.DoesNotExist:
                # Run the password hasher once to prevent timing attacks
                UserModel().set_password(password)
                return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
