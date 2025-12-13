"""
Django management command to create test users for development.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates test users for each role'

    def handle(self, *args, **options):
        test_users = [
            {
                'email': 'customer.test@coastalbanking.com',
                'password': 'SecureTestPass123!',
                'first_name': 'John',
                'last_name': 'Customer',
                'username': 'john.customer',
                'role': 'customer',
            },
            {
                'email': 'cashier.test@coastalbanking.com',
                'password': 'SecureTestPass123!',
                'first_name': 'Sarah',
                'last_name': 'Cashier',
                'username': 'sarah.cashier',
                'role': 'cashier',
            },
            {
                'email': 'mobile.test@coastalbanking.com',
                'password': 'SecureTestPass123!',
                'first_name': 'Michael',
                'last_name': 'Mobile',
                'username': 'michael.mobile',
                'role': 'mobile_banker',
            },
            {
                'email': 'manager.test@coastalbanking.com',
                'password': 'SecureTestPass123!',
                'first_name': 'David',
                'last_name': 'Manager',
                'username': 'david.manager',
                'role': 'manager',
            },
            {
                'email': 'opsmgr.test@coastalbanking.com',
                'password': 'SecureTestPass123!',
                'first_name': 'Emily',
                'last_name': 'Operations',
                'username': 'emily.operations',
                'role': 'operations_manager',
            },
            {
                'email': 'admin.test@coastalbanking.com',
                'password': 'SecureTestPass123!',
                'first_name': 'Admin',
                'last_name': 'User',
                'username': 'admin.user',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
        ]

        for user_data in test_users:
            email = user_data['email']
            password = user_data.pop('password')
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults=user_data
            )
            
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {email} ({user_data["role"]})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {email}')
                )

        self.stdout.write(self.style.SUCCESS('\nTest users setup complete!'))
