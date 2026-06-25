import pytest
from django.urls import reverse
from rest_framework import status
from decimal import Decimal
from unittest.mock import patch
from io import BytesIO
from django.utils import timezone
import core.pdf_services

from core.models.accounts import Account
from core.models.transactions import Transaction
from core.models.reporting import Report, ReportTemplate, ReportSchedule
from core.models.operational import CashAdvance
from users.models import User, AuditLog


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username="rpt_mgr", email="rpt_mgr@example.com",
        password="Password123!", role="manager",
        is_approved=True, is_staff=True,
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username="rpt_cust", email="rpt_cust@example.com",
        password="Password123!", role="customer", is_approved=True,
    )


# ---------------------------------------------------------------------------
#  GenerateReportView  (/operations/generate-report/)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestGenerateReportView:

    def _url(self):
        return reverse("core:generate-report")

    def test_invalid_date_format_falls_back_gracefully(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {
            "type": "transactions", "format": "json",
            "date_from": "not-a-date", "date_to": "also-bad",
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_invalid_limit_falls_back_to_default(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {
            "type": "transactions", "format": "json", "limit": "not_an_int",
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_audit_logs_report_type(self, api_client, manager_user):
        AuditLog.objects.create(
            user=manager_user, action="login", model_name="User",
        )
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {"type": "audit_logs", "format": "json"})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["type"] == "audit_logs"
        assert len(response.data["data"]["data"]) >= 1

    def test_cash_advances_report_type(self, api_client, manager_user):
        CashAdvance.objects.create(user=manager_user, amount=Decimal("500.00"), reason="petty cash", status="approved")
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {"type": "cash_advances", "format": "json"})
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data["data"]["data"]) >= 1

    def test_loans_report_type(self, api_client, manager_user, customer_user):
        from core.models.loans import Loan
        Loan.objects.create(
            user=customer_user, amount=Decimal("2000.00"),
            status="approved", term_months=12,
            interest_rate=10.0,
        )
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {"type": "loans", "format": "json"})
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data["data"]["data"]) >= 1

    def test_unknown_report_type_returns_empty_data(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {"type": "unicorn", "format": "json"})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["data"] == []

    def test_transactions_csv_format(self, api_client, manager_user):
        Transaction.objects.create(amount=Decimal("100.00"), transaction_type="deposit")
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {"type": "transactions", "format": "csv"})
        assert response.status_code == status.HTTP_200_OK
        assert "text/csv" in response.get("Content-Type")

    def test_transactions_pdf_format(self, api_client, manager_user):
        Transaction.objects.create(amount=Decimal("100.00"), transaction_type="deposit")
        api_client.force_authenticate(user=manager_user)
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"fake-pdf-bytes")
            response = api_client.post(self._url(), {"type": "transactions", "format": "pdf"})
        assert response.status_code == status.HTTP_200_OK
        assert "application/pdf" in response.get("Content-Type")

    def test_date_range_filter_applied(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {
            "type": "transactions", "format": "json",
            "date_from": "2020-01-01", "date_to": "2020-01-31",
        })
        # Should succeed with empty data for that old period
        assert response.status_code == status.HTTP_201_CREATED


# ---------------------------------------------------------------------------
#  ReportViewSet  (router basename=report)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestReportViewSet:

    def test_generate_action_no_template(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"pdf")
            response = api_client.post(url, {"format": "pdf"})
        assert response.status_code == status.HTTP_200_OK
        assert Report.objects.filter(status="completed").count() >= 1

    def test_generate_action_with_valid_template(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        template = ReportTemplate.objects.create(name="Tx Report", report_type="transactions")
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"pdf")
            response = api_client.post(url, {"template_id": template.id, "format": "pdf"})
        assert response.status_code == status.HTTP_200_OK
        report = Report.objects.get(id=response.data["report_id"])
        assert report.template == template

    def test_generate_action_non_existent_template_creates_report(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"pdf")
            response = api_client.post(url, {"template_id": 99999, "format": "pdf"})
        assert response.status_code == status.HTTP_200_OK

    def test_generate_action_loans_type(self, api_client, manager_user, customer_user):
        from core.models.loans import Loan
        Loan.objects.create(
            user=customer_user, amount=Decimal("1500.00"),
            status="active", term_months=24,
            interest_rate=10.0,
        )
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"pdf")
            response = api_client.post(url, {"report_type": "loans", "format": "pdf"})
        assert response.status_code == status.HTTP_200_OK

    def test_generate_action_accounts_type_manager_sees_full_number(self, api_client, manager_user, customer_user):
        Account.objects.create(user=customer_user, account_number="123456789012", balance=Decimal("500.00"))
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"pdf")
            response = api_client.post(url, {"report_type": "accounts", "format": "pdf"})
        assert response.status_code == status.HTTP_200_OK
        # Ensure pdf was called with the unmasked number
        _args, _kwargs = mock_pdf.call_args
        data_rows = _args[3]
        if data_rows:
            assert "****" not in data_rows[0][0]

    def test_generate_action_accounts_type_staff_sees_masked_number(self, api_client, customer_user, db):
        Account.objects.create(user=customer_user, account_number="123456789012", balance=Decimal("500.00"))
        banker = User.objects.create_user(
            username="rpt_banker", email="banker@ex.com",
            role="banker", is_approved=True, is_staff=True,
        )
        api_client.force_authenticate(user=banker)
        url = reverse("core:report-generate")
        with patch("core.pdf_services.generate_generic_report_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"pdf")
            response = api_client.post(url, {"report_type": "accounts", "format": "pdf"})
        assert response.status_code == status.HTTP_200_OK
        _args, _kwargs = mock_pdf.call_args
        data_rows = _args[3]
        if data_rows:
            assert "****" in data_rows[0][0]

    def test_generate_action_non_pdf_format(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        response = api_client.post(url, {"format": "csv"})
        assert response.status_code == status.HTTP_200_OK
        report = Report.objects.filter(status="completed").last()
        assert report is not None

    def test_generate_action_pdf_failure_returns_500(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-generate")
        with patch("core.pdf_services.generate_generic_report_pdf", side_effect=Exception("PDF failed")):
            response = api_client.post(url, {"format": "pdf"})
        assert response.status_code == 500
        assert response.data.get('status') == 'error'

    def test_list_reports(self, api_client, manager_user):
        Report.objects.create(report_type="transactions", status="completed",
                              generated_by=manager_user)
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_create_report(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-list")
        response = api_client.post(url, {"title": "Test", "report_type": "transactions", "format": "pdf", "status": "pending"})
        assert response.status_code == status.HTTP_201_CREATED


# ---------------------------------------------------------------------------
#  ReportAnalyticsView  (/reports/analytics/)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestReportAnalyticsView:

    def test_analytics_returns_correct_structure(self, api_client, manager_user):
        Report.objects.create(
            report_type="transactions", status="completed",
            completed_at=timezone.now(), generated_by=manager_user,
        )
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-analytics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "report_stats" in response.data
        assert "interest_projection" in response.data
        assert response.data["report_stats"]["total_reports"] >= 1

    def test_analytics_empty_database(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-analytics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["report_stats"]["total_reports"] == 0


# ---------------------------------------------------------------------------
#  ReportScheduleViewSet  (basename=report-schedule)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestReportScheduleViewSet:

    def test_toggle_active_action(self, api_client, manager_user):
        schedule = ReportSchedule.objects.create(
            template=ReportTemplate.objects.create(name="Daily Report", report_type="transactions"),
            name="Weekly Report",
            frequency="weekly", format="pdf", is_active=True,
            time_of_day=timezone.now().time(),
            created_by=manager_user,
        )
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-schedule-toggle-active", args=[schedule.pk])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_active"] is False

    def test_toggle_active_not_found(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:report-schedule-toggle-active", args=[99999])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
#  GeneratePayslipView  (/operations/generate-payslip/)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestGeneratePayslipView:

    def _url(self):
        return reverse("core:generate-payslip")

    def test_staff_not_found(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {"staff_id": 99999, "base_pay": 1000})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_negative_base_pay_rejected(self, api_client, manager_user, customer_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {
            "staff_id": customer_user.id, "base_pay": "-500", "allowances": "200",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "INVALID_INPUT"

    def test_negative_allowances_rejected(self, api_client, manager_user, customer_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {
            "staff_id": customer_user.id, "base_pay": "1000", "allowances": "-100",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_new_payslip_success(self, api_client, manager_user, customer_user):
        api_client.force_authenticate(user=manager_user)
        with patch("core.pdf_services.generate_payslip_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"payslip-content")
            response = api_client.post(self._url(), {
                "staff_id": customer_user.id,
                "base_pay": "1500", "allowances": "300",
                "month": 3, "year": 2026,
            })
        assert response.status_code == status.HTTP_200_OK
        assert "download_url" in response.data

    def test_update_existing_payslip(self, api_client, manager_user, customer_user):
        from core.models.hr import Payslip
        now = timezone.now()
        Payslip.objects.create(
            staff=customer_user, month=2, year=2026,
            pay_period_start=now.date().replace(day=1),
            pay_period_end=now.date(),
            base_pay=1000, allowances=100, gross_pay=1100,
            ssnit_contribution=55, total_deductions=55, net_salary=1045,
            generated_by=manager_user,
        )
        api_client.force_authenticate(user=manager_user)
        with patch("core.pdf_services.generate_payslip_pdf") as mock_pdf:
            mock_pdf.return_value = BytesIO(b"updated-payslip")
            response = api_client.post(self._url(), {
                "staff_id": customer_user.id,
                "base_pay": "2000", "allowances": "500",
                "month": 2, "year": 2026,
            })
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
#  GenerateStatementView  (/banking/generate-statement/)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestGenerateStatementView:

    def _url(self):
        return reverse("core:generate-statement")

    def test_account_not_found(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(self._url(), {
            "account_number": "DOES_NOT_EXIST",
            "start_date": "2024-01-01", "end_date": "2024-01-31",
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
#  PayslipViewSet  (basename=payslip)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPayslipViewSet:

    def test_my_payslips_action(self, api_client, cashier_user, manager_user):
        from core.models.hr import Payslip
        now = timezone.now()
        Payslip.objects.create(
            staff=cashier_user, month=1, year=2026,
            pay_period_start=now.date().replace(day=1),
            pay_period_end=now.date(),
            base_pay=1000, allowances=50, gross_pay=1050,
            ssnit_contribution=55, total_deductions=55, net_salary=995,
            generated_by=manager_user,
        )
        api_client.force_authenticate(user=cashier_user)
        url = reverse("core:payslip-my-payslips")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_mark_paid_requires_manager(self, api_client, customer_user, manager_user):
        from core.models.hr import Payslip
        now = timezone.now()
        ps = Payslip.objects.create(
            staff=customer_user, month=4, year=2026,
            pay_period_start=now.date().replace(day=1),
            pay_period_end=now.date(),
            base_pay=Decimal("1000.00"), allowances=Decimal("50.00"), gross_pay=Decimal("1050.00"),
            ssnit_contribution=Decimal("55.00"), total_deductions=Decimal("55.00"), net_salary=Decimal("995.00"),
            generated_by=manager_user,
        )
        # Non-manager is rejected
        api_client.force_authenticate(user=customer_user)
        url = reverse("core:payslip-mark-paid", args=[ps.pk])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Manager succeeds
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        ps.refresh_from_db()
        assert ps.is_paid is True

    def test_payslip_download_not_found(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:payslip-download", args=[99999])
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_payslip_download_no_pdf_file(self, api_client, customer_user, manager_user):
        from core.models.hr import Payslip
        now = timezone.now()
        ps = Payslip.objects.create(
            staff=customer_user, month=5, year=2026,
            pay_period_start=now.date().replace(day=1),
            pay_period_end=now.date(),
            base_pay=Decimal("1000.00"), allowances=Decimal("0.00"), gross_pay=Decimal("1000.00"),
            ssnit_contribution=Decimal("55.00"), total_deductions=Decimal("55.00"), net_salary=Decimal("945.00"),
            generated_by=manager_user,
        )
        api_client.force_authenticate(user=manager_user)
        url = reverse("core:payslip-download", args=[ps.pk])
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
