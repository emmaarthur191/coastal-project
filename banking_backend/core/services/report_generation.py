from datetime import datetime
from decimal import Decimal
import logging
from django.utils import timezone
from django.db.models import Sum

from core.models.accounts import Account, AccountOpeningRequest
from core.models.hr import Expense
from core.models.loans import Loan
from core.models.operational import CashAdvance
from core.models.transactions import Transaction
from users.models import AuditLog

logger = logging.getLogger(__name__)

class ReportService:
    """Service to centralize and unify report generation logic."""

    @staticmethod
    def get_report_data(report_type, start_date=None, end_date=None, limit=100, user=None):
        """Fetch and format report data based on type and filters."""
        report_data_list = []
        
        is_manager = False
        if user:
            is_manager = (
                user.role in ["manager", "operations_manager", "admin"] or user.is_superuser
            )
        
        if report_type == "transactions":
            queryset = Transaction.objects.all()
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)
            
            items = list(
                queryset.order_by("-timestamp")[:limit].values(
                    "id", "transaction_type", "amount", "status", "timestamp", "description"
                )
            )
            report_data_list = [
                {
                    "date": item["timestamp"].strftime("%Y-%m-%d") if item["timestamp"] else "",
                    "description": item["description"] or f"{item['transaction_type'].title()} #{item['id']}",
                    "amount": float(item["amount"]),
                    "status": item["status"].title().replace("_", " "),
                }
                for item in items
            ]

        elif report_type == "loans":
            queryset = Loan.objects.all().select_related("user")
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)
            
            items = queryset.order_by("-created_at")[:limit]
            for loan in items:
                member_name = loan.user.get_full_name() if loan.user else "N/A"
                report_data_list.append({
                    "date": loan.created_at.strftime("%Y-%m-%d") if loan.created_at else "",
                    "description": f"Loan #{loan.id} - {member_name}",
                    "amount": float(loan.amount),
                    "status": loan.status.title(),
                })

        elif report_type == "cash_advances":
            queryset = CashAdvance.objects.all()
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)

            items = list(
                queryset.order_by("-created_at")[:limit].values("id", "amount", "status", "created_at", "reason")
            )
            report_data_list = [
                {
                    "date": item["created_at"].strftime("%Y-%m-%d") if item["created_at"] else "",
                    "description": item["reason"] or f"Cash Advance #{item['id']}",
                    "amount": float(item["amount"]),
                    "status": item["status"].title(),
                }
                for item in items
            ]

        elif report_type == "audit_logs":
            queryset = AuditLog.objects.all()
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)

            items = list(
                queryset.order_by("-created_at")[:limit].values("id", "action", "model_name", "created_at")
            )
            report_data_list = [
                {
                    "date": item["created_at"].strftime("%Y-%m-%d") if item["created_at"] else "",
                    "description": f"[{item['action']}] {item['model_name']}",
                    "amount": 0.0,
                    "status": "Logged",
                }
                for item in items
            ]

        elif report_type == "expenses":
            queryset = Expense.objects.all()
            if start_date:
                queryset = queryset.filter(date__gte=start_date)
            if end_date:
                queryset = queryset.filter(date__lte=end_date)

            items = list(
                queryset.order_by("-date")[:limit].values("id", "category", "description", "amount", "status", "date")
            )
            report_data_list = [
                {
                    "date": item["date"].strftime("%Y-%m-%d") if item["date"] else "",
                    "description": f"[{item['category']}] {item['description']}",
                    "amount": float(item["amount"]),
                    "status": item["status"].title(),
                }
                for item in items
            ]

        elif report_type == "onboarding_metrics":
            queryset = AccountOpeningRequest.objects.all()
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)

            items = list(
                queryset.order_by("-created_at")[:limit].values("id", "status", "created_at")
            )
            for item in items:
                report_data_list.append({
                    "date": item["created_at"].strftime("%Y-%m-%d") if item["created_at"] else "",
                    "description": f"Onboarding Request #{item['id']}",
                    "amount": 0.0,
                    "status": item["status"].title(),
                })

        elif report_type == "profit_summary":
            # Enhanced Profit/Loss summary
            inflow_types = ["deposit", "repayment", "fee"]
            outflow_types = ["withdrawal", "disbursement"]
            
            expenses_agg = Expense.objects.filter(status="approved")

            if start_date:
                expenses_agg = expenses_agg.filter(date__gte=start_date)
            if end_date:
                expenses_agg = expenses_agg.filter(date__lte=end_date)
            
            # Individual breakdowns for the summary
            total_deposits = Transaction.objects.filter(
                transaction_type="deposit", status="completed"
            )
            total_repayments = Transaction.objects.filter(
                transaction_type="repayment", status="completed"
            )
            total_fees = Transaction.objects.filter(
                transaction_type="fee", status="completed"
            )
            total_withdrawals = Transaction.objects.filter(
                transaction_type="withdrawal", status="completed"
            )
            total_disbursements = Transaction.objects.filter(
                transaction_type="disbursement", status="completed"
            )

            if start_date:
                total_deposits = total_deposits.filter(timestamp__date__gte=start_date)
                total_repayments = total_repayments.filter(timestamp__date__gte=start_date)
                total_fees = total_fees.filter(timestamp__date__gte=start_date)
                total_withdrawals = total_withdrawals.filter(timestamp__date__gte=start_date)
                total_disbursements = total_disbursements.filter(timestamp__date__gte=start_date)
            
            if end_date:
                total_deposits = total_deposits.filter(timestamp__date__lte=end_date)
                total_repayments = total_repayments.filter(timestamp__date__lte=end_date)
                total_fees = total_fees.filter(timestamp__date__lte=end_date)
                total_withdrawals = total_withdrawals.filter(timestamp__date__lte=end_date)
                total_disbursements = total_disbursements.filter(timestamp__date__lte=end_date)

            val_deposits = total_deposits.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            val_repayments = total_repayments.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            val_fees = total_fees.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            val_withdrawals = total_withdrawals.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            val_disbursements = total_disbursements.aggregate(t=Sum("amount"))["t"] or Decimal("0")
            val_expenses = expenses_agg.aggregate(t=Sum("amount"))["t"] or Decimal("0")

            total_inflow = val_deposits + val_repayments + val_fees
            total_outflow = val_withdrawals + val_disbursements + val_expenses
            net_profit = total_inflow - total_outflow

            report_data_list = [
                {"date": "", "description": "INCOME / INFLOWS", "amount": 0.0, "status": "Header"},
                {"date": "", "description": "  - Deposits", "amount": float(val_deposits), "status": "Inflow"},
                {"date": "", "description": "  - Loan Repayments", "amount": float(val_repayments), "status": "Inflow"},
                {"date": "", "description": "  - Service Fees", "amount": float(val_fees), "status": "Inflow"},
                {"date": "", "description": "EXPENSES / OUTFLOWS", "amount": 0.0, "status": "Header"},
                {"date": "", "description": "  - Withdrawals", "amount": float(val_withdrawals), "status": "Outflow"},
                {"date": "", "description": "  - Loan Disbursements", "amount": float(val_disbursements), "status": "Outflow"},
                {"date": "", "description": "  - Operational Expenses", "amount": float(val_expenses), "status": "Outflow"},
                {"date": timezone.now().strftime("%Y-%m-%d"), "description": "NET PROFIT/LOSS", "amount": float(net_profit), "status": "Summary"},
            ]

        elif report_type == "accounts":
            queryset = Account.objects.all().select_related("user")
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)
            
            items = queryset.order_by("-created_at")[:limit]
            for acc in items:
                acc_num = acc.account_number
                if not is_manager:
                    # Mask account number: first 4 and last 4 visible
                    if len(acc_num) > 8:
                        acc_num = f"{acc_num[:4]}****{acc_num[-4:]}"
                    else:
                        acc_num = "****"

                report_data_list.append({
                    "date": acc.created_at.strftime("%Y-%m-%d") if acc.created_at else "",
                    "description": f"Account {acc_num} ({acc.get_account_type_display()})",
                    "amount": float(acc.balance),
                    "status": "Active" if acc.is_active else "Inactive",
                })

        return report_data_list
