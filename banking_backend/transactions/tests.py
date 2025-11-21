import pytest
from django.test import TestCase
from transactions.serializers import TransactionSerializer, FastTransferSerializer
from banking.models import Account, Transaction
from banking_backend.utils.exceptions import InsufficientFundsException, ValidationException


class TransactionSerializerTestCase(TestCase):
    """Test cases for TransactionSerializer."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='serializer_test@example.com',
            first_name='Serializer',
            last_name='Test',
            role='member',
            password='testpass123'
        )
        self.account = Account.objects.create(
            owner=self.user,
            account_number='1234567890123456',
            type='Savings',
            balance=1000.00
        )

    def test_transaction_serializer_valid_data(self):
        """Test TransactionSerializer with valid data."""
        data = {
            'account': self.account.id,
            'type': 'deposit',
            'amount': '500.00',
            'description': 'Test deposit'
        }
        serializer = TransactionSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['amount'], 500.00)

    def test_transaction_serializer_invalid_amount(self):
        """Test TransactionSerializer with invalid amount."""
        data = {
            'account': self.account.id,
            'type': 'deposit',
            'amount': '-100.00',  # Negative amount
            'description': 'Invalid deposit'
        }
        serializer = TransactionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)

    def test_transaction_serializer_invalid_type(self):
        """Test TransactionSerializer with invalid transaction type."""
        data = {
            'account': self.account.id,
            'type': 'invalid_type',
            'amount': '100.00',
            'description': 'Invalid type'
        }
        serializer = TransactionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('type', serializer.errors)

    def test_transaction_serializer_long_description(self):
        """Test TransactionSerializer with description too long."""
        long_description = 'A' * 501  # Exceeds 500 character limit
        data = {
            'account': self.account.id,
            'type': 'deposit',
            'amount': '100.00',
            'description': long_description
        }
        serializer = TransactionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('description', serializer.errors)


class FastTransferSerializerTestCase(TestCase):
    """Test cases for FastTransferSerializer."""

    def setUp(self):
        """Set up test data."""
        from users.models import User
        self.user = User.objects.create_user(
            email='transfer_test@example.com',
            first_name='Transfer',
            last_name='Test',
            role='member',
            password='testpass123'
        )
        self.from_account = Account.objects.create(
            owner=self.user,
            account_number='1111111111111111',
            type='Savings',
            balance=1000.00
        )
        self.to_account = Account.objects.create(
            owner=self.user,
            account_number='2222222222222222',
            type='Checking',
            balance=500.00
        )

    def test_fast_transfer_serializer_valid_data(self):
        """Test FastTransferSerializer with valid data."""
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'amount': '200.00',
            'description': 'Test transfer'
        }
        serializer = FastTransferSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        validated_data = serializer.validated_data
        self.assertEqual(validated_data['from_account_obj'], self.from_account)
        self.assertEqual(validated_data['to_account_obj'], self.to_account)
        self.assertEqual(validated_data['amount'], 200.00)

    def test_fast_transfer_serializer_same_account(self):
        """Test FastTransferSerializer with same from and to accounts."""
        data = {
            'from_account': self.from_account.id,
            'to_account': self.from_account.id,  # Same account
            'amount': '100.00'
        }
        serializer = FastTransferSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_fast_transfer_serializer_insufficient_funds(self):
        """Test FastTransferSerializer with insufficient funds."""
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'amount': '1500.00'  # More than balance
        }
        serializer = FastTransferSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_fast_transfer_serializer_invalid_accounts(self):
        """Test FastTransferSerializer with non-existent accounts."""
        data = {
            'from_account': 99999,  # Non-existent
            'to_account': self.to_account.id,
            'amount': '100.00'
        }
        serializer = FastTransferSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_fast_transfer_serializer_negative_amount(self):
        """Test FastTransferSerializer with negative amount."""
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'amount': '-50.00'
        }
        serializer = FastTransferSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('amount', serializer.errors)


# Pytest-style tests
@pytest.mark.django_db
class TestTransactionProcessing:
    """Test transaction processing logic with pytest."""

    def test_deposit_transaction(self, user_factory, account_factory):
        """Test deposit transaction processing."""
        user = user_factory(role='cashier')
        account = account_factory(owner=user, balance=1000.00)

        initial_balance = account.balance
        deposit_amount = 500.00

        transaction = Transaction.objects.create(
            account=account,
            type='deposit',
            amount=deposit_amount,
            cashier=user
        )

        account.refresh_from_db()
        assert account.balance == initial_balance + deposit_amount
        assert transaction.amount == deposit_amount

    def test_withdrawal_transaction(self, user_factory, account_factory):
        """Test withdrawal transaction processing."""
        user = user_factory(role='cashier')
        account = account_factory(owner=user, balance=1000.00)

        initial_balance = account.balance
        withdrawal_amount = 200.00

        transaction = Transaction.objects.create(
            account=account,
            type='withdrawal',
            amount=-withdrawal_amount,  # Negative for withdrawal
            cashier=user
        )

        account.refresh_from_db()
        assert account.balance == initial_balance - withdrawal_amount
        assert transaction.amount == -withdrawal_amount

    def test_transfer_transaction(self, user_factory, account_factory):
        """Test transfer transaction processing."""
        user = user_factory(role='cashier')
        from_account = account_factory(owner=user, balance=1000.00)
        to_account = account_factory(owner=user, balance=500.00)

        initial_from_balance = from_account.balance
        initial_to_balance = to_account.balance
        transfer_amount = 300.00

        # Create transfer out transaction
        from_transaction = Transaction.objects.create(
            account=from_account,
            type='transfer',
            amount=-transfer_amount,
            cashier=user,
            related_account=to_account
        )

        # Create transfer in transaction
        to_transaction = Transaction.objects.create(
            account=to_account,
            type='transfer',
            amount=transfer_amount,
            cashier=user,
            related_account=from_account
        )

        from_account.refresh_from_db()
        to_account.refresh_from_db()

        assert from_account.balance == initial_from_balance - transfer_amount
        assert to_account.balance == initial_to_balance + transfer_amount
        assert from_transaction.related_account == to_account
        assert to_transaction.related_account == from_account
