import pytest
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from core.models.accounts import Account
from core.models.operational import ClientAssignment, VisitSchedule
from core.models.loans import Loan
from core.models.transactions import Transaction
from users.models import User
from unittest.mock import patch, MagicMock

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def mobile_banker(db):
    return User.objects.create_user(
        username="mb_user", email="mb@coastal.com", password="Password123!", role="mobile_banker", is_approved=True, is_staff=True
    )

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="client_user", email="client@e.com", password="Password123!", role="customer", is_approved=True
    )

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="mgr_user", email="mgr@coastal.com", password="Password123!", role="manager", is_approved=True, is_staff=True
    )

@pytest.mark.django_db
class TestMobileMobilityCoverage:
    def test_visit_schedule_workflow(self, api_client, mobile_banker):
        visit = VisitSchedule.objects.create(
            mobile_banker=mobile_banker, client_name="John Doe", location="Accra",
            scheduled_time=timezone.now(), status="scheduled"
        )
        api_client.force_authenticate(user=mobile_banker)
        
        # List
        assert api_client.get(reverse("core:visit-schedule-list")).status_code == status.HTTP_200_OK
        
        # Check-in
        url_checkin = reverse("core:visit-schedule-check-in", args=[visit.id])
        resp = api_client.post(url_checkin, {"latitude": 5.6037, "longitude": -0.1870})
        assert resp.status_code == status.HTTP_200_OK
        visit.refresh_from_db()
        assert visit.status == "completed"
        assert visit.check_in_latitude == Decimal("5.6037")

        # Complete action
        visit.status = "scheduled"
        visit.save()
        assert api_client.post(reverse("core:visit-schedule-complete", args=[visit.id])).status_code == status.HTTP_200_OK

    def test_mobile_metrics(self, api_client, mobile_banker):
        api_client.force_authenticate(user=mobile_banker)
        response = api_client.get(reverse("core:mobile-banker-metrics"))
        assert response.status_code == status.HTTP_200_OK
        assert "collections" in response.data

    def test_mobile_operations_deposit_withdrawal(self, api_client, mobile_banker, customer_user):
        from core.models.operational import ClientAssignment
        ClientAssignment.objects.create(mobile_banker=mobile_banker, client=customer_user, is_active=True)
        Account.objects.create(
            user=customer_user, account_number="MOB_001", balance=Decimal("500.00"), account_type="daily_susu", is_active=True
        )
        api_client.force_authenticate(user=mobile_banker)
        
        # Deposit
        url_dep = reverse("core:mobile-ops-process-deposit")
        resp = api_client.post(url_dep, {"member_id": customer_user.id, "amount": 50.00, "account_type": "daily_susu"})
        assert resp.status_code == status.HTTP_200_OK
        
        # Withdrawal
        url_wd = reverse("core:mobile-ops-process-withdrawal")
        resp = api_client.post(url_wd, {"member_id": customer_user.id, "amount": 100.00, "account_type": "daily_susu"})
        assert resp.status_code == status.HTTP_200_OK

    def test_client_assignment_management(self, api_client, mobile_banker, customer_user, manager_user):
        assignment = ClientAssignment.objects.create(
            mobile_banker=mobile_banker, client=customer_user, status="assigned", is_active=True
        )
        api_client.force_authenticate(user=mobile_banker)
        assert api_client.get(reverse("core:client-assignment-my-clients")).status_code == status.HTTP_200_OK
        
        api_client.force_authenticate(user=manager_user)
        assert api_client.get(reverse("core:client-assignment-list")).status_code == status.HTTP_200_OK
        
        url_status = reverse("core:client-assignment-update-status", args=[assignment.id])
        assert api_client.post(url_status, {"status": "in_progress"}).status_code == status.HTTP_200_OK

    def test_mobile_repayment_workflow(self, api_client, mobile_banker, customer_user):
        # Setup source account for repayment
        Account.objects.create(
            user=customer_user, account_number="SAV_001", balance=Decimal("1000.00"), account_type="member_savings", is_active=True
        )
        ClientAssignment.objects.create(mobile_banker=mobile_banker, client=customer_user, is_active=True)
        loan = Loan.objects.create(
            user=customer_user, amount=Decimal("1000.00"), term_months=12,
            interest_rate=Decimal("10.00"), status="active", outstanding_balance=Decimal("1100.00")
        )
        api_client.force_authenticate(user=mobile_banker)
        url_rep = reverse("core:mobile-process-repayment")
        
        resp = api_client.post(url_rep, {"member_id": customer_user.id, "amount": 200.00})
        assert resp.status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.outstanding_balance == Decimal("900.00")

    def test_mobile_banker_restricted_access(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)
        assert api_client.get(reverse("core:visit-schedule-list")).status_code == status.HTTP_403_FORBIDDEN
