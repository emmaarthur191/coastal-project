"""Fraud-related services for Coastal Banking.

Handles fraud alert creation and resolution.
"""

import logging

from django.utils import timezone

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from core.models.fraud import FraudAlert
from core.serializers.fraud import FraudAlertSerializer

logger = logging.getLogger(__name__)


class FraudAlertService:
    """Service class for fraud alert operations."""

    @staticmethod
    def create_alert(user, message: str, severity: str = "medium") -> FraudAlert:
        """Create a new fraud alert and broadcast it via WebSocket."""
        alert = FraudAlert.objects.create(user=user, message=message, severity=severity)
        logger.warning(f"Fraud alert created for user {user.email}: {message}")

        # Broadcast the new alert via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"fraud_alerts_{user.id}", {"type": "fraud_alert_update", "alert": FraudAlertSerializer(alert).data}
        )
        return alert

    @staticmethod
    def resolve_alert(alert: FraudAlert) -> FraudAlert:
        """Resolve a fraud alert."""
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.save(update_fields=["is_resolved", "resolved_at"])
        logger.info(f"Fraud alert {alert.id} resolved.")
        return alert
