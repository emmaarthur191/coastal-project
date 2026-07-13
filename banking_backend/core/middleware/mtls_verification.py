"""Mutual TLS (mTLS) Foundation Middleware for Coastal Banking.

Provides a 'fail-closed' mechanism for internal staff endpoints, requiring
a verified client certificate passed via a trusted reverse proxy.
"""

import ipaddress
import logging
from django.core.exceptions import PermissionDenied
from django.conf import settings

logger = logging.getLogger(__name__)

# RFC 1918 private networks (Render internal health checks, load balancers)
_PRIVATE_NETWORKS = (
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
)


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

    def _is_private_ip(self, ip_str):
        """Check if an IP address belongs to a private/internal network."""
        try:
            addr = ipaddress.ip_address(ip_str)
            return any(addr in net for net in _PRIVATE_NETWORKS)
        except (ValueError, TypeError):
            return False

    def __call__(self, request):
        # 1. Check if path requires mTLS
        if any(request.path.startswith(path) for path in self.MTLS_REQUIRED_PATHS):
            # Exempt OPTIONS requests (CORS preflight)
            if request.method == "OPTIONS":
                return self.get_response(request)

            # 2. Allow skipping mTLS in local development or testing ONLY if explicitly configured
            if (settings.DEBUG or getattr(settings, "TESTING", False)) and getattr(settings, "SKIP_MTLS_IN_DEV", False):
                return self.get_response(request)

            # 3. Bypass mTLS for internal platform health checks (Render, load balancers)
            #    These originate from private RFC 1918 IPs that cannot be spoofed externally.
            client_ip = self._get_client_ip(request)
            if self._is_private_ip(client_ip):
                logger.debug(
                    f"mTLS BYPASS: Internal health check from {client_ip} on {request.path}"
                )
                return self.get_response(request)

            # 4. Verify that the request came authentically from the trusted proxy (Cloudflare)
            # This mitigates direct origin header-spoofing bypasses.
            if not getattr(request, "is_authenticated_origin", False):
                logger.warning(
                    f"mTLS REJECTION: Path {request.path} accessed directly bypassing Cloudflare. IP: {client_ip}"
                )
                raise PermissionDenied("Direct origin access is forbidden.")

            # 5. Verify mTLS header from Cloudflare (or fallback)
            verify_status = request.META.get(self.CF_MTLS_HEADER) or request.META.get(self.LEGACY_MTLS_HEADER)
            
            if verify_status != self.MTLS_SUCCESS_VALUE:
                logger.warning(
                    f"mTLS REJECTION: Path {request.path} accessed without valid "
                    f"client certificate. Status: {verify_status}. IP: {client_ip}"
                )
                
                # Fail-closed for staff endpoints
                raise PermissionDenied(
                    "Mutual TLS (mTLS) Required. Valid client certificate not found."
                )

        return self.get_response(request)

    def _get_client_ip(self, request):
        from users.security import SecurityService
        return SecurityService.get_client_ip(request)
