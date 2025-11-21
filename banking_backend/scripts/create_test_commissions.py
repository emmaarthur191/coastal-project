"""
Script to create test commission data for testing the commission tracking system.
Run this script with: python manage.py shell < scripts/create_test_commissions.py
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from operations.models import Commission
from users.models import User

def create_test_commissions():
    """Create test commission data"""
    
    print("=" * 80)
    print("CREATING TEST COMMISSION DATA")
    print("=" * 80)
    print()
    
    # Get a user to assign commissions to (use admin or create one)
    try:
        user = User.objects.filter(role__in=['manager', 'cashier']).first()
        if not user:
            print("No manager or cashier found. Please create users first.")
            return
        
        print(f"Creating commissions for user: {user.email}")
        print()
        
        # Clear existing test commissions
        Commission.objects.all().delete()
        print("Cleared existing commissions")
        
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
        print(f"[OK] Created {len(today_commissions)} commissions for today")
        
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
        print(f"[OK] Created {len(week_commissions)} commissions for this week")
        
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
        print(f"[OK] Created {len(month_commissions)} commissions for this month")
        
        # Calculate totals
        total_today = sum(Decimal(c['amount']) for c in today_commissions)
        total_week = total_today + sum(Decimal(c['amount']) for c in week_commissions)
        total_month = total_week + sum(Decimal(c['amount']) for c in month_commissions)
        
        print()
        print("=" * 80)
        print("TEST COMMISSION DATA CREATED SUCCESSFULLY!")
        print("=" * 80)
        print()
        print("Summary:")
        print(f"  Today's Total:      GHS {total_today:.2f}")
        print(f"  This Week's Total:  GHS {total_week:.2f}")
        print(f"  This Month's Total: GHS {total_month:.2f}")
        print()
        print("You can now test the commission tracking system at:")
        print("  API: GET /api/operations/commissions/summary/")
        print("  Frontend: Manager Dashboard > Commission Tab")
        print("=" * 80)
        
    except Exception as e:
        print(f"Error creating test commissions: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_test_commissions()