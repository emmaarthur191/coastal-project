import logging
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from typing import Dict, List, Tuple, Any
from .models import FraudRule, FraudAlert, FraudPattern
from banking.models import Transaction, Account

logger = logging.getLogger(__name__)


class FraudDetectionEngine:
    """
    Rule-based fraud detection engine that evaluates transactions against configurable rules.
    """

    def __init__(self):
        self.rules_cache = {}

    def _load_active_rules(self):
        """Load all active fraud rules into cache."""
        self.rules_cache = {
            rule.id: rule for rule in FraudRule.objects.filter(is_active=True)
        }
        logger.info(f"Loaded {len(self.rules_cache)} active fraud rules")

    def reload_rules(self):
        """Force reload of rules cache."""
        self._load_active_rules()

    def evaluate_transaction(self, transaction: Transaction, context: Dict[str, Any] = None) -> Tuple[bool, int, List[Dict]]:
        """
        Evaluate a transaction against all active fraud rules.

        Args:
            transaction: The transaction to evaluate
            context: Additional context data (IP, location, etc.)

        Returns:
            Tuple of (is_fraudulent, fraud_score, triggered_rules_details)
        """
        if not self.rules_cache:
            self._load_active_rules()

        triggered_rules = []
        total_score = 0
        max_severity = 'low'

        # Prepare transaction data for rule evaluation
        transaction_data = self._prepare_transaction_data(transaction, context)

        for rule in self.rules_cache.values():
            triggered, score, details = rule.evaluate(transaction_data)
            if triggered:
                triggered_rules.append(details)
                total_score += score

                # Track highest severity
                severity_levels = ['low', 'medium', 'high', 'critical']
                if severity_levels.index(rule.severity) > severity_levels.index(max_severity):
                    max_severity = rule.severity

        is_fraudulent = total_score >= 60  # Configurable threshold

        return is_fraudulent, total_score, triggered_rules

    def _prepare_transaction_data(self, transaction: Transaction, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Prepare transaction data for rule evaluation."""
        data = {
            'transaction_id': str(transaction.id),
            'amount': float(transaction.amount),
            'type': transaction.type,
            'category': transaction.category,
            'timestamp': transaction.timestamp.isoformat(),
            'account_id': str(transaction.account.id),
            'user_id': str(transaction.account.owner.id),
            'cashier_id': str(transaction.cashier.id) if transaction.cashier else None,
        }

        # Add account information
        account = transaction.account
        data.update({
            'account_balance': float(account.balance),
            'account_type': account.type,
            'user_role': account.owner.role,
        })

        # Add velocity checks (transactions in last 24 hours)
        velocity_data = self._calculate_velocity_metrics(transaction)
        data.update(velocity_data)

        # Add context data if provided
        if context:
            data.update(context)

        return data

    def _calculate_velocity_metrics(self, transaction: Transaction) -> Dict[str, Any]:
        """Calculate velocity metrics for the account."""
        account = transaction.account
        last_24h = timezone.now() - timedelta(hours=24)
        last_7d = timezone.now() - timedelta(days=7)

        # Transactions in last 24 hours
        recent_transactions = Transaction.objects.filter(
            account=account,
            timestamp__gte=last_24h
        )

        # Transactions in last 7 days
        weekly_transactions = Transaction.objects.filter(
            account=account,
            timestamp__gte=last_7d
        )

        # Calculate metrics
        metrics = {
            'transactions_24h': recent_transactions.count(),
            'amount_24h': float(recent_transactions.aggregate(total=Sum('amount'))['total'] or 0),
            'transactions_7d': weekly_transactions.count(),
            'amount_7d': float(weekly_transactions.aggregate(total=Sum('amount'))['total'] or 0),
            'avg_transaction_24h': 0,
            'avg_transaction_7d': 0,
        }

        # Calculate averages
        if metrics['transactions_24h'] > 0:
            metrics['avg_transaction_24h'] = metrics['amount_24h'] / metrics['transactions_24h']

        if metrics['transactions_7d'] > 0:
            metrics['avg_transaction_7d'] = metrics['amount_7d'] / metrics['transactions_7d']

        # Check for unusual patterns
        metrics.update(self._detect_unusual_patterns(recent_transactions, transaction))

        return metrics

    def _detect_unusual_patterns(self, recent_transactions, current_transaction) -> Dict[str, Any]:
        """Detect unusual patterns in transaction behavior."""
        patterns = {
            'is_first_transaction': recent_transactions.count() == 0,
            'amount_vs_average': 0,
            'time_since_last_transaction': 0,
            'transaction_frequency': 0,
        }

        if recent_transactions.exists():
            # Compare amount to average
            avg_amount = recent_transactions.aggregate(avg=Sum('amount'))['avg'] or 0
            if avg_amount > 0:
                patterns['amount_vs_average'] = abs(float(current_transaction.amount) - float(avg_amount)) / float(avg_amount)

            # Time since last transaction
            last_transaction = recent_transactions.order_by('-timestamp').first()
            if last_transaction:
                time_diff = current_transaction.timestamp - last_transaction.timestamp
                patterns['time_since_last_transaction'] = time_diff.total_seconds() / 3600  # hours

            # Transaction frequency (transactions per hour in last 24h)
            total_hours = 24
            patterns['transaction_frequency'] = recent_transactions.count() / total_hours

        return patterns

    def create_alert(self, transaction: Transaction, fraud_score: int, triggered_rules: List[Dict],
                    context: Dict[str, Any] = None) -> FraudAlert:
        """
        Create a fraud alert for a suspicious transaction.
        """
        # Determine priority based on score
        if fraud_score >= 80:
            priority = 'critical'
        elif fraud_score >= 60:
            priority = 'high'
        elif fraud_score >= 40:
            priority = 'medium'
        else:
            priority = 'low'

        # Create alert
        alert = FraudAlert.objects.create(
            alert_type='transaction',
            priority=priority,
            status='new',
            transaction=transaction,
            account=transaction.account,
            user=transaction.account.owner,
            title=f"Suspicious Transaction Detected - {transaction.type}",
            description=self._generate_alert_description(transaction, triggered_rules),
            fraud_score=fraud_score,
            risk_level=priority,
            rule_details={'triggered_rules': triggered_rules},
            transaction_data=self._prepare_transaction_data(transaction, context),
            account_data={
                'account_id': str(transaction.account.id),
                'balance': float(transaction.account.balance),
                'type': transaction.account.type,
            },
            user_data={
                'user_id': str(transaction.account.owner.id),
                'role': transaction.account.owner.role,
                'is_active': transaction.account.owner.is_active,
            },
            source_ip=context.get('ip_address') if context else None,
            user_agent=context.get('user_agent') if context else None,
            location_data=context.get('location_data', {}) if context else {},
        )

        # Associate triggered rules
        rule_ids = [rule_detail.get('rule_id') for rule_detail in triggered_rules if 'rule_id' in rule_detail]
        if rule_ids:
            rules = FraudRule.objects.filter(id__in=rule_ids)
            alert.triggered_rules.set(rules)

        logger.warning(f"Created fraud alert {alert.id} for transaction {transaction.id} with score {fraud_score}")
        return alert

    def _generate_alert_description(self, transaction: Transaction, triggered_rules: List[Dict]) -> str:
        """Generate a human-readable description for the alert."""
        rule_names = [rule.get('rule_name', 'Unknown Rule') for rule in triggered_rules]

        description = f"Suspicious {transaction.type.lower()} transaction of {transaction.amount:.2f} detected. "
        description += f"Triggered rules: {', '.join(rule_names)}. "

        if transaction.account:
            description += f"Account: {transaction.account.get_decrypted_account_number()[-4:] if transaction.account.get_decrypted_account_number() else 'Unknown'}"

        return description

    def check_velocity_limits(self, account: Account, transaction_amount: Decimal,
                            time_window_hours: int = 24) -> Tuple[bool, Dict]:
        """
        Check if transaction exceeds velocity limits.
        """
        time_window = timezone.now() - timedelta(hours=time_window_hours)

        # Get transactions in time window
        recent_transactions = Transaction.objects.filter(
            account=account,
            timestamp__gte=time_window
        )

        total_amount = recent_transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        transaction_count = recent_transactions.count()

        # Define velocity limits (configurable)
        limits = {
            'max_amount_24h': Decimal('10000.00'),
            'max_transactions_24h': 10,
            'max_amount_single': Decimal('5000.00'),
        }

        violations = {}

        if total_amount + transaction_amount > limits['max_amount_24h']:
            violations['amount_limit'] = f"24h limit exceeded: {total_amount + transaction_amount} > {limits['max_amount_24h']}"

        if transaction_count + 1 > limits['max_transactions_24h']:
            violations['count_limit'] = f"24h transaction count exceeded: {transaction_count + 1} > {limits['max_transactions_24h']}"

        if transaction_amount > limits['max_amount_single']:
            violations['single_amount_limit'] = f"Single transaction limit exceeded: {transaction_amount} > {limits['max_amount_single']}"

        is_violation = len(violations) > 0

        return is_violation, {
            'violations': violations,
            'current_amount_24h': float(total_amount),
            'current_count_24h': transaction_count,
            'limits': {k: float(v) for k, v in limits.items()}
        }

    def update_patterns(self, transaction: Transaction, was_fraudulent: bool = False):
        """
        Update fraud patterns based on transaction behavior.
        """
        # This is a simplified pattern learning - in production, use ML algorithms
        patterns_to_update = FraudPattern.objects.filter(is_active=True)

        for pattern in patterns_to_update:
            # Simple pattern: transaction amount ranges
            if pattern.pattern_type == 'transaction_velocity':
                # Update based on transaction frequency
                pattern.total_occurrences += 1
                if was_fraudulent:
                    pattern.fraud_occurrences += 1
                pattern.save()

    def bulk_evaluate_transactions(self, transactions: List[Transaction]) -> List[Tuple[Transaction, bool, int, List[Dict]]]:
        """
        Evaluate multiple transactions efficiently.
        """
        results = []
        for transaction in transactions:
            is_fraud, score, rules = self.evaluate_transaction(transaction)
            results.append((transaction, is_fraud, score, rules))
        return results

    def get_fraud_statistics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get fraud detection statistics for the specified period.
        """
        since_date = timezone.now() - timedelta(days=days)

        stats = {
            'total_alerts': FraudAlert.objects.filter(created_at__gte=since_date).count(),
            'resolved_alerts': FraudAlert.objects.filter(
                created_at__gte=since_date,
                status__in=['resolved', 'dismissed']
            ).count(),
            'high_priority_alerts': FraudAlert.objects.filter(
                created_at__gte=since_date,
                priority__in=['high', 'critical']
            ).count(),
            'active_rules': len(self.rules_cache),
            'rule_triggers': {},
        }

        # Rule trigger statistics
        for rule in self.rules_cache.values():
            stats['rule_triggers'][rule.name] = {
                'triggers': rule.trigger_count,
                'false_positives': rule.false_positive_count,
                'last_triggered': rule.last_triggered.isoformat() if rule.last_triggered else None,
            }

        return stats


# Global instance for easy access
fraud_engine = FraudDetectionEngine()