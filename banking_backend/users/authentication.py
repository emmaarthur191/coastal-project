from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions

def enforce_csrf(request):
    """
    Enforce CSRF validation for cookie-based authentication.
    """
    check = CSRFCheck(request)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)

class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom Authentication class to authenticate using JWT from cookies.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        
        # 1. Try Header Authentication first (Native SimpleJWT)
        if header is not None:
            raw_token = self.get_raw_token(header)
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
            
        # 2. Try Cookie Authentication
        access_token_cookie = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(access_token_cookie)

        if raw_token is None:
            return None

        # Enforce CSRF for cookie-based authentication (security best practice)
        # Only enforce for unsafe methods (POST, PUT, DELETE, PATCH)
        if request.method not in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
             enforce_csrf(request)

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
