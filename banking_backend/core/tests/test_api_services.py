from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.operational import Complaint, ServiceCharge, ServiceRequest
from core.models.transactions import Refund

User = get_user_model()


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff1", email="staff1@test.com", password="password", role="staff", is_staff=True
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(username="cust1", email="cust1@test.com", password="password", role="customer")


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="mgr1", email="mgr1@test.com", password="password", role="manager", is_staff=True
    )


@pytest.mark.django_db
class TestServiceCharges:
    def test_calculate_service_charge_logic(self, staff_user):
        client = APIClient()
        client.force_authenticate(user=staff_user)

        # 1. Create a fixed charge
        ServiceCharge.objects.create(
            name="Transaction Fee", charge_type="fixed", rate=Decimal("2.00"), applicable_to=["all"], is_active=True
        )
        # 2. Create a percentage charge
        ServiceCharge.objects.create(
            name="Percentage Tax", charge_type="percentage", rate=Decimal("1.5"), applicable_to=["all"], is_active=True
        )

        url = reverse("core:calculate-service-charge")
        data = {"account_type": "savings", "transaction_amount": 1000.0, "transaction_count": 1}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        # 2.00 (fixed) + 15.00 (1.5% of 1000) = 17.00
        assert response.data["total_charge"] == 17.00

    def test_service_charges_list_and_create(self, staff_user):
        client = APIClient()
        client.force_authenticate(user=staff_user)

        url = reverse("core:service-charges")
        # GET
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK

        # POST
        data = {"name": "New Fee", "charge_type": "fixed", "rate": 5.0, "applicable_to": ["savings"]}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert ServiceCharge.objects.filter(name="New Fee").exists()


@pytest.mark.django_db
class TestServiceRequests:
    def test_customer_create_and_staff_process_request(self, customer_user, staff_user):
        # 1. Customer creates
        client = APIClient()
        client.force_authenticate(user=customer_user)
        url = reverse("core:service-request-list")
        data = {"request_type": "checkbook", "delivery_method": "pickup"}
        response = client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        req_id = response.data["id"]

        # 2. Staff processes
        client.force_authenticate(user=staff_user)
        process_url = reverse("core:service-request-process", kwargs={"pk": req_id})
        response = client.post(process_url, {"status": "completed", "admin_notes": "Done"})
        assert response.status_code == status.HTTP_200_OK
        assert ServiceRequest.objects.get(id=req_id).status == "completed"

    def test_manager_approve_checkbook(self, manager_user, customer_user):
        client = APIClient()
        client.force_authenticate(user=manager_user)
        req = ServiceRequest.objects.create(user=customer_user, request_type="checkbook", status="pending")

        url = reverse("core:service-request-approve-checkbook", kwargs={"pk": req.pk})
        response = client.post(url, {"action": "approve", "notes": "Approved by mgr"})
        assert response.status_code == status.HTTP_200_OK
        req.refresh_from_db()
        assert req.status == "processing"


@pytest.mark.django_db
class TestRefundsAndComplaints:
    def test_refund_approval_workflow(self, manager_user, customer_user):
        client = APIClient()
        client.force_authenticate(user=manager_user)
        refund = Refund.objects.create(user=customer_user, amount=50, status="pending", reason="Double charge")

        url = reverse("core:refund-approve", kwargs={"pk": refund.pk})
        response = client.post(url, {"admin_notes": "Valid refund"})
        assert response.status_code == status.HTTP_200_OK
        refund.refresh_from_db()
        assert refund.status == "approved"

    def test_complaint_resolution_and_summary(self, staff_user, customer_user):
        client = APIClient()
        client.force_authenticate(user=staff_user)
        complaint = Complaint.objects.create(
            user=customer_user, category="service", subject="Slow service", status="pending"
        )

        # Resolve
        url = reverse("core:complaint-resolve", kwargs={"pk": complaint.pk})
        response = client.post(url, {"resolution": "Apologies sent"})
        assert response.status_code == status.HTTP_200_OK

        # Summary
        summary_url = reverse("core:complaint-reports-summary")
        response = client.get(summary_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] >= 1
