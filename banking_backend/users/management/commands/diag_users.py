from django.core.management.base import BaseCommand

from users.models import User


class Command(BaseCommand):
    help = "Diagnostic info for all users to identify patterns in migrated accounts."

    def handle(self, *args, **options):
        users = User.objects.all().order_by("id")
        self.stdout.write(self.style.SUCCESS(f"Analyzing {users.count()} users..."))
        self.stdout.write("email | approved | active | pw_prefix | role")
        self.stdout.write("-" * 80)

        for user in users:
            pw_prefix = user.password[:20] if user.password else "EMPTY"
            self.stdout.write(
                f"{user.email} | "
                f"approved={user.is_approved} | "
                f"active={user.is_active} | "
                f"pw={pw_prefix} | "
                f"role={user.role}"
            )
