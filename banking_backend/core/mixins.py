import logging
from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from rest_framework.response import Response

from .models import IdempotencyKey

logger = logging.getLogger(__name__)


class IdempotencyMixin:
    """Mixin to provide idempotency for ViewSet actions.
    Expects 'X-Idempotency-Key' header in the request.
    """

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ["POST", "PATCH", "PUT"]:
            return super().dispatch(request, *args, **kwargs)

        idempotency_key = request.headers.get("X-Idempotency-Key")
        if not idempotency_key:
            return super().dispatch(request, *args, **kwargs)

        user = request.user if request.user.is_authenticated else None

        # Check for existing key
        existing_key = IdempotencyKey.objects.filter(key=idempotency_key, user=user).first()

        if existing_key:
            if existing_key.is_expired():
                existing_key.delete()
            elif existing_key.response_data is not None:
                logger.info(f"Idempotency hit: returning cached response for {idempotency_key}")
                # FIX: Use JsonResponse instead of DRF Response to avoid
                # '.accepted_renderer not set on Response' error
                return JsonResponse(
                    existing_key.response_data,
                    status=existing_key.status_code,
                    safe=False,  # Allow non-dict responses (e.g., lists)
                )
            else:
                # Key exists but no response data -> possible concurrent request or previous crash
                return JsonResponse(
                    {"detail": "Request already in progress or failed. Please check status and retry."},
                    status=409,
                )

        # Create new key entry
        # Default expiry: 24 hours
        expires_at = timezone.now() + timedelta(hours=24)
        new_key = IdempotencyKey.objects.create(key=idempotency_key, user=user, expires_at=expires_at)

        response = super().dispatch(request, *args, **kwargs)

        # Save response data for subsequent retries
        try:
            # We only cache successful or terminal responses (not transient errors if possible,
            # but usually we cache all to be safe about the result).
            if hasattr(response, "data"):
                new_key.response_data = response.data
                new_key.status_code = response.status_code
                new_key.save()
        except Exception as e:
            logger.error(f"Failed to save idempotency response for {idempotency_key}: {e}")

        return response
