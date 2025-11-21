from django.core.management.base import BaseCommand
from django.utils import timezone
from fraud_detection.models import FraudRule
from users.models import User


class Command(BaseCommand):
    help = 'Load default fraud detection rules into the database'

    def handle(self, *args, **options):
        # Get or create a system user for rule creation
        system_user, created = User.objects.get_or_create(
            email='system@bankingapp.com',
            defaults={
                'first_name': 'System',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True
            }
        )

        default_rules = [
            {
                'name': 'High Amount Transaction Alert',
                'description': 'Flag transactions above $1,000 as potentially fraudulent',
                'rule_type': 'amount_threshold',
                'field': 'amount',
                'operator': 'gt',
                'value': '1000.00',
                'severity': 'medium',
                'is_active': True,
                'auto_block': False,
                'require_approval': True,
            },
            {
                'name': 'Velocity Check - Transactions per 24h',
                'description': 'Alert on more than 10 transactions in 24 hours',
                'rule_type': 'velocity_check',
                'field': 'transactions_24h',
                'operator': 'gt',
                'value': '10',
                'severity': 'high',
                'is_active': True,
                'auto_block': False,
                'require_approval': True,
            },
            {
                'name': 'Velocity Check - Amount per 24h',
                'description': 'Alert on transactions totaling more than $10,000 in 24 hours',
                'rule_type': 'velocity_check',
                'field': 'amount_24h',
                'operator': 'gt',
                'value': '10000.00',
                'severity': 'high',
                'is_active': True,
                'auto_block': False,
                'require_approval': True,
            },
            {
                'name': 'Single Transaction Limit',
                'description': 'Block transactions above $5,000',
                'rule_type': 'amount_threshold',
                'field': 'amount',
                'operator': 'gt',
                'value': '5000.00',
                'severity': 'critical',
                'is_active': True,
                'auto_block': True,
                'require_approval': True,
            },
            {
                'name': 'Geographic Anomaly Detection',
                'description': 'Alert on transactions from unusual geographic locations',
                'rule_type': 'location_anomaly',
                'field': 'country_code',
                'operator': 'not_in',
                'value': 'GH,NG,KE,ZA,US,UK,CA,AU',
                'severity': 'medium',
                'is_active': True,
                'auto_block': False,
                'require_approval': True,
            },
            {
                'name': 'Unusual Time Pattern',
                'description': 'Alert on transactions outside normal business hours (9 AM - 6 PM)',
                'rule_type': 'time_based',
                'field': 'transaction_hour',
                'operator': 'not_between',
                'value': '9,18',
                'severity': 'low',
                'is_active': True,
                'auto_block': False,
                'require_approval': False,
            },
        ]

        rules_created = 0
        rules_updated = 0

        for rule_data in default_rules:
            rule, created = FraudRule.objects.get_or_create(
                name=rule_data['name'],
                defaults={
                    'description': rule_data['description'],
                    'rule_type': rule_data['rule_type'],
                    'field': rule_data['field'],
                    'operator': rule_data['operator'],
                    'value': rule_data['value'],
                    'severity': rule_data['severity'],
                    'is_active': rule_data['is_active'],
                    'auto_block': rule_data['auto_block'],
                    'require_approval': rule_data['require_approval'],
                    'created_by': system_user,
                }
            )

            if created:
                rules_created += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created rule: {rule.name}')
                )
            else:
                # Update existing rule if it's not active
                if not rule.is_active:
                    rule.is_active = True
                    rule.save()
                    rules_updated += 1
                    self.stdout.write(
                        self.style.WARNING(f'Activated existing rule: {rule.name}')
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {rules_created} new rules and activated {rules_updated} existing rules'
            )
        )

        # Display summary
        total_active = FraudRule.objects.filter(is_active=True).count()
        self.stdout.write(
            self.style.SUCCESS(f'Total active fraud rules: {total_active}')
        )