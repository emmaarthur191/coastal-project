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

    # Configurable in settings
    MTLS_HEADER = "HTTP_X_SSL_CLIENT_VERIFY"
    MTLS_SUCCESS_VALUE = "SUCCESS"
    MTLS_REQUIRED_PATHS = [
        "/api/accounts/summary/",
        "/api/banking/",
        "/api/operations/",
        "/api/reports/",
        "/api/audit/",
        "/api/ml/",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Check if path requires mTLS
        if any(request.path.startswith(path) for path in self.MTLS_REQUIRED_PATHS):
            
            # 2. Allow skipping mTLS in local development ONLY if explicitly configured
            if settings.DEBUG and getattr(settings, "SKIP_MTLS_IN_DEV", False):
                return self.get_response(request)

            # 3. Verify mTLS header from trusted proxy
            verify_status = request.META.get(self.MTLS_HEADER)
            
            if verify_status != self.MTLS_SUCCESS_VALUE:
                logger.warning(
                    f"mTLS REJECTION: Path {request.path} accessed without valid "
                    f"client certificate. Status: {verify_status}. IP: {self._get_client_ip(request)}"
                )
                
                # Purple Team Requirement: Alert on mTLS spoofing or absence
                from core.models.operational import SystemAlert
                SystemAlert.objects.create(
                    alert_type="security",
                    severity="high",
                    title="mTLS Verification Failure",
                    message=f"Unauthorized access attempt to staff endpoint {request.path} without valid client certificate. Status: {verify_status}",
                    metadata={"path": request.path, "status": verify_status, "ip": self._get_client_ip(request)}
                )
                
                # Fail-closed for staff endpoints
                raise PermissionDenied(
                    "Mutual TLS (mTLS) Required. Valid client certificate not found."
                )

        return self.get_response(request)

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
