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
            # DEBUG: Log that cookie is missing (helpful for diagnosing cross-site issues)
            # import logging
            # logger = logging.getLogger(__name__)
            # logger.info(f"JWTCookieAuthentication: No cookie found. Cookies keys: {list(request.COOKIES.keys())}")
            return None

        # CSRF enforcement is handled by Django's CsrfViewMiddleware in MIDDLEWARE.
        # Do NOT enforce here - it causes 403 when csrftoken cookie is missing (e.g., first request).
        # The frontend sends X-CSRFToken header which the middleware validates.

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
