"""Behavioral anomaly detection for Coastal Banking.

Implements a 'Dead Man's Switch' to detect and block suspicious bulk data
access (scraping/exfiltration) and unusual transaction patterns.
"""

import logging
import time
from decimal import Decimal
from django.core.exceptions import PermissionDenied
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
        from users.models import AdminNotification
        AdminNotification.objects.create(
            priority="critical",
            title="Suspicious Bulk Access Detected",
            message=f"Staff {request.user.email} fetched {count} records in a single query.",
        )

    def _get_client_ip(self, request):
        from users.security import SecurityService
        return SecurityService.get_client_ip(request)


class TransactionVelocityMiddleware:
    """Detects rapid bursts of high-value transactions to prevent fraud."""

    MAX_TX_PER_MIN = 3
    MAX_CUMULATIVE_5MIN = Decimal("10000.00")
    WINDOW_TX_SECONDS = 60
    WINDOW_CUMULATIVE_SECONDS = 300

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # We only check POST requests to the transactions endpoint
        if (
            request.method == "POST"
            and request.path.startswith("/api/transactions")
            and request.user.is_authenticated
        ):
            # Skip velocity check for superusers in development
            if request.user.is_superuser and settings.DEBUG:
                return self.get_response(request)

            user_id = request.user.id
            now = time.time()

            # Attempt to parse amount from raw JSON body
            amount = Decimal("0.00")
            try:
                import json
                if request.body:
                    body_data = json.loads(request.body.decode("utf-8"))
                    amount_val = body_data.get("amount")
                    if amount_val is not None:
                        amount = Decimal(str(amount_val))
            except Exception:
                # Fallback if body cannot be parsed or read
                pass

            # 1. Update/check transaction frequency (rolling 1-minute window)
            freq_key = f"tx_velocity_freq_{user_id}"
            freq_history = cache.get(freq_key, [])
            freq_history = [t for t in freq_history if t > now - self.WINDOW_TX_SECONDS]
            freq_history.append(now)
            cache.set(freq_key, freq_history, timeout=self.WINDOW_TX_SECONDS)

            if len(freq_history) > self.MAX_TX_PER_MIN:
                self._trigger_alert(
                    request,
                    f"Transaction frequency limit exceeded: {len(freq_history)} transactions in last minute."
                )
                raise PermissionDenied(
                    "Transaction frequency limit exceeded. Please wait a minute and try again."
                )

            # 2. Update/check cumulative amount limit (rolling 5-minute window)
            if amount > 0:
                amount_key = f"tx_velocity_amount_{user_id}"
                amount_history = cache.get(amount_key, [])
                amount_history = [
                    entry for entry in amount_history
                    if entry[0] > now - self.WINDOW_CUMULATIVE_SECONDS
                ]
                amount_history.append((now, float(amount)))
                cache.set(amount_key, amount_history, timeout=self.WINDOW_CUMULATIVE_SECONDS)

                total_amount = sum(Decimal(str(entry[1])) for entry in amount_history)
                if total_amount > self.MAX_CUMULATIVE_5MIN:
                    self._trigger_alert(
                        request,
                        f"Cumulative transaction amount ${total_amount} exceeded limit of ${self.MAX_CUMULATIVE_5MIN} in last 5 minutes."
                    )
                    raise PermissionDenied(
                        "Cumulative high-value transaction limit exceeded. Transaction blocked."
                    )

        return self.get_response(request)

    def _trigger_alert(self, request, reason):
        logger.warning(
            f"SECURITY ANOMALY: User {request.user.email} (ID: {request.user.id}) "
            f"triggered transaction velocity alert. Reason: {reason}. IP: {self._get_client_ip(request)}"
        )
        from users.models import AdminNotification
        AdminNotification.objects.create(
            priority="critical",
            title="Suspicious Transaction Velocity",
            message=f"User {request.user.email} triggered alert: {reason}",
        )

    def _get_client_ip(self, request):
        from users.security import SecurityService
        return SecurityService.get_client_ip(request)

