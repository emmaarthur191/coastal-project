from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from core.utils.field_encryption import hash_field

class DualAuthBackend(ModelBackend):
    """
    Custom authentication backend for Coastal Banking.
    Allows users to authenticate using either their email address OR their phone number.
    Improves mobile-first onboarding flexibility while maintaining Zero-Plaintext security.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        
        if not username:
            return None

        user = None
        # 1. Attempt to find the user by email
        try:
            user = UserModel.objects.get(email=username)
        except UserModel.DoesNotExist:
            # 2. Attempt to find the user by phone number hash (PII Security)
            # We clean the input just in case it contains common separators
            clean_phone = str(username).replace(" ", "").replace("+", "").replace("-", "")
            if clean_phone.isdigit():
                 try:
                     phone_hash = hash_field(clean_phone)
                     user = UserModel.objects.get(phone_number_hash=phone_hash)
                 except (UserModel.DoesNotExist, UserModel.MultipleObjectsReturned):
                     user = None

            # 3. Fallback to standard username search if still not found
            if not user:
                try:
                    user = UserModel.objects.get(username=username)
                except UserModel.DoesNotExist:
                    # Run the password hasher once to prevent timing attacks
                    UserModel().set_password(password)
                    return None
        
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
