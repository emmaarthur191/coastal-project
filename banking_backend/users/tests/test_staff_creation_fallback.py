import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User
from core.models.hr import Payslip
from core.pdf_services import generate_payslip_pdf
import datetime
from decimal import Decimal

@pytest.mark.django_db
class TestStaffCreationFallbackAndBankDetails:

    @pytest.fixture(autouse=True)
    def setup_method(self, db):
        # Create a manager user to authenticate staff creation requests
        self.manager = User.objects.create_user(
            username="manager1",
            email="manager@coastal.com",
            phone_number="+233201111111",
            password="SecurePassword123!",
            role="manager",
            is_approved=True,
            is_staff=True
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.manager)
        self.create_url = reverse("users:create-staff")

    def test_staff_creation_success_with_all_details(self):
        """Verify staff is created successfully when all valid bank details and SSNIT are provided."""
        payload = {
            "email": "staff1@coastal.com",
            "phone": "+233202222222",
            "role": "cashier",
            "bank_name": "Coastal Trust Bank",
            "account_number": "123456789012",
            "branch_code": "ACCRA-01",
            "ssnit_number": "C123456789012",
            "government_id": "GHA-123456789-0",
        }
        
        response = self.client.post(self.create_url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify user was created in the database
        user = User.objects.get(email="staff1@coastal.com")
        assert user.role == "cashier"
        assert user.bank_name == "Coastal Trust Bank"
        assert user.bank_account_number == "123456789012"
        assert user.bank_branch == "ACCRA-01"
        assert user.ssnit_number == "C123456789012"
        
        # Verify database fields are encrypted
        assert user.bank_name_encrypted != "Coastal Trust Bank"
        assert user.bank_account_number_encrypted != "123456789012"
        assert user.bank_branch_encrypted != "ACCRA-01"

    def test_staff_creation_missing_branch_code_fails(self):
        """Verify staff creation fails when branch_code is omitted."""
        payload = {
            "email": "staff2@coastal.com",
            "phone": "+233202222223",
            "role": "cashier",
            "bank_name": "Coastal Trust Bank",
            "account_number": "123456789012",
            "ssnit_number": "C123456789012",
            "government_id": "GHA-123456789-0",
        }
        
        response = self.client.post(self.create_url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "branch_code" in response.data

    def test_ssnit_fallback_to_ghana_card(self):
        """Verify ssnit_number picks the Ghana Card ID from government_id when ssnit_number is left blank."""
        payload = {
            "email": "staff3@coastal.com",
            "phone": "+233202222224",
            "role": "cashier",
            "bank_name": "Coastal Trust Bank",
            "account_number": "123456789012",
            "branch_code": "ACCRA-01",
            "government_id": "GHA-987654321-0", # Valid Ghana Card ID
        }
        
        response = self.client.post(self.create_url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        
        user = User.objects.get(email="staff3@coastal.com")
        assert user.id_number == "GHA9876543210" # Cleaned
        assert user.ssnit_number == "GHA9876543210" # Falling back to Ghana Card ID
        assert user.id_type == "ghana_card"

    def test_ssnit_validation_fails_without_fallback_and_no_ssnit(self):
        """Verify registration fails if ssnit_number is blank and government_id is not a Ghana Card."""
        payload = {
            "email": "staff4@coastal.com",
            "phone": "+233202222225",
            "role": "cashier",
            "bank_name": "Coastal Trust Bank",
            "account_number": "123456789012",
            "branch_code": "ACCRA-01",
            "government_id": "PASSPORT-12345", # Not a Ghana Card
        }
        
        response = self.client.post(self.create_url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "ssnit_number" in response.data

    def test_payslip_pdf_contains_bank_details(self):
        """Verify payslip generation includes the employee's bank details and SSNIT on the document."""
        # Create user
        payload = {
            "email": "staff5@coastal.com",
            "phone": "+233202222226",
            "role": "cashier",
            "bank_name": "Fidelity Bank",
            "account_number": "987654321098",
            "branch_code": "KUMASI-02",
            "government_id": "GHA-777777777-7",
        }
        self.client.post(self.create_url, payload, format="json")
        user = User.objects.get(email="staff5@coastal.com")
        
        # Create a mock payslip for this staff member
        payslip = Payslip.objects.create(
            staff=user,
            month=6,
            year=2026,
            pay_period_start=datetime.date(2026, 6, 1),
            pay_period_end=datetime.date(2026, 6, 30),
            base_pay=Decimal("2500.00"),
            generated_by=self.manager
        )
        
        # Generate the PDF buffer with compression disabled so we can assert on plain text bytes
        from reportlab import rl_config
        rl_config.pageCompression = 0
        pdf_buffer = generate_payslip_pdf(payslip)
        pdf_bytes = pdf_buffer.getvalue()
        
        # Convert PDF bytes to text to verify presence of values (ReportLab generates plain PDF structures)
        # Verify the binary stream contains mentions of bank and SSNIT number
        assert b"Fidelity Bank" in pdf_bytes
        assert b"987654321098" in pdf_bytes
        assert b"GHA7777777777" in pdf_bytes
