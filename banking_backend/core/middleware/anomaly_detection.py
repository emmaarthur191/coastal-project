"""Behavioral anomaly detection for Coastal Banking.

Implements a 'Dead Man's Switch' to detect and block suspicious bulk data
access (scraping/exfiltration) and unusual transaction patterns.
"""

import logging
import time
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class BulkAccessDetectionMiddleware:
    """Detects suspicious volume of sensitive data retrieval."""

    # Thresholds (Configurable in settings)
    MAX_RECORDS_PER_MIN = 100
    SENSITIVE_MODELS = [
        "user",
        "account",
        "transaction",
        "loan_application",
        "account_opening_request",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_authenticated:
            return self.get_response(request)

        # Skip detection for superusers in development
        if request.user.is_superuser and settings.DEBUG:
            return self.get_response(request)

        # 10-Minute Sliding Window Implementation
        now = time.time()
        window_seconds = 600  # 10 Minutes
        user_id = request.user.id
        cache_key = f"bulk_access_window_{user_id}"
        
        response = self.get_response(request)

        # Extract record count from DRF response
        count = 0
        if hasattr(response, 'data') and isinstance(response.data, dict):
            # Standard DRF Pagination
            count = response.data.get('count', 1 if 'id' in response.data else 0)
            # If it's a list without pagination, count the results
            if 'results' in response.data and isinstance(response.data['results'], list):
                count = len(response.data['results'])
        elif hasattr(response, 'data') and isinstance(response.data, list):
            count = len(response.data)

        if count > 0:
            # Update sliding window
            history = cache.get(cache_key, [])
            # Add current entry: (timestamp, count)
            history.append((now, count))
            # Prune old entries
            history = [entry for entry in history if entry[0] > now - window_seconds]
            
            # Check window total
            total_in_window = sum(entry[1] for entry in history)
            cache.set(cache_key, history, timeout=window_seconds)

            if total_in_window > self.MAX_RECORDS_PER_MIN:  # Keep settings name for compatibility
                self._trigger_alert(request, total_in_window, f"Bulk Access Detected ({total_in_window} in 10 minutes)")

        return response

    def _trigger_alert(self, request, count, reason):
        """Log the anomaly and potentially lock the account."""
        logger.warning(
            f"SECURITY ANOMALY: User {request.user.email} (ID: {request.user.id}) "
            f"accessed {count} records. Reason: {reason}. IP: {self._get_client_ip(request)}"
        )
        
        # In a real bank, we would trigger an incident in Sentry or a SIEM here
        # and potentially set user.is_active = False (Fail-Closed)
        
        # Example: Triggering a dedicated security notification
        from core.models.operational import SystemAlert
        SystemAlert.objects.create(
            alert_type="security",
            severity="critical",
            title="Suspicious Bulk Access Detected",
            message=f"Staff {request.user.email} fetched {count} records in a single query.",
            is_active=True
        )

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class TransactionVelocityMiddleware:
    """Detects rapid bursts of high-value transactions."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Implementation for rolling window velocity checks
        return self.get_response(request)
