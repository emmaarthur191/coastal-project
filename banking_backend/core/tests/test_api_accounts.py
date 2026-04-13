from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

import pytest

from core.models.accounts import Account, AccountClosureRequest, AccountOpeningRequest

User = get_user_model()


@pytest.mark.django_db
class TestAccountAPI:
    """Tests for the AccountViewSet API."""

    def test_customer_list_accounts(self, api_client, sender_account):
        """Verify customer only sees their own accounts."""
        # Create another account for a different user
        other_user = User.objects.create_user(username="other", email="other@test.com")
        Account.objects.create(user=other_user, account_number="OTHER123", balance=Decimal("100.00"))

        api_client.force_authenticate(user=sender_account.user)
        try:
            url = reverse("core:account-list")
        except Exception:
            try:
                url = reverse("account-list")
            except Exception:
                pytest.fail("No 'core:account-list' or 'account-list' URL found.")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should only see 1 account (sender_account)
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["account_number"] == sender_account.account_number

    def test_staff_list_all_accounts(self, api_client, sender_account, staff_user):
        """Verify staff can see all accounts."""
        other_user = User.objects.create_user(username="other_staff_test", email="other_staff@test.com")
        Account.objects.create(user=other_user, account_number="OTHER456", balance=Decimal("100.00"))

        api_client.force_authenticate(user=staff_user)
        try:
            url = reverse("core:account-list")
        except Exception:
            try:
                url = reverse("account-list")
            except Exception:
                pytest.fail("No 'core:account-list' or 'account-list' URL found.")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should see at least 2 accounts
        assert len(response.data["results"]) >= 2

    def test_create_account_success(self, api_client):
        """Verify customer can create a new account."""
        user = User.objects.create_user(username="new_acc_user", email="newacc@test.com", role="customer")
        api_client.force_authenticate(user=user)
        try:
            url = reverse("core:account-list")
        except Exception:
            try:
                url = reverse("account-list")
            except Exception:
                pytest.fail("No 'core:account-list' or 'account-list' URL found.")
        data = {"account_type": "daily_susu"}

        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED

        # Verify in DB
        assert Account.objects.filter(user=user, account_type="daily_susu").exists()

    def test_retrieve_account_owner_only(self, api_client, sender_account):
        """Verify only owner or staff can retrieve account details."""
        unauthorized_user = User.objects.create_user(username="hacker", email="hacker@test.com", role="customer")

        # 1. Unauthorized attempt
        api_client.force_authenticate(user=unauthorized_user)
        try:
            url = reverse("core:account-detail", kwargs={"pk": sender_account.pk})
        except Exception:
            try:
                url = reverse("account-detail", kwargs={"pk": sender_account.pk})
            except Exception:
                pytest.fail("No 'core:account-detail' or 'account-detail' URL found.")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND  # Queryset filtering hides it

        # 2. Authorized attempt (Owner)
        api_client.force_authenticate(user=sender_account.user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["account_number"] == sender_account.account_number


@pytest.mark.django_db
class TestAccountOpening:
    """Tests for Account Opening workflow."""

    def test_submit_opening_request(self, api_client, staff_user):
        """Verify staff user can submit opening request."""
        api_client.force_authenticate(user=staff_user)
        url = reverse("core:account-opening-list")
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "phone_number": "+233244000111",
            "email": "john@test.com",
            "account_type": "daily_susu",
            "id_type": "ghana_card",
            "id_number": "GHA-123456789-0",
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert AccountOpeningRequest.objects.filter(phone_number_encrypted__isnull=False).exists()

    def test_manager_approve_opening(self, api_client, staff_user, manager_user):
        """Verify manager can approve (4-Eyes Principle)."""
        req = AccountOpeningRequest.objects.create(
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@test.com",
            phone_number="+233244222333",
            account_type="daily_susu",
            status="pending",
            submitted_by=staff_user,
        )
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:account-opening-approve", kwargs={"pk": req.pk})

        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK

        req.refresh_from_db()
        assert req.status == "approved"
        assert req.created_account is not None
        assert req.created_account.user.username == "jane.smith@test.com"


@pytest.mark.django_db
class TestAccountClosure:
    """Tests for Account Closure workflow."""

    def test_submit_closure_request(self, api_client, sender_account):
        """Verify owner can submit closure request."""
        api_client.force_authenticate(user=sender_account.user)
        url = reverse("core:account-closure-list")
        data = {
            "account_id": sender_account.id,
            "closure_reason": "customer_request",
            "notes": "Closing due to relocation",
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert AccountClosureRequest.objects.filter(account=sender_account).exists()
