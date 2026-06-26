import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock
from conftest import TEST_PASSWORD
from django.db import IntegrityError
from core.services.accounts import AccountService
from core.services.transactions import TransactionService
from core.models.accounts import Account
from core.models.transactions import Transaction
from core.exceptions import OperationalError, InvalidTransactionError, AccountSuspendedError
from users.models import User, AuditLog

@pytest.fixture
def db_user(db):
    return User.objects.create_user(username="srv_user", email="srv@ex.com", password=TEST_PASSWORD, is_approved=True)

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(username="srv_mgr", email="mgr@ex.com", password=TEST_PASSWORD, role="manager", is_approved=True)

@pytest.mark.django_db
class TestAccountService:
    def test_luhn_algorithm(self):
        num = "223187654321"
        checksum = AccountService._calculate_luhn(num)
        assert 0 <= checksum <= 9

    def test_create_account_collision_retry(self, db_user):
        with patch('core.models.accounts.Account.objects.filter') as mock_filter:
            mock_qs = MagicMock()
            mock_qs.exists.side_effect = [True, False]
            mock_filter.return_value = mock_qs
            
            account = AccountService.create_account(db_user, initial_balance=Decimal("10.00"))
            assert account.balance == 10.00
            assert mock_qs.exists.call_count == 2

    def test_account_locking_flow(self, db_user):
        acc = Account.objects.create(user=db_user, account_number="LOCK-123")
        AccountService.lock_account(acc, reason="Safety check")
        acc.refresh_from_db()
        assert acc.is_active is False
        audit = AuditLog.objects.filter(object_id=str(acc.id), object_repr__startswith="Lock Account").first()
        assert audit is not None
        assert "Lock Account" in audit.object_repr
        assert audit.changes["reason"] == "Safety check"

@pytest.mark.django_db
class TestTransactionService:
    @patch('core.services.transactions.MLFraudDetector.predict')
    def test_transaction_approval_threshold(self, mock_predict, db_user):
        mock_predict.return_value = {"is_anomaly": False, "risk_level": "low"}
        acc1 = Account.objects.create(user=db_user, account_number="T1", balance=10000)
        acc2 = Account.objects.create(user=db_user, account_number="T2", balance=0)
        tx = TransactionService.create_transaction(acc1, acc2, Decimal("6000.00"), "transfer")
        assert tx.status == "pending_approval"
        acc1.refresh_from_db()
        assert acc1.balance == 10000

    def test_self_approval_violation(self, db_user, manager_user):
        acc1 = Account.objects.create(user=db_user, account_number="TS1", balance=1000)
        tx = Transaction.objects.create(from_account=acc1, amount=100, transaction_type="withdrawal", status="pending_approval")
        acc1.user = manager_user
        acc1.save()
        with pytest.raises(InvalidTransactionError, match="Self-approval is not allowed"):
            TransactionService.approve_transaction(tx.id, manager_user)

    def test_transaction_reversal(self, db_user, manager_user):
        acc = Account.objects.create(user=db_user, account_number="REV-1", balance=500)
        tx = Transaction.objects.create(to_account=acc, amount=200, transaction_type="deposit", status="completed")
        TransactionService.reverse_transaction(tx.id, manager_user, reason="Error")
        acc.refresh_from_db()
        assert acc.balance == 300
        tx.refresh_from_db()
        assert tx.status == "reversed"
