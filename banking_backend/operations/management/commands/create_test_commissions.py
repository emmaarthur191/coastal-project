from django.core.management.base import BaseCommand
from decimal import Decimal
from datetime import datetime, timedelta
from operations.models import Commission
from users.models import User


class Command(BaseCommand):
    help = 'Create test commission data for testing the commission tracking system'

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("CREATING TEST COMMISSION DATA"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        
        # Get a user to assign commissions to
        user = User.objects.filter(role__in=['manager', 'cashier']).first()
        if not user:
            self.stdout.write(self.style.ERROR("No manager or cashier found. Please create users first."))
            return
        
        self.stdout.write(f"Creating commissions for user: {user.email}")
        self.stdout.write("")
        
        # Clear existing test commissions
        Commission.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Cleared existing commissions"))
        
        # Create commissions for different time periods
        now = datetime.now()
        
        # Today's commissions
        today_commissions = [
            {
                'commission_type': 'deposit',
                'amount': Decimal('50.00'),
                'percentage': Decimal('2.5'),
                'base_amount': Decimal('2000.00'),
                'description': 'Deposit commission - Today',
            },
            {
                'commission_type': 'withdrawal',
                'amount': Decimal('25.00'),
                'percentage': Decimal('2.0'),
                'base_amount': Decimal('1250.00'),
                'description': 'Withdrawal commission - Today',
            },
            {
                'commission_type': 'transfer',
                'amount': Decimal('15.00'),
                'percentage': Decimal('1.5'),
                'base_amount': Decimal('1000.00'),
                'description': 'Transfer commission - Today',
            },
        ]
        
        for comm_data in today_commissions:
            Commission.objects.create(
                earned_by=user,
                created_at=now,
                **comm_data
            )
        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(today_commissions)} commissions for today"))
        
        # This week's commissions (3 days ago)
        week_date = now - timedelta(days=3)
        week_commissions = [
            {
                'commission_type': 'deposit',
                'amount': Decimal('75.00'),
                'percentage': Decimal('2.5'),
                'base_amount': Decimal('3000.00'),
                'description': 'Deposit commission - 3 days ago',
            },
            {
                'commission_type': 'loan',
                'amount': Decimal('100.00'),
                'percentage': Decimal('2.0'),
                'base_amount': Decimal('5000.00'),
                'description': 'Loan commission - 3 days ago',
            },
        ]
        
        for comm_data in week_commissions:
            Commission.objects.create(
                earned_by=user,
                created_at=week_date,
                **comm_data
            )
        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(week_commissions)} commissions for this week"))
        
        # This month's commissions (10 days ago)
        month_date = now - timedelta(days=10)
        month_commissions = [
            {
                'commission_type': 'deposit',
                'amount': Decimal('120.00'),
                'percentage': Decimal('2.5'),
                'base_amount': Decimal('4800.00'),
                'description': 'Deposit commission - 10 days ago',
            },
            {
                'commission_type': 'withdrawal',
                'amount': Decimal('60.00'),
                'percentage': Decimal('2.0'),
                'base_amount': Decimal('3000.00'),
                'description': 'Withdrawal commission - 10 days ago',
            },
            {
                'commission_type': 'other',
                'amount': Decimal('30.00'),
                'percentage': Decimal('1.0'),
                'base_amount': Decimal('3000.00'),
                'description': 'Other commission - 10 days ago',
            },
        ]
        
        for comm_data in month_commissions:
            Commission.objects.create(
                earned_by=user,
                created_at=month_date,
                **comm_data
            )
        self.stdout.write(self.style.SUCCESS(f"[OK] Created {len(month_commissions)} commissions for this month"))
        
        # Calculate totals
        total_today = sum(Decimal(c['amount']) for c in today_commissions)
        total_week = total_today + sum(Decimal(c['amount']) for c in week_commissions)
        total_month = total_week + sum(Decimal(c['amount']) for c in month_commissions)
        
        self.stdout.write("")
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("TEST COMMISSION DATA CREATED SUCCESSFULLY!"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        self.stdout.write("Summary:")
        self.stdout.write(f"  Today's Total:      GHS {total_today:.2f}")
        self.stdout.write(f"  This Week's Total:  GHS {total_week:.2f}")
        self.stdout.write(f"  This Month's Total: GHS {total_month:.2f}")
        self.stdout.write("")
        self.stdout.write("You can now test the commission tracking system at:")
        self.stdout.write("  API: GET /api/operations/commissions/summary/")
        self.stdout.write("  Frontend: Manager Dashboard > Commission Tab")
        self.stdout.write("=" * 80)