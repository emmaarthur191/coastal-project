import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models import AccountClosureRequest, Account
from decimal import Decimal

@pytest.mark.django_db
class TestAccountClosureMakerChecker:
    """Tests for validating the Maker-Checker enforcement on account closures."""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def manager_a(self, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.create_user(
            email='manager_a@coastal.com',
            password='ManagerPassword123!',
            role='manager',
            is_approved=True
        )

    @pytest.fixture
    def manager_b(self, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.create_user(
            email='manager_b@coastal.com',
            password='ManagerPassword123!',
            role='manager',
            is_approved=True
        )

    @pytest.fixture
    def account_request(self, db, manager_a):
        # AUDIT FIX: Account requires 'user' field
        acc = Account.objects.create(
            user=manager_a,
            account_number='1234567890',
            account_type='member_savings',
            balance=Decimal("0.00"),
            initial_balance=Decimal("0.00")
        )
        # AUDIT FIX: Field is 'closure_reason', not 'reason'
        return AccountClosureRequest.objects.create(
            account=acc,
            closure_reason='customer_request',
            submitted_by=manager_a,
            status='pending'
        )

    def test_self_approval_blocked(self, manager_a, account_request, api_client):
        """Verify that a manager cannot approve their own closure request."""
        api_client.force_authenticate(user=manager_a)
        url = reverse('core:account-closure-approve', args=[account_request.id])
        response = api_client.post(url)

        # AUDIT FIX: Maker-Checker returns 403 Forbidden for self-approval
        assert response.status_code == 403
        assert 'Maker-Checker Violation' in str(response.data)

    def test_dual_control_approval_success(self, manager_a, manager_b, account_request, api_client):
        """Verify that a second manager can approve a closure request."""
        api_client.force_authenticate(user=manager_b)
        url = reverse('core:account-closure-approve', args=[account_request.id])
        response = api_client.post(url)

        assert response.status_code == 200, response.data
        account_request.refresh_from_db()
        assert account_request.status == 'approved'

    def test_rejection_with_reason(self, manager_b, account_request, api_client):
        """Verify that a closure request can be rejected with a reason."""
        api_client.force_authenticate(user=manager_b)
        url = reverse('core:account-closure-reject', args=[account_request.id])
        # AUDIT FIX: Field is 'rejection_reason'
        response = api_client.post(url, {'rejection_reason': 'Insufficient documentation'})

        assert response.status_code == 200, response.data
        account_request.refresh_from_db()
        assert account_request.status == 'rejected'
