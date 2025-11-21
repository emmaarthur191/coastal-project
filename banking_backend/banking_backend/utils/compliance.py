"""
Comprehensive compliance checking system for banking operations.
Implements regulatory requirements and anti-money laundering checks.
"""

import logging
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from typing import Dict, List, Any, Optional
from .audit import AuditService

logger = logging.getLogger(__name__)


class ComplianceService:
    """Service for checking compliance with banking regulations."""

    # Regulatory thresholds
    DAILY_TRANSACTION_LIMIT = Decimal('50000.00')  # GHS 50,000 per day
    SINGLE_TRANSACTION_LIMIT = Decimal('10000.00')  # GHS 10,000 per transaction
    MONTHLY_TRANSACTION_LIMIT = Decimal('200000.00')  # GHS 200,000 per month

    # Suspicious activity thresholds
    SUSPICIOUS_AMOUNT_THRESHOLD = Decimal('5000.00')  # Flag amounts over GHS 5,000
    FREQUENT_TRANSACTION_THRESHOLD = 10  # More than 10 transactions per hour

    @staticmethod
    def check_transaction_compliance(user, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform comprehensive compliance checks on a transaction.

        Args:
            user: User performing the transaction
            transaction_data: Transaction details

        Returns:
            Dict with compliance check results
        """
        results = {
            'compliant': True,
            'warnings': [],
            'blocks': [],
            'flags': [],
            'risk_score': 0
        }

        amount = Decimal(str(transaction_data.get('amount', 0)))
        transaction_type = transaction_data.get('type', '').lower()
        account_type = transaction_data.get('account_type', '')
        member_id = transaction_data.get('member_id')

        # 1. Amount-based checks
        amount_checks = ComplianceService._check_amount_limits(user, amount, transaction_type)
        results['warnings'].extend(amount_checks['warnings'])
        results['blocks'].extend(amount_checks['blocks'])
        results['flags'].extend(amount_checks['flags'])
        results['risk_score'] += amount_checks['risk_score']

        # 2. Velocity checks (transaction frequency)
        velocity_checks = ComplianceService._check_transaction_velocity(user, member_id, transaction_type)
        results['warnings'].extend(velocity_checks['warnings'])
        results['blocks'].extend(velocity_checks['blocks'])
        results['flags'].extend(velocity_checks['flags'])
        results['risk_score'] += velocity_checks['risk_score']

        # 3. Account type compliance
        account_checks = ComplianceService._check_account_compliance(user, account_type, transaction_type, amount)
        results['warnings'].extend(account_checks['warnings'])
        results['blocks'].extend(account_checks['blocks'])
        results['flags'].extend(account_checks['flags'])
        results['risk_score'] += account_checks['risk_score']

        # 4. User role and authorization checks
        auth_checks = ComplianceService._check_user_authorization(user, transaction_type, amount)
        results['warnings'].extend(auth_checks['warnings'])
        results['blocks'].extend(auth_checks['blocks'])
        results['flags'].extend(auth_checks['flags'])
        results['risk_score'] += auth_checks['risk_score']

        # 5. Regulatory reporting requirements
        reporting_checks = ComplianceService._check_reporting_requirements(amount, transaction_type)
        results['flags'].extend(reporting_checks['flags'])

        # Determine overall compliance
        if results['blocks']:
            results['compliant'] = False

        # High risk score indicates need for approval
        if results['risk_score'] >= 7:
            results['requires_approval'] = True
            results['flags'].append('HIGH_RISK_REQUIRES_APPROVAL')

        return results

    @staticmethod
    def _check_amount_limits(user, amount: Decimal, transaction_type: str) -> Dict[str, Any]:
        """Check transaction amount against regulatory limits."""
        results = {'warnings': [], 'blocks': [], 'flags': [], 'risk_score': 0}

        # Single transaction limit
        if amount > ComplianceService.SINGLE_TRANSACTION_LIMIT:
            if user.role not in ['manager', 'operations_manager', 'administrator']:
                results['blocks'].append(f'Transaction amount exceeds single transaction limit of GHS {ComplianceService.SINGLE_TRANSACTION_LIMIT}')
                results['risk_score'] += 3
            else:
                results['warnings'].append(f'Large transaction amount: GHS {amount}')
                results['flags'].append('LARGE_TRANSACTION')
                results['risk_score'] += 2

        # Suspicious amount threshold
        if amount > ComplianceService.SUSPICIOUS_AMOUNT_THRESHOLD:
            results['flags'].append('SUSPICIOUS_AMOUNT')
            results['risk_score'] += 1

        # Round amount checks (potential money laundering indicator)
        if amount == round(amount):
            results['flags'].append('ROUND_AMOUNT')
            results['risk_score'] += 1

        return results

    @staticmethod
    def _check_transaction_velocity(user, member_id: str, transaction_type: str) -> Dict[str, Any]:
        """Check transaction frequency and velocity."""
        results = {'warnings': [], 'blocks': [], 'flags': [], 'risk_score': 0}

        # This would typically query the database for recent transactions
        # For now, we'll implement basic velocity checks
        # In production, this would check against transaction history

        # Placeholder for velocity analysis
        # recent_transactions = Transaction.objects.filter(
        #     member_id=member_id,
        #     created_at__gte=timezone.now() - timedelta(hours=1)
        # ).count()

        # if recent_transactions >= ComplianceService.FREQUENT_TRANSACTION_THRESHOLD:
        #     results['warnings'].append('High transaction frequency detected')
        #     results['flags'].append('HIGH_FREQUENCY_TRANSACTIONS')
        #     results['risk_score'] += 2

        return results

    @staticmethod
    def _check_account_compliance(user, account_type: str, transaction_type: str, amount: Decimal) -> Dict[str, Any]:
        """Check account type specific compliance rules."""
        results = {'warnings': [], 'blocks': [], 'flags': [], 'risk_score': 0}

        # Business account restrictions
        if account_type == 'business':
            if user.role not in ['manager', 'operations_manager', 'administrator']:
                results['blocks'].append('Business account transactions require manager approval')
                results['risk_score'] += 2

        # Savings account withdrawal limits
        if account_type == 'savings' and transaction_type == 'withdrawal':
            daily_limit = Decimal('5000.00')  # GHS 5,000 daily withdrawal limit for savings
            if amount > daily_limit:
                results['warnings'].append(f'Savings account withdrawal exceeds daily limit of GHS {daily_limit}')
                results['flags'].append('SAVINGS_WITHDRAWAL_LIMIT_EXCEEDED')
                results['risk_score'] += 1

        return results

    @staticmethod
    def _check_user_authorization(user, transaction_type: str, amount: Decimal) -> Dict[str, Any]:
        """Check if user is authorized for the transaction."""
        results = {'warnings': [], 'blocks': [], 'flags': [], 'risk_score': 0}

        # Role-based authorization
        role_permissions = {
            'cashier': {
                'max_amount': Decimal('5000.00'),
                'allowed_types': ['deposit', 'withdrawal']
            },
            'mobile_banker': {
                'max_amount': Decimal('2000.00'),
                'allowed_types': ['deposit', 'withdrawal']
            },
            'manager': {
                'max_amount': Decimal('50000.00'),
                'allowed_types': ['deposit', 'withdrawal', 'transfer']
            },
            'operations_manager': {
                'max_amount': Decimal('100000.00'),
                'allowed_types': ['deposit', 'withdrawal', 'transfer']
            },
            'administrator': {
                'max_amount': Decimal('1000000.00'),
                'allowed_types': ['deposit', 'withdrawal', 'transfer']
            }
        }

        user_role = user.role
        if user_role in role_permissions:
            permissions = role_permissions[user_role]

            # Check amount authorization
            if amount > permissions['max_amount']:
                results['blocks'].append(f'User role {user_role} not authorized for transactions over GHS {permissions["max_amount"]}')
                results['risk_score'] += 3

            # Check transaction type authorization
            if transaction_type not in permissions['allowed_types']:
                results['blocks'].append(f'User role {user_role} not authorized for {transaction_type} transactions')
                results['risk_score'] += 2
        else:
            results['blocks'].append(f'Unknown user role: {user_role}')
            results['risk_score'] += 5

        return results

    @staticmethod
    def _check_reporting_requirements(amount: Decimal, transaction_type: str) -> Dict[str, Any]:
        """Check if transaction requires regulatory reporting."""
        results = {'flags': []}

        # Reportable transaction thresholds
        if amount >= Decimal('10000.00'):
            results['flags'].append('REGULATORY_REPORTING_REQUIRED')
            results['flags'].append('CASH_TRANSACTION_REPORT')

        # Suspicious transaction reporting
        if amount >= Decimal('50000.00'):
            results['flags'].append('SUSPICIOUS_TRANSACTION_REPORT')

        return results

    @staticmethod
    def check_customer_due_diligence(customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform Customer Due Diligence (CDD) checks."""
        results = {
            'compliant': True,
            'warnings': [],
            'blocks': [],
            'flags': [],
            'risk_level': 'LOW'
        }

        # Check for required fields
        required_fields = ['first_name', 'last_name', 'date_of_birth', 'nationality', 'address', 'phone_number', 'email']
        missing_fields = [field for field in required_fields if not customer_data.get(field)]

        if missing_fields:
            results['blocks'].append(f'Missing required customer information: {", ".join(missing_fields)}')
            results['compliant'] = False

        # Age verification (must be 18+)
        if customer_data.get('date_of_birth'):
            try:
                dob = customer_data['date_of_birth']
                if isinstance(dob, str):
                    from datetime import datetime
                    dob = datetime.fromisoformat(dob.replace('Z', '+00:00'))

                age = (timezone.now().date() - dob.date()).days // 365
                if age < 18:
                    results['blocks'].append('Customer must be at least 18 years old')
                    results['compliant'] = False
            except:
                results['warnings'].append('Unable to verify customer age')

        # Risk assessment based on nationality or other factors
        high_risk_nationalities = ['country_x', 'country_y']  # Would be configured based on regulatory lists
        if customer_data.get('nationality') in high_risk_nationalities:
            results['flags'].append('HIGH_RISK_NATIONALITY')
            results['risk_level'] = 'HIGH'

        return results

    @staticmethod
    def log_compliance_check(user, transaction_data: Dict[str, Any], compliance_results: Dict[str, Any]):
        """Log compliance check results."""
        try:
            AuditService.log_financial_operation(
                user=user,
                operation_type="COMPLIANCE_CHECK",
                model_name="Transaction",
                object_id=f"compliance_check_{timezone.now().strftime('%Y%m%d%H%M%S')}",
                changes={
                    'transaction_data': transaction_data,
                    'compliance_results': compliance_results,
                    'risk_score': compliance_results.get('risk_score', 0),
                    'compliant': compliance_results.get('compliant', True)
                },
                metadata={
                    'compliance_check_type': 'transaction_compliance',
                    'flags_count': len(compliance_results.get('flags', [])),
                    'warnings_count': len(compliance_results.get('warnings', [])),
                    'blocks_count': len(compliance_results.get('blocks', []))
                },
                audit_level='HIGH' if not compliance_results.get('compliant', True) else 'MEDIUM'
            )
        except Exception as e:
            logger.error(f"Failed to log compliance check: {str(e)}")


# Global compliance service instance
compliance_service = ComplianceService()