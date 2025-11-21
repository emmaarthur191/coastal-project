import json
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from typing import Dict, Any, List, Optional
import structlog
from .models import FraudAlert
from .redis_rule_engine import redis_rule_engine
from .logging_system import distributed_logger

logger = structlog.get_logger(__name__)


class FraudAlertConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time fraud alerts and rule updates.
    Handles client connections for fraud monitoring dashboard.
    """

    async def connect(self):
        """Handle WebSocket connection."""
        self.user = self.scope.get('user')
        self.groups = []

        # Check authentication
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)  # Unauthorized
            return

        # Check permissions
        if not await self._has_fraud_monitoring_permission():
            await self.close(code=4003)  # Forbidden
            return

        # Join fraud alerts group
        await self.channel_layer.group_add(
            'fraud_alerts',
            self.channel_name
        )
        self.groups.append('fraud_alerts')

        # Join user-specific group for personalized alerts
        user_group = f"user_{self.user.id}_alerts"
        await self.channel_layer.group_add(
            user_group,
            self.channel_name
        )
        self.groups.append(user_group)

        await self.accept()

        # Send welcome message with current status
        await self.send_json({
            'type': 'connection_established',
            'user': self.user.username,
            'timestamp': timezone.now().isoformat(),
            'permissions': await self._get_user_permissions()
        })

        # Send recent alerts (last 10)
        recent_alerts = await self._get_recent_alerts(10)
        if recent_alerts:
            await self.send_json({
                'type': 'recent_alerts',
                'alerts': recent_alerts
            })

        logger.info(f"Fraud alert consumer connected: {self.user.username}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave all groups
        for group in self.groups:
            await self.channel_layer.group_discard(
                group,
                self.channel_name
            )

        logger.info(f"Fraud alert consumer disconnected: {self.user.username}, code: {close_code}")

    async def receive_json(self, content):
        """Handle incoming WebSocket messages."""
        message_type = content.get('type', 'unknown')

        try:
            if message_type == 'subscribe_alerts':
                await self._handle_subscribe_alerts(content)
            elif message_type == 'unsubscribe_alerts':
                await self._handle_unsubscribe_alerts(content)
            elif message_type == 'get_alert_details':
                await self._handle_get_alert_details(content)
            elif message_type == 'acknowledge_alert':
                await self._handle_acknowledge_alert(content)
            elif message_type == 'request_rule_status':
                await self._handle_request_rule_status(content)
            else:
                await self.send_json({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                })
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send_json({
                'type': 'error',
                'message': 'Internal server error'
            })

    # Group message handlers
    async def fraud_event(self, event):
        """Handle fraud event broadcasts."""
        await self.send_json({
            'type': 'fraud_event',
            'data': event['event']
        })

    async def rules_updated(self, event):
        """Handle rule update notifications."""
        await self.send_json({
            'type': 'rules_updated',
            'data': {
                'rules_count': event['rules_count'],
                'timestamp': event['timestamp']
            }
        })

    async def alert_created(self, event):
        """Handle new alert notifications."""
        alert_data = event['alert']

        # Check if user should receive this alert based on severity/permissions
        if await self._should_receive_alert(alert_data):
            await self.send_json({
                'type': 'new_alert',
                'alert': alert_data
            })

    async def alert_updated(self, event):
        """Handle alert update notifications."""
        await self.send_json({
            'type': 'alert_updated',
            'alert': event['alert']
        })

    # Message handlers
    async def _handle_subscribe_alerts(self, content):
        """Handle alert subscription requests."""
        severity_levels = content.get('severity_levels', ['high', 'critical'])
        alert_types = content.get('alert_types', ['all'])

        # Create subscription group
        subscription_id = f"subscription_{self.user.id}_{hash(str(content))}"
        await self.channel_layer.group_add(subscription_id, self.channel_name)
        self.groups.append(subscription_id)

        await self.send_json({
            'type': 'subscription_confirmed',
            'subscription_id': subscription_id,
            'severity_levels': severity_levels,
            'alert_types': alert_types
        })

    async def _handle_unsubscribe_alerts(self, content):
        """Handle alert unsubscription requests."""
        subscription_id = content.get('subscription_id')
        if subscription_id and subscription_id in self.groups:
            await self.channel_layer.group_discard(subscription_id, self.channel_name)
            self.groups.remove(subscription_id)

            await self.send_json({
                'type': 'unsubscription_confirmed',
                'subscription_id': subscription_id
            })

    async def _handle_get_alert_details(self, content):
        """Handle requests for detailed alert information."""
        alert_id = content.get('alert_id')
        if not alert_id:
            await self.send_json({
                'type': 'error',
                'message': 'alert_id required'
            })
            return

        alert_details = await self._get_alert_details(alert_id)
        if alert_details:
            await self.send_json({
                'type': 'alert_details',
                'alert': alert_details
            })
        else:
            await self.send_json({
                'type': 'error',
                'message': 'Alert not found'
            })

    async def _handle_acknowledge_alert(self, content):
        """Handle alert acknowledgement."""
        alert_id = content.get('alert_id')
        notes = content.get('notes', '')

        if not alert_id:
            await self.send_json({
                'type': 'error',
                'message': 'alert_id required'
            })
            return

        success = await self._acknowledge_alert(alert_id, notes)
        if success:
            await self.send_json({
                'type': 'alert_acknowledged',
                'alert_id': alert_id
            })
        else:
            await self.send_json({
                'type': 'error',
                'message': 'Failed to acknowledge alert'
            })

    async def _handle_request_rule_status(self, content):
        """Handle requests for current rule engine status."""
        rule_stats = redis_rule_engine.get_rule_statistics()
        log_stats = distributed_logger.get_log_statistics()

        await self.send_json({
            'type': 'rule_status',
            'rule_statistics': rule_stats,
            'log_statistics': log_stats,
            'timestamp': timezone.now().isoformat()
        })

    # Helper methods
    @database_sync_to_async
    def _has_fraud_monitoring_permission(self) -> bool:
        """Check if user has permission to monitor fraud alerts."""
        return self.user.has_perm('fraud_detection.can_monitor_alerts')

    @database_sync_to_async
    def _get_user_permissions(self) -> List[str]:
        """Get user's fraud monitoring permissions."""
        permissions = []
        if self.user.has_perm('fraud_detection.can_monitor_alerts'):
            permissions.append('monitor_alerts')
        if self.user.has_perm('fraud_detection.can_manage_rules'):
            permissions.append('manage_rules')
        if self.user.has_perm('fraud_detection.can_rollback_audit'):
            permissions.append('rollback_audit')
        return permissions

    @database_sync_to_async
    def _get_recent_alerts(self, limit: int) -> List[Dict[str, Any]]:
        """Get recent fraud alerts."""
        alerts = FraudAlert.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(hours=24)
        ).order_by('-created_at')[:limit]

        return [{
            'id': str(alert.id),
            'alert_type': alert.alert_type,
            'priority': alert.priority,
            'title': alert.title,
            'description': alert.description[:100] + '...' if len(alert.description) > 100 else alert.description,
            'fraud_score': alert.fraud_score,
            'status': alert.status,
            'created_at': alert.created_at.isoformat(),
            'transaction_id': str(alert.transaction.id) if alert.transaction else None
        } for alert in alerts]

    @database_sync_to_async
    def _get_alert_details(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific alert."""
        try:
            alert = FraudAlert.objects.select_related('transaction', 'account', 'user').get(id=alert_id)

            # Check if user can access this alert
            if not self._can_access_alert(alert):
                return None

            return {
                'id': str(alert.id),
                'alert_type': alert.alert_type,
                'priority': alert.priority,
                'severity': alert.risk_level,
                'title': alert.title,
                'description': alert.description,
                'fraud_score': alert.fraud_score,
                'status': alert.status,
                'created_at': alert.created_at.isoformat(),
                'updated_at': alert.updated_at.isoformat(),
                'transaction_data': alert.transaction_data,
                'account_data': alert.account_data,
                'user_data': alert.user_data,
                'rule_details': alert.rule_details,
                'source_ip': alert.source_ip,
                'location_data': alert.location_data,
                'transaction': {
                    'id': str(alert.transaction.id),
                    'type': alert.transaction.type,
                    'amount': float(alert.transaction.amount),
                    'timestamp': alert.transaction.timestamp.isoformat()
                } if alert.transaction else None,
                'account': {
                    'id': str(alert.account.id),
                    'type': alert.account.type,
                    'balance': float(alert.account.balance)
                } if alert.account else None
            }
        except FraudAlert.DoesNotExist:
            return None

    def _can_access_alert(self, alert: FraudAlert) -> bool:
        """Check if user can access this alert."""
        # Basic permission check
        if not self.user.has_perm('fraud_detection.can_monitor_alerts'):
            return False

        # Additional business logic (e.g., branch restrictions)
        # For now, allow access to all alerts for authorized users
        return True

    @database_sync_to_async
    def _acknowledge_alert(self, alert_id: str, notes: str) -> bool:
        """Acknowledge an alert."""
        try:
            alert = FraudAlert.objects.get(id=alert_id)

            # Check permissions
            if not self.user.has_perm('fraud_detection.can_resolve_alerts'):
                return False

            # Update alert
            alert.status = 'acknowledged'
            alert.resolved_by = self.user
            alert.resolution_notes = notes
            alert.save()

            # Log acknowledgement
            distributed_logger.log_fraud_event(
                'alert_acknowledged',
                f"alert_{alert_id}",
                str(alert.transaction.id) if alert.transaction else "unknown",
                str(alert.user.id) if alert.user else "unknown",
                {
                    'alert_id': alert_id,
                    'acknowledged_by': self.user.username,
                    'notes': notes
                },
                'info'
            )

            return True
        except FraudAlert.DoesNotExist:
            return False

    @database_sync_to_async
    def _should_receive_alert(self, alert_data: Dict[str, Any]) -> bool:
        """Determine if user should receive this alert."""
        alert_priority = alert_data.get('priority', 'low')

        # High and critical alerts go to all monitoring users
        if alert_priority in ['high', 'critical']:
            return True

        # Medium alerts go to users with medium alert permissions
        if alert_priority == 'medium' and self.user.has_perm('fraud_detection.can_view_medium_alerts'):
            return True

        # Low alerts only for users with explicit low alert permissions
        if alert_priority == 'low' and self.user.has_perm('fraud_detection.can_view_low_alerts'):
            return True

        return False


class RuleManagementConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for real-time rule management.
    Handles rule updates, testing, and deployment notifications.
    """

    async def connect(self):
        """Handle WebSocket connection for rule management."""
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        if not self.user.has_perm('fraud_detection.can_manage_rules'):
            await self.close(code=4003)
            return

        # Join rule management group
        await self.channel_layer.group_add(
            'rule_management',
            self.channel_name
        )

        await self.accept()

        await self.send_json({
            'type': 'rule_management_connected',
            'user': self.user.username,
            'timestamp': timezone.now().isoformat()
        })

        logger.info(f"Rule management consumer connected: {self.user.username}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(
            'rule_management',
            self.channel_name
        )

        logger.info(f"Rule management consumer disconnected: {self.user.username}")

    async def receive_json(self, content):
        """Handle incoming rule management messages."""
        message_type = content.get('type', 'unknown')

        try:
            if message_type == 'reload_rules':
                await self._handle_reload_rules(content)
            elif message_type == 'test_rule':
                await self._handle_test_rule(content)
            elif message_type == 'get_rule_stats':
                await self._handle_get_rule_stats(content)
            else:
                await self.send_json({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                })
        except Exception as e:
            logger.error(f"Error handling rule management message: {e}")
            await self.send_json({
                'type': 'error',
                'message': 'Internal server error'
            })

    async def rules_updated(self, event):
        """Handle rule update notifications."""
        await self.send_json({
            'type': 'rules_updated',
            'data': event
        })

    async def rule_test_result(self, event):
        """Handle rule test result notifications."""
        await self.send_json({
            'type': 'rule_test_result',
            'data': event
        })

    async def _handle_reload_rules(self, content):
        """Handle rule reload requests."""
        force_reload = content.get('force', False)

        try:
            success = redis_rule_engine.reload_rules()

            await self.send_json({
                'type': 'rules_reloaded',
                'success': success,
                'force_reload': force_reload,
                'timestamp': timezone.now().isoformat()
            })

            if success:
                # Broadcast to all fraud alert consumers
                await self.channel_layer.group_send(
                    'fraud_alerts',
                    {
                        'type': 'rules_updated',
                        'rules_count': len(redis_rule_engine.get_active_rules()),
                        'timestamp': timezone.now().isoformat(),
                        'triggered_by': self.user.username
                    }
                )

        except Exception as e:
            logger.error(f"Failed to reload rules: {e}")
            await self.send_json({
                'type': 'error',
                'message': 'Failed to reload rules'
            })

    async def _handle_test_rule(self, content):
        """Handle rule testing requests."""
        rule_data = content.get('rule')
        test_data = content.get('test_data')

        if not rule_data or not test_data:
            await self.send_json({
                'type': 'error',
                'message': 'rule and test_data required'
            })
            return

        try:
            # Test the rule (this would need implementation)
            test_result = await self._test_rule_logic(rule_data, test_data)

            await self.send_json({
                'type': 'rule_test_completed',
                'result': test_result
            })

        except Exception as e:
            logger.error(f"Failed to test rule: {e}")
            await self.send_json({
                'type': 'error',
                'message': 'Failed to test rule'
            })

    async def _handle_get_rule_stats(self, content):
        """Handle requests for rule statistics."""
        stats = redis_rule_engine.get_rule_statistics()

        await self.send_json({
            'type': 'rule_statistics',
            'statistics': stats,
            'timestamp': timezone.now().isoformat()
        })

    @database_sync_to_async
    def _test_rule_logic(self, rule_data: Dict[str, Any], test_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test rule logic against test data."""
        # This is a simplified implementation
        # In production, this would safely test the rule without affecting live data

        correlation_id = f"test_{timezone.now().timestamp()}"

        is_fraudulent, score, triggered_rules = redis_rule_engine.evaluate_rules(
            test_data, correlation_id
        )

        return {
            'is_fraudulent': is_fraudulent,
            'score': score,
            'triggered_rules': triggered_rules,
            'correlation_id': correlation_id,
            'test_timestamp': timezone.now().isoformat()
        }