#!/usr/bin/env python3
"""
Comprehensive test for transaction endpoints to verify the fixes work correctly.
"""

import os
import sys
import django
from decimal import Decimal
from uuid import uuid4

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from banking.models import Account, Transaction
from banking.permissions import IsCashier
from django.db import transaction

User = get_user_model()


class TransactionEndpointTestCase(APITestCase):
    """Test case for transaction endpoints."""
    
    def setUp(self):
        """Set up test data."""
        # Create test users
        self.cashier_user = User.objects.create_user(
            email='cashier@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='cashier',
            first_name='Test',
            last_name='Cashier'
        )
        
        self.member_user = User.objects.create_user(
            email='member@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='member',
            first_name='Test',
            last_name='Member'
        )
        
        # Create test account
        self.member_account = Account.objects.create(
            owner=self.member_user,
            account_number='1234567890',
            type='Savings',
            balance=Decimal('1000.00')
        )
        
        # Create test transactions
        self.transaction1 = Transaction.objects.create(
            account=self.member_account,
            type='deposit',
            amount=Decimal('500.00'),
            cashier=self.cashier_user,
            description='Test deposit'
        )
        
        self.transaction2 = Transaction.objects.create(
            account=self.member_account,
            type='withdrawal',
            amount=-Decimal('200.00'),
            cashier=self.cashier_user,
            description='Test withdrawal'
        )
        
        # Setup API client
        self.client = APIClient()
        self.cashier_client = APIClient()
        self.member_client = APIClient()
        
        # Authenticate users
        self.cashier_client.force_authenticate(user=self.cashier_user)
        self.member_client.force_authenticate(user=self.member_user)
    
    def test_transaction_list_endpoint(self):
        """Test transaction list endpoint."""
        url = reverse('transactions-list')

        # Test member can see their own transactions
        response = self.member_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify transaction data structure
        data = response.json()
        transactions = data.get('transactions', [])
        if transactions:
            transaction_data = transactions[0]
            self.assertIn('date', transaction_data)
            self.assertIn('description', transaction_data)
            self.assertIn('amount', transaction_data)
    
    def test_transaction_process_endpoint(self):
        """Test transaction processing endpoint."""
        url = reverse('transactions-process')
        
        # Test cashier can process transactions
        data = {
            'member_id': str(self.member_user.id),
            'amount': '100.50',
            'type': 'deposit'
        }
        
        response = self.cashier_client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        self.assertIn('message', response.json())
        self.assertIn('receipt_id', response.json())
        
        # Test with invalid member_id (creates user for testing)
        data['member_id'] = str(uuid4())
        response = self.cashier_client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_transaction_transfer_endpoint(self):
        """Test transfer endpoint."""
        # Create destination account
        dest_user = User.objects.create_user(
            email='dest@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='member'
        )
        dest_account = Account.objects.create(
            owner=dest_user,
            account_number='9876543210',
            type='Savings',
            balance=Decimal('500.00')
        )
        
        url = reverse('transactions-transfer')
        
        data = {
            'from_account': str(self.member_account.id),
            'to_account': str(dest_account.id),
            'amount': '50.00'
        }
        
        response = self.cashier_client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.json())
    
    def test_fast_transfer_endpoint(self):
        """Test fast transfer endpoint."""
        # Create destination account
        dest_user = User.objects.create_user(
            email='dest2@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='member'
        )
        dest_account = Account.objects.create(
            owner=dest_user,
            account_number='5555555555',
            type='Savings',
            balance=Decimal('300.00')
        )
        
        url = reverse('transfers-fast-transfer')
        
        data = {
            'from_account': str(self.member_account.id),
            'to_account': str(dest_account.id),
            'amount': '25.00',
            'description': 'Test fast transfer'
        }
        
        response = self.cashier_client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.json())
        self.assertIn('from_balance', response.json())
        self.assertIn('to_balance', response.json())
        self.assertIn('transfer_id', response.json())
    
    def test_account_summary_endpoint(self):
        """Test account summary endpoint."""
        url = reverse('transactions-account-summary')
        
        # Test member can get their own summary
        response = self.member_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        # Verify summary structure for member
        self.assertIn('total_savings', data)
        self.assertIn('total_loans', data)
        self.assertIn('available_balance', data)
        self.assertIn('monthly_contributions', data)
        self.assertIn('account_count', data)
        self.assertIn('loan_count', data)
        
        # Test cashier can get all summaries
        response = self.cashier_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_permission_restrictions(self):
        """Test that proper permissions are enforced."""
        # Test member cannot process transactions
        url = reverse('transactions-process')
        data = {
            'member_id': str(self.member_user.id),
            'amount': '50.00',
            'type': 'deposit'
        }
        
        response = self.member_client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test unauthenticated requests are rejected
        unauth_client = APIClient()
        response = unauth_client.get(reverse('transactions-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TransactionModelIntegrationTestCase(TransactionTestCase):
    """Test transaction model integration."""
    
    def setUp(self):
        """Set up test data."""
        self.cashier_user = User.objects.create_user(
            email='cashier2@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='cashier'
        )
        
        self.member_user = User.objects.create_user(
            email='member2@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='member'
        )
        
        self.member_account = Account.objects.create(
            owner=self.member_user,
            account_number='1111111111',
            type='Savings',
            balance=Decimal('1000.00')
        )
    
    def test_account_balance_updates(self):
        """Test that account balances are properly updated during transactions."""
        initial_balance = self.member_account.balance
        
        # Create a deposit transaction
        with transaction.atomic():
            self.member_account.balance += Decimal('100.00')
            self.member_account.save()
            
            Transaction.objects.create(
                account=self.member_account,
                type='deposit',
                amount=Decimal('100.00'),
                cashier=self.cashier_user,
                description='Test deposit'
            )
        
        # Refresh from database
        self.member_account.refresh_from_db()
        self.assertEqual(self.member_account.balance, initial_balance + Decimal('100.00'))
        
        # Create a withdrawal transaction
        with transaction.atomic():
            self.member_account.balance -= Decimal('50.00')
            self.member_account.save()
            
            Transaction.objects.create(
                account=self.member_account,
                type='withdrawal',
                amount=-Decimal('50.00'),
                cashier=self.cashier_user,
                description='Test withdrawal'
            )
        
        # Refresh from database
        self.member_account.refresh_from_db()
        self.assertEqual(self.member_account.balance, initial_balance + Decimal('50.00'))


def run_tests():
    """Run all transaction endpoint tests."""
    print("Running comprehensive transaction endpoint tests...")
    print("=" * 60)
    
    # Run the tests
    from django.core.management import execute_from_command_line
    
    try:
        # Run with Django test runner
        import unittest
        from django.test.utils import get_runner
        from config.settings import get_cache_name
        
        TestRunner = get_runner(None)
        test_runner = TestRunner(verbosity=2, interactive=False, keepdb=False)
        
        # Get test cases
        test_cases = [
            TransactionEndpointTestCase,
            TransactionModelIntegrationTestCase
        ]
        
        failed_tests = []
        for test_case in test_cases:
            print(f"\nRunning {test_case.__name__}...")
            suite = test_case.defaultTestLoader.loadTestsFromTestCase(test_case)
            result = test_runner.run_suite(suite)
            
            if not result.wasSuccessful():
                failed_tests.append(test_case.__name__)
                print(f"FAILED: {test_case.__name__}")
                for failure in result.failures:
                    print(f"  - {failure[0]}")
                for error in result.errors:
                    print(f"  - {error[0]}")
            else:
                print(f"PASSED: {test_case.__name__}")
        
        print("\n" + "=" * 60)
        if failed_tests:
            print(f"FAILED: {len(failed_tests)} test suite(s) failed: {', '.join(failed_tests)}")
            return False
        else:
            print("SUCCESS: All transaction endpoint tests passed!")
            return True
            
    except Exception as e:
        print(f"Error running tests: {e}")
        return False


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)