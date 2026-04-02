import time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from core.models.accounts import Account
from core.models.loans import Loan
from core.models.messaging import BankingMessage

User = get_user_model()


class RedTeamSimulationTest(TransactionTestCase):
    def setUp(self):
        # Setup users
        self.cust_a = User.objects.create_user(
            username="cust_a", email="a@example.com", password="password123", role="customer"
        )
        self.cust_b = User.objects.create_user(
            username="cust_b", email="b@example.com", password="password123", role="customer"
        )
        self.staff = User.objects.create_user(
            username="staff", email="staff@example.com", password="password123", role="staff", is_staff=True
        )
        self.manager = User.objects.create_user(
            username="mgr", email="mgr@example.com", password="password123", role="manager", is_staff=True
        )

        # Setup accounts
        self.acc_a = Account.objects.create(user=self.cust_a, balance=Decimal("100.00"), account_number="111122223333")
        self.acc_b = Account.objects.create(user=self.cust_b, balance=Decimal("100.00"), account_number="444455556666")

        # Setup Loan for B
        self.loan_b = Loan.objects.create(
            user=self.cust_b, amount=Decimal("1000.00"), status="pending", interest_rate=5, term_months=12
        )

        # Setup Message for B
        self.msg_b = BankingMessage.objects.create(user=self.cust_b, subject="Private")
        self.msg_b.body = "Secret"
        self.msg_b.save()

        self.client = APIClient()

    def login(self, user):
        self.client.force_authenticate(user=user)

    # --- IDOR ATTACKS ---
    def test_idor_loans(self):
        """ATTACK: Customer A attempts to view Customer B's Loan."""
        self.login(self.cust_a)
        url = reverse("core:loan-detail", kwargs={"pk": self.loan_b.pk})
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_idor_messages(self):
        """ATTACK: Customer A attempts to view Customer B's private Message."""
        self.login(self.cust_a)
        url = reverse("core:message-detail", kwargs={"pk": self.msg_b.pk})
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    # --- XSS ATTACKS ---
    def test_stored_xss_transaction(self):
        """ATTACK: Inject <script> into transaction description."""
        self.login(self.cust_a)
        url = reverse("core:transaction-list")
        payload = {
            "to_account": self.acc_b.id,
            "amount": "1.00",
            "transaction_type": "transfer",
            "description": "<script>alert('XSS')</script>SafeText",
        }
        response = self.client.post(url, payload)

        if response.status_code == status.HTTP_201_CREATED:
            from core.models.transactions import Transaction

            tx = Transaction.objects.get(id=response.data["id"])
            self.assertNotIn("<script>", tx.description)
            self.assertIn("SafeText", tx.description)

    # --- SQL INJECTION ATTACKS ---
    def test_sqli_boolean(self):
        """ATTACK: Boolean-based SQLi (' OR '1'='1) on search endpoints."""
        self.login(self.manager)
        sqli_payload = "' OR '1'='1"
        url = reverse("core:loan-list") + f"?search={sqli_payload}"
        response = self.client.get(url)

        count = response.data.get("count", len(response.data) if isinstance(response.data, list) else 0)
        self.assertLess(count, Loan.objects.count())

    def test_sqli_time_blind(self):
        """ATTACK: Time-based blind SQLi (sleep/delay) to infiltrate the DB logic."""
        url = reverse("users:login")
        payload = {"email": "mgr@example.com' AND (SELECT 1 FROM (SELECT(SLEEP(2)))a)--", "password": "wrong"}

        start_time = time.time()
        self.client.post(url, payload)
        duration = time.time() - start_time
        self.assertLess(duration, 2.0, f"Potential Time-based SQLi detected! {duration:.2f}s")

    def test_sqli_union(self):
        """ATTACK: Union-based SQLi to attempt cross-table data leakage."""
        self.login(self.manager)
        union_payload = "' UNION SELECT password, NULL, NULL FROM users_user--"
        url = reverse("core:loan-list") + f"?search={union_payload}"
        response = self.client.get(url)

        self.assertIn(
            response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]
        )
        content = str(response.data)
        self.assertNotIn("pbkdf2_sha256", content)

    # --- IAO & MAKER-CHECKER ATTACKS ---
    def test_iao_self_approval(self):
        """ATTACK: Customer attempts to approve their own loan."""
        self.login(self.cust_b)
        url = reverse("core:loan-approve", kwargs={"pk": self.loan_b.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_maker_checker_violation(self):
        """ATTACK: Staff attempts to approve their own loan request."""
        loan_mgr = Loan.objects.create(
            user=self.manager, amount=Decimal("1000.00"), status="pending", interest_rate=5, term_months=12
        )
        self.login(self.manager)
        url = reverse("core:loan-approve", kwargs={"pk": loan_mgr.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
