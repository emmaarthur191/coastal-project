import os
import django
import traceback
from decimal import Decimal
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.conf import settings
settings.DEBUG = True

from core.models.transactions import Transaction
from core.models.accounts import Account
from users.models import User
from core.views.dashboard import OperationsMetricsView
from core.views.transactions import TransactionViewSet
from rest_framework.request import Request
from django.test import RequestFactory

def main():
    # Setup Data
    mgr, _ = User.objects.get_or_create(username='verify_mgr', defaults={'role': 'manager', 'is_active': True, 'email': 'mgr@verify.com'})
    cust, _ = User.objects.get_or_create(username='verify_cust', defaults={'role': 'customer', 'is_active': True, 'email': 'cust@verify.com'})

    a1, _ = Account.objects.get_or_create(user=cust, account_number='111111', defaults={'balance': Decimal('10000.00'), 'is_active': True})
    a2_user, _ = User.objects.get_or_create(username='verify_recip', defaults={'role': 'customer', 'is_active': True, 'email': 'recip@verify.com'})
    a2, _ = Account.objects.get_or_create(user=a2_user, account_number='222222', defaults={'balance': Decimal('0.00'), 'is_active': True})

    # 1. Create TX
    t = Transaction.objects.create(from_account=a1, to_account=a2, amount=Decimal('7500.00'), transaction_type='transfer', status='pending_approval')

    # 2. Check Metrics
    rf = RequestFactory()
    req = rf.get('/')
    req.user = mgr
    view = OperationsMetricsView.as_view()
    try:
        res = view(req)
        if 'pending_approvals' not in res.data:
            print(f'ERROR: Data: {res.data}')
        else:
            found = any(str(t.id) == str(p['id']) for p in res.data['pending_approvals'])
            print(f'In metrics: {found}')

            # 3. Approve
            v_viewset = TransactionViewSet()
            v_viewset.request = Request(rf.post('/'))
            v_viewset.request.user = mgr
            ares = v_viewset.approve(v_viewset.request, pk=t.id)
            t.refresh_from_db()
            print(f'Approval Result: {t.status}')
            if t.status == 'completed':
                print('VERIFICATION SUCCESSFUL')
    except Exception:
        traceback.print_exc()

if __name__ == '__main__':
    main()
