import os
import pytest
from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from banking.models import (
    Account, Transaction, LoanApplication, Loan, LoanRepayment,
    FeeStructure, FeeTransaction, KYCApplication
)


class AccountModelTestCase(TestCase):
    """Test cases for Account model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='account_test@example.com',
            first_name='Account',
            last_name='Test',
            role='member',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )

    def test_create_account(self):
        """Test creating an account."""
        account = Account.objects.create(
            owner=self.user,
            account_number='1234567890123456',
            type='Savings',
            balance=1000.00,
            status='Active'
        )
        self.assertEqual(account.owner, self.user)
        self.assertEqual(account.get_decrypted_account_number(), '1234567890123456')
        self.assertEqual(account.type, 'Savings')
        self.assertEqual(account.balance, 1000.00)
        self.assertEqual(account.status, 'Active')

    def test_account_str_representation(self):
        """Test string representation of Account."""
        account = Account.objects.create(
            owner=self.user,
            account_number='1234567890123456',
            type='Savings'
        )
        expected_str = f"1234567890123456 (Savings) - {self.user.email}"
        self.assertEqual(str(account), expected_str)

    def test_get_decrypted_account_number(self):
        """Test decrypting account number."""
        account = Account.objects.create(
            owner=self.user,
            account_number='1234567890123456',
            type='Savings'
        )
        self.assertEqual(account.get_decrypted_account_number(), '1234567890123456')

    def test_negative_balance_validation(self):
        """Test that negative balance raises validation error."""
        with self.assertRaises(ValidationError):
            account = Account(
                owner=self.user,
                account_number='1234567890123456',
                type='Savings',
                balance=-100.00
            )
            account.full_clean()


class TransactionModelTestCase(TestCase):
    """Test cases for Transaction model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='transaction_test@example.com',
            first_name='Transaction',
            last_name='Test',
            role='member',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )
        self.account = Account.objects.create(
            owner=self.user,
            account_number='1234567890123456',
            type='Savings',
            balance=1000.00
        )

    def test_create_transaction(self):
        """Test creating a transaction."""
        transaction = Transaction.objects.create(
            account=self.account,
            type='deposit',
            amount=500.00,
            description='Test deposit'
        )
        self.assertEqual(transaction.account, self.account)
        self.assertEqual(transaction.type, 'deposit')
        self.assertEqual(transaction.amount, 500.00)
        self.assertEqual(transaction.description, 'Test deposit')

    def test_transaction_str_representation(self):
        """Test string representation of Transaction."""
        transaction = Transaction.objects.create(
            account=self.account,
            type='deposit',
            amount=500.00
        )
        expected_str = f"deposit of 500.00 on {transaction.timestamp.strftime('%Y-%m-%d')}"
        self.assertEqual(str(transaction), expected_str)

    def test_transaction_types(self):
        """Test all transaction types."""
        types = ['deposit', 'withdrawal', 'transfer', 'loan_disbursement', 'loan_repayment', 'fee', 'interest']
        for trans_type in types:
            with self.subTest(type=trans_type):
                transaction = Transaction.objects.create(
                    account=self.account,
                    type=trans_type,
                    amount=100.00
                )
                self.assertEqual(transaction.type, trans_type)


class LoanApplicationModelTestCase(TestCase):
    """Test cases for LoanApplication model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='loan_app_test@example.com',
            first_name='Loan',
            last_name='Applicant',
            role='member',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )

    def test_create_loan_application(self):
        """Test creating a loan application."""
        application = LoanApplication.objects.create(
            applicant=self.user,
            amount_requested=5000.00,
            term_months=12,
            interest_rate=10.00,
            purpose='Home improvement'
        )
        self.assertEqual(application.applicant, self.user)
        self.assertEqual(application.amount_requested, 5000.00)
        self.assertEqual(application.term_months, 12)
        self.assertEqual(application.interest_rate, 10.00)
        self.assertEqual(application.status, 'pending')

    def test_loan_application_str_representation(self):
        """Test string representation of LoanApplication."""
        application = LoanApplication.objects.create(
            applicant=self.user,
            amount_requested=5000.00,
            term_months=12,
            interest_rate=10.00
        )
        expected_str = f"Loan Application by {self.user.email} - 5000.00 (pending)"
        self.assertEqual(str(application), expected_str)


class LoanModelTestCase(TestCase):
    """Test cases for Loan model."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='loan_test@example.com',
            first_name='Loan',
            last_name='Test',
            role='member',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )
        self.account = Account.objects.create(
            owner=self.user,
            account_number='1234567890123456',
            type='Loan'
        )
        self.application = LoanApplication.objects.create(
            applicant=self.user,
            amount_requested=5000.00,
            term_months=12,
            interest_rate=10.00
        )

    def test_create_loan(self):
        """Test creating a loan."""
        from datetime import date
        loan = Loan.objects.create(
            application=self.application,
            account=self.account,
            principal_amount=5000.00,
            interest_rate=10.00,
            term_months=12,
            disbursement_date=date.today()
        )
        self.assertEqual(loan.application, self.application)
        self.assertEqual(loan.account, self.account)
        self.assertEqual(loan.principal_amount, 5000.00)
        self.assertEqual(loan.outstanding_balance, 5000.00)
        self.assertEqual(loan.status, 'active')

    def test_calculate_monthly_payment(self):
        """Test monthly payment calculation."""
        from datetime import date
        loan = Loan.objects.create(
            application=self.application,
            account=self.account,
            principal_amount=5000.00,
            interest_rate=10.00,
            term_months=12,
            disbursement_date=date.today()
        )
        monthly_payment = loan.calculate_monthly_payment()
        self.assertGreater(monthly_payment, 0)

    def test_zero_interest_loan(self):
        """Test loan with zero interest rate."""
        from datetime import date
        loan = Loan.objects.create(
            application=self.application,
            account=self.account,
            principal_amount=5000.00,
            interest_rate=0.00,
            term_months=12,
            disbursement_date=date.today()
        )
        monthly_payment = loan.calculate_monthly_payment()
        expected_payment = 5000.00 / 12
        self.assertEqual(monthly_payment, expected_payment)


class FeeStructureModelTestCase(TestCase):
    """Test cases for FeeStructure model."""

    def test_create_fee_structure(self):
        """Test creating a fee structure."""
        fee = FeeStructure.objects.create(
            name='Test Fee',
            description='Test fee structure',
            transaction_type='withdrawal',
            fee_type='fixed',
            fixed_amount=2.50
        )
        self.assertEqual(fee.name, 'Test Fee')
        self.assertEqual(fee.transaction_type, 'withdrawal')
        self.assertEqual(fee.fee_type, 'fixed')
        self.assertEqual(fee.fixed_amount, 2.50)

    def test_calculate_fixed_fee(self):
        """Test fixed fee calculation."""
        fee = FeeStructure.objects.create(
            name='Fixed Fee',
            transaction_type='withdrawal',
            fee_type='fixed',
            fixed_amount=5.00
        )
        calculated_fee = fee.calculate_fee(100.00)
        self.assertEqual(calculated_fee, 5.00)

    def test_calculate_percentage_fee(self):
        """Test percentage fee calculation."""
        fee = FeeStructure.objects.create(
            name='Percentage Fee',
            transaction_type='transfer',
            fee_type='percentage',
            percentage=1.50,
            min_fee=1.00,
            max_fee=10.00
        )
        # Test normal percentage
        calculated_fee = fee.calculate_fee(100.00)
        self.assertEqual(calculated_fee, 1.50)

        # Test minimum fee
        calculated_fee = fee.calculate_fee(10.00)
        self.assertEqual(calculated_fee, 1.00)

        # Test maximum fee
        calculated_fee = fee.calculate_fee(1000.00)
        self.assertEqual(calculated_fee, 10.00)

    def test_fee_structure_str_representation(self):
        """Test string representation of FeeStructure."""
        fee = FeeStructure.objects.create(
            name='Test Fee',
            transaction_type='withdrawal',
            fee_type='fixed',
            fixed_amount=2.50
        )
        expected_str = "Test Fee - withdrawal"
        self.assertEqual(str(fee), expected_str)


# Pytest-style tests
@pytest.mark.django_db
class TestLoanRepayment:
    """Test LoanRepayment model with pytest."""

    def test_create_loan_repayment(self, user_factory, account_factory, loan_application_factory):
        """Test creating a loan repayment."""
        user = user_factory()
        account = account_factory(owner=user)
        application = loan_application_factory(applicant=user)
        loan = Loan.objects.create(
            application=application,
            account=account,
            principal_amount=5000.00,
            interest_rate=10.00,
            term_months=12,
            disbursement_date='2024-01-01'
        )

        repayment = LoanRepayment.objects.create(
            loan=loan,
            amount=450.00
        )

        assert repayment.loan == loan
        assert repayment.amount == 450.00
        assert repayment.principal_paid > 0
        assert repayment.interest_paid > 0

    def test_repayment_updates_loan_balance(self, user_factory, account_factory, loan_application_factory):
        """Test that repayment updates loan outstanding balance."""
        user = user_factory()
        account = account_factory(owner=user)
        application = loan_application_factory(applicant=user)
        loan = Loan.objects.create(
            application=application,
            account=account,
            principal_amount=5000.00,
            interest_rate=10.00,
            term_months=12,
            disbursement_date='2024-01-01'
        )

        initial_balance = loan.outstanding_balance
        repayment = LoanRepayment.objects.create(
            loan=loan,
            amount=450.00
        )

        loan.refresh_from_db()
        assert loan.outstanding_balance < initial_balance
        assert loan.total_paid == 450.00
