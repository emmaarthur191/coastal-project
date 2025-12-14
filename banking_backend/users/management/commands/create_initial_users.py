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

        # Create or Update Admin
        admin_user, created = User.objects.get_or_create(email=admin_email, defaults={
            'username': admin_email,
            'role': 'admin',
            'is_superuser': True,
            'is_staff': True
        })
        
        if created:
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'Admin user created: {admin_email}'))
        elif admin_password and not admin_user.check_password(admin_password):
            # Update password if env var provides explicit password and it doesn't match
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'Admin user password updated from environment.'))
        else:
            self.stdout.write('Admin user exists and password matches/not provided.')

        # Create or Update Manager
        manager_user, created = User.objects.get_or_create(email=manager_email, defaults={
            'username': manager_email,
            'role': 'manager',
            'is_staff': True
        })

        if created:
            manager_user.set_password(manager_password)
            manager_user.save()
            self.stdout.write(self.style.SUCCESS(f'Manager user created: {manager_email}'))
        elif manager_password and not manager_user.check_password(manager_password):
            manager_user.set_password(manager_password)
            manager_user.save()
            self.stdout.write(self.style.SUCCESS(f'Manager user password updated from environment.'))
        else:
             self.stdout.write('Manager user exists and password matches/not provided.')
