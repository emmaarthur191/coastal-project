from django.core.management.base import BaseCommand

from users.models import User


class Command(BaseCommand):
    help = "Fix legacy/migrated users by setting is_approved=True for active accounts."

    def handle(self, *args, **kwargs):
        users_to_fix = User.objects.filter(is_approved=False, is_active=True)
        count = users_to_fix.count()
        if count == 0:
            self.stdout.write(self.style.WARNING("No unapproved active users found."))
            return

        self.stdout.write(self.style.WARNING(f"Found {count} users needing approval backfill."))

        updated = users_to_fix.update(is_approved=True)

        self.stdout.write(self.style.SUCCESS(f"Successfully fixed {updated} users."))
