import io
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

import pytest

from core.models.accounts import Account
from core.models.transactions import Transaction

User = get_user_model()


@pytest.fixture
def manager_client(db):
    client = APIClient()
    manager = User.objects.create_user(
        username="mgr", email="mgr@example.com", password="password123", role="manager", is_staff=True
    )
    client.force_authenticate(user=manager)
    return client


@pytest.fixture
def sample_account(db):
    user = User.objects.create_user(username="acc_user", email="acc@test.com", password="password123", role="customer")
    return Account.objects.create(user=user, account_number="1234567890", balance=100.0)


@pytest.mark.django_db
class TestReportGeneration:
    def test_generate_report_view_csv(self, manager_client):
        """Test GenerateReportView for CSV formatted output."""
        url = reverse("core:generate-report")
        # Create at least one transaction to avoid empty report (which returns JSON)
        Account.objects.create(user=User.objects.first(), account_number="TEST123", balance=100)
        Transaction.objects.create(transaction_type="deposit", amount=10, description="Test", status="completed")

        response = manager_client.post(url, {"type": "transactions", "format": "csv", "limit": 5})
        # If no transactions exist, the view returns 200 with empty CSV
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"
        assert "attachment" in response["Content-Disposition"]

    def test_generate_report_view_pdf_json_dispatch(self, manager_client):
        """Test GenerateReportView for PDF returns JSON with download URL."""
        url = reverse("core:generate-report")
        response = manager_client.post(url, {"type": "loans", "format": "pdf", "limit": 5})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "report_id" in response.data["data"]


@pytest.mark.django_db
class TestPDFGeneratorsMocked:
    @patch("core.pdf_services.generate_generic_report_pdf")
    def test_report_viewset_generate(self, mock_pdf, manager_client):
        """Test ReportViewSet generic PDF logic without actual PDF writes."""
        mock_pdf.return_value = io.BytesIO(b"mock pdf content")
        # report-general maps to ReportViewSet
        url = reverse("core:report-general-generate")
        response = manager_client.post(url, {"format": "pdf", "parameters": {"filter": "none"}}, format="json")
        # Note: ReportViewSet returns 200 SUCCESS on manual PDF trigger
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "success"
        assert mock_pdf.called

    @patch("core.pdf_services.generate_payslip_pdf")
    def test_generate_payslip(self, mock_pdf, manager_client):
        mock_pdf.return_value = io.BytesIO(b"mock pdf content")
        # Need a staff user to generate payslip for
        staff = User.objects.create_user(username="staff3", email="s@s.com", password="password123", role="staff")
        url = reverse("core:generate-payslip")
        response = manager_client.post(
            url, {"staff_id": staff.id, "month": 10, "year": 2025, "base_pay": 5000, "allowances": 200}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data

    @patch("core.pdf_services.generate_statement_pdf")
    def test_generate_statement(self, mock_pdf, manager_client, sample_account):
        mock_pdf.return_value = io.BytesIO(b"mock pdf content")
        url = reverse("core:generate-statement")
        response = manager_client.post(
            url, {"account_number": sample_account.account_number, "start_date": "2025-01-01", "end_date": "2025-12-31"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "download_url" in response.data


@pytest.mark.django_db
class TestReportLifecycle:
    def test_report_analytics(self, manager_client):
        url = reverse("core:report-analytics")
        response = manager_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "total_reports" in response.data

    def test_report_viewset_list(self, manager_client):
        url = reverse("core:report-general-list")
        response = manager_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_payslip_viewset_access(self, manager_client):
        url = reverse("core:payslip-list")
        response = manager_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    @patch("core.report_download.default_storage.exists", return_value=True)
    @patch("core.report_download.default_storage.open", return_value=MagicMock())
    @patch("core.report_download.async_file_iterator", return_value=["testdata"])
    def test_download_report_by_pk(self, mock_iter, mock_open, mock_exists, api_client, manager_user):
        """Verify report download via report_<pk> format."""
        from core.models.reporting import Report

        report = Report.objects.create(
            report_type="daily_summary", generated_by=manager_user, file_path="reports/daily_2026.pdf"
        )
        url = reverse("core:report-download", kwargs={"report_id": f"report_{report.pk}"})
        api_client.force_authenticate(user=manager_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_download_report_unauthorized(self, api_client, manager_user):
        """Verify users cannot download reports generated by others (IDOR)."""
        User = get_user_model()
        other_user = User.objects.create_user(username="other_report_user", email="other_rep@test.com")
        from core.models.reporting import Report

        report = Report.objects.create(
            report_type="daily_summary", generated_by=other_user, file_path="reports/other.pdf"
        )
        # customer who is NOT the owner
        customer = User.objects.create_user(username="cust_report_1", email="custrep1@test.com", role="customer")
        api_client.force_authenticate(user=customer)
        url = reverse("core:report-download", kwargs={"report_id": f"report_{report.pk}"})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
