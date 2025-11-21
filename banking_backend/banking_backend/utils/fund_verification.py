"""
Fund verification and balance confirmation system for banking operations.
Provides real-time balance verification, fraud detection, and fund availability checks.
"""

import logging
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from typing import Dict, List, Any, Optional, Tuple
from .audit import AuditService
from .monitoring import log_security_event

logger = logging.getLogger(__name__)


class FundVerificationService:
    """Service for verifying fund availability and detecting fraudulent activities."""

    # Verification thresholds
    MINIMUM_BALANCE_BUFFER = Decimal('1.00')  # Minimum buffer for fees
    LARGE_TRANSACTION_THRESHOLD = Decimal('10000.00')  # Flag large transactions
    SUSPICIOUS_VELOCITY_THRESHOLD = 5  # Transactions per hour

    def __init__(self):
        self.verification_cache = {}  # In production, use Redis

    def verify_funds_availability(self, account, amount: Decimal,
                                transaction_type: str = 'withdrawal',
                                include_fees: bool = True) -> Dict[str, Any]:
        """
        Comprehensive fund availability verification.

        Args:
            account: Account model instance
            amount: Transaction amount
            transaction_type: Type of transaction ('withdrawal', 'transfer', etc.)
            include_fees: Whether to include potential fees in calculation

        Returns:
            Dict with verification results
        """
        results = {
            'available': False,
            'sufficient_funds': False,
            'verification_warnings': [],
            'fraud_flags': [],
            'risk_score': 0,
            'available_balance': account.balance,
            'hold_amount': Decimal('0.00'),
            'pending_transactions': 0
        }

        # 1. Basic balance check
        if account.balance >= amount:
            results['sufficient_funds'] = True
        else:
            results['verification_warnings'].append(
                f'Insufficient funds. Available: GHS {account.balance}, Required: GHS {amount}'
            )
            return results

        # 2. Check for pending holds/transactions
        pending_holds = self._check_pending_holds(account)
        results['hold_amount'] = pending_holds
        results['pending_transactions'] = self._count_pending_transactions(account)

        # Adjust available balance for holds
        adjusted_balance = account.balance - pending_holds
        if adjusted_balance < amount:
            results['verification_warnings'].append(
                f'Funds held by pending transactions. Adjusted balance: GHS {adjusted_balance}'
            )
            results['sufficient_funds'] = False
            return results

        # 3. Include fee buffer if required
        if include_fees:
            fee_buffer = self._calculate_fee_buffer(amount, transaction_type)
            if adjusted_balance < (amount + fee_buffer):
                results['verification_warnings'].append(
                    f'Insufficient funds including estimated fees. Required: GHS {amount + fee_buffer}'
                )
                results['sufficient_funds'] = False
                return results

        # 4. Velocity and pattern analysis
        velocity_check = self._check_transaction_velocity(account, amount, transaction_type)
        results['fraud_flags'].extend(velocity_check['flags'])
        results['risk_score'] += velocity_check['risk_score']

        # 5. Amount pattern analysis
        pattern_check = self._check_amount_patterns(account, amount)
        results['fraud_flags'].extend(pattern_check['flags'])
        results['risk_score'] += pattern_check['risk_score']

        # 6. Account status verification
        if account.status != 'Active':
            results['verification_warnings'].append(f'Account status: {account.status}')
            results['sufficient_funds'] = False
            return results

        # 7. Final availability determination
        results['available'] = results['sufficient_funds'] and results['risk_score'] < 7

        return results

    def perform_balance_confirmation(self, account, expected_balance: Decimal = None) -> Dict[str, Any]:
        """
        Perform real-time balance confirmation with integrity checks.

        Args:
            account: Account model instance
            expected_balance: Expected balance for verification

        Returns:
            Dict with confirmation results
        """
        results = {
            'confirmed': False,
            'current_balance': account.balance,
            'last_updated': account.updated_at,
            'integrity_check': True,
            'warnings': []
        }

        # Check if balance has been updated recently
        time_since_update = timezone.now() - account.updated_at
        if time_since_update > timedelta(minutes=5):
            results['warnings'].append('Balance not updated recently')

        # Verify against expected balance if provided
        if expected_balance is not None:
            if abs(account.balance - expected_balance) > Decimal('0.01'):
                results['warnings'].append(
                    f'Balance mismatch. Expected: GHS {expected_balance}, Actual: GHS {account.balance}'
                )
                results['integrity_check'] = False

        # Perform basic integrity checks
        if account.balance < 0:
            results['warnings'].append('Negative balance detected')
            results['integrity_check'] = False

        # Check for unusual balance changes
        unusual_change = self._check_balance_change_patterns(account)
        if unusual_change:
            results['warnings'].append(unusual_change)
            results['integrity_check'] = False

        results['confirmed'] = len(results['warnings']) == 0 and results['integrity_check']

        return results

    def detect_fraudulent_activity(self, account, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Advanced fraud detection for fund-related activities.

        Args:
            account: Account model instance
            transaction_data: Transaction details

        Returns:
            Dict with fraud detection results
        """
        results = {
            'fraud_detected': False,
            'risk_level': 'LOW',
            'flags': [],
            'score': 0,
            'recommendations': []
        }

        amount = Decimal(str(transaction_data.get('amount', 0)))
        transaction_type = transaction_data.get('type', '')

        # 1. Amount-based fraud detection
        if amount > self.LARGE_TRANSACTION_THRESHOLD:
            results['flags'].append('LARGE_AMOUNT_TRANSACTION')
            results['score'] += 2

        # 2. Round number detection
        if amount == round(amount) and amount >= Decimal('1000.00'):
            results['flags'].append('ROUND_NUMBER_AMOUNT')
            results['score'] += 1

        # 3. Velocity analysis
        velocity_score = self._analyze_transaction_velocity(account, transaction_data)
        results['score'] += velocity_score

        # 4. Geographic analysis (if location data available)
        location_score = self._check_location_consistency(account, transaction_data)
        results['score'] += location_score

        # 5. Device fingerprinting (if available)
        device_score = self._check_device_consistency(account, transaction_data)
        results['score'] += device_score

        # 6. Time-based analysis
        time_score = self._check_timing_patterns(account, transaction_data)
        results['score'] += time_score

        # Determine risk level
        if results['score'] >= 8:
            results['risk_level'] = 'CRITICAL'
            results['fraud_detected'] = True
            results['recommendations'].append('Block transaction and require manual review')
        elif results['score'] >= 5:
            results['risk_level'] = 'HIGH'
            results['fraud_detected'] = True
            results['recommendations'].append('Require additional verification')
        elif results['score'] >= 3:
            results['risk_level'] = 'MEDIUM'
            results['recommendations'].append('Monitor transaction closely')

        return results

    def _check_pending_holds(self, account) -> Decimal:
        """Check for pending holds on the account."""
        # In a real implementation, this would query pending transactions
        # For now, return a placeholder
        return Decimal('0.00')

    def _count_pending_transactions(self, account) -> int:
        """Count pending transactions for the account."""
        # In a real implementation, this would query pending transactions
        return 0

    def _calculate_fee_buffer(self, amount: Decimal, transaction_type: str) -> Decimal:
        """Calculate estimated fee buffer for transaction."""
        # Basic fee estimation - in production, this would use fee structure
        if transaction_type == 'withdrawal':
            return max(Decimal('2.00'), amount * Decimal('0.005'))  # 0.5% or minimum GHS 2
        elif transaction_type == 'transfer':
            return max(Decimal('1.00'), amount * Decimal('0.002'))  # 0.2% or minimum GHS 1
        return Decimal('0.00')

    def _check_transaction_velocity(self, account, amount: Decimal, transaction_type: str) -> Dict[str, Any]:
        """Check transaction velocity patterns."""
        results = {'flags': [], 'risk_score': 0}

        # Placeholder for velocity analysis
        # In production, this would analyze recent transaction patterns

        return results

    def _check_amount_patterns(self, account, amount: Decimal) -> Dict[str, Any]:
        """Check for suspicious amount patterns."""
        results = {'flags': [], 'risk_score': 0}

        # Check for structured amounts (money laundering technique)
        if amount % 1000 == 0 and amount >= 9000:
            results['flags'].append('STRUCTURED_AMOUNT')
            results['risk_score'] += 2

        # Check for amounts just below reporting thresholds
        if Decimal('9500.00') <= amount <= Decimal('9999.99'):
            results['flags'].append('THRESHOLD_AVOIDANCE')
            results['risk_score'] += 1

        return results

    def _check_balance_change_patterns(self, account) -> Optional[str]:
        """Check for unusual balance change patterns."""
        # Placeholder for balance change analysis
        return None

    def _analyze_transaction_velocity(self, account, transaction_data: Dict[str, Any]) -> int:
        """Analyze transaction velocity for fraud detection."""
        # Placeholder implementation
        return 0

    def _check_location_consistency(self, account, transaction_data: Dict[str, Any]) -> int:
        """Check location consistency for fraud detection."""
        # Placeholder implementation
        return 0

    def _check_device_consistency(self, account, transaction_data: Dict[str, Any]) -> int:
        """Check device consistency for fraud detection."""
        # Placeholder implementation
        return 0

    def _check_timing_patterns(self, account, transaction_data: Dict[str, Any]) -> int:
        """Check timing patterns for fraud detection."""
        # Placeholder implementation
        return 0

    def log_fund_verification(self, user, account, verification_results: Dict[str, Any]):
        """Log fund verification results."""
        try:
            AuditService.log_financial_operation(
                user=user,
                operation_type="FUND_VERIFICATION",
                model_name="Account",
                object_id=account.id,
                changes={
                    'verification_results': verification_results,
                    'account_balance': str(account.balance),
                    'available': verification_results.get('available', False)
                },
                metadata={
                    'verification_type': 'fund_availability_check',
                    'risk_score': verification_results.get('risk_score', 0),
                    'fraud_flags_count': len(verification_results.get('fraud_flags', []))
                },
                audit_level='HIGH' if not verification_results.get('available', True) else 'MEDIUM'
            )
        except Exception as e:
            logger.error(f"Failed to log fund verification: {str(e)}")


# Global fund verification service instance
fund_verification_service = FundVerificationService()