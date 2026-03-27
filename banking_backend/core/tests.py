from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .exceptions import InsufficientFundsError
from .models import Account, Loan, Transaction
from .services import AccountService, BankingMessageService, FraudAlertService, LoanService, TransactionService

User = get_user_model()


class AccountModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_model", password="testpass", role="customer", email="model@test.com"
        )

    def test_account_creation(self):
        account = AccountService.create_account(self.user, "daily_susu")
        self.assertEqual(account.user, self.user)
        self.assertEqual(account.account_type, "daily_susu")
        self.assertEqual(account.balance, Decimal("0.00"))
        self.assertTrue(account.is_active)


class TransactionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_trans", password="testpass", role="customer", email="trans@test.com"
        )
        self.from_account = AccountService.create_account(self.user, "daily_susu")
        self.to_account = AccountService.create_account(self.user, "member_savings")
        self.from_account.balance = Decimal("100.00")
        self.from_account.save()

    def test_transaction_creation(self):
        transaction = TransactionService.create_transaction(
            self.from_account, self.to_account, Decimal("50.00"), "transfer", "Test transfer"
        )
        self.assertEqual(transaction.amount, Decimal("50.00"))
        self.assertEqual(transaction.transaction_type, "transfer")
        self.assertEqual(transaction.status, "completed")
        self.from_account.refresh_from_db()
        self.to_account.refresh_from_db()
        self.assertEqual(self.from_account.balance, Decimal("50.00"))
        self.assertEqual(self.to_account.balance, Decimal("50.00"))

    def test_insufficient_funds(self):
        with self.assertRaises(InsufficientFundsError):
            TransactionService.validate_transaction(self.from_account, self.to_account, Decimal("200.00"), "transfer")


class LoanModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_loan", password="testpass", role="customer", email="loan@test.com"
        )
        # Create an account for loan disbursement
        AccountService.create_account(self.user, "member_savings")

    def test_loan_creation(self):
        loan = LoanService.create_loan(self.user, Decimal("1000.00"), Decimal("5.00"), 12)
        self.assertEqual(loan.amount, Decimal("1000.00"))
        self.assertEqual(loan.status, "pending")

    def test_loan_approval(self):
        loan = LoanService.create_loan(self.user, Decimal("1000.00"), Decimal("5.00"), 12)
        LoanService.approve_loan(loan)
        loan.refresh_from_db()
        self.assertEqual(loan.status, "approved")
        self.assertIsNotNone(loan.approved_at)


class FraudAlertModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_fraud", password="testpass", role="customer", email="fraud@test.com"
        )

    def test_fraud_alert_creation(self):
        alert = FraudAlertService.create_alert(self.user, "Suspicious activity detected", "high")
        self.assertEqual(alert.severity, "high")
        self.assertFalse(alert.is_resolved)

    def test_fraud_alert_resolution(self):
        alert = FraudAlertService.create_alert(self.user, "Suspicious activity detected", "high")
        FraudAlertService.resolve_alert(alert)
        alert.refresh_from_db()
        self.assertTrue(alert.is_resolved)
        self.assertIsNotNone(alert.resolved_at)


class BankingMessageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_msg", password="testpass", role="customer", email="msg@test.com"
        )

    def test_message_creation(self):
        message = BankingMessageService.create_message(self.user, "Welcome", "Welcome to our banking app!")
        self.assertEqual(message.subject, "Welcome")
        self.assertFalse(message.is_read)

    def test_message_mark_read(self):
        message = BankingMessageService.create_message(self.user, "Welcome", "Welcome to our banking app!")
        BankingMessageService.mark_as_read(message)
        message.refresh_from_db()
        self.assertTrue(message.is_read)
        self.assertIsNotNone(message.read_at)


class AccountAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_api_acc", password="testpass", role="customer", email="api_acc@test.com"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_account(self):
        response = self.client.post("/api/accounts/", {"account_type": "daily_susu"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Account.objects.count(), 1)

    def test_list_accounts(self):
        AccountService.create_account(self.user, "daily_susu")
        response = self.client.get("/api/accounts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle potential pagination
        data = response.data.get("results", response.data)
        self.assertEqual(len(data), 1)


class TransactionAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_api_trans", password="testpass", role="customer", email="api_trans@test.com"
        )
        self.from_account = AccountService.create_account(self.user, "daily_susu")
        self.to_account = AccountService.create_account(self.user, "member_savings")
        self.from_account.balance = Decimal("100.00")
        self.from_account.save()
        self.client.force_authenticate(user=self.user)

    def test_create_transaction(self):
        data = {
            "from_account": self.from_account.id,
            "to_account": self.to_account.id,
            "amount": "50.00",
            "transaction_type": "transfer",
            "description": "Test transfer",
        }
        response = self.client.post("/api/transactions/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 1)


class LoanAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_api_loan", password="testpass", role="customer", email="api_loan@test.com"
        )
        # Create an account for loan disbursement
        AccountService.create_account(self.user, "member_savings")
        self.client.force_authenticate(user=self.user)

    def test_create_loan(self):
        data = {"amount": "1000.00", "interest_rate": "5.00", "term_months": 12}
        response = self.client.post("/api/loans/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Loan.objects.count(), 1)


class FraudAlertAPITest(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="staff_api", password="testpass", role="staff", email="staff_api@test.com"
        )
        self.customer_user = User.objects.create_user(
            username="customer_api", password="testpass", role="customer", email="customer_api@test.com"
        )

    def test_create_alert_as_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {"user": self.customer_user.id, "message": "Suspicious activity", "severity": "high"}
        response = self.client.post("/api/fraud-alerts/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class BankingMessageAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_api_msg", password="testpass", role="customer", email="api_msg@test.com"
        )
        self.client.force_authenticate(user=self.user)

    def test_list_messages(self):
        BankingMessageService.create_message(self.user, "Test", "Test message")
        response = self.client.get("/api/messages/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle potential pagination
        data = response.data.get("results", response.data)
        self.assertEqual(len(data), 1)

    def test_mark_read(self):
        message = BankingMessageService.create_message(self.user, "Test", "Test message")
        response = self.client.post(f"/api/messages/{message.id}/mark-read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        message.refresh_from_db()
        self.assertTrue(message.is_read)
