import os
import django
import inspect
import sys
from decimal import Decimal
import datetime
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.conf import settings
settings.DEBUG = True

from core.views.dashboard import OperationsMetricsView
from core.models.transactions import Transaction
from core.models.accounts import Account
from users.models import User
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory, force_authenticate
import traceback

def main():
    print("--- DEBUG INFO ---")
    print(f"File: {inspect.getfile(OperationsMetricsView)}")

    # Setup Data
    try:
        mgr, _ = User.objects.get_or_create(username='verify_mgr', defaults={'role': 'manager', 'is_active': True, 'email': 'mgr@verify.com'})
        cust, _ = User.objects.get_or_create(username='verify_cust', defaults={'role': 'customer', 'is_active': True, 'email': 'cust@verify.com'})

        a1, _ = Account.objects.get_or_create(user=cust, account_number='111111', defaults={'balance': Decimal('10000.00'), 'is_active': True})
        a2_user, _ = User.objects.get_or_create(username='verify_recip', defaults={'role': 'customer', 'is_active': True, 'email': 'recip@verify.com'})
        a2, _ = Account.objects.get_or_create(user=a2_user, account_number='222222', defaults={'balance': Decimal('0.00'), 'is_active': True})

        # Create TX
        Transaction.objects.filter(transaction_type='transfer', status='pending_approval').delete()
        t = Transaction.objects.create(from_account=a1, to_account=a2, amount=Decimal('7500.00'), transaction_type='transfer', status='pending_approval')

        # Check Metrics
        rf = APIRequestFactory()
        req = rf.get('/')
        force_authenticate(req, user=mgr)
        view = OperationsMetricsView.as_view()
        res = view(req)

        if res.status_code != 200:
            print(f"FAILED with status {res.status_code}")
            print(f"Data: {res.data}")
        else:
            print("SUCCESS: Metrics view executed.")
            pending = res.data.get('pending_approvals', [])
            found = any(str(t.id) == str(p['id']) for p in pending)
            print(f"Pending TX {t.id} found in metrics: {found}")
            if not found:
                print(f"Pending items count: {len(pending)}")
                for p in pending:
                    print(f"  - {p['id']}: {p['type']}")
    except Exception:
        traceback.print_exc()

if __name__ == '__main__':
    main()
