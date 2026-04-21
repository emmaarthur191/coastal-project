import logging
from django.core.management.base import BaseCommand
from core.models.reporting import ReportTemplate

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Seed standard report templates for the Analytics portal.'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Daily Transaction Summary',
                'description': (
                    'Summary of all transactions processed today including '
                    'deposits, withdrawals, and transfers.'
                ),
                'report_type': 'transaction',
                'default_parameters': {
                    'period': 'daily', 
                    'include_failed': True
                }
            },
            {
                'name': 'Financial Performance Audit',
                'description': (
                    'Detailed audit of all loans and financial products '
                    'within the selected period.'
                ),
                'report_type': 'financial',
                'default_parameters': {'status': 'active'}
            },
            {
                'name': 'Account Demographics Report',
                'description': (
                    'Metrics on new account openings and applicant '
                    'demographics.'
                ),
                'report_type': 'account',
                'default_parameters': {}
            },
            {
                'name': 'Operational Activity Log',
                'description': (
                    'Detailed security logs of all administrative and '
                    'staff actions.'
                ),
                'report_type': 'audit',
                'default_parameters': {}
            },
            {
                'name': 'System Performance Snapshot',
                'description': (
                    'Real-time performance metrics and response time '
                    'analysis.'
                ),
                'report_type': 'performance',
                'default_parameters': {}
            }
        ]

        count = 0
        for t_data in templates:
            template, created = ReportTemplate.objects.get_or_create(
                name=t_data['name'],
                defaults={
                    'description': t_data['description'],
                    'report_type': t_data['report_type'],
                    'default_parameters': t_data['default_parameters'],
                    'is_active': True
                }
            )
            if created:
                count += 1

        success_msg = f'Successfully seeded {count} report templates.'
        self.stdout.write(self.style.SUCCESS(success_msg))
