from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models import Account, Report

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def users(db):
    customer1 = User.objects.create_user(
        username="customer1", email="c1@example.com", password="password123", role="customer"
    )
    customer2 = User.objects.create_user(
        username="customer2", email="c2@example.com", password="password123", role="customer"
    )
    staff = User.objects.create_user(username="staff1", email="staff@example.com", password="password123", role="staff")
    return {"c1": customer1, "c2": customer2, "staff": staff}


@pytest.mark.django_db
class TestSecurityRemediation:
    def test_account_balance_read_only(self, api_client, users):
        """Verify that account balance cannot be modified via API."""
        account = Account.objects.create(user=users["c1"], account_number="123", balance=Decimal("100.00"))
        api_client.force_authenticate(user=users["staff"])

        url = reverse("core:account-detail", kwargs={"pk": account.pk})
        response = api_client.patch(url, {"balance": "1000.00"})

        assert response.status_code == status.HTTP_200_OK
        account.refresh_from_db()
        assert account.balance == Decimal("100.00")

    def test_account_closure_idor_prevention(self, api_client, users):
        """Verify that a customer cannot request closure for someone else's account."""
        account_c2 = Account.objects.create(user=users["c2"], account_number="456", balance=Decimal("50.00"))
        api_client.force_authenticate(user=users["c1"])

        url = reverse("core:account-closure-list")
        response = api_client.post(url, {"account_id": account_c2.id, "closure_reason": "customer_request"})

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "permission" in str(response.data).lower()

    def test_report_download_idor_prevention(self, api_client, users):
        """Verify that a customer cannot download another user's report."""
        report = Report.objects.create(
            title="Private Report", report_type="statement", generated_by=users["c2"], file_path="reports/secret.pdf"
        )
        api_client.force_authenticate(user=users["c1"])

        url = reverse("core:report-download", kwargs={"report_id": f"report_{report.id}"})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_customer_cannot_initiate_chat_with_another_customer(self, api_client, users):
        """Verify that customers are restricted from starting chats with other customers."""
        api_client.force_authenticate(user=users["c1"])

        url = reverse("core:chat-room-create")
        response = api_client.post(url, {"member_ids": [users["c2"].id], "is_group": False})

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "only initiate chats with staff" in response.data["error"]

    def test_customer_can_initiate_chat_with_staff(self, api_client, users):
        """Verify that customers can still start chats with staff."""
        api_client.force_authenticate(user=users["c1"])

        url = reverse("core:chat-room-create")
        response = api_client.post(url, {"member_ids": [users["staff"].id], "is_group": False})

        assert response.status_code == status.HTTP_201_CREATED
