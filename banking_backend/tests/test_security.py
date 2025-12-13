"""
Security Test Suite for Coastal Banking Application.

These tests specifically target known vulnerability patterns:
- Double Spend (Race Condition)
- Unauthorized Access
- Negative Value Injection

Run with: pytest tests/test_security.py -v
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Account, Transaction

User = get_user_model()


@pytest.fixture
def user_a(db):
    """Create test user A."""
    return User.objects.create_user(
        email='user_a@test.com', username='user_a', password='testpass123', role='customer'
    )


@pytest.fixture
def user_b(db):
    """Create test user B."""
    return User.objects.create_user(
        email='user_b@test.com', username='user_b', password='testpass123', role='customer'
    )


@pytest.fixture
def staff_user(db):
    """Create a staff user for processing transactions."""
    return User.objects.create_user(
        email='staff@test.com', username='staff', password='testpass123', 
        role='cashier', is_staff=True
    )


@pytest.fixture
def account_a(db, user_a):
    """Create account for user A with 1000 balance."""
    return Account.objects.create(
        user=user_a, account_number='2231000000001', 
        account_type='daily_susu', balance=Decimal('1000.00')
    )


@pytest.fixture
def account_b(db, user_b):
    """Create account for user B with 500 balance."""
    return Account.objects.create(
        user=user_b, account_number='2231000000002', 
        account_type='daily_susu', balance=Decimal('500.00')
    )


class TestDoubleSpend:
    """
    TEST 1: The "Double Spend" Test
    Try to withdraw money twice instantly - should NOT exceed balance.
    """
    
    @pytest.mark.django_db(transaction=True)
    def test_concurrent_withdrawal_prevents_double_spend(self, user_a, account_a, staff_user):
        """Two simultaneous withdrawals of 600 should fail one (balance is 1000)."""
        from concurrent.futures import ThreadPoolExecutor
        
        def withdraw():
            # Each thread gets its own client
            client = APIClient()
            client.force_authenticate(user=staff_user)
            return client.post('/api/transactions/process/', {
                'member_id': user_a.id,
                'amount': '600.00',
                'type': 'withdrawal',
                'account_type': 'daily_susu'
            })
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: withdraw(), range(2)))
        
        # Count successes
        successes = [r for r in results if r.status_code == 200]
        
        # Reload account
        account_a.refresh_from_db()
        
        # ASSERTION: Only ONE should succeed (due to select_for_update locking)
        assert len(successes) <= 1, f"Double spend occurred! Both transactions succeeded."
        assert account_a.balance >= Decimal('0'), "Balance went negative!"


class TestUnauthorizedAccess:
    """
    TEST 2: The "Unauthorized Access" Test
    User A should NOT be able to fetch User B's account details.
    """
    
    @pytest.mark.django_db
    def test_user_cannot_access_other_user_account(self, user_a, user_b, account_b):
        """User A tries to access User B's account - should be denied."""
        client = APIClient()
        client.force_authenticate(user=user_a)
        
        # User A tries to access User B's account
        response = client.get(f'/api/accounts/{account_b.id}/')
        
        # ASSERTION: Should be 404 (not found in their queryset) or 403
        assert response.status_code in [403, 404], \
            f"User A accessed User B's account! Status: {response.status_code}"


class TestNegativeValue:
    """
    TEST 3: The "Negative Value" Test
    Attempting to transfer a negative amount should be rejected.
    """
    
    @pytest.mark.django_db
    def test_negative_transfer_is_rejected(self, user_a, account_a, staff_user):
        """Negative amount should be rejected with 400."""
        client = APIClient()
        client.force_authenticate(user=staff_user)
        
        response = client.post('/api/transactions/process/', {
            'member_id': user_a.id,
            'amount': '-1000.00',
            'type': 'deposit',
            'account_type': 'daily_susu'
        })
        
        # ASSERTION: Should be rejected with 400
        assert response.status_code == 400, \
            f"Negative amount accepted! Status: {response.status_code}"
        
        # Verify balance unchanged
        account_a.refresh_from_db()
        assert account_a.balance == Decimal('1000.00'), "Balance changed with negative amount!"
    
    @pytest.mark.django_db
    def test_zero_amount_is_rejected(self, user_a, account_a, staff_user):
        """Zero amount should be rejected with 400."""
        client = APIClient()
        client.force_authenticate(user=staff_user)
        
        response = client.post('/api/transactions/process/', {
            'member_id': user_a.id,
            'amount': '0.00',
            'type': 'deposit',
            'account_type': 'daily_susu'
        })
        
        assert response.status_code == 400, \
            f"Zero amount accepted! Status: {response.status_code}"
