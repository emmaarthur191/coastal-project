import pytest
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from core.models.accounts import Account, AccountClosureRequest, AccountOpeningRequest
from core.models.transactions import Transaction
from users.models import User
from unittest.mock import patch, MagicMock

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    client = APIClient()
    return client

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="mgr_acc", email="mgr_acc@example.com", password="Password123!", role="manager", is_approved=True, is_staff=True
    )

@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff_acc", email="staff_acc@example.com", password="Password123!", role="staff", is_approved=True, is_staff=True
    )

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="cust_acc", email="cust_acc@example.com", password="Password123!", role="customer", is_approved=True
    )

@pytest.fixture
def cashier_user(db):
    return User.objects.create_user(
        username="cashier_acc", email="cashier_acc@example.com", password="Password123!", role="cashier", is_approved=True, is_staff=True
    )

@pytest.fixture
def account_1(customer_user):
    return Account.objects.create(
        user=customer_user, account_number="ACC_001", balance=Decimal("10000.00"), account_type="daily_susu", is_active=True
    )

@pytest.mark.django_db
class TestAccountLifecycleCoverage:
    def test_account_detail_and_history(self, api_client, manager_user, account_1):
        api_client.force_authenticate(user=manager_user)
        response = api_client.get(reverse("core:account-detail", args=[account_1.id]))
        assert response.status_code == status.HTTP_200_OK

    def test_account_status_management(self, api_client, manager_user, account_1):
        api_client.force_authenticate(user=manager_user)
        api_client.post(reverse("core:account-freeze", args=[account_1.id]), {"reason": "Test"})
        account_1.refresh_from_db()
        assert not account_1.is_active
        api_client.post(reverse("core:account-unfreeze", args=[account_1.id]))
        account_1.refresh_from_db()
        assert account_1.is_active

    def test_account_opening_full_workflow(self, api_client, manager_user, staff_user):
        opening_req = AccountOpeningRequest.objects.create(
            first_name="Jane", last_name="Doe", email="jane@example.com", phone_number="+233111222333",
            account_type="daily_susu", initial_deposit=Decimal("100.00"), submitted_by=staff_user, status="pending"
        )
        api_client.force_authenticate(user=manager_user)
        with patch("users.services.SendexaService.send_sms", return_value=True):
            assert api_client.post(reverse("core:account-opening-approve", args=[opening_req.id])).status_code == status.HTTP_200_OK
            assert api_client.post(reverse("core:account-opening-dispatch-credentials", args=[opening_req.id])).status_code == status.HTTP_200_OK
            opening_req.refresh_from_db()
            assert opening_req.status == "completed"

    def test_paper_first_submission_and_approval_workflow(self, api_client, manager_user, staff_user):
        """Test the new Paper-First approach: Submit -> Approve & Print."""
        # 1. Public Submission (Paper-First entry point)
        url_submit = reverse("core:account-opening-submit-request")
        sub_data = {
            "first_name": "Paper", "last_name": "User", "email": "paper@example.com",
            "phone_number": "+233555666777", "account_type": "daily_susu",
            "id_type": "ghana_card", "id_number": "GHA-123456"
        }
        # Clear any session to ensure no OTP dependency
        api_client.logout() 
        response = api_client.post(url_submit, sub_data)
        assert response.status_code == status.HTTP_201_CREATED
        req_id = response.data["data"]["id"]

        # 2. Manager Approval & PDF Printing
        api_client.force_authenticate(user=manager_user)
        url_print = reverse("core:account-opening-approve-and-print", args=[req_id])
        
        with patch("users.services.SendexaService.send_sms", return_value=(True, "OK")):
            # Approve and Print returns a FileResponse (PDF)
            print_resp = api_client.post(url_print, {"kyc_verified": True}, format="json")
            assert print_resp.status_code == status.HTTP_200_OK
            assert print_resp["Content-Type"] == "application/pdf"
            pdf_content = print_resp.content
            assert b"%PDF" in pdf_content

        # 3. Verify Account Creation
        opening_req = AccountOpeningRequest.objects.get(id=req_id)
        assert opening_req.status == "completed"
        assert opening_req.approved_by == manager_user
        assert opening_req.created_account is not None
        assert User.objects.filter(email="paper@example.com").exists()

    def test_maker_checker_violation_paper_first(self, api_client, staff_user):
        """Ensure a staff member cannot approve a request they submitted (Paper-First)."""
        # 1. Staff submits the request
        api_client.force_authenticate(user=staff_user)
        url_submit = reverse("core:account-opening-submit-request")
        sub_data = {
            "first_name": "Violation", "last_name": "Tester", "email": "violation@example.com",
            "phone_number": "+233555222111", "account_type": "shares",
            "id_type": "voter_id", "id_number": "V999888"
        }
        res = api_client.post(url_submit, sub_data)
        req_id = res.data["data"]["id"]

        # 2. Same Staff tries to approve
        url_approve = reverse("core:account-opening-approve", args=[req_id])
        # Note: approve action requires IsManagerOrAdmin usually, but logic-level check exists too
        # If staff_user is not manager, it fails at permission level, but we want to test the logic-level check too.
        # Let's temporarily elevate the staff_user to manager role just for this logic check if needed, 
        # or use a manager who is also the submitter.
        
        # Scenario: Manager submits (allowed via submit-request) then tries to approve their own
        manager_submitter = User.objects.create_user(
            username="mgr_sub", email="mgr_sub@example.com", password="Pwd!", role="manager", is_staff=True, is_approved=True
        )
        api_client.force_authenticate(user=manager_submitter)
        res_sub = api_client.post(url_submit, sub_data)
        req_id_mgr = res_sub.data["data"]["id"]
        
        url_approve_mgr = reverse("core:account-opening-approve", args=[req_id_mgr])
        res_app = api_client.post(url_approve_mgr)
        
        assert res_app.status_code == status.HTTP_403_FORBIDDEN
        assert "Maker-Checker Violation" in res_app.data["message"]

    def test_account_opening_reject(self, api_client, manager_user, staff_user):
        opening_req = AccountOpeningRequest.objects.create(
            first_name="Rejected", last_name="User", email="rej@example.com", submitted_by=staff_user, status="pending"
        )
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:account-opening-reject", args=[opening_req.id])
        assert api_client.post(url, {"reason": "Bad credit"}).status_code == status.HTTP_200_OK
        opening_req.refresh_from_db()
        assert opening_req.status == "rejected"

    def test_staff_account_search_and_filters(self, api_client, manager_user, account_1):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:staff-account-list")
        
        # Test basic list
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1
        
        # Test filters
        assert api_client.get(url, {"account_type": "daily_susu"}).status_code == status.HTTP_200_OK
        assert api_client.get(url, {"is_active": "true"}).status_code == status.HTTP_200_OK
        
        # Test hash-based PII search
        from core.utils.field_encryption import hash_field
        search_term = "cust_acc@example.com" # Should match email or username
        response = api_client.get(url, {"search": search_term})
        assert response.status_code == status.HTTP_200_OK

    def test_account_summary_stats(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:accounts-summary")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "total_accounts" in response.data
        assert "total_balance" in response.data

    def test_account_freeze_unfreeze_audit(self, api_client, manager_user, account_1):
        from users.models import AuditLog
        api_client.force_authenticate(user=manager_user)
        
        # Freeze
        freeze_url = reverse("core:account-freeze", args=[account_1.id])
        api_client.post(freeze_url, {"reason": "Suspicious activity"})
        
        # Verify Audit Log
        audit = AuditLog.objects.filter(model_name="Account", object_id=str(account_1.id)).first()
        assert audit is not None
        assert str(audit.changes["is_active"]).lower() == "false"
        
        # Unfreeze
        unfreeze_url = reverse("core:account-unfreeze", args=[account_1.id])
        api_client.post(unfreeze_url)
        account_1.refresh_from_db()
        assert account_1.is_active

@pytest.mark.django_db
class TestTransactionHardeningCoverage:
    def test_transaction_approval_workflow(self, api_client, manager_user, staff_user, account_1):
        c2 = User.objects.create_user(username="c2tx", email="c2tx@e.com", password="P1", role="customer", is_approved=True)
        account_2 = Account.objects.create(user=c2, account_number="ACC_002", balance=Decimal("100.00"), account_type="daily_susu")
        tx = Transaction.objects.create(
            from_account=account_1, to_account=account_2, amount=Decimal("6000.00"),
            transaction_type="transfer", status="pending_approval", description="Large transfer"
        )
        api_client.force_authenticate(user=manager_user)
        with patch("users.services.SendexaService.send_sms", return_value=True):
            assert api_client.post(reverse("core:transaction-approve", args=[tx.id])).status_code == status.HTTP_200_OK
            tx.refresh_from_db()
            assert tx.status == "completed"
            assert api_client.post(reverse("core:transaction-reverse", args=[tx.id]), {"reason": "Correction"}).status_code == status.HTTP_200_OK
            tx.refresh_from_db()
            assert tx.status == "reversed"

    def test_transaction_rejection(self, api_client, manager_user, account_1):
        tx = Transaction.objects.create(to_account=account_1, amount=Decimal("100.00"), transaction_type="deposit", status="pending_approval")
        api_client.force_authenticate(user=manager_user)
        assert api_client.post(reverse("core:transaction-reject", args=[tx.id]), {"reason": "Incorrect source"}).status_code == status.HTTP_200_OK
        tx.refresh_from_db()
        assert tx.status == "cancelled"

    def test_inter_account_transfer_and_limits(self, api_client, customer_user, account_1):
        c2 = User.objects.create_user(username="c2lim", email="c2lim@e.com", password="P1", role="customer", is_approved=True)
        account_2 = Account.objects.create(user=c2, account_number="ACC_LIM", balance=Decimal("0.00"), account_type="daily_susu")
        api_client.force_authenticate(user=customer_user)
        url = reverse("core:transaction-list")
        assert api_client.post(url, {"from_account": account_1.id, "to_account": account_2.id, "amount": 200.00, "transaction_type": "transfer"}, format="json").status_code == status.HTTP_201_CREATED
        assert api_client.post(url, {"from_account": account_1.id, "to_account": account_2.id, "amount": 99999.00, "transaction_type": "transfer"}, format="json").status_code == status.HTTP_400_BAD_REQUEST

    def test_cashier_process_transaction(self, api_client, cashier_user, customer_user, account_1):
        api_client.force_authenticate(user=cashier_user)
        url = reverse("core:transaction-process")
        account_1.balance = Decimal("10000.00")
        account_1.save()
        assert api_client.post(url, {"member_id": customer_user.id, "amount": 150.00, "type": "deposit", "account_type": "daily_susu"}).status_code == status.HTTP_200_OK
        account_1.refresh_from_db()
        assert account_1.balance == Decimal("10150.00")
        
    def test_transaction_search_and_advanced_filters(self, api_client, manager_user, account_1):
        api_client.force_authenticate(user=manager_user)
        Transaction.objects.create(to_account=account_1, amount=Decimal("123.45"), transaction_type="deposit", status="completed", description="SEARCH_REF")
        url = reverse("core:transaction-search")
        response = api_client.get(url, {"reference": "SEARCH_REF"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1
        
        # Test complex filters
        assert api_client.get(url, {"min_amount": 100, "max_amount": 200, "status": "completed"}).status_code == status.HTTP_200_OK
        assert api_client.get(url, {"date_from": "2020-01-01", "date_to": "2030-01-01"}).status_code == status.HTTP_200_OK
        assert api_client.get(url, {"member": "mgr_acc"}).status_code == status.HTTP_200_OK
        assert api_client.get(url, {"type": "deposit"}).status_code == status.HTTP_200_OK

    def test_transaction_ownership_security(self, api_client, customer_user, account_1):
        # Create another user's account
        other_user = User.objects.create_user(username="other", email="other@e.com", password="P1", role="customer", is_approved=True)
        other_acc = Account.objects.create(user=other_user, account_number="OTHER_ACC", balance=Decimal("500.00"), account_type="daily_susu")
        
        api_client.force_authenticate(user=customer_user)
        url = reverse("core:transaction-list")
        
        # SECURITY: Try to transfer FROM other_acc to account_1
        data = {
            "from_account": other_acc.id,
            "to_account": account_1.id,
            "amount": 50.00,
            "transaction_type": "transfer"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "UNAUTHORIZED_ACCOUNT_ACCESS"

    def test_transaction_error_handling(self, api_client, customer_user, account_1):
        from core.services.transactions import TransactionService
        from core.exceptions import InsufficientFundsError
        
        api_client.force_authenticate(user=customer_user)
        url = reverse("core:transaction-list")
        
        # Create a receiver account
        rec = User.objects.create_user(username="rec", email="rec@e.com", password="P1", role="customer", is_approved=True)
        rec_acc = Account.objects.create(user=rec, account_number="REC_ACC", balance=Decimal("0.00"), account_type="daily_susu")

        with patch("core.services.transactions.TransactionService.validate_transaction", side_effect=InsufficientFundsError("Mock Insufficient")):
            data = {
                "from_account": account_1.id,
                "to_account": rec_acc.id,
                "amount": 10.00,
                "transaction_type": "transfer"
            }
            response = api_client.post(url, data)
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert response.data["code"] == "INSUFFICIENT_FUNDS"
