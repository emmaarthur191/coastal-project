from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from banking.models import Transaction, Account
from operations.models import Commission


class ReportGenerator:
    """Service class for generating various types of reports."""

    def __init__(self):
        pass

    def generate_transaction_summary(self, start_date, end_date, filters=None):
        """Generate transaction summary for a date range."""
        filters = filters or {}

        # Base queryset
        transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )

        # Apply filters
        if 'cashier_id' in filters:
            transactions = transactions.filter(cashier_id=filters['cashier_id'])
        if 'transaction_type' in filters:
            transactions = transactions.filter(type=filters['transaction_type'])
        if 'category' in filters:
            transactions = transactions.filter(category=filters['category'])

        # Aggregate data
        summary = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'totals': transactions.aggregate(
                total_transactions=Count('id'),
                total_amount=Sum('amount'),
                average_amount=Avg('amount')
            ),
            'by_type': self._aggregate_by_field(transactions, 'type'),
            'by_category': self._aggregate_by_field(transactions, 'category'),
            'by_cashier': self._aggregate_by_cashier(transactions),
            'daily_breakdown': self._daily_breakdown(transactions, start_date, end_date),
        }

        return summary

    def generate_cashier_performance_report(self, start_date, end_date, cashier_id=None):
        """Generate cashier performance report."""
        transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            cashier__isnull=False
        )

        if cashier_id:
            transactions = transactions.filter(cashier_id=cashier_id)

        # Group by cashier
        cashier_stats = transactions.values(
            'cashier__id',
            'cashier__email',
            'cashier__first_name',
            'cashier__last_name'
        ).annotate(
            total_transactions=Count('id'),
            total_amount=Sum('amount'),
            average_transaction=Avg('amount'),
            deposits_count=Count('id', filter=Q(type='deposit')),
            withdrawals_count=Count('id', filter=Q(type='withdrawal')),
            transfers_count=Count('id', filter=Q(type='transfer'))
        ).order_by('-total_amount')

        # Get commission data
        commissions = Commission.objects.filter(
            transaction__timestamp__date__gte=start_date,
            transaction__timestamp__date__lte=end_date
        ).values('earned_by__id').annotate(
            total_commissions=Sum('amount')
        )

        commission_dict = {item['earned_by__id']: item['total_commissions'] for item in commissions}

        report_data = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'cashier_performance': []
        }

        for stat in cashier_stats:
            cashier_id = stat['cashier__id']
            performance = {
                'cashier_id': cashier_id,
                'cashier_name': f"{stat['cashier__first_name']} {stat['cashier__last_name']}",
                'cashier_email': stat['cashier__email'],
                'total_transactions': stat['total_transactions'],
                'total_amount': float(stat['total_amount'] or 0),
                'average_transaction': float(stat['average_transaction'] or 0),
                'deposits_count': stat['deposits_count'],
                'withdrawals_count': stat['withdrawals_count'],
                'transfers_count': stat['transfers_count'],
                'total_commissions': float(commission_dict.get(cashier_id, 0)),
            }
            report_data['cashier_performance'].append(performance)

        return report_data

    def generate_financial_overview(self, start_date, end_date):
        """Generate financial overview report."""
        transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )

        # Income and expenses
        income_data = transactions.filter(category='income').aggregate(
            total_income=Sum('amount'),
            income_count=Count('id')
        )

        expense_data = transactions.filter(category='expense').aggregate(
            total_expenses=Sum('amount'),
            expense_count=Count('id')
        )

        # Account balances summary
        accounts_summary = Account.objects.aggregate(
            total_accounts=Count('id'),
            total_balance=Sum('balance'),
            active_accounts=Count('id', filter=Q(status='Active'))
        )

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'financial_summary': {
                'total_income': float(income_data['total_income'] or 0),
                'total_expenses': float(expense_data['total_expenses'] or 0),
                'net_profit': float((income_data['total_income'] or 0) - (expense_data['total_expenses'] or 0)),
                'income_transactions': income_data['income_count'],
                'expense_transactions': expense_data['expense_count'],
            },
            'accounts_summary': {
                'total_accounts': accounts_summary['total_accounts'],
                'active_accounts': accounts_summary['active_accounts'],
                'total_balance': float(accounts_summary['total_balance'] or 0),
            }
        }

    def generate_compliance_report(self, start_date, end_date):
        """Generate compliance and regulatory report."""
        # Large transactions (above threshold)
        threshold = Decimal('10000.00')  # Configurable threshold
        large_transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            amount__gte=threshold
        ).values(
            'id', 'amount', 'type', 'timestamp',
            'account__owner__email', 'cashier__email'
        ).order_by('-amount')

        # Suspicious patterns (placeholder - would need ML/fraud detection)
        suspicious_transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            # Add suspicious criteria here
        ).values(
            'id', 'amount', 'type', 'timestamp',
            'account__owner__email'
        )

        # Failed transactions
        failed_transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            status='failed'
        ).count()

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'compliance_metrics': {
                'large_transactions_count': large_transactions.count(),
                'large_transactions_threshold': float(threshold),
                'suspicious_transactions_count': suspicious_transactions.count(),
                'failed_transactions_count': failed_transactions,
            },
            'large_transactions': list(large_transactions),
            'suspicious_transactions': list(suspicious_transactions),
            'regulatory_notes': []
        }

    def generate_trend_analysis(self, start_date, end_date, periods=12):
        """Generate trend analysis report."""
        # Calculate monthly trends
        trends = []
        current_date = start_date

        while current_date <= end_date:
            month_end = min(current_date + timedelta(days=30), end_date)

            monthly_data = Transaction.objects.filter(
                timestamp__date__gte=current_date,
                timestamp__date__lte=month_end
            ).aggregate(
                total_transactions=Count('id'),
                total_amount=Sum('amount'),
                average_amount=Avg('amount')
            )

            trends.append({
                'period': current_date.strftime('%Y-%m'),
                'start_date': current_date.isoformat(),
                'end_date': month_end.isoformat(),
                'total_transactions': monthly_data['total_transactions'],
                'total_amount': float(monthly_data['total_amount'] or 0),
                'average_amount': float(monthly_data['average_amount'] or 0),
            })

            current_date = month_end + timedelta(days=1)

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'trends': trends,
            'summary': {
                'total_periods': len(trends),
                'avg_transactions_per_period': sum(t['total_transactions'] for t in trends) / len(trends) if trends else 0,
                'avg_amount_per_period': sum(t['total_amount'] for t in trends) / len(trends) if trends else 0,
            }
        }

    def _aggregate_by_field(self, queryset, field_name):
        """Helper method to aggregate transactions by a field."""
        return {
            item[field_name]: {
                'count': item['count'],
                'total_amount': float(item['total_amount'] or 0),
                'average_amount': float(item['average_amount'] or 0)
            }
            for item in queryset.values(field_name).annotate(
                count=Count('id'),
                total_amount=Sum('amount'),
                average_amount=Avg('amount')
            )
        }

    def _aggregate_by_cashier(self, queryset):
        """Helper method to aggregate transactions by cashier."""
        return {
            f"{item['cashier__first_name']} {item['cashier__last_name']}": {
                'cashier_id': item['cashier__id'],
                'count': item['count'],
                'total_amount': float(item['total_amount'] or 0),
                'average_amount': float(item['average_amount'] or 0)
            }
            for item in queryset.values(
                'cashier__id', 'cashier__first_name', 'cashier__last_name'
            ).annotate(
                count=Count('id'),
                total_amount=Sum('amount'),
                average_amount=Avg('amount')
            )
        }

    def _daily_breakdown(self, queryset, start_date, end_date):
        """Generate daily transaction breakdown."""
        daily_data = []
        current_date = start_date

        while current_date <= end_date:
            day_data = queryset.filter(
                timestamp__date=current_date
            ).aggregate(
                count=Count('id'),
                total_amount=Sum('amount'),
                average_amount=Avg('amount')
            )

            daily_data.append({
                'date': current_date.isoformat(),
                'count': day_data['count'],
                'total_amount': float(day_data['total_amount'] or 0),
                'average_amount': float(day_data['average_amount'] or 0),
            })

            current_date += timedelta(days=1)

        return daily_data


class ReportScheduler:
    """Service class for managing report scheduling."""

    def __init__(self):
        pass

    def get_due_schedules(self):
        """Get all schedules that are due for execution."""
        return ReportSchedule.objects.filter(
            status='active',
            next_run__lte=timezone.now()
        )

    def process_scheduled_reports(self):
        """Process all due scheduled reports."""
        due_schedules = self.get_due_schedules()
        processed_count = 0

        for schedule in due_schedules:
            try:
                self.execute_schedule(schedule)
                processed_count += 1
            except Exception as e:
                schedule.mark_run_failed(str(e))

        return processed_count

    def execute_schedule(self, schedule):
        """Execute a specific report schedule."""
        from .management.commands.generate_reports import Command

        # Mark as started
        schedule.mark_run_started()

        try:
            # Generate the report
            cmd = Command()
            report_date = date.today()
            cmd.generate_report_for_template(schedule.template, report_date)

            # Mark as completed and update next run
            schedule.mark_run_completed()

        except Exception as e:
            schedule.mark_run_failed(str(e))
            raise