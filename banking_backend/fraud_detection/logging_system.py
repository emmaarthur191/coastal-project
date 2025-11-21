import logging
import uuid
import json
import redis
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import structlog

logger = structlog.get_logger(__name__)


class DistributedLogger:
    """
    Distributed logging system with correlation IDs and Redis aggregation.
    Provides centralized log aggregation and real-time event streaming.
    """

    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_LOG_DB,
            decode_responses=True
        )
        self.channel_layer = get_channel_layer()
        self.log_retention_days = getattr(settings, 'LOG_RETENTION_DAYS', 30)

    def log_fraud_event(self, event_type: str, correlation_id: str,
                       transaction_id: str, user_id: str, data: Dict[str, Any],
                       severity: str = 'info') -> str:
        """
        Log a fraud detection event with correlation tracking.

        Args:
            event_type: Type of fraud event (rule_trigger, alert_created, etc.)
            correlation_id: Unique correlation ID for tracking related events
            transaction_id: Associated transaction ID
            user_id: Associated user ID
            data: Event-specific data
            severity: Log severity level

        Returns:
            Log entry ID
        """
        log_entry = {
            'id': str(uuid.uuid4()),
            'timestamp': timezone.now().isoformat(),
            'event_type': event_type,
            'correlation_id': correlation_id,
            'transaction_id': transaction_id,
            'user_id': user_id,
            'severity': severity,
            'data': data,
            'service': 'fraud_detection',
            'version': '1.0'
        }

        # Store in Redis with TTL
        log_key = f"fraud_log:{log_entry['id']}"
        self.redis_client.setex(
            log_key,
            self.log_retention_days * 24 * 3600,  # TTL in seconds
            json.dumps(log_entry)
        )

        # Add to correlation set
        correlation_key = f"correlation:{correlation_id}"
        self.redis_client.sadd(correlation_key, log_entry['id'])
        self.redis_client.expire(correlation_key, self.log_retention_days * 24 * 3600)

        # Add to event type index
        event_key = f"events:{event_type}:{timezone.now().date()}"
        self.redis_client.sadd(event_key, log_entry['id'])
        self.redis_client.expire(event_key, self.log_retention_days * 24 * 3600)

        # Broadcast real-time event
        self._broadcast_event(log_entry)

        # Log to Django logger as well
        log_method = getattr(logger, severity, logger.info)
        log_method(
            f"Fraud event: {event_type}",
            correlation_id=correlation_id,
            transaction_id=transaction_id,
            user_id=user_id,
            extra=log_entry
        )

        return log_entry['id']

    def get_correlation_events(self, correlation_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve all events for a given correlation ID.
        """
        correlation_key = f"correlation:{correlation_id}"
        log_ids = self.redis_client.smembers(correlation_key)

        events = []
        for log_id in log_ids:
            log_key = f"fraud_log:{log_id}"
            log_data = self.redis_client.get(log_key)
            if log_data:
                events.append(json.loads(log_data))

        # Sort by timestamp
        events.sort(key=lambda x: x['timestamp'])
        return events

    def get_events_by_type(self, event_type: str, date: datetime.date = None) -> List[Dict[str, Any]]:
        """
        Retrieve events by type for a specific date.
        """
        if date is None:
            date = timezone.now().date()

        event_key = f"events:{event_type}:{date}"
        log_ids = self.redis_client.smembers(event_key)

        events = []
        for log_id in log_ids:
            log_key = f"fraud_log:{log_id}"
            log_data = self.redis_client.get(log_key)
            if log_data:
                events.append(json.loads(log_data))

        events.sort(key=lambda x: x['timestamp'])
        return events

    def search_logs(self, query: Dict[str, Any], limit: int = 100) -> List[Dict[str, Any]]:
        """
        Search logs based on criteria.
        Note: This is a simplified implementation. In production, consider Elasticsearch.
        """
        # Get all log keys (simplified - in production use Redis search or indexing)
        log_keys = self.redis_client.keys("fraud_log:*")

        results = []
        for key in log_keys[:limit]:  # Limit for performance
            log_data = self.redis_client.get(key)
            if log_data:
                entry = json.loads(log_data)
                if self._matches_query(entry, query):
                    results.append(entry)

        results.sort(key=lambda x: x['timestamp'], reverse=True)
        return results[:limit]

    def _matches_query(self, entry: Dict[str, Any], query: Dict[str, Any]) -> bool:
        """Check if log entry matches search query."""
        for key, value in query.items():
            if key not in entry:
                return False
            if isinstance(value, dict):
                # Handle nested queries
                if not self._matches_query(entry[key], value):
                    return False
            elif entry[key] != value:
                return False
        return True

    def _broadcast_event(self, log_entry: Dict[str, Any]):
        """Broadcast event to WebSocket clients."""
        try:
            async_to_sync(self.channel_layer.group_send)(
                'fraud_alerts',
                {
                    'type': 'fraud_event',
                    'event': log_entry
                }
            )
        except Exception as e:
            logger.error(f"Failed to broadcast fraud event: {e}")

    def get_log_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get logging statistics."""
        stats = {
            'total_logs': 0,
            'events_by_type': {},
            'events_by_severity': {},
            'correlation_count': 0
        }

        # Count logs
        log_keys = self.redis_client.keys("fraud_log:*")
        stats['total_logs'] = len(log_keys)

        # Sample logs for statistics (performance consideration)
        sample_size = min(1000, len(log_keys))
        sampled_keys = log_keys[:sample_size] if log_keys else []

        for key in sampled_keys:
            log_data = self.redis_client.get(key)
            if log_data:
                entry = json.loads(log_data)
                event_type = entry.get('event_type', 'unknown')
                severity = entry.get('severity', 'info')

                stats['events_by_type'][event_type] = stats['events_by_type'].get(event_type, 0) + 1
                stats['events_by_severity'][severity] = stats['events_by_severity'].get(severity, 0) + 1

        # Count correlations
        correlation_keys = self.redis_client.keys("correlation:*")
        stats['correlation_count'] = len(correlation_keys)

        return stats


# Global instance
distributed_logger = DistributedLogger()