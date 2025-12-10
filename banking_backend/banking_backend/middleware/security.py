"""
Security middleware for enhanced banking application security.
Implements security headers, CSRF protection, and session security.
"""

import logging
from django.http import HttpResponseForbidden
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware that adds comprehensive security headers to all responses.
    Implements OWASP security headers for banking application.
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # Security headers configuration
        self.security_headers = {
            # Prevent clickjacking
            'X-Frame-Options': 'DENY',

            # Prevent MIME type sniffing
            'X-Content-Type-Options': 'nosniff',

            # Referrer policy for banking data
            'Referrer-Policy': 'strict-origin-when-cross-origin',

            # Cross-origin policies
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',

            # Prevent XSS
            'X-XSS-Protection': '1; mode=block',

            # Permissions policy for banking app
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

            # Feature policy (legacy support)
            'Feature-Policy': 'geolocation \'none\', microphone \'none\', camera \'none\', payment \'none\'',
        }

        # Environment-specific headers
        if settings.ENVIRONMENT == 'production':
            # HSTS for production
            self.security_headers.update({
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            })

            # CSP for production - Secure with trusted CDNs
            # Note: 'unsafe-inline' is needed for Django admin/dashboard templates that use onclick handlers
            self.security_headers.update({
                'Content-Security-Policy': (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; "
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
                    "font-src 'self' data: https://cdnjs.cloudflare.com; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' https://coastal-backend-bmn3.onrender.com https://coastal-frontend.onrender.com https://cdn.jsdelivr.net; "
                    "frame-src 'none'; "
                    "object-src 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'; "
                    "frame-ancestors 'none';"
                ),
            })
        else:
            # Relaxed CSP for development (still secure, no external CDNs)
            self.security_headers.update({
                'Content-Security-Policy': (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 http://127.0.0.1:3000; "
                    "style-src 'self' 'unsafe-inline'; "
                    "font-src 'self' data:; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' ws: wss: http://localhost:3000 http://127.0.0.1:3000; "
                    "frame-src 'none'; "
                    "object-src 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'; "
                    "frame-ancestors 'none';"
                ),
            })

    def __call__(self, request):
        response = self.get_response(request)

        # Handle async responses (coroutines)
        if hasattr(response, '__await__'):
            # For async responses, we can't modify headers here
            # The headers will be added by the async handler
            return response

        # Skip if response is not a proper HTTP response
        if not hasattr(response, '__setitem__'):
            return response

        # Add security headers to all responses
        for header, value in self.security_headers.items():
            response[header] = value

        return response


class EnhancedCsrfMiddleware(CsrfViewMiddleware):
    """
    Enhanced CSRF middleware with banking-specific protections.
    """

    def process_view(self, request, callback, callback_args, callback_kwargs):
        """
        Check CSRF token for state-changing operations.
        Enhanced to be more strict for financial operations.
        """
        # Skip CSRF check for safe methods
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return None

        # Check if this is a financial operation that requires strict CSRF
        financial_endpoints = [
            '/api/banking/transactions/',
            '/api/banking/transfers/',
            '/api/banking/loans/',
            '/api/banking/cash-advances/',
            '/api/banking/refunds/',
            '/api/transactions/',
        ]

        is_financial_operation = any(endpoint in request.path for endpoint in financial_endpoints)

        if is_financial_operation:
            # For financial operations, always require CSRF token
            return super().process_view(request, callback, callback_args, callback_kwargs)
        else:
            # For other operations, use standard CSRF check
            return super().process_view(request, callback, callback_args, callback_kwargs)

    def _reject(self, request, reason):
        """
        Enhanced rejection with detailed logging for security monitoring.
        """
        logger.warning(
            f"CSRF rejection: {reason}",
            extra={
                'user': getattr(request.user, 'email', 'anonymous'),
                'ip_address': self._get_ip_address(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'endpoint': request.path,
                'method': request.method,
            }
        )

        return HttpResponseForbidden(
            '{"error": "CSRF token validation failed", "message": "Security validation failed. Please refresh the page and try again."}',
            content_type='application/json'
        )

    def _get_ip_address(self, request):
        """Get client IP address for logging."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SessionSecurityMiddleware(MiddlewareMixin):
    """
    Middleware for session security and fixation protection.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add session security headers
        if hasattr(request, 'session'):
            # Regenerate session ID after login/logout for fixation protection
            if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
                # Check if this is a login response (has user data)
                if hasattr(response, 'data') and isinstance(response.data, dict) and 'user' in response.data:
                    request.session.cycle_key()
                    logger.info(
                        f"Session regenerated after authentication for user: {request.user.email}",
                        extra={
                            'user': request.user.email,
                            'ip_address': request.META.get('REMOTE_ADDR'),
                            'session_key': request.session.session_key,
                        }
                    )

        return response


class InputValidationMiddleware(MiddlewareMixin):
    """
    Middleware for comprehensive input validation and sanitization.
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # Dangerous patterns to block
        self.dangerous_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'data:',  # Data URLs (potential XSS)
            r'vbscript:',  # VBScript
            r'on\w+\s*=',  # Event handlers
            r'<\s*iframe[^>]*>.*?</\s*iframe\s*>',  # Iframes
            r'<\s*object[^>]*>.*?</\s*object\s*>',  # Object tags
            r'<\s*embed[^>]*>.*?</\s*embed\s*>',  # Embed tags
        ]

    def __call__(self, request):
        # Validate and sanitize input data
        if request.method in ('POST', 'PUT', 'PATCH'):
            self._validate_input(request)

        response = self.get_response(request)
        return response

    def _validate_input(self, request):
        """
        Validate and sanitize input data.
        """
        # Check POST data
        if hasattr(request, 'POST') and request.POST:
            for key, value in request.POST.items():
                if isinstance(value, str):
                    self._check_dangerous_content(key, value, request)

        # Check request body for JSON data
        # Skip body validation for multipart requests to avoid RawPostDataException
        if getattr(request, 'content_type', '').startswith('multipart/form-data'):
            return

        try:
            # Check if body attribute exists and has content
            if hasattr(request, 'body') and request.body:
                import json
                data = json.loads(request.body)
                self._validate_json_data(data, request)
        except Exception:
            pass  # Not JSON or cannot read body, skip validation

    def _check_dangerous_content(self, key, value, request):
        """
        Check for dangerous content in input.
        """
        import re

        for pattern in self.dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
                logger.warning(
                    f"Dangerous content detected in field '{key}'",
                    extra={
                        'user': getattr(request.user, 'email', 'anonymous'),
                        'ip_address': request.META.get('REMOTE_ADDR'),
                        'field': key,
                        'endpoint': request.path,
                        'method': request.method,
                    }
                )
                # In production, you might want to block the request
                # For now, just log and continue

    def _validate_json_data(self, data, request, path=""):
        """
        Recursively validate JSON data structure.
        """
        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{path}.{key}" if path else key
                if isinstance(value, str):
                    self._check_dangerous_content(current_path, value, request)
                elif isinstance(value, (dict, list)):
                    self._validate_json_data(value, request, current_path)
        elif isinstance(data, list):
            for i, item in enumerate(data):
                current_path = f"{path}[{i}]"
                if isinstance(item, str):
                    self._check_dangerous_content(current_path, item, request)
                elif isinstance(item, (dict, list)):
                    self._validate_json_data(item, request, current_path)