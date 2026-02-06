"""Report-related views for Coastal Banking.

This module contains views for generating and managing reports,
statements, and payslips.
"""

import csv
import io
import logging
from datetime import datetime
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models.accounts import Account
from core.models.hr import Payslip
from core.models.loans import Loan
from core.models.reporting import Report, ReportSchedule, ReportTemplate
from core.models.transactions import AccountStatement, Transaction
from core.permissions import IsStaff
from core.serializers.reporting import (
    ReportScheduleSerializer,
    ReportSerializer,
    ReportTemplateSerializer,
)
from core.serializers.transactions import AccountStatementSerializer

logger = logging.getLogger(__name__)


class GenerateReportView(APIView):
    """View to generate reports for operations manager."""

    permission_classes = [IsStaff]

    def post(self, request):
        report_type = request.data.get("type", "transactions")
        format_type = request.data.get("format", "pdf")
        date_from = request.data.get("date_from", "")
        date_to = request.data.get("date_to", "")

        # SECURITY: Configurable limit with enforced maximum to prevent resource exhaustion
        MAX_RECORDS = 500
        DEFAULT_LIMIT = 100
        try:
            limit = min(int(request.data.get("limit", DEFAULT_LIMIT)), MAX_RECORDS)
        except (ValueError, TypeError):
            limit = DEFAULT_LIMIT

        report_id = f'RPT-{timezone.now().strftime("%Y%m%d%H%M%S")}'

        # Parse date filters
        try:
            start_date = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
            end_date = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
        except ValueError:
            start_date = end_date = None

        # Get real data based on report type
        if report_type == "transactions":
            queryset = Transaction.objects.all()
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)

            report_data_list = list(
                queryset.order_by("-timestamp")[:limit].values(
                    "id", "transaction_type", "amount", "status", "timestamp", "description"
                )
            )
            report_data_list = [
                {
                    "date": item["timestamp"].strftime("%Y-%m-%d") if item["timestamp"] else "",
                    "description": item["description"] or f"{item['transaction_type']} #{item['id']}",
                    "amount": float(item["amount"]),
                    "status": item["status"].title(),
                }
                for item in report_data_list
            ]

        elif report_type == "loans":
            queryset = Loan.objects.all()
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            report_data_list = list(
                queryset.order_by("-created_at")[:limit].values("id", "amount", "status", "created_at", "interest_rate")
            )
            report_data_list = [
                {
                    "date": item["created_at"].strftime("%Y-%m-%d") if item["created_at"] else "",
                    "description": f"Loan #{item['id']}",
                    "amount": float(item["amount"]),
                    "status": item["status"].title(),
                }
                for item in report_data_list
            ]

        else:
            report_data_list = []

        # For CSV format, return the file directly
        if format_type == "csv" and report_data_list:
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=report_data_list[0].keys())
            writer.writeheader()
            writer.writerows(report_data_list)

            response = HttpResponse(output.getvalue(), content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="{report_id}.csv"'
            return response

        # For PDF/other formats, return JSON with download info
        total_amount = sum(item["amount"] for item in report_data_list) if report_data_list else 0
        completed_count = len([i for i in report_data_list if i.get("status", "").lower() == "completed"])
        success_rate = round((completed_count / len(report_data_list) * 100), 1) if report_data_list else 0

        report_data = {
            "id": report_id,
            "report_id": report_id,
            "title": f'{report_type.replace("_", " ").title()} Report',
            "type": report_type,
            "generated_at": timezone.now().isoformat(),
            "generated_by": request.user.get_full_name() or request.user.username,
            "period": {"from": date_from, "to": date_to},
            "status": "completed",
            "format": format_type,
            "report_url": f"/api/reports/download/{report_id}/",
            "data": report_data_list,
            "summary": {
                "total_records": len(report_data_list),
                "total_amount": total_amount,
                "success_rate": success_rate,
            },
        }

        return Response(
            {
                "success": True,
                "message": f'{report_type.replace("_", " ").title()} report generated successfully',
                "data": report_data,
            },
            status=status.HTTP_201_CREATED,
        )


class ReportViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing generated reports."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "report_type", "format"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter reports so customers only see their own generated files."""
        return Report.objects.all()

    def get_serializer_class(self):
        """Return the serializer for report metadata."""
        return ReportSerializer

    def perform_create(self, serializer):
        """Associate the current user with the report being created."""
        serializer.save(generated_by=self.request.user)

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """Generate a report from a template."""
        from core.models.reporting import ReportTemplate
        from core.pdf_services import generate_generic_report_pdf

        template_id = request.data.get("template_id")
        file_format = request.data.get("format", "pdf")
        parameters = request.data.get("parameters", {})

        try:
            template = None
            report_type = "transactions"
            title = "Custom Report"

            if template_id:
                try:
                    template = ReportTemplate.objects.get(pk=template_id)
                    report_type = template.report_type
                    title = f"{template.name}"
                except ReportTemplate.DoesNotExist:
                    pass

            report = Report.objects.create(
                template=template,
                title=title,
                report_type=report_type,
                format=file_format,
                status="generating",
                generated_by=request.user,
                parameters=parameters,
            )

            headers = []
            data = []
            subtitle = f"Generated on {timezone.now().strftime('%Y-%m-%d')}"

            if report_type == "transactions":
                headers = ["Date", "Type", "Amount (GHS)", "Status", "Description"]
                queryset = Transaction.objects.all().order_by("-timestamp")[:50]
                for tx in queryset:
                    data.append(
                        [
                            tx.timestamp.strftime("%Y-%m-%d"),
                            tx.get_transaction_type_display(),
                            f"{tx.amount:,.2f}",
                            tx.status.title(),
                            (tx.description or "")[:30],
                        ]
                    )

            elif report_type == "loans":
                headers = ["Date", "Amount (GHS)", "Term", "Status", "Applicant"]
                queryset = Loan.objects.all().order_by("-created_at")[:50]
                for loan in queryset:
                    data.append(
                        [
                            loan.created_at.strftime("%Y-%m-%d"),
                            f"{loan.amount:,.2f}",
                            f"{loan.repayment_period_months} mo",
                            loan.status.title(),
                            loan.member.get_full_name() if loan.member else "N/A",
                        ]
                    )

                is_manager = (
                    request.user.role in ["manager", "operations_manager", "admin"] or request.user.is_superuser
                )
                for acc in queryset:
                    acc_num = acc.account_number
                    if not is_manager:
                        # Mask account number: first 4 and last 4 visible
                        if len(acc_num) > 8:
                            acc_num = f"{acc_num[:4]}****{acc_num[-4:]}"
                        else:
                            acc_num = "****"

                    data.append(
                        [
                            acc_num,
                            acc.get_account_type_display(),
                            f"{acc.balance:,.2f}",
                            acc.user.get_full_name(),
                            "Active" if acc.is_active else "Inactive",
                        ]
                    )

            if file_format == "pdf":
                try:
                    pdf_buffer = generate_generic_report_pdf(title, subtitle, headers, data)
                    filename = f"report_{report.id}_{timezone.now().strftime('%Y%m%d%H%M')}.pdf"
                    path = default_storage.save(f"reports/{filename}", ContentFile(pdf_buffer.getvalue()))

                    report.file_path = path
                    report.status = "completed"
                    report.file_url = f"/reports/download/report_{report.id}/"
                    report.completed_at = timezone.now()
                    report.save()

                except Exception as gen_error:
                    report.status = "failed"
                    report.error_message = str(gen_error)
                    report.save()
                    raise gen_error
            else:
                report.status = "completed"
                report.file_url = f"/reports/download/report_{report.id}/"
                report.completed_at = timezone.now()
                report.save()

            return Response(
                {
                    "status": "success",
                    "message": f"Report generated successfully ({file_format.upper()})",
                    "report_id": report.id,
                    "report_url": report.file_url,
                    "format": file_format,
                }
            )

        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return Response({"error": "An error occurred while generating the report. Please try again."}, status=500)


class ReportTemplateViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing report templates."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["report_type", "is_active"]
    ordering_fields = ["name", "created_at"]
    ordering = ["report_type", "name"]

    def get_queryset(self):
        """Return the list of active report templates."""
        return ReportTemplate.objects.filter(is_active=True)

    def get_serializer_class(self):
        """Return the serializer for report templates."""
        return ReportTemplateSerializer

    def get_permissions(self):
        """Map template management actions to staff permissions."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return super().get_permissions()


class ReportScheduleViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for managing report schedules."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["frequency", "is_active"]
    ordering_fields = ["name", "next_run"]
    ordering = ["next_run"]

    def get_queryset(self):
        """Return the list of report schedules."""
        return ReportSchedule.objects.all()

    def get_serializer_class(self):
        """Return the serializer for report schedules."""
        return ReportScheduleSerializer

    def perform_create(self, serializer):
        """Associate the current user with the report schedule being created."""
        serializer.save(created_by=self.request.user)

    def get_permissions(self):
        """Map schedule management actions to staff permissions."""
        from core.permissions import IsStaff

        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsStaff], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        """Toggle schedule active state."""
        try:
            schedule = ReportSchedule.objects.get(pk=pk)
            schedule.is_active = not schedule.is_active
            schedule.save()
            return Response(
                {
                    "status": "success",
                    "is_active": schedule.is_active,
                    "message": f'Schedule {"activated" if schedule.is_active else "deactivated"}',
                }
            )
        except ReportSchedule.DoesNotExist:
            return Response(
                {"status": "error", "message": "Schedule not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ReportAnalyticsView(APIView):
    """View for report analytics (now using real data)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve aggregated report analytics data."""
        from django.db import models
        from django.db.models import Avg, Count, ExpressionWrapper, F

        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Basic Counts
        total_reports = Report.objects.count()
        reports_this_month = Report.objects.filter(created_at__gte=start_of_month).count()

        # 2. Reports by Type
        type_counts = Report.objects.values("report_type").annotate(count=Count("report_type"))
        reports_by_type = {item["report_type"]: item["count"] for item in type_counts}

        # 3. Generation Stats (Successful reports only)
        successful_reports = Report.objects.filter(status="completed", completed_at__isnull=False)
        total_generated = successful_reports.count()

        # Average generation time (duration in seconds)
        avg_gen_time = successful_reports.annotate(
            duration=ExpressionWrapper(F("completed_at") - F("created_at"), output_field=models.DurationField())
        ).aggregate(avg=Avg("duration"))["avg"]

        avg_seconds = round(avg_gen_time.total_seconds(), 2) if avg_gen_time else 0

        popular_templates = list(
            ReportTemplate.objects.filter(generated_reports__isnull=False)
            .annotate(generation_count=Count("generated_reports"))
            .order_by("-generation_count")[:5]
            .values("id", "name", "generation_count")
        )

        return Response(
            {
                "success": True,
                "total_reports": total_reports,
                "reports_this_month": reports_this_month,
                "reports_by_type": reports_by_type,
                "popular_templates": popular_templates,
                "generation_stats": {"total_generated": total_generated, "avg_generation_time": avg_seconds},
                "generation_time_avg": f"{avg_seconds} seconds",
            }
        )


class GeneratePayslipView(APIView):
    """View to generate staff payslips."""

    permission_classes = [IsStaff]

    def post(self, request):
        """Generate a payslip for a specified staff member."""
        from django.contrib.auth import get_user_model

        from core.models.hr import Payslip
        from core.pdf_services import generate_payslip_pdf

        User = get_user_model()

        import calendar

        from django.utils import timezone

        staff_id = request.data.get("staff_id")
        try:
            staff = User.objects.get(pk=staff_id)
        except User.DoesNotExist:
            return Response(
                {"status": "error", "message": "Staff not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Period Selection
        now = timezone.now()
        month = int(request.data.get("month", now.month))
        year = int(request.data.get("year", now.year))

        # Calculate pay period dates based on selection
        try:
            pay_period_start = datetime(year, month, 1).date()
            last_day = calendar.monthrange(year, month)[1]
            pay_period_end = datetime(year, month, last_day).date()
        except (ValueError, TypeError):
            pay_period_start = now.replace(day=1).date()
            pay_period_end = now.date()

        base_pay = Decimal(str(request.data.get("base_pay", "0")))
        allowances = Decimal(str(request.data.get("allowances", "0")))

        # Check if payslip already exists for this period
        existing = Payslip.objects.filter(staff=staff, month=month, year=year).first()
        if existing:
            # Update existing or return error? Typically regenerate/update
            payslip = existing
            payslip.base_pay = base_pay
            payslip.allowances = allowances
            payslip.pay_period_start = pay_period_start
            payslip.pay_period_end = pay_period_end
            payslip.generated_by = request.user
            payslip.save()
        else:
            payslip = Payslip.objects.create(
                staff=staff,
                month=month,
                year=year,
                pay_period_start=pay_period_start,
                pay_period_end=pay_period_end,
                base_pay=base_pay,
                allowances=allowances,
                gross_pay=0,
                ssnit_contribution=0,
                total_deductions=0,
                net_salary=0,
                generated_by=request.user,
            )

        pdf_buffer = generate_payslip_pdf(payslip)
        filename = f"payslip_{staff.username}_{payslip.month}_{payslip.year}.pdf"
        payslip.pdf_file.save(filename, ContentFile(pdf_buffer.read()))
        payslip.save()

        return Response(
            {
                "message": "Payslip generated successfully",
                "staff_id": staff.id,
                "generated_at": payslip.created_at,
                "breakdown": {
                    "base_pay": payslip.base_pay,
                    "allowances": payslip.allowances,
                    "ssnit_contribution": round(payslip.ssnit_contribution, 2),
                    "net_salary": round(payslip.net_salary, 2),
                },
                "download_url": payslip.pdf_file.url,
            }
        )


class GenerateStatementView(APIView):
    """View to generate account statements."""

    permission_classes = [IsStaff]

    def post(self, request):
        """Handle manual account statement generation requests for staff."""
        from django.db import models

        from core.models.accounts import Account
        from core.models.transactions import AccountStatement
        from core.pdf_services import generate_statement_pdf

        account_number = request.data.get("account_number")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        try:
            account = Account.objects.get(account_number=account_number)
        except Account.DoesNotExist:
            return Response(
                {"status": "error", "message": "Account not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        transactions = Transaction.objects.filter(
            models.Q(from_account=account) | models.Q(to_account=account),
            timestamp__date__range=[start_date, end_date],
            status="completed",
        ).order_by("timestamp")

        statement = AccountStatement.objects.create(
            account=account,
            requested_by=request.user,
            start_date=start_date,
            end_date=end_date,
            status="pending",
            transaction_count=transactions.count(),
            opening_balance=0,
            closing_balance=account.balance,
        )

        pdf_buffer = generate_statement_pdf(statement, list(transactions))
        filename = f"statement_{account_number}_{start_date}_{end_date}.pdf"
        statement.pdf_file.save(filename, ContentFile(pdf_buffer.read()))
        statement.status = "generated"
        statement.generated_at = timezone.now()
        statement.save()

        return Response(
            {
                "message": "Statement generated successfully",
                "account_number": account_number,
                "period": f"{start_date} to {end_date}",
                "download_url": statement.pdf_file.url,
            }
        )


class PayslipViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, GenericViewSet):
    """ViewSet for managing staff payslips with PDF generation."""

    permission_classes = [IsStaff]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["month", "year", "is_paid"]
    ordering_fields = ["created_at", "month", "year"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter payslips based on role; staff see their own, managers see all."""
        from core.models.hr import Payslip

        if self.request.user.role in ["manager", "admin", "superuser"]:
            return Payslip.objects.all()
        return Payslip.objects.filter(staff=self.request.user)

    def get_serializer_class(self):
        """Return the serializer for staff payslips."""
        from core.serializers.hr import PayslipSerializer

        return PayslipSerializer

    @action(detail=False, methods=["get"], url_path="my_payslips")
    def my_payslips(self, request):
        """Get current user's payslips with filtering support."""
        queryset = self.get_queryset().filter(staff=request.user)
        filtered_queryset = self.filter_queryset(queryset)
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Download payslip PDF."""
        from django.http import FileResponse

        try:
            payslip = Payslip.objects.get(pk=pk)

            # SECURITY: Verify ownership - only payslip owner or managers can download
            if payslip.staff != request.user and request.user.role not in ["manager", "admin", "superuser"]:
                return Response(
                    {
                        "status": "error",
                        "message": "Not authorized to access this payslip",
                        "code": "PERMISSION_DENIED",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if payslip.pdf_file:
                return FileResponse(payslip.pdf_file, as_attachment=True)
            return Response(
                {"status": "error", "message": "PDF not available", "code": "FILE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Payslip.DoesNotExist:
            return Response(
                {"status": "error", "message": "Payslip not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        """Mark payslip as paid."""
        # SECURITY: Only managers/admins can mark payslips as paid
        if request.user.role not in ["manager", "admin", "superuser"]:
            return Response(
                {"status": "error", "message": "Only managers can mark payslips as paid", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            payslip = Payslip.objects.get(pk=pk)
            payslip.is_paid = True
            payslip.paid_at = timezone.now()
            payslip.save()
            return Response({"status": "success", "message": "Payslip marked as paid"})
        except Payslip.DoesNotExist:
            return Response(
                {"status": "error", "message": "Payslip not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )


class AccountStatementViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, GenericViewSet):
    """ViewSet for auto-generated account statements."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return account statements accessible to the current user."""
        if self.request.user.role in ["staff", "cashier", "manager", "admin", "superuser"]:
            return AccountStatement.objects.all()
        return AccountStatement.objects.filter(account__user=self.request.user)

    def get_serializer_class(self):
        """Return the serializer for account statements."""
        return AccountStatementSerializer

    @action(detail=False, methods=["post"], url_path="request-statement")
    def request_statement(self, request):
        """Request a new statement."""
        from django.db import models

        from core.pdf_services import generate_statement_pdf

        account_id = request.data.get("account_id")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        try:
            account = Account.objects.get(pk=account_id)
        except Account.DoesNotExist:
            return Response(
                {"status": "error", "message": "Account not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify user can access this account
        if request.user.role == "customer" and account.user != request.user:
            return Response(
                {"status": "error", "message": "Not authorized to access this account.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        transactions = Transaction.objects.filter(
            models.Q(from_account=account) | models.Q(to_account=account),
            timestamp__date__range=[start_date, end_date],
            status="completed",
        ).order_by("timestamp")

        statement = AccountStatement.objects.create(
            account=account,
            requested_by=request.user,
            start_date=start_date,
            end_date=end_date,
            status="pending",
            transaction_count=transactions.count(),
            opening_balance=0,
            closing_balance=account.balance,
        )

        try:
            pdf_buffer = generate_statement_pdf(statement, list(transactions))
            filename = f"statement_{account.account_number}_{start_date}_{end_date}.pdf"
            statement.pdf_file.save(filename, ContentFile(pdf_buffer.read()))
            statement.status = "generated"
            statement.generated_at = timezone.now()
            statement.save()
        except Exception as e:
            logger.error(f"Failed to generate statement for account {account_id}: {e}")
            statement.status = "failed"
            statement.save()
            return Response(
                {"status": "error", "message": "Internal error during PDF generation", "code": "PDF_GEN_FAILED"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "status": "success",
                "statement_id": statement.id,
                "download_url": statement.pdf_file.url if statement.pdf_file else None,
            }
        )

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Download statement PDF."""
        from django.http import FileResponse

        from core.models.transactions import AccountStatement

        try:
            statement = AccountStatement.objects.get(pk=pk)

            # Verify access
            if request.user.role == "customer" and statement.account.user != request.user:
                return Response({"error": "Not authorized"}, status=403)

            if statement.pdf_file:
                return FileResponse(statement.pdf_file, as_attachment=True)
            return Response(
                {"status": "error", "message": "PDF not available", "code": "FILE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except AccountStatement.DoesNotExist:
            return Response(
                {"status": "error", "message": "Statement not found", "code": "NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
