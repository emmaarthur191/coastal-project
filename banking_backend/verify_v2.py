import os
import django
from decimal import Decimal
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from core.models.transactions import Transaction
from core.models.accounts import Account
from users.models import User
from core.views.dashboard import OperationsMetricsView
from core.views.transactions import TransactionViewSet
from rest_framework.request import Request
from django.test import RequestFactory
def main():
    mgr = User.objects.filter(role='manager', is_active=True).first()
    cust = User.objects.filter(role='customer', is_active=True).first()
    a1 = Account.objects.filter(user=cust).first()
    a2 = Account.objects.exclude(id=a1.id if a1 else None).first()
    if not all([mgr, cust, a1, a2]):
        print('Data missing')
        return
    t = Transaction.objects.create(from_account=a1, to_account=a2, amount=Decimal('9999.00'), transaction_type='transfer', status='pending_approval')
    print(f'TX {t.id} created')
    rf = RequestFactory()
    req = rf.get('/')
    req.user = mgr
    res = OperationsMetricsView.as_view()(req)
    found = any(str(t.id) == str(p['id']) for p in res.data['pending_approvals'])
    print(f'In metrics: {found}')
    v = TransactionViewSet()
    v.request = Request(rf.post('/'))
    v.request.user = mgr
    ares = v.approve(v.request, pk=t.id)
    t.refresh_from_db()
    print(f'Approval: {ares.status_code}, Status: {t.status}')
if __name__ == '__main__':
    main()
