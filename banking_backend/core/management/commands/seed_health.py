import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import SystemHealth


class Command(BaseCommand):
    help = "Seed the database with mock SystemHealth records for the performance dashboard"

    def handle(self, *args, **options):
        self.stdout.write("Seeding system health data...")

        # Clear existing data if desired (optional)
        # SystemHealth.objects.all().delete()

        now = timezone.now()
        records_to_create = []

        # Create 24 hours of data (one snapshot per hour)
        for i in range(24):
            check_time = now - timedelta(hours=i)
            cpu = random.uniform(5, 45)
            mem = random.uniform(20, 60)
            resp = random.randint(80, 250)

            # Occasionally add a spike or issue
            status = "healthy"
            if i % 10 == 0:
                cpu += 40
                status = "warning"

            records_to_create.append(
                SystemHealth(
                    service_name="Main Application",
                    status=status,
                    response_time_ms=resp,
                    details={
                        "cpu_usage": round(cpu, 1),
                        "memory_usage": round(mem, 1),
                        "db_status": "healthy",
                        "pending_issues": 1 if status == "warning" else 0,
                    },
                )
            )
            # Set auto_now_add field manually if needed,
            # but usually we just set it in the creation

        # Bulk create doesn't trigger auto_now_add properly for custom times
        # unless handled, but since we have checked_at as auto_now_add=True,
        # we might need to manually update them after creation if we want historical data.

        for record in records_to_create:
            record.save()
            # Manually override checked_at for history
            SystemHealth.objects.filter(pk=record.pk).update(checked_at=record.checked_at)

        # Fix: the records_to_create loop above needs to be careful with auto_now_add
        # Let's do it properly step by step
        SystemHealth.objects.all().delete()
        for i in range(24):
            check_time = now - timedelta(hours=i)
            cpu = random.uniform(5, 45)
            mem = random.uniform(20, 60)
            resp = random.randint(80, 250)
            status = "healthy"
            if i == 5:  # Recent warning
                cpu = 85.5
                status = "critical"

            rec = SystemHealth.objects.create(
                service_name="Main Application",
                status=status,
                response_time_ms=resp,
                details={
                    "cpu_usage": round(cpu, 1),
                    "memory_usage": round(mem, 1),
                    "db_status": "healthy",
                    "pending_issues": 1 if status != "healthy" else 0,
                },
            )
            # Override checking time for historical trend
            SystemHealth.objects.filter(id=rec.id).update(checked_at=check_time)

        self.stdout.write(self.style.SUCCESS("Successfully seeded 24 health records."))
