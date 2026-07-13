import logging
from django.core.exceptions import PermissionDenied
from django.conf import settings

logger = logging.getLogger(__name__)

class OriginVerificationMiddleware:
    """Verifies that requests originate from a trusted proxy (e.g. Cloudflare)

    by checking a high-entropy secret header.
    """
    EXEMPT_PATHS = [
        "/api/health/",
        "/api/health/simple/",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Exempt OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return self.get_response(request)

        # Allow health checks and root path to bypass origin secret verification
        if request.path in self.EXEMPT_PATHS or request.path == "/":
            return self.get_response(request)

        secret = getattr(settings, "ORIGIN_VERIFICATION_SECRET", None)
        if secret:
            header_val = request.META.get("HTTP_X_ORIGIN_VERIFICATION_SECRET")
            import secrets
            if not secrets.compare_digest(header_val or "", secret):
                logger.warning(
                    f"Direct origin access attempt rejected. Header present: {header_val is not None}. IP: {self._get_client_ip(request)}"
                )
                raise PermissionDenied("Direct origin access is forbidden.")
        
        # Set a flag to verify that this request came through the trusted origin proxy
        request.is_authenticated_origin = True
        return self.get_response(request)

    def _get_client_ip(self, request):
        # Fallback helper to get IP for logging if needed
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
