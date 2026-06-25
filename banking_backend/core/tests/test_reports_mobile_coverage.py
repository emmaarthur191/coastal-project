import pytest
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from core.models.accounts import Account
from core.models.operational import VisitSchedule, ClientAssignment
from core.models.transactions import Transaction
from users.models import User

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def mb_user(db):
    return User.objects.create_user(
        username="mb_banker",
        email="mb@example.com",
        password="Password123!",
        role="mobile_banker",
        is_approved=True,
        is_staff=True
    )

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="mgr_reports",
        email="mgr_rep@example.com",
        password="Password123!",
        role="manager",
        is_approved=True,
        is_staff=True
    )

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="test_customer",
        email="test_cust@example.com",
        password="Password123!",
        role="customer",
        is_approved=True
    )

@pytest.fixture
def customer_account(customer_user):
    return Account.objects.create(
        user=customer_user,
        account_number="ACC_REPORTS",
        balance=Decimal("5000.00"),
        account_type="daily_susu"
    )

@pytest.mark.django_db
class TestReportsViewCoverage:
    def test_generate_report_large_dataset(self, api_client, manager_user, customer_account):
        # 1. Seed Large Dataset (100+ Transactions)
        transactions = [
            Transaction(
                to_account=customer_account,
                amount=Decimal("10.00"),
                transaction_type="deposit",
                status="completed",
                description=f"Seeded Transaction {i}"
            ) for i in range(150)
        ]
        Transaction.objects.bulk_create(transactions)
        
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:generate-report")
        
        # Test default (100 limit)
        response = api_client.post(url, {"type": "transactions", "format": "json"})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["summary"]["total_records"] == 100
        
        # Test large limit (500 MAX_RECORDS)
        response = api_client.post(url, {"type": "transactions", "format": "json", "limit": 200})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["summary"]["total_records"] == 150
        
        # Test CSV format with large data
        response = api_client.post(url, {"type": "transactions", "format": "csv", "limit": 200})
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"

    def test_report_analytics_view(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-analytics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "report_stats" in response.data

    def test_report_viewset_generate_pdf(self, api_client, manager_user):
        from core.models.reporting import ReportTemplate
        template = ReportTemplate.objects.create(name="Daily Transactions", report_type="transactions", is_active=True)
        
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        data = {
            "template_id": template.id,
            "format": "pdf",
            "parameters": {"start_date": "2026-01-01"}
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "report_url" in response.data

    def test_generate_payslip_view(self, api_client, manager_user, mb_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:generate-payslip")
        data = {
            "staff_id": mb_user.id,
            "month": 3,
            "year": 2026,
            "base_pay": 5000,
            "allowances": 1000
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "download_url" in response.data

    def test_generate_statement_view(self, api_client, manager_user, customer_account):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:generate-statement")
        data = {
            "account_number": customer_account.account_number,
            "start_date": "2026-01-01",
            "end_date": "2026-04-01"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "download_url" in response.data

@pytest.mark.django_db
class TestMobileBankerViewCoverage:
    def test_visit_schedule_check_in_gps(self, api_client, mb_user):
        # 1. Create a scheduled visit
        visit = VisitSchedule.objects.create(
            mobile_banker=mb_user,
            client_name="Kojo Mensah",
            location="Accra Central",
            scheduled_time=timezone.now(),
            status="scheduled"
        )
        
        api_client.force_authenticate(user=mb_user)
        url = reverse("core:visit-schedule-check-in", args=[visit.id])
        
        # Test missing GPS
        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Test with mock GPS coordinates
        gps_data = {
            "latitude": 5.6037,
            "longitude": -0.1870
        }
        response = api_client.post(url, gps_data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["lat"] == 5.6037
        
        visit.refresh_from_db()
        assert visit.status == "completed"
        assert visit.check_in_latitude == Decimal("5.603700")

    def test_mobile_banker_metrics(self, api_client, mb_user):
        api_client.force_authenticate(user=mb_user)
        url = reverse("core:mobile-banker-metrics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "visits" in response.data

    def test_mobile_operations_deposit(self, api_client, mb_user, customer_user, customer_account):
        ClientAssignment.objects.create(mobile_banker=mb_user, client=customer_user, is_active=True)
        api_client.force_authenticate(user=mb_user)
        url = reverse("core:mobile-ops-process-deposit")
        data = {
            "member_id": customer_user.id,
            "amount": 50.00,
            "account_type": "daily_susu"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        
        customer_account.refresh_from_db()
        assert customer_account.balance == Decimal("5050.00")

    def test_mobile_operations_withdrawal_and_repayment(self, api_client, mb_user, customer_user, customer_account):
        from core.models.loans import Loan
        ClientAssignment.objects.create(mobile_banker=mb_user, client=customer_user, is_active=True)
        api_client.force_authenticate(user=mb_user)
        
        # 1. Withdrawal
        url_withdraw = reverse("core:mobile-ops-process-withdrawal")
        data = {"member_id": customer_user.id, "amount": 50.00, "account_type": "daily_susu"}
        response = api_client.post(url_withdraw, data)
        assert response.status_code == status.HTTP_200_OK
        
        # 2. Repayment
        loan = Loan.objects.create(
            user=customer_user, 
            amount=Decimal("1000.00"), 
            outstanding_balance=Decimal("1000.00"), 
            status="active",
            interest_rate=Decimal("15.0"),
            term_months=12
        )
        
        url_repay = reverse("core:mobile-process-repayment")
        response = api_client.post(url_repay, {"member_id": customer_user.id, "amount": 200})
        assert response.status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.outstanding_balance == Decimal("800.00")

    def test_client_assignment_lifecycle(self, api_client, mb_user, customer_user):
        api_client.force_authenticate(user=mb_user)
        # Create assignment
        assignment = ClientAssignment.objects.create(
            mobile_banker=mb_user,
            client=customer_user,
            status="pending",
            priority="high"
        )
        
        url = reverse("core:client-assignment-my-clients")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert any(str(c["id"]) == str(assignment.id) for c in response.data)
        
        # Update status
        url_status = reverse("core:client-assignment-update-status", args=[assignment.id])
        response = api_client.post(url_status, {"status": "due_payment"})
        assert response.status_code == status.HTTP_200_OK
        
        assignment.refresh_from_db()
        assert assignment.status == "due_payment"
        
        # Complete
        url_complete = reverse("core:client-assignment-complete", args=[assignment.id])
        response = api_client.post(url_complete)
        assert response.status_code == status.HTTP_200_OK
        assignment.refresh_from_db()
        assert assignment.status == "completed"
