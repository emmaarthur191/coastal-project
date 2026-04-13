import logging

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from core.models.transactions import Transaction
from core.models.loans import Loan
from core.models.accounts import AccountOpeningRequest, AccountClosureRequest
from core.models.operational import SystemAlert

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Flags pending records that have exceeded the 24-hour approval window for manager review."

    def handle(self, *args, **options):
        stale_threshold = timezone.now() - timedelta(hours=24)
        count = 0

        # Support models and their status filters
        models_to_check = [
            (Transaction, {"status": "pending_approval"}),
            (Loan, {"status": "pending"}),
            (AccountOpeningRequest, {"status": "pending"}),
            (AccountClosureRequest, {"status": "pending"}),
        ]

        for model, filters in models_to_check:
            # Find stale records that aren't already flagged
            stale_records = model.objects.filter(
                **filters,
                created_at__lt=stale_threshold, # Wait, Transaction uses 'timestamp'
                is_stale=False
            ) if model != Transaction else model.objects.filter(
                **filters,
                timestamp__lt=stale_threshold,
                is_stale=False
            )

            for record in stale_records:
                record.is_stale = True
                record.is_flagged_for_review = True
                record.save(update_fields=["is_stale", "is_flagged_for_review"])
                count += 1
                
                # Internal Alert for the Manager
                SystemAlert.objects.create(
                    alert_type="security",
                    severity="medium",
                    title="Stale Pending Record Detected",
                    message=f"A {model.__name__} (ID: {record.id}) has been pending for over 24 hours. Manager intervention required.",
                    is_active=True
                )

        self.stdout.write(self.style.SUCCESS(f"Successfully flagged {count} stale records."))
