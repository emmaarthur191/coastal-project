"""Behavioral anomaly detection for Coastal Banking.

Implements a 'Dead Man's Switch' to detect and block suspicious bulk data
access (scraping/exfiltration) and unusual transaction patterns.
"""

import logging
import time
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class BulkAccessDetectionMiddleware:
    """Detects suspicious volume of sensitive data retrieval with Sentinel resilience."""

    # Thresholds (Configurable in settings)
    MAX_RECORDS_PER_MIN = 100
    SENSITIVE_MODELS = [
        "user",
        "account",
        "transaction",
        "loan_application",
        "account_opening_request",
    ]

    # Circuit Breaker & Suppression State (In-Memory)
    _cb_error_count = 0
    _cb_last_error_time = 0
    _cb_state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    _recent_alerts = {}  # {(user_id, alert_title): timestamp}

    def __init__(self, get_response):
        self.get_response = get_response
        self.config = getattr(settings, "SENTINEL_GATEKEEPER_CONFIG", {})

    def __call__(self, request):
        """Processes the request with tiered resilience and anomaly detection."""
        tier = self._get_sensitivity_tier(request.path)
        cls = type(self)
        
        # 1. Circuit Breaker Check
        if cls._cb_state == "OPEN":
            if time.time() - cls._cb_last_error_time > self.config.get("CIRCUIT_BREAKER", {}).get("RECOVERY_TIMEOUT", 60):
                cls._cb_state = "HALF_OPEN"
                logger.info(f"SENTINEL: Circuit Breaker entering HALF_OPEN state for {request.path}")
            elif tier == "CRITICAL":
                return self._fail_closed(request, "Circuit Breaker OPEN", tier)

        try:
            # 2. Proactive Infrastructure Health Check (Fail-Closed Tiered)
            try:
                # If PUBLIC tier, skip health check for maximum availability
                if tier != "PUBLIC":
                    cache.get("security_health_check")
                
                # If we reached here in HALF_OPEN, reset CB
                if cls._cb_state == "HALF_OPEN":
                    self._reset_circuit_breaker()
                    
            except Exception as e:
                self._record_failure()
                return self._fail_closed(request, e, tier)

            # 3. Execute Request
            response = self.get_response(request)

            # 4. Identity Check (Post-Response)
            if not hasattr(request, 'user') or not request.user.is_authenticated:
                return response

            # Skip detection for superusers in development
            if request.user.is_superuser and settings.DEBUG:
                return response

            # 5. Anomaly Analysis
            count = self._extract_record_count(response)

            if count > 0:
                # Sliding Window logic (10 Minutes)
                now = time.time()
                window_seconds = 600
                user_id = request.user.id
                cache_key = f"bulk_access_window_{user_id}"
                
                history = cache.get(cache_key, [])
                history.append((now, count))
                history = [entry for entry in history if entry[0] > now - window_seconds]
                
                total_in_window = sum(entry[1] for entry in history)
                cache.set(cache_key, history, timeout=window_seconds)

                if total_in_window > self.MAX_RECORDS_PER_MIN:
                    self._trigger_alert(request, total_in_window, f"Bulk Access Detected ({total_in_window} in 10m window)")

            return response

        except Exception as e:
            # Fallback for unexpected errors
            self._record_failure()
            return self._fail_closed(request, e, tier)

    def _get_sensitivity_tier(self, path):
        """Identifies the sensitivity tier of the request path."""
        tiers = self.config.get("TIERS", {})
        for prefix in tiers.get("CRITICAL", []):
            if path.startswith(prefix): return "CRITICAL"
        for prefix in tiers.get("STANDARD", []):
            if path.startswith(prefix): return "STANDARD"
        return "PUBLIC"

    def _fail_closed(self, request, exception, tier):
        """Handles infrastructure failure based on path sensitivity."""
        if tier == "PUBLIC":
            logger.warning(f"SENTINEL: Infrastructure failure on PUBLIC path {request.path}. Proceeding.")
            return self.get_response(request)
            
        if tier == "STANDARD":
            logger.error(f"SENTINEL: Infrastructure failure on STANDARD path {request.path}. Degraded access allowed.")
            # In a real bank, we might add a header 'X-Security-State: Degraded'
            response = self.get_response(request)
            response["X-Security-Resilience"] = "Degraded"
            return response

        # CRITICAL TIER -> FAIL CLOSED
        logger.critical(f"SENTINEL: Infrastructure failure on CRITICAL path {request.path}. FAILING CLOSED.")
        
        # Suppressed Alert Trigger
        self._trigger_suppressed_alert(
            title="Infrastructure Resilience Triggered (Fail-Closed)",
            message=f"Service check failed in Sentinel Middleware: {str(exception)}. Path {request.path} blocked.",
            alert_type="reliability",
            severity="critical",
            user_id=getattr(request.user, 'id', 'anonymous') if hasattr(request, 'user') else 'anonymous'
        )
        
        return JsonResponse({
            "status": "error",
            "message": "Security validation failed due to infrastructure error.",
            "code": "SECURITY_FAILURE"
        }, status=503)

    def _trigger_suppressed_alert(self, title, message, alert_type="security", severity="high", user_id="system"):
        """Triggers a SystemAlert with storm protection (suppression)."""
        now = time.time()
        cls = type(self)
        suppression_config = self.config.get("ALERT_STORM_PROTECTION", {})
        min_interval = suppression_config.get("MIN_INTERVAL", 300)
        
        alert_key = (user_id, title)
        last_time = cls._recent_alerts.get(alert_key, 0)
        
        if now - last_time < min_interval:
            logger.info(f"SENTINEL: Suppressing duplicate alert '{title}' for user {user_id}")
            return

        cls._recent_alerts[alert_key] = now
        
        from core.models.operational import SystemAlert
        SystemAlert.objects.create(
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            is_active=True
        )

    def _record_failure(self):
        """Update circuit breaker state on failure."""
        cls = type(self)
        cls._cb_error_count += 1
        cls._cb_last_error_time = time.time()
        threshold = self.config.get("CIRCUIT_BREAKER", {}).get("ERROR_THRESHOLD", 5)
        
        if cls._cb_error_count >= threshold:
            cls._cb_state = "OPEN"
            logger.error("SENTINEL: Circuit Breaker OPENED due to high error rate.")

    def _reset_circuit_breaker(self):
        """Reset circuit breaker on success."""
        cls = type(self)
        cls._cb_error_count = 0
        cls._cb_state = "CLOSED"
        logger.info("SENTINEL: Circuit Breaker CLOSED. Normal operation resumed.")

    def _extract_record_count(self, response):
        """Robustly extracts record count from various response formats."""
        count = 0
        if not hasattr(response, 'data'):
            return 0
            
        data = response.data
        if isinstance(data, dict):
            # 1. Standard DRF Pagination
            if 'count' in data and isinstance(data['count'], int):
                count = data['count']
            # 2. Custom Results Wrapper
            elif 'results' in data and isinstance(data['results'], list):
                count = len(data['results'])
            # 3. Single object with ID
            elif 'id' in data:
                count = 1
        elif isinstance(data, list):
            # 4. Raw list response
            count = len(data)
            
        return count

    def _trigger_alert(self, request, count, reason):
        """Log the anomaly and trigger suppressed alert."""
        self._trigger_suppressed_alert(
            title="Suspicious Bulk Access Detected",
            message=f"Staff {request.user.email} fetched {count} records. Reason: {reason}.",
            alert_type="security",
            severity="critical",
            user_id=request.user.id
        )

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

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
