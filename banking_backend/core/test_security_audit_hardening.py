import time
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import Account, Loan

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def users(db):
    customer = User.objects.create_user(
        username="customer", email="customer@example.com", password="password123", role="customer"
    )
    staff = User.objects.create_user(
        username="staff", email="staff@example.com", password="password123", role="staff", is_staff=True
    )
    manager = User.objects.create_user(
        username="manager", email="manager@example.com", password="password123", role="manager", is_staff=True
    )
    ops_manager = User.objects.create_user(
        username="ops_mgr", email="ops@example.com", password="password123", role="operations_manager", is_staff=True
    )
    return {"customer": customer, "staff": staff, "manager": manager, "ops_manager": ops_manager}


@pytest.mark.django_db
class TestRedTeamAuditHardening:
    def test_loan_status_mass_assignment_bypass(self, api_client, users):
        """Red Team: Attempt to manually 'Approve' a loan via PATCH to bypass review."""
        loan = Loan.objects.create(
            user=users["customer"],
            amount=Decimal("500.00"),
            status="pending",
            interest_rate=Decimal("15.00"),
            term_months=12,
        )
        api_client.force_authenticate(user=users["staff"])

        url = reverse("core:loan-detail", kwargs={"pk": loan.pk})
        response = api_client.patch(url, {"status": "approved"})

        assert response.status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.status == "pending"  # Should NOT change to approved

    def test_bola_loan_creation_for_arbitrary_customer(self, api_client, users):
        """Red Team: Low-level staff attempting to create a loan for a non-assigned customer."""
        api_client.force_authenticate(user=users["staff"])

        url = reverse("core:loan-list")
        response = api_client.post(
            url, {"user": users["customer"].id, "amount": "1000.00", "term_months": 12, "interest_rate": 5}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only Managers or Mobile Bankers" in response.data["detail"]

    def test_otp_expiration_bypass_via_missing_timestamp(self, api_client, users):
        """Defensive: Verify that OTP expires and cannot be used indefinitely."""
        api_client.force_authenticate(user=users["customer"])

        # 1. Trigger OTP
        with patch("users.views.SendexaService.send_sms", return_value=(True, "Mock success")):
            api_client.post(reverse("send-otp"), {"phone_number": "+233200000000"})

        # 2. Get code from session and mock expiration
        session = api_client.session
        otp_code = session.get("otp_code")
        assert otp_code is not None

        session["otp_created_at"] = time.time() - 700  # 11+ minutes ago
        session.save()

        # 3. Verify
        response = api_client.post(reverse("verify-otp"), {"phone_number": "+233200000000", "otp_code": otp_code})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Check either 'error' or 'detail' depending on exception handler
        error_msg = response.data.get("error", "") or response.data.get("detail", "")
        assert "expired" in str(error_msg).lower()

    def test_loan_approval_limit_bypass_via_detail_view(self, api_client, users):
        """Red Team: Ops Manager attempting to access/approve a large loan through detail endpoint."""
        large_loan = Loan.objects.create(
            user=users["customer"],
            amount=Decimal("5000.00"),
            status="pending",
            interest_rate=Decimal("15.00"),
            term_months=12,
        )
        api_client.force_authenticate(user=users["ops_manager"])

        url = reverse("core:loan-detail", kwargs={"pk": large_loan.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        # Handle both custom and generic DRF messages
        detail = str(response.data.get("detail", ""))
        assert "Escalate to Manager" in detail or "permission" in detail.lower()

    def test_loan_repayment_deducts_funds(self, api_client, users):
        """Integrity: Verify that repaying a loan actually takes money from the customer's account."""
        account = Account.objects.create(
            user=users["customer"], balance=Decimal("1000.00"), account_number="223100001111"
        )
        loan = Loan.objects.create(
            user=users["customer"],
            amount=Decimal("500.00"),
            status="approved",
            outstanding_balance=Decimal("500.00"),
            interest_rate=Decimal("15.00"),
            term_months=12,
        )

        from core.services import LoanService

        LoanService.repay_loan(loan, Decimal("200.00"))

        account.refresh_from_db()
        loan.refresh_from_db()

        assert account.balance == Decimal("800.00")
        assert loan.outstanding_balance == Decimal("300.00")

    def test_account_closure_maker_checker_bypass(self, api_client, users):
        """Black Team: Verify that a staff member cannot approve their own closure request."""
        account = Account.objects.create(
            user=users["customer"], balance=Decimal("100.00"), account_number="223100002222"
        )
        from core.models import AccountClosureRequest

        closure_request = AccountClosureRequest.objects.create(
            account=account,
            closure_reason="customer_request",
            phone_number="+233200000000",
            submitted_by=users["manager"],
        )
        api_client.force_authenticate(user=users["manager"])

        url = reverse("core:account-closure-approve", kwargs={"pk": closure_request.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Maker-Checker Violation" in response.data["message"]

    def test_pii_masking_in_audit_logs(self, api_client, users):
        """Black Team: Verify that full account numbers are masked in audit logs."""
        from_acc = Account.objects.create(
            user=users["customer"], balance=Decimal("1000.00"), account_number="223100001111"
        )
        to_acc = Account.objects.create(
            user=users["manager"], balance=Decimal("1000.00"), account_number="223100002222"
        )

        from core.services import TransactionService

        TransactionService.create_transaction(from_acc, to_acc, Decimal("100.00"), "transfer", "test masking")

        from users.models import AuditLog

        last_log = AuditLog.objects.filter(model_name="Transaction").latest("created_at")

        changes = last_log.changes
        assert changes["from_account"] == "...1111"
        assert changes["to_account"] == "...2222"
        assert "223100001111" not in str(changes)

    def test_pii_field_encryption_on_save(self, db):
        """Black Team: Verify that PII is automatically encrypted on save."""
        # Test User encryption
        user = User.objects.create_user(
            username="encrypt_test",
            email="encrypt@example.com",
            password="password123",
            phone_number="+233200009999",
            id_number="GHA-123456789-0",
        )
        user.refresh_from_db()
        assert user.phone_number_encrypted != ""
        assert user.id_number_encrypted != ""
        assert user.phone_number_encrypted != user.phone_number
        assert user.id_number_encrypted != user.id_number

        # Verify it looks like Fernet (starts with gAAAA)
        assert user.phone_number_encrypted.startswith("gAAAA")

        # Test AccountOpeningRequest encryption
        from core.models import AccountOpeningRequest

        request = AccountOpeningRequest.objects.create(
            first_name="Test",
            last_name="Enc",
            phone_number="+233200008888",
            id_number="GHA-987654321-0",
            date_of_birth="1990-01-01",
        )
        request.refresh_from_db()
        assert request.phone_number_encrypted != ""
        assert request.id_number_encrypted != ""
        assert request.phone_number_encrypted.startswith("gAAAA")
