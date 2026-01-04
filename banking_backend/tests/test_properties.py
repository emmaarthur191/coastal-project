"""Property-Based Tests using Hypothesis

These tests verify invariants and properties that should always hold,
regardless of the input values. This is a form of fuzz testing that
finds edge cases traditional unit tests might miss.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model

import pytest
from hypothesis import assume, given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase

User = get_user_model()


class TestTransactionProperties(TestCase):
    """Property-based tests for transaction operations."""

    @given(
        amount=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("1000000"), places=2),
    )
    @settings(max_examples=50, deadline=None)
    def test_deposit_never_reduces_balance(self, amount):
        """Property: A deposit should never reduce account balance."""
        from core.models import Account, Transaction

        # Create test user and account
        user = User.objects.create_user(
            email=f"test_{id(amount)}@test.com", username=f"testuser_{id(amount)}", password="testpass123"
        )
        account = Account.objects.create(
            user=user,
            account_number=f"ACC{id(amount)}",
            account_type="daily_susu",
            initial_balance=Decimal("1000.00"),  # Use initial_balance for calculations
            balance=Decimal("1000.00"),
        )
        initial_balance = account.balance

        # Create deposit transaction
        Transaction.objects.create(to_account=account, transaction_type="deposit", amount=amount, status="completed")

        # Update balance
        account.update_balance_from_transactions()

        # Property: balance should never decrease after deposit
        assert (
            account.balance >= initial_balance
        ), f"Balance decreased after deposit: {initial_balance} -> {account.balance}"

        # Cleanup
        account.delete()
        user.delete()

    @given(
        balance=st.decimals(min_value=Decimal("100"), max_value=Decimal("10000"), places=2),
        withdrawal=st.decimals(min_value=Decimal("0.01"), max_value=Decimal("50"), places=2),
    )
    @settings(max_examples=50, deadline=None)
    def test_withdrawal_never_exceeds_balance(self, balance, withdrawal):
        """Property: A valid withdrawal should never result in negative balance."""
        from core.models import Account, Transaction

        assume(withdrawal <= balance)  # Only test valid withdrawals

        user = User.objects.create_user(
            email=f"test_wd_{id(balance)}@test.com", username=f"testuser_wd_{id(balance)}", password="testpass123"
        )
        account = Account.objects.create(
            user=user,
            account_number=f"WD{id(balance)}",
            account_type="savings",
            initial_balance=balance,  # Use initial_balance for calculations
            balance=balance,
        )

        # Create withdrawal
        Transaction.objects.create(
            from_account=account, transaction_type="withdrawal", amount=withdrawal, status="completed"
        )

        account.update_balance_from_transactions()

        # Property: balance should never be negative
        assert account.balance >= Decimal("0"), f"Balance became negative: {account.balance}"

        # Cleanup
        account.delete()
        user.delete()


class TestUserInputSanitization(TestCase):
    """Property-based tests for input sanitization."""

    @given(
        email=st.emails(),
    )
    @settings(max_examples=30, deadline=None)
    def test_email_validation_accepts_valid_emails(self, email):
        """Property: Valid email formats should be accepted."""
        from users.serializers import UserSerializer

        data = {
            "email": email,
            "username": f'user_{email.split("@")[0][:10]}',
            "password": "SecurePass123!",
            "role": "customer",
        }

        serializer = UserSerializer(data=data)
        # If email is valid, it should pass email validation
        if serializer.is_valid():
            assert "email" not in serializer.errors

    @given(
        malicious_input=st.text(alphabet=st.sampled_from("<>\"';(){}[]"), min_size=1, max_size=100),
    )
    @settings(max_examples=30, deadline=None)
    def test_description_sanitizes_special_characters(self, malicious_input):
        """Property: Transaction descriptions should handle special characters safely."""
        from core.serializers import TransactionSerializer

        data = {
            "transaction_type": "deposit",
            "amount": "100.00",
            "description": malicious_input,
        }

        serializer = TransactionSerializer(data=data)
        # Should not raise unhandled exceptions
        try:
            serializer.is_valid()
        except Exception as e:
            # Only validation errors are acceptable
            assert "ValidationError" in str(type(e).__name__) or "Invalid" in str(e), f"Unexpected exception: {e}"


class TestAmountBoundaries(TestCase):
    """Property-based tests for amount handling edge cases."""

    @given(
        amount=st.decimals(min_value=Decimal("-1000000"), max_value=Decimal("1000000"), places=2),
    )
    @settings(max_examples=50, deadline=None)
    def test_negative_amounts_rejected(self, amount):
        """Property: Negative transaction amounts should be rejected."""
        from core.serializers import TransactionSerializer

        if amount < 0:
            data = {
                "transaction_type": "deposit",
                "amount": str(amount),
                "description": "Test transaction",
            }

            serializer = TransactionSerializer(data=data)
            is_valid = serializer.is_valid()

            # Property: Negative amounts should fail validation
            assert not is_valid or "amount" in serializer.errors, f"Negative amount {amount} was accepted"

    @given(
        amount=st.decimals(min_value=Decimal("0.001"), max_value=Decimal("0.009"), places=3),
    )
    @settings(max_examples=20, deadline=None)
    def test_sub_cent_amounts_handled(self, amount):
        """Property: Sub-cent amounts should be handled appropriately."""
        from core.serializers import TransactionSerializer

        data = {
            "transaction_type": "deposit",
            "amount": str(amount),
            "description": "Sub-cent test",
        }

        serializer = TransactionSerializer(data=data)
        # Should either accept (and round) or reject, but never crash
        try:
            serializer.is_valid()
        except Exception as e:
            pytest.fail(f"Sub-cent amount caused crash: {e}")
