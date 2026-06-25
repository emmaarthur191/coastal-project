import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models.operational import CashAdvance, ClientAssignment
from core.models.transactions import Refund
from core.models.loans import Loan

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def mobile_banker(db):
    return User.objects.create_user(
        username="mb_test", 
        email="mb@coastal.com", 
        password="password123", 
        role="mobile_banker", 
        is_staff=True
    )

@pytest.fixture
def cashier(db):
    return User.objects.create_user(
        username="cashier_test", 
        email="cashier@coastal.com", 
        password="password123", 
        role="cashier", 
        is_staff=True
    )

@pytest.fixture
def client_user(db):
    return User.objects.create_user(
        username="client_test", 
        email="client@test.com", 
        password="password123", 
        role="customer"
    )

@pytest.fixture
def other_client(db):
    return User.objects.create_user(
        username="other_client", 
        email="other@test.com", 
        password="password123", 
        role="customer"
    )

@pytest.mark.django_db
class TestStaffInitiatedFinancialRequests:
    
    def test_cash_advance_mobile_banker_assigned_client(self, api_client, mobile_banker, client_user):
        # Assign client to mobile banker
        ClientAssignment.objects.create(client=client_user, mobile_banker=mobile_banker, is_active=True)
        
        api_client.force_authenticate(user=mobile_banker)
        url = reverse("core:cash-advance-list")
        data = {
            "user": client_user.id,
            "amount": 500.0,
            "reason": "Emergency medical expenses",
            "id_type": "ghana_card",
            "id_number": "GHA-123456789-0",
            "verification_notes": "Verified physical card matching the applicant."
        }
        
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        
        advance = CashAdvance.objects.get(id=response.data["id"])
        assert advance.verification_notes == "Verified physical card matching the applicant."
        assert advance.id_type == "ghana_card"
        assert advance.submitted_by == mobile_banker

    def test_cash_advance_mobile_banker_unassigned_client(self, api_client, mobile_banker, other_client):
        # other_client is NOT assigned to mobile_banker
        api_client.force_authenticate(user=mobile_banker)
        url = reverse("core:cash-advance-list")
        data = {
            "user": other_client.id,
            "amount": 500.0,
            "reason": "Unauthorized attempt",
            "id_type": "ghana_card",
            "id_number": "GHA-999999999-0",
            "verification_notes": "Should fail security check."
        }
        
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "not authorized to initiate requests for this client" in str(response.data)

    def test_refund_mobile_banker_assigned_client(self, api_client, mobile_banker, client_user):
        # Assign client to mobile banker
        ClientAssignment.objects.create(client=client_user, mobile_banker=mobile_banker, is_active=True)
        
        api_client.force_authenticate(user=mobile_banker)
        url = reverse("core:refund-list")
        data = {
            "user": client_user.id,
            "amount": 50.0,
            "reason": "duplicate_charge",
            "id_type": "passport",
            "id_number": "P-1234567",
            "verification_notes": "Identity confirmed via biometric passport check."
        }
        
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        
        refund = Refund.objects.get(id=response.data["id"])
        assert refund.verification_notes == "Identity confirmed via biometric passport check."
        assert refund.requested_by == mobile_banker

    def test_loan_verification_notes_capture(self, api_client, mobile_banker, client_user):
        # Assign client to mobile banker
        ClientAssignment.objects.create(client=client_user, mobile_banker=mobile_banker, is_active=True)
        
        api_client.force_authenticate(user=mobile_banker)
        url = reverse("core:banking-loan-list")
        data = {
            "user": client_user.id,
            "amount": 2000.0,
            "purpose": "business",
            "term_months": 12,
            "interest_rate": 5.0,
            "date_of_birth": "1990-01-01",
            "id_type": "ghana_card",
            "id_number": "GHA-123456789-0",
            "digital_address": "GA-123-4567",
            "town": "Accra",
            "city": "Accra",
            "verification_notes": "Physical business site visited and documents verified."
        }
        
        response = api_client.post(url, data, format="json")
        if response.status_code != status.HTTP_201_CREATED:
            print(f"DEBUG: Loan creation failed: {response.data}")
        assert response.status_code == status.HTTP_201_CREATED
        
        loan = Loan.objects.get(id=response.data["id"])
        assert loan.verification_notes == "Physical business site visited and documents verified."
        assert loan.requested_by == mobile_banker

    def test_cashier_bypass_assigned_mapping(self, api_client, cashier, other_client):
        # Cashiers are not subject to Mobile Banker client assignment scoping
        api_client.force_authenticate(user=cashier)
        url = reverse("core:cash-advance-list")
        data = {
            "user": other_client.id,
            "amount": 100.0,
            "reason": "Cash advance withdrawal",
            "id_type": "voter_id",
            "id_number": "V-12345678",
            "verification_notes": "Cashier verified ID at branch."
        }
        
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
