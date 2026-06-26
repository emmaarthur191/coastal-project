import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from conftest import TEST_PASSWORD
from core.models.accounts import AccountOpeningRequest, Account

User = get_user_model()

@pytest.fixture
def registrar_user(db):
    return User.objects.create_user(
        email="registrar@coastal.com",
        username="registrar",
        password=TEST_PASSWORD,
        role="cashier",
        is_approved=True
    )

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        email="manager@coastal.com",
        username="manager",
        password=TEST_PASSWORD,
        role="manager",
        is_approved=True
    )

@pytest.mark.django_db
class TestOperationalWorkflows:
    """Integration tests for Member Onboarding and Administrative workflows."""

    def test_member_onboarding_lifecycle(self, registrar_user, manager_user):
        """Full lifecycle: submission -> approval -> PDF generation."""
        client = APIClient()

        # 1. Registrar submits request
        client.force_authenticate(user=registrar_user)
        submit_url = reverse("core:account-opening-submit-request")
        response = client.post(submit_url, {
            "account_data": {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane.doe.workflow@example.com",
                "phone_number": "+233500000001",
                "id_type": "ghana_card",
                "id_number": "GHA-123456789-0",
                "account_type": "daily_susu"
            }
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        request_id = response.data["data"]["id"]

        # 2. Manager approves and generates PDF
        client.force_authenticate(user=manager_user)
        approve_url = reverse("core:account-opening-approve-and-print", kwargs={"pk": request_id})
        response = client.post(approve_url, {"kyc_verified": True})
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert len(response.content) > 0

        # 3. Verify account + user created and approved
        new_account = Account.objects.filter(user__email="jane.doe.workflow@example.com").first()
        assert new_account is not None
        assert new_account.user.is_approved is True

        # 4. Verify request status
        opening_req = AccountOpeningRequest.objects.get(id=request_id)
        assert opening_req.status == "completed"
        assert opening_req.approved_by == manager_user

    def test_maker_checker_violation(self, manager_user):
        """A manager cannot approve their own submission."""
        client = APIClient()
        client.force_authenticate(user=manager_user)

        submit_url = reverse("core:account-opening-submit-request")
        response = client.post(submit_url, {
            "account_data": {
                "first_name": "Self",
                "last_name": "Applicant",
                "email": "self.checker@example.com",
                "phone_number": "+233500000002",
                "id_type": "ghana_card",
                "id_number": "GHA-000000000-0"
            }
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        request_id = response.data["data"]["id"]

        # Same manager attempts approval
        approve_url = reverse("core:account-opening-approve-and-print", kwargs={"pk": request_id})
        response = client.post(approve_url, {"kyc_verified": True})
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Maker-Checker Violation" in response.data["message"]

    def test_onboarding_rejection(self, registrar_user, manager_user):
        """Manager can reject a pending request with a reason."""
        client = APIClient()

        # Registrar submits
        client.force_authenticate(user=registrar_user)
        submit_url = reverse("core:account-opening-submit-request")
        response = client.post(submit_url, {
            "account_data": {
                "first_name": "Reject",
                "last_name": "Me",
                "email": "reject.me@example.com",
                "phone_number": "+233500000003",
                "id_type": "ghana_card",
                "id_number": "GHA-REJECT-001"
            }
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        request_id = response.data["data"]["id"]

        # Manager rejects
        client.force_authenticate(user=manager_user)
        reject_url = reverse("core:account-opening-reject", kwargs={"pk": request_id})
        response = client.post(reject_url, {"reason": "Incomplete documentation."}, format="json")
        assert response.status_code == status.HTTP_200_OK

        opening_req = AccountOpeningRequest.objects.get(id=request_id)
        assert opening_req.status == "rejected"
        assert opening_req.rejection_reason == "Incomplete documentation."

    def test_unauthenticated_can_submit_but_validates(self):
        """Unauthenticated users can access the endpoint, but invalid payloads fail with 400 Bad Request."""
        client = APIClient()
        submit_url = reverse("core:account-opening-submit-request")
        # Missing 'email' and 'phone_number' which are required by the serializer
        response = client.post(submit_url, {"account_data": {"first_name": "Anon"}}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_staff_cannot_approve(self, registrar_user):
        """Staff cannot approve requests; only managers/admins can."""
        client = APIClient()
        
        # Create a direct pending request in DB (bypass submission auth check)
        req = AccountOpeningRequest.objects.create(
            first_name="Test",
            last_name="User",
            phone_number="+233500000099",
            id_type="ghana_card",
            id_number="GHA-STAFF-APPROVE",
            account_type="savings_account",
            submitted_by=registrar_user,
            status="pending"
        )
        
        client.force_authenticate(user=registrar_user)
        approve_url = reverse("core:account-opening-approve-and-print", kwargs={"pk": req.id})
        response = client.post(approve_url, {"kyc_verified": True})
        assert response.status_code == status.HTTP_403_FORBIDDEN
