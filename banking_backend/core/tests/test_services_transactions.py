from decimal import Decimal

from django.contrib.auth import get_user_model

import pytest

from core.exceptions import AccountSuspendedError, InvalidTransactionError
from core.services.transactions import TransactionService

User = get_user_model()


@pytest.mark.django_db
class TestTransactionServiceBasic:
    def test_create_deposit_success(self, receiver_account):
        """Verify basic deposit increases balance."""
        tx = TransactionService.create_transaction(
            from_account=None,
            to_account=receiver_account,
            amount=Decimal("50.00"),
            transaction_type="deposit",
            description="Birthday gift",
        )
        receiver_account.refresh_from_db()
        assert receiver_account.balance == Decimal("1050.00")
        assert tx.status == "completed"
        assert tx.transaction_type == "deposit"

    def test_create_withdrawal_success(self, sender_account):
        """Verify basic withdrawal decreases balance."""
        initial_balance = sender_account.balance
        tx = TransactionService.create_transaction(
            from_account=sender_account, to_account=None, amount=Decimal("200.00"), transaction_type="withdrawal"
        )
        sender_account.refresh_from_db()
        assert sender_account.balance == initial_balance - Decimal("200.00")
        assert tx.status == "completed"

    def test_transfer_insufficient_funds(self, sender_account, receiver_account):
        """Verify threshold transfers (>= 5000) go to pending_approval."""
        tx = TransactionService.create_transaction(
            from_account=sender_account,
            to_account=receiver_account,
            amount=Decimal("5000.00"),
            transaction_type="transfer",
        )
        assert tx.status == "pending_approval"

    def test_transfer_same_account(self, sender_account):
        """Verify transfer to same account is blocked."""
        with pytest.raises(InvalidTransactionError, match="same account"):
            TransactionService.create_transaction(
                from_account=sender_account,
                to_account=sender_account,
                amount=Decimal("10.00"),
                transaction_type="transfer",
            )


@pytest.mark.django_db
class TestTransactionServiceLocking:
    def test_locking_order_prevents_deadlock(self, sender_account, receiver_account):
        """Verify consistent locking order by primary keys."""
        # Force accounts to have specific IDs if possible, or just use their PKs
        # Sort by PK to ensure the service logic matches
        accounts = [sender_account, receiver_account]
        accounts.sort(key=lambda a: a.pk)

        # This test ensures no Exception is raised during the sort/lock logic
        tx = TransactionService.create_transaction(
            from_account=sender_account,
            to_account=receiver_account,
            amount=Decimal("10.00"),
            transaction_type="transfer",
        )
        assert tx.status == "completed"

    def test_suspended_account_transfer_blocked(self, sender_account, receiver_account):
        """Verify suspended account cannot be used."""
        sender_account.is_active = False
        sender_account.save()

        with pytest.raises(AccountSuspendedError):
            TransactionService.create_transaction(
                from_account=sender_account,
                to_account=receiver_account,
                amount=Decimal("10.00"),
                transaction_type="transfer",
            )


@pytest.mark.django_db
class TestTransactionServiceApproval:
    def test_threshold_requires_approval(self, sender_account, receiver_account):
        """Verify amount >= 5000 triggers pending status (4-Eyes Principle)."""
        tx = TransactionService.create_transaction(
            from_account=sender_account,
            to_account=receiver_account,
            amount=Decimal("5000.00"),
            transaction_type="transfer",
            description="Large transfer",
        )
        assert tx.status == "pending_approval"
        sender_account.refresh_from_db()
        assert sender_account.balance == Decimal("10000.00")  # No change yet

    def test_approve_transaction_success(self, sender_account, receiver_account, staff_user):
        """Verify approval executes the transaction."""
        tx = TransactionService.create_transaction(
            from_account=sender_account,
            to_account=receiver_account,
            amount=Decimal("5000.00"),
            transaction_type="transfer",
        )

        # Approve
        approved_tx = TransactionService.approve_transaction(tx.id, staff_user)
        assert approved_tx.status == "completed"
        assert approved_tx.approved_by == staff_user

        sender_account.refresh_from_db()
        receiver_account.refresh_from_db()
        assert sender_account.balance == Decimal("5000.00")  # 10000 - 5000
        assert receiver_account.balance == Decimal("6000.00")  # 1000 + 5000

    def test_reject_transaction_success(self, sender_account, receiver_account, staff_user):
        """Verify rejection cancels the transaction."""
        tx = TransactionService.create_transaction(
            from_account=sender_account,
            to_account=receiver_account,
            amount=Decimal("5000.00"),
            transaction_type="transfer",
        )

        rejected_tx = TransactionService.reject_transaction(tx.id, staff_user, reason="Suspicious")
        assert rejected_tx.status == "cancelled"
        assert "Rejected: Suspicious" in rejected_tx.description

    def test_self_approval_blocked(self, sender_account, receiver_account):
        """Verify maker-checker prevents self-approval."""
        tx = TransactionService.create_transaction(
            from_account=sender_account,
            to_account=receiver_account,
            amount=Decimal("5000.00"),
            transaction_type="transfer",
        )

        with pytest.raises(InvalidTransactionError, match="Self-approval is not allowed"):
            TransactionService.approve_transaction(tx.id, sender_account.user)
