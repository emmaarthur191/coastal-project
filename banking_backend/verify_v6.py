import os
from decimal import Decimal

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from django.conf import settings

settings.DEBUG = True

from django.test import RequestFactory
from rest_framework.request import Request

from core.models.accounts import Account
from core.models.transactions import Transaction
from core.views.dashboard import OperationsMetricsView
from core.views.transactions import TransactionViewSet
from users.models import User


def main():
    # Setup Data
    mgr, _ = User.objects.get_or_create(
        username="verify_mgr", defaults={"role": "manager", "is_active": True, "email": "mgr@verify.com"}
    )
    cust, _ = User.objects.get_or_create(
        username="verify_cust", defaults={"role": "customer", "is_active": True, "email": "cust@verify.com"}
    )

    a1, _ = Account.objects.get_or_create(
        user=cust, account_number="111111", defaults={"balance": Decimal("10000.00"), "is_active": True}
    )
    a2_user, _ = User.objects.get_or_create(
        username="verify_recip", defaults={"role": "customer", "is_active": True, "email": "recip@verify.com"}
    )
    a2, _ = Account.objects.get_or_create(
        user=a2_user, account_number="222222", defaults={"balance": Decimal("0.00"), "is_active": True}
    )

    print(f"Using Manager: {mgr.username}, Customer: {cust.username}")

    # 1. Create TX
    t = Transaction.objects.create(
        from_account=a1,
        to_account=a2,
        amount=Decimal("7500.00"),
        transaction_type="transfer",
        status="pending_approval",
    )
    print(f"TX {t.id} created for GHS 7,500")

    # 2. Check Metrics
    rf = RequestFactory()
    req = rf.get("/")
    req.user = mgr
    view = OperationsMetricsView.as_view()
    res = view(req)

    if "pending_approvals" not in res.data:
        print(f"ERROR: Data: {res.data}")
        return

    found = any(str(t.id) == str(p["id"]) for p in res.data["pending_approvals"])
    print(f"In metrics: {found}")

    # 3. Approve
    v_viewset = TransactionViewSet()
    v_viewset.request = Request(rf.post("/"))
    v_viewset.request.user = mgr
    ares = v_viewset.approve(v_viewset.request, pk=t.id)
    t.refresh_from_db()
    print(f'Approval Response: {ares.status_code}, Data: {ares.data if hasattr(ares, "data") else "N/A"}')
    print(f"DB Status: {t.status}")

    # 4. Check results
    if t.status == "completed" and t.approved_by == mgr:
        print("VERIFICATION SUCCESSFUL: Maker-Checker logic works.")
    else:
        print("VERIFICATION FAILED")


if __name__ == "__main__":
    main()
