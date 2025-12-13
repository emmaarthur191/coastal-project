import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates initial admin and manager users if they do not exist'

    def handle(self, *args, **options):
        User = get_user_model()
        
        from django.utils.crypto import get_random_string

        # Get credentials from environment or generate random
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@coastal.com')
        admin_password = os.environ.get('ADMIN_PASSWORD')
        if not admin_password:
            admin_password = get_random_string(16)
            self.stdout.write(self.style.WARNING(f"ADMIN_PASSWORD not set. Generated: {admin_password}"))
        
        manager_email = os.environ.get('MANAGER_EMAIL', 'manager@coastal.com')
        manager_password = os.environ.get('MANAGER_PASSWORD')
        if not manager_password:
            manager_password = get_random_string(16)
            self.stdout.write(self.style.WARNING(f"MANAGER_PASSWORD not set. Generated: {manager_password}"))

        # Create Admin
        if not User.objects.filter(email=admin_email).exists():
            self.stdout.write(f'Creating admin user: {admin_email}...')
            User.objects.create_superuser(
                email=admin_email,
                username=admin_email,
                password=admin_password,
                role='admin'
            )
            self.stdout.write(self.style.SUCCESS('Admin user created.'))
        else:
            self.stdout.write('Admin user already exists.')

        # Create Manager
        if not User.objects.filter(email=manager_email).exists():
            self.stdout.write(f'Creating manager user: {manager_email}...')
            manager = User.objects.create_user(
                email=manager_email,
                username=manager_email,
                password=manager_password,
                role='manager',
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS('Manager user created.'))
        else:
            self.stdout.write('Manager user already exists.')
