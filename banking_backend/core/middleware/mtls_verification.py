"""Mutual TLS (mTLS) Foundation Middleware for Coastal Banking.

Provides a 'fail-closed' mechanism for internal staff endpoints, requiring
a verified client certificate passed via a trusted reverse proxy.
"""

import logging
from django.core.exceptions import PermissionDenied
from django.conf import settings

logger = logging.getLogger(__name__)


class MTLSVerificationMiddleware:
    """Verifies client certificates for staff-only endpoints."""

    # Cloudflare mTLS verification header (and legacy/fallback headers)
    CF_MTLS_HEADER = "HTTP_CF_CLIENT_CERT_VERIFIED"
    LEGACY_MTLS_HEADER = "HTTP_X_SSL_CLIENT_VERIFY"
    MTLS_SUCCESS_VALUE = "SUCCESS"
    
    MTLS_REQUIRED_PATHS = [
        "/api/banking/staff-accounts/",
        "/api/performance/system-health/",
        "/api/performance/dashboard-data/",
        "/api/operations/metrics/",
        "/api/audit/dashboard/",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Check if path requires mTLS
        if any(request.path.startswith(path) for path in self.MTLS_REQUIRED_PATHS):
            
            # 2. Allow skipping mTLS in local development or testing ONLY if explicitly configured
            if (settings.DEBUG or getattr(settings, "TESTING", False)) and getattr(settings, "SKIP_MTLS_IN_DEV", False):
                return self.get_response(request)

            # 3. Verify that the request came authentically from the trusted proxy (Cloudflare)
            # This mitigates direct origin header-spoofing bypasses.
            if not getattr(request, "is_authenticated_origin", False):
                logger.warning(
                    f"mTLS REJECTION: Path {request.path} accessed directly bypassing Cloudflare. IP: {self._get_client_ip(request)}"
                )
                raise PermissionDenied("Direct origin access is forbidden.")

            # 4. Verify mTLS header from Cloudflare (or fallback)
            verify_status = request.META.get(self.CF_MTLS_HEADER) or request.META.get(self.LEGACY_MTLS_HEADER)
            
            if verify_status != self.MTLS_SUCCESS_VALUE:
                logger.warning(
                    f"mTLS REJECTION: Path {request.path} accessed without valid "
                    f"client certificate. Status: {verify_status}. IP: {self._get_client_ip(request)}"
                )
                
                # Fail-closed for staff endpoints
                raise PermissionDenied(
                    "Mutual TLS (mTLS) Required. Valid client certificate not found."
                )

        return self.get_response(request)

    def _get_client_ip(self, request):
        from users.security import SecurityService
        return SecurityService.get_client_ip(request)
