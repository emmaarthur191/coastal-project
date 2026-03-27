import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from decimal import Decimal

from django.test import RequestFactory
from django.utils import timezone

from core.models.transactions import Transaction
from core.views.mobile import MobileBankerMetricsView
from users.models import User


def main():
    print("--- Verifying MobileBankerMetricsView Data Leakage ---")

    # 1. Setup Users
    mb1, _ = User.objects.get_or_create(email="mb1@bank.com", username="mb1", role="mobile_banker")
    mb2, _ = User.objects.get_or_create(email="mb2@bank.com", username="mb2", role="mobile_banker")

    # 2. Setup Transactions (Simulated collections)
    # Give mb2 some collections today
    today = timezone.now()
    tx1 = Transaction.objects.create(
        amount=Decimal("500.00"),
        transaction_type="deposit",
        status="completed",
        description="mobile collection by mb2",
        # Assuming we can create it without an account just for this test, or we need an account
    )
    # Backdate to today
    Transaction.objects.filter(id=tx1.id).update(timestamp=today)

    # 3. Simulate Request by mb1
    rf = RequestFactory()
    request = rf.get("/api/v1/mobile/metrics/")
    request.user = mb1

    view = MobileBankerMetricsView.as_view()
    response = view(request)

    print("\n[Result] Collections Today reported for mb1:", response.data.get("collections_today"))

    # The vulnerability: The query does NOT filter by request.user!
    # collections_today = Transaction.objects.filter(
    #    transaction_type="deposit", status="completed", timestamp__date=today, description__icontains="mobile"
    # )
    # This sums ALL mobile collections across the entire bank, leaking business metrics to an individual mobile banker.


if __name__ == "__main__":
    main()
