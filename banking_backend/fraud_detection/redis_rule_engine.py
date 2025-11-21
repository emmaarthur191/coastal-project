import json
import redis
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Callable
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import structlog
from .models import FraudRule, FraudAlert
from .logging_system import distributed_logger

logger = structlog.get_logger(__name__)


class RedisRuleEngine:
    """
    Redis-backed rule engine with hot-reload capabilities and fallback strategies.
    Provides distributed rule storage, real-time updates, and compliance features.
    """

    def __init__(self):
        # Try to connect to Redis
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_RULES_DB,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.redis_available = True
            logger.info("Redis connection established for rule engine")
        except redis.ConnectionError as e:
            logger.warning(f"Redis not available, falling back to database-only mode: {e}")
            self.redis_available = False
            self.redis_client = None

        # Initialize channel layer (may not be available in all contexts)
        try:
            self.channel_layer = get_channel_layer()
        except Exception as e:
            logger.warning(f"Channel layer not available: {e}")
            self.channel_layer = None

        self.rule_cache_key = "fraud_rules:active"
        self.rule_hash_key = "fraud_rules:hash"
        self.fallback_cache_key = "fraud_rules:fallback"
        self.rule_ttl = getattr(settings, 'RULE_CACHE_TTL', 3600)  # 1 hour

        # Load initial rules if Redis is available
        if self.redis_available:
            self._load_rules_to_redis()

    def _load_rules_to_redis(self):
        """Load active rules from database to Redis."""
        if not self.redis_available:
            logger.info("Redis not available, skipping rule loading to cache")
            return

        try:
            active_rules = FraudRule.objects.filter(is_active=True)
            rules_data = {}

            for rule in active_rules:
                rule_data = {
                    'id': rule.id,
                    'name': rule.name,
                    'description': rule.description,
                    'rule_type': rule.rule_type,
                    'conditions': rule.conditions,
                    'actions': rule.actions,
                    'severity': rule.severity,
                    'score': rule.score,
                    'is_active': rule.is_active,
                    'created_at': rule.created_at.isoformat(),
                    'updated_at': rule.updated_at.isoformat(),
                    'version': rule.version,
                    'metadata': rule.metadata or {}
                }
                rules_data[str(rule.id)] = rule_data

            # Store rules in Redis
            self.redis_client.setex(
                self.rule_cache_key,
                self.rule_ttl,
                json.dumps(rules_data)
            )

            # Store hash for change detection
            rules_hash = hashlib.md5(json.dumps(rules_data, sort_keys=True).encode()).hexdigest()
            self.redis_client.setex(self.rule_hash_key, self.rule_ttl, rules_hash)

            # Create fallback snapshot
            self.redis_client.setex(
                self.fallback_cache_key,
                7 * 24 * 3600,  # 7 days
                json.dumps(rules_data)
            )

            logger.info(f"Loaded {len(rules_data)} rules to Redis cache")

        except Exception as e:
            logger.error(f"Failed to load rules to Redis: {e}")
            raise

    def get_active_rules(self) -> Dict[str, Dict[str, Any]]:
        """Get active rules from Redis cache or database fallback."""
        if not self.redis_available:
            return self._get_database_rules()

        try:
            rules_data = self.redis_client.get(self.rule_cache_key)
            if rules_data:
                return json.loads(rules_data)
            else:
                # Try fallback
                return self._get_fallback_rules()
        except Exception as e:
            logger.error(f"Failed to get rules from Redis: {e}")
            return self._get_fallback_rules()

    def _get_database_rules(self) -> Dict[str, Dict[str, Any]]:
        """Get rules directly from database when Redis is unavailable."""
        logger.info("Loading rules directly from database (Redis unavailable)")
        try:
            active_rules = FraudRule.objects.filter(is_active=True)
            rules_data = {}

            for rule in active_rules:
                rule_data = {
                    'id': rule.id,
                    'name': rule.name,
                    'description': rule.description,
                    'rule_type': rule.rule_type,
                    'conditions': rule.conditions,
                    'actions': rule.actions,
                    'severity': rule.severity,
                    'score': rule.score,
                    'is_active': rule.is_active,
                    'created_at': rule.created_at.isoformat(),
                    'updated_at': rule.updated_at.isoformat(),
                    'version': rule.version,
                    'metadata': rule.metadata or {}
                }
                rules_data[str(rule.id)] = rule_data

            logger.info(f"Loaded {len(rules_data)} rules from database")
            return rules_data

        except Exception as e:
            logger.error(f"Failed to load rules from database: {e}")
            return self._get_default_compliance_rules()

    def _get_fallback_rules(self) -> Dict[str, Dict[str, Any]]:
        """Get fallback rules when Redis is unavailable."""
        if not self.redis_available:
            return self._get_database_rules()

        try:
            fallback_data = self.redis_client.get(self.fallback_cache_key)
            if fallback_data:
                logger.warning("Using fallback rules from Redis cache")
                return json.loads(fallback_data)
        except Exception as e:
            logger.error(f"Failed to get fallback rules: {e}")

        # Ultimate fallback: database or default compliance rules
        return self._get_database_rules()

    def _get_default_compliance_rules(self) -> Dict[str, Dict[str, Any]]:
        """Get default banking compliance rules when all else fails."""
        logger.warning("Using default compliance rules - rule service unavailable")

        default_rules = {
            'velocity_check': {
                'id': 'velocity_check',
                'name': 'Transaction Velocity Check',
                'description': 'Check transaction frequency and amounts against velocity limits',
                'rule_type': 'velocity',
                'conditions': {
                    'max_transactions_24h': 10,
                    'max_amount_24h': 10000.00,
                    'max_single_transaction': 5000.00
                },
                'actions': ['alert', 'block'],
                'severity': 'high',
                'score': 50,
                'is_active': True,
                'version': '1.0',
                'metadata': {'compliance': 'PCI DSS', 'category': 'velocity'}
            },
            'amount_threshold': {
                'id': 'amount_threshold',
                'name': 'High Amount Transaction',
                'description': 'Flag transactions above threshold amount',
                'rule_type': 'threshold',
                'conditions': {
                    'threshold_amount': 1000.00,
                    'operator': 'greater_than'
                },
                'actions': ['alert'],
                'severity': 'medium',
                'score': 30,
                'is_active': True,
                'version': '1.0',
                'metadata': {'compliance': 'AML', 'category': 'amount'}
            },
            'geographic_anomaly': {
                'id': 'geographic_anomaly',
                'name': 'Geographic Location Anomaly',
                'description': 'Detect transactions from unusual geographic locations',
                'rule_type': 'geographic',
                'conditions': {
                    'known_countries': ['GH', 'NG', 'KE', 'ZA'],
                    'max_distance_km': 1000
                },
                'actions': ['alert'],
                'severity': 'medium',
                'score': 25,
                'is_active': True,
                'version': '1.0',
                'metadata': {'compliance': 'KYC', 'category': 'location'}
            }
        }
        return default_rules

    def evaluate_rules(self, transaction_data: Dict[str, Any],
                      correlation_id: str) -> Tuple[bool, int, List[Dict[str, Any]]]:
        """
        Evaluate transaction against active rules.

        Returns:
            Tuple of (is_fraudulent, total_score, triggered_rules)
        """
        rules = self.get_active_rules()
        triggered_rules = []
        total_score = 0
        max_severity = 'low'

        for rule_id, rule in rules.items():
            try:
                triggered, score, details = self._evaluate_single_rule(rule, transaction_data)

                if triggered:
                    triggered_rules.append({
                        'rule_id': rule_id,
                        'rule_name': rule['name'],
                        'severity': rule['severity'],
                        'score': score,
                        'details': details,
                        'rule_version': rule.get('version', '1.0')
                    })
                    total_score += score

                    # Track highest severity
                    severity_levels = ['low', 'medium', 'high', 'critical']
                    if severity_levels.index(rule['severity']) > severity_levels.index(max_severity):
                        max_severity = rule['severity']

                    # Log rule trigger
                    distributed_logger.log_fraud_event(
                        'rule_trigger',
                        correlation_id,
                        transaction_data.get('transaction_id', 'unknown'),
                        transaction_data.get('user_id', 'unknown'),
                        {
                            'rule_id': rule_id,
                            'rule_name': rule['name'],
                            'score': score,
                            'severity': rule['severity']
                        },
                        'warning'
                    )

            except Exception as e:
                logger.error(f"Error evaluating rule {rule_id}: {e}")
                continue

        is_fraudulent = total_score >= getattr(settings, 'FRAUD_SCORE_THRESHOLD', 60)

        return is_fraudulent, total_score, triggered_rules

    def _evaluate_single_rule(self, rule: Dict[str, Any],
                            transaction_data: Dict[str, Any]) -> Tuple[bool, int, Dict[str, Any]]:
        """Evaluate a single rule against transaction data."""
        rule_type = rule.get('rule_type')
        conditions = rule.get('conditions', {})
        score = rule.get('score', 0)

        if rule_type == 'velocity':
            return self._evaluate_velocity_rule(conditions, transaction_data, score)
        elif rule_type == 'threshold':
            return self._evaluate_threshold_rule(conditions, transaction_data, score)
        elif rule_type == 'geographic':
            return self._evaluate_geographic_rule(conditions, transaction_data, score)
        elif rule_type == 'pattern':
            return self._evaluate_pattern_rule(conditions, transaction_data, score)
        else:
            # Custom rule evaluation
            return self._evaluate_custom_rule(rule, transaction_data)

    def _evaluate_velocity_rule(self, conditions: Dict[str, Any],
                              transaction_data: Dict[str, Any], score: int) -> Tuple[bool, int, Dict[str, Any]]:
        """Evaluate velocity-based rules."""
        amount = transaction_data.get('amount', 0)
        transactions_24h = transaction_data.get('transactions_24h', 0)
        amount_24h = transaction_data.get('amount_24h', 0)

        violations = []

        if transactions_24h >= conditions.get('max_transactions_24h', 10):
            violations.append('transaction_count_exceeded')

        if amount_24h + amount >= conditions.get('max_amount_24h', 10000):
            violations.append('amount_limit_exceeded')

        if amount >= conditions.get('max_single_transaction', 5000):
            violations.append('single_transaction_limit_exceeded')

        triggered = len(violations) > 0

        return triggered, score if triggered else 0, {
            'violations': violations,
            'current_count': transactions_24h,
            'current_amount': amount_24h,
            'transaction_amount': amount
        }

    def _evaluate_threshold_rule(self, conditions: Dict[str, Any],
                               transaction_data: Dict[str, Any], score: int) -> Tuple[bool, int, Dict[str, Any]]:
        """Evaluate threshold-based rules."""
        amount = transaction_data.get('amount', 0)
        threshold = conditions.get('threshold_amount', 1000)
        operator = conditions.get('operator', 'greater_than')

        if operator == 'greater_than':
            triggered = amount > threshold
        elif operator == 'greater_equal':
            triggered = amount >= threshold
        elif operator == 'less_than':
            triggered = amount < threshold
        elif operator == 'less_equal':
            triggered = amount <= threshold
        else:
            triggered = False

        return triggered, score if triggered else 0, {
            'amount': amount,
            'threshold': threshold,
            'operator': operator,
            'triggered': triggered
        }

    def _evaluate_geographic_rule(self, conditions: Dict[str, Any],
                                transaction_data: Dict[str, Any], score: int) -> Tuple[bool, int, Dict[str, Any]]:
        """Evaluate geographic-based rules."""
        location_data = transaction_data.get('location_data', {})
        country = location_data.get('country_code')

        known_countries = conditions.get('known_countries', [])
        max_distance = conditions.get('max_distance_km', 1000)

        violations = []

        if country and country not in known_countries:
            violations.append('unknown_country')

        # Distance check would require additional location data
        # This is simplified for the example

        triggered = len(violations) > 0

        return triggered, score if triggered else 0, {
            'violations': violations,
            'country': country,
            'known_countries': known_countries
        }

    def _evaluate_pattern_rule(self, conditions: Dict[str, Any],
                             transaction_data: Dict[str, Any], score: int) -> Tuple[bool, int, Dict[str, Any]]:
        """Evaluate pattern-based rules."""
        # Simplified pattern evaluation
        pattern_type = conditions.get('pattern_type')
        threshold = conditions.get('threshold', 0.8)

        if pattern_type == 'amount_deviation':
            avg_amount = transaction_data.get('avg_transaction_24h', 0)
            current_amount = transaction_data.get('amount', 0)

            if avg_amount > 0:
                deviation = abs(current_amount - avg_amount) / avg_amount
                triggered = deviation > threshold
            else:
                triggered = False
        else:
            triggered = False

        return triggered, score if triggered else 0, {
            'pattern_type': pattern_type,
            'threshold': threshold,
            'triggered': triggered
        }

    def _evaluate_custom_rule(self, rule: Dict[str, Any],
                            transaction_data: Dict[str, Any]) -> Tuple[bool, int, Dict[str, Any]]:
        """Evaluate custom rules using rule logic."""
        # This would implement custom rule evaluation logic
        # For now, return safe defaults
        return False, 0, {'custom_evaluation': 'not_implemented'}

    def reload_rules(self, notify_clients: bool = True) -> bool:
        """
        Force reload rules from database to cache.
        Returns True if rules were updated.
        """
        try:
            old_hash = None
            if self.redis_available:
                old_hash = self.redis_client.get(self.rule_hash_key)

            # Reload rules
            if self.redis_available:
                self._load_rules_to_redis()
                new_hash = self.redis_client.get(self.rule_hash_key)
            else:
                # When Redis is not available, we can't track hash changes
                # but we can still reload from database
                new_hash = "database_reload"

            rules_updated = old_hash != new_hash

            if rules_updated and notify_clients and self.channel_layer:
                self._notify_clients_rule_update()

            logger.info(f"Rules reloaded, updated: {rules_updated}, redis_available: {self.redis_available}")
            return rules_updated

        except Exception as e:
            logger.error(f"Failed to reload rules: {e}")
            return False

    def _notify_clients_rule_update(self):
        """Notify WebSocket clients about rule updates."""
        try:
            rules = self.get_active_rules()
            async_to_sync(self.channel_layer.group_send)(
                'fraud_alerts',
                {
                    'type': 'rules_updated',
                    'rules_count': len(rules),
                    'timestamp': timezone.now().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Failed to notify clients about rule update: {e}")

    def add_rule(self, rule_data: Dict[str, Any]) -> str:
        """Add a new rule to the system."""
        # This would create the rule in the database and reload cache
        # Implementation depends on the specific rule model
        rule_id = str(uuid.uuid4())
        logger.info(f"Rule addition requested: {rule_id}")
        # Trigger reload after database update
        self.reload_rules()
        return rule_id

    def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing rule."""
        logger.info(f"Rule update requested: {rule_id}")
        # Trigger reload after database update
        return self.reload_rules()

    def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule from the system."""
        logger.info(f"Rule deletion requested: {rule_id}")
        # Trigger reload after database update
        return self.reload_rules()

    def get_rule_statistics(self) -> Dict[str, Any]:
        """Get statistics about rule performance."""
        rules = self.get_active_rules()

        stats = {
            'total_rules': len(rules),
            'rules_by_type': {},
            'rules_by_severity': {},
            'cache_status': 'active' if self.redis_available else 'database_fallback'
        }

        for rule in rules.values():
            rule_type = rule.get('rule_type', 'unknown')
            severity = rule.get('severity', 'low')

            stats['rules_by_type'][rule_type] = stats['rules_by_type'].get(rule_type, 0) + 1
            stats['rules_by_severity'][severity] = stats['rules_by_severity'].get(severity, 0) + 1

        return stats


# Global instance
redis_rule_engine = RedisRuleEngine()