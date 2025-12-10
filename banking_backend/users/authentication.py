
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Try standard header authentication first
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)
            
        # If no header, check for cookie
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except exceptions.AuthenticationFailed:
            # If cookie token is invalid, we return None to let other auth classes try
            # or allow unauthenticated access (if AllowAny)
            return None
