from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import datetime, date, timedelta
from decimal import Decimal
from banking.models import Transaction
from reports.models import Report, ReportTemplate, ReportSchedule, ReportAnalytics


class Command(BaseCommand):
    help = 'Generate automated reports based on schedules and templates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--template-id',
            type=str,
            help='Generate report for specific template ID',
        )
        parser.add_argument(
            '--schedule-id',
            type=str,
            help='Generate report for specific schedule ID',
        )
        parser.add_argument(
            '--report-date',
            type=str,
            help='Report date in YYYY-MM-DD format (default: today)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force generation even if already exists',
        )

    def handle(self, *args, **options):
        report_date = date.today()
        if options['report_date']:
            try:
                report_date = datetime.strptime(options['report_date'], '%Y-%m-%d').date()
            except ValueError:
                raise CommandError('Invalid date format. Use YYYY-MM-DD')

        if options['template_id']:
            # Generate report for specific template
            try:
                template = ReportTemplate.objects.get(id=options['template_id'])
                self.generate_report_for_template(template, report_date, options['force'])
            except ReportTemplate.DoesNotExist:
                raise CommandError(f'Template with ID {options["template_id"]} does not exist')
        elif options['schedule_id']:
            # Generate report for specific schedule
            try:
                schedule = ReportSchedule.objects.get(id=options['schedule_id'])
                self.generate_report_for_schedule(schedule, report_date, options['force'])
            except ReportSchedule.DoesNotExist:
                raise CommandError(f'Schedule with ID {options["schedule_id"]} does not exist')
        else:
            # Generate all due scheduled reports
            self.generate_scheduled_reports(report_date)

    def generate_scheduled_reports(self, report_date):
        """Generate all reports that are due for the given date."""
        self.stdout.write(f'Checking for scheduled reports due on {report_date}')

        # Find schedules that should run
        due_schedules = ReportSchedule.objects.filter(
            status='active',
            next_run__lte=timezone.now()
        )

        generated_count = 0
        for schedule in due_schedules:
            try:
                self.generate_report_for_schedule(schedule, report_date)
                generated_count += 1
            except Exception as e:
                self.stderr.write(f'Failed to generate report for schedule {schedule.id}: {str(e)}')
                schedule.mark_run_failed(str(e))

        self.stdout.write(f'Successfully generated {generated_count} scheduled reports')

    def generate_report_for_template(self, template, report_date, force=False):
        """Generate a report for a specific template."""
        self.stdout.write(f'Generating report for template: {template.name}')

        # Check if report already exists
        existing_report = Report.objects.filter(
            template=template,
            report_date=report_date
        ).first()

        if existing_report and not force:
            self.stdout.write(f'Report already exists for {report_date}, skipping')
            return existing_report

        # Create new report
        report = Report.objects.create(
            template=template,
            title=f"{template.name} - {report_date.strftime('%B %Y')}",
            report_date=report_date,
        )

        try:
            # Generate report data
            report_data = self.generate_report_data(template, report_date)
            report.complete_generation(data=report_data)

            # Generate analytics
            self.generate_report_analytics(report)

            self.stdout.write(f'Successfully generated report: {report.title}')
            return report

        except Exception as e:
            report.fail_generation(str(e))
            raise CommandError(f'Failed to generate report: {str(e)}')

    def generate_report_for_schedule(self, schedule, report_date, force=False):
        """Generate a report for a specific schedule."""
        self.stdout.write(f'Generating scheduled report: {schedule.name}')

        # Mark schedule as running
        schedule.mark_run_started()

        try:
            report = self.generate_report_for_template(schedule.template, report_date, force)
            schedule.mark_run_completed()
            return report
        except Exception as e:
            schedule.mark_run_failed(str(e))
            raise

    def generate_report_data(self, template, report_date):
        """Generate the actual report data based on template type."""
        if template.template_type == 'transaction_summary':
            return self.generate_transaction_summary(template, report_date)
        elif template.template_type == 'cashier_activity':
            return self.generate_cashier_activity_report(template, report_date)
        elif template.template_type == 'compliance':
            return self.generate_compliance_report(template, report_date)
        elif template.template_type == 'financial_overview':
            return self.generate_financial_overview(template, report_date)
        else:
            return self.generate_custom_report(template, report_date)

    def generate_transaction_summary(self, template, report_date):
        """Generate transaction summary report."""
        # Calculate date range based on template frequency
        start_date, end_date = self.get_date_range(template.frequency, report_date)

        # Get transaction data
        transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )

        # Aggregate data
        summary = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'frequency': template.frequency
            },
            'totals': {
                'total_transactions': transactions.count(),
                'total_amount': float(transactions.aggregate(Sum('amount'))['amount__sum'] or 0),
            },
            'by_type': {},
            'by_category': {},
            'daily_breakdown': []
        }

        # By transaction type
        type_summary = transactions.values('type').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('type')

        for item in type_summary:
            summary['by_type'][item['type']] = {
                'count': item['count'],
                'total_amount': float(item['total_amount'] or 0)
            }

        # By category
        category_summary = transactions.values('category').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('category')

        for item in category_summary:
            summary['by_category'][item['category']] = {
                'count': item['count'],
                'total_amount': float(item['total_amount'] or 0)
            }

        # Daily breakdown
        daily_data = transactions.extra(
            select={'date': 'DATE(timestamp)'}
        ).values('date').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('date')

        for item in daily_data:
            summary['daily_breakdown'].append({
                'date': item['date'].isoformat(),
                'count': item['count'],
                'total_amount': float(item['total_amount'] or 0)
            })

        return summary

    def generate_cashier_activity_report(self, template, report_date):
        """Generate cashier activity report."""
        start_date, end_date = self.get_date_range(template.frequency, report_date)

        # Get transactions by cashier
        cashier_data = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            cashier__isnull=False
        ).values('cashier__email', 'cashier__first_name', 'cashier__last_name').annotate(
            total_transactions=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-total_amount')

        report_data = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'cashier_performance': []
        }

        for item in cashier_data:
            report_data['cashier_performance'].append({
                'cashier_name': f"{item['cashier__first_name']} {item['cashier__last_name']}",
                'cashier_email': item['cashier__email'],
                'total_transactions': item['total_transactions'],
                'total_amount': float(item['total_amount'] or 0),
                'average_transaction': float(item['total_amount'] or 0) / item['total_transactions'] if item['total_transactions'] > 0 else 0
            })

        return report_data

    def generate_compliance_report(self, template, report_date):
        """Generate compliance report."""
        start_date, end_date = self.get_date_range(template.frequency, report_date)

        # This would include compliance checks, suspicious activities, etc.
        # For now, placeholder implementation
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'compliance_checks': {
                'total_checks': 0,
                'passed': 0,
                'failed': 0,
                'pending': 0
            },
            'suspicious_activities': [],
            'regulatory_filings': []
        }

    def generate_financial_overview(self, template, report_date):
        """Generate financial overview report."""
        start_date, end_date = self.get_date_range(template.frequency, report_date)

        transactions = Transaction.objects.filter(
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date
        )

        income = transactions.filter(category='income').aggregate(Sum('amount'))['amount__sum'] or 0
        expenses = transactions.filter(category='expense').aggregate(Sum('amount'))['amount__sum'] or 0

        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            'financial_summary': {
                'total_income': float(income),
                'total_expenses': float(expenses),
                'net_profit': float(income - expenses),
                'total_transactions': transactions.count()
            }
        }

    def generate_custom_report(self, template, report_date):
        """Generate custom report based on template configuration."""
        # This would use the template's filters_config, columns_config, etc.
        # For now, return basic structure
        return {
            'period': {
                'start_date': report_date.isoformat(),
                'end_date': report_date.isoformat(),
            },
            'custom_data': {},
            'note': 'Custom report generation not fully implemented'
        }

    def generate_report_analytics(self, report):
        """Generate analytics for a completed report."""
        analytics = ReportAnalytics.objects.create(report=report)

        # Extract metrics from report data
        data = report.data
        if 'totals' in data:
            analytics.total_transactions = data['totals'].get('total_transactions', 0)
            analytics.total_amount = Decimal(str(data['totals'].get('total_amount', 0)))

        # Calculate averages
        if analytics.total_transactions > 0:
            analytics.average_transaction_amount = analytics.total_amount / analytics.total_transactions

        # Transaction breakdown
        if 'by_type' in data:
            by_type = data['by_type']
            analytics.deposits_count = by_type.get('deposit', {}).get('count', 0)
            analytics.withdrawals_count = by_type.get('withdrawal', {}).get('count', 0)
            analytics.transfers_count = by_type.get('transfer', {}).get('count', 0)
            analytics.fees_count = by_type.get('fee', {}).get('count', 0)

            analytics.deposits_amount = Decimal(str(by_type.get('deposit', {}).get('total_amount', 0)))
            analytics.withdrawals_amount = Decimal(str(by_type.get('withdrawal', {}).get('total_amount', 0)))
            analytics.transfers_amount = Decimal(str(by_type.get('transfer', {}).get('total_amount', 0)))
            analytics.fees_amount = Decimal(str(by_type.get('fee', {}).get('total_amount', 0)))

        analytics.save()

    def get_date_range(self, frequency, report_date):
        """Get date range based on frequency and report date."""
        if frequency == 'daily':
            return report_date, report_date
        elif frequency == 'weekly':
            # Start of week (Monday)
            start_date = report_date - timedelta(days=report_date.weekday())
            end_date = start_date + timedelta(days=6)
            return start_date, end_date
        elif frequency == 'monthly':
            # Start of month
            start_date = report_date.replace(day=1)
            # End of month
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1, day=1) - timedelta(days=1)
            return start_date, end_date
        elif frequency == 'quarterly':
            # Start of quarter
            quarter = (report_date.month - 1) // 3 + 1
            start_month = (quarter - 1) * 3 + 1
            start_date = report_date.replace(month=start_month, day=1)
            # End of quarter
            end_month = quarter * 3
            if end_month == 12:
                end_date = start_date.replace(year=start_date.year, month=12, day=31)
            else:
                end_date = start_date.replace(month=end_month + 1, day=1) - timedelta(days=1)
            return start_date, end_date
        elif frequency == 'yearly':
            start_date = report_date.replace(month=1, day=1)
            end_date = report_date.replace(month=12, day=31)
            return start_date, end_date
        else:
            # Default to daily
            return report_date, report_date