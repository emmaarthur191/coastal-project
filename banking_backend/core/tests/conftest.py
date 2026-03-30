from decimal import Decimal

from django.contrib.auth import get_user_model

import pytest

from core.models.accounts import Account

User = get_user_model()


@pytest.fixture
def sender_account(db):
    """Global fixture for a sender account with 10,000.00 balance."""
    user = User.objects.create_user(username="global_sender", email="sender@global.com", password="password123")
    return Account.objects.create(
        user=user,
        account_number="GLOB-SENDER-001",
        balance=Decimal("10000.00"),
        account_type="daily_susu",
        is_active=True,
    )


@pytest.fixture
def receiver_account(db):
    """Global fixture for a receiver account with 1,000.00 balance."""
    user = User.objects.create_user(username="global_receiver", email="receiver@global.com", password="password123")
    return Account.objects.create(
        user=user, account_number="GLOB-RCVR-001", balance=Decimal("1000.00"), account_type="daily_susu", is_active=True
    )


@pytest.fixture
def api_client():
    """Global DRF APIClient fixture."""
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def staff_user(db):
    """Global staff user fixture."""
    return User.objects.create_user(
        username="global_staff", email="staff@global.com", password="password123", is_staff=True, role="staff"
    )


@pytest.fixture
def manager_user(db):
    """Global manager user fixture for high-privilege operations."""
    return User.objects.create_user(
        username="global_manager", email="manager@global.com", password="password123", is_staff=True, role="manager"
    )


@pytest.fixture
def ops_manager_user(db):
    """Operations manager fixture for threshold testing (< 1,000 GHS)."""
    return User.objects.create_user(
        username="global_ops", email="ops@global.com", password="password123", is_staff=True, role="operations_manager"
    )


@pytest.fixture
def mobile_banker_user(db):
    """Mobile banker fixture for assignment-based testing."""
    return User.objects.create_user(
        username="global_mobile", email="mobile@global.com", password="password123", is_staff=True, role="mobile_banker"
    )


@pytest.fixture
def cashier_user(db):
    """Global cashier user fixture for office-based repayment testing."""
    return User.objects.create_user(
        username="global_cashier", email="cashier@global.com", password="password123", is_staff=True, role="cashier"
    )
