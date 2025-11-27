#!/usr/bin/env python
"""
Test script to validate frontend-backend data synchronization fixes.
Tests the new serializers and data transformations.
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from banking.models import Account, Transaction
from banking.serializers import (
    AccountListSerializer, TransactionListSerializer, 
    FrontendAccountSummarySerializer
)
from users.models import User


def test_account_list_serializer():
    """Test AccountListSerializer with type→name mapping"""
    print("\n=== Testing AccountListSerializer ===")
    
    # Create test data
    test_user = User.objects.create_user(
        email='test@example.com',
        password=os.getenv('TEST_USER_PASSWORD', 'test123'),
        first_name='Test',
        last_name='User',
        role='member'
    )
    
    # Create test account
    test_account = Account.objects.create(
        owner=test_user,
        account_number='123456789',
        type='Savings',
        balance=Decimal('1000.50')
    )
    
    # Test serialization
    serializer = AccountListSerializer(test_account)
    data = serializer.data
    
    print(f"Original account data:")
    print(f"  ID: {test_account.id}")
    print(f"  Type: {test_account.type}")
    print(f"  Balance: {test_account.balance}")
    
    print(f"\nSerialized data:")
    print(f"  ID: {data['id']}")
    print(f"  Name: {data['name']}")
    print(f"  Balance: {data['balance']}")
    
    # Validation
    assert 'id' in data, "Missing 'id' field"
    assert 'name' in data, "Missing 'name' field"
    assert 'balance' in data, "Missing 'balance' field"
    assert data['name'] == 'Savings', f"Expected 'Savings', got '{data['name']}'"
    assert isinstance(data['balance'], float), f"Expected float, got {type(data['balance'])}"
    
    print(" AccountListSerializer test PASSED")
    
    # Cleanup
    test_account.delete()
    test_user.delete()


def test_transaction_list_serializer():
    """Test TransactionListSerializer with timestamp→date mapping"""
    print("\n=== Testing TransactionListSerializer ===")
    
    # Create test data
    test_user = User.objects.create_user(
        email='test2@example.com',
        password=os.getenv('TEST_USER_PASSWORD', 'test123'),
        first_name='Test',
        last_name='User',
        role='member'
    )
    
    test_account = Account.objects.create(
        owner=test_user,
        account_number='987654321',
        type='Savings',
        balance=Decimal('500.00')
    )
    
    # Create test transaction
    test_transaction = Transaction.objects.create(
        account=test_account,
        type='deposit',
        amount=Decimal('250.00'),
        timestamp=datetime(2024, 1, 15, 10, 30, 0),
        cashier=test_user,
        description='Test deposit transaction'
    )
    
    # Test serialization
    serializer = TransactionListSerializer(test_transaction)
    data = serializer.data
    
    print(f"Original transaction data:")
    print(f"  ID: {test_transaction.id}")
    print(f"  Timestamp: {test_transaction.timestamp}")
    print(f"  Amount: {test_transaction.amount}")
    print(f"  Description: {test_transaction.description}")
    
    print(f"\nSerialized data:")
    print(f"  ID: {data['id']}")
    print(f"  Date: {data['date']}")
    print(f"  Amount: {data['amount']}")
    print(f"  Description: {data['description']}")
    
    # Validation
    assert 'id' in data, "Missing 'id' field"
    assert 'date' in data, "Missing 'date' field"
    assert 'amount' in data, "Missing 'amount' field"
    assert 'description' in data, "Missing 'description' field"
    assert data['date'] == '2024-01-15', f"Expected '2024-01-15', got '{data['date']}'"
    assert isinstance(data['amount'], float), f"Expected float, got {type(data['amount'])}"
    
    print(" TransactionListSerializer test PASSED")
    
    # Cleanup
    test_transaction.delete()
    test_account.delete()
    test_user.delete()


def test_account_summary_serializer():
    """Test FrontendAccountSummarySerializer with proper formatting"""
    print("\n=== Testing FrontendAccountSummarySerializer ===")
    
    # Test data
    summary_data = {
        'total_savings': Decimal('25000.75'),
        'total_loans': Decimal('15000.00'),
        'available_balance': Decimal('10000.75'),
        'monthly_contributions': Decimal('500.00'),
        'account_count': 5,
        'loan_count': 2
    }
    
    # Test serialization
    serializer = FrontendAccountSummarySerializer(data=summary_data)
    serializer.is_valid()
    data = serializer.validated_data
    
    print(f"Original summary data:")
    for key, value in summary_data.items():
        print(f"  {key}: {value} ({type(value).__name__})")
    
    print(f"\nSerialized data:")
    for key, value in data.items():
        print(f"  {key}: {value} ({type(value).__name__})")
    
    # Validation
    decimal_fields = ['total_savings', 'total_loans', 'available_balance', 'monthly_contributions']
    for field in decimal_fields:
        assert field in data, f"Missing '{field}' field"
        assert isinstance(data[field], float), f"Expected float for {field}, got {type(data[field])}"
    
    assert data['account_count'] == 5, f"Expected 5, got {data['account_count']}"
    assert data['loan_count'] == 2, f"Expected 2, got {data['loan_count']}"
    
    print(" FrontendAccountSummarySerializer test PASSED")


def test_backwards_compatibility():
    """Test that existing serializers still work"""
    print("\n=== Testing Backwards Compatibility ===")
    
    # Test original AccountSerializer
    from banking.serializers import AccountSerializer
    
    test_user = User.objects.create_user(
        email='test3@example.com',
        password=os.getenv('TEST_USER_PASSWORD', 'test123'),
        first_name='Test',
        last_name='User',
        role='member'
    )
    
    test_account = Account.objects.create(
        owner=test_user,
        account_number='555666777',
        type='Checking',
        balance=Decimal('750.25')
    )
    
    # Test original serializer still works
    serializer = AccountSerializer(test_account)
    data = serializer.data
    
    print(f"Original AccountSerializer data:")
    print(f"  Fields: {list(data.keys())}")
    
    # Should include all original fields
    expected_fields = ['id', 'owner', 'owner_email', 'account_number', 'type', 'balance', 'status']
    for field in expected_fields:
        assert field in data, f"Missing expected field '{field}'"
    
    print(" Backwards compatibility test PASSED")
    
    # Cleanup
    test_account.delete()
    test_user.delete()


def main():
    """Run all tests"""
    print("Starting Data Synchronization Tests...")
    print("=" * 50)
    
    try:
        test_account_list_serializer()
        test_transaction_list_serializer()
        test_account_summary_serializer()
        test_backwards_compatibility()
        
        print("\n" + "=" * 50)
        print("SUCCESS: ALL TESTS PASSED!")
        print("\nData synchronization fixes are working correctly:")
        print("* Account type->name mapping")
        print("* Transaction timestamp->date formatting (YYYY-MM-DD)")
        print("* Decimal->float conversion for frontend compatibility")
        print("* Backward compatibility maintained")
        
    except Exception as e:
        print(f"\nERROR: TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)