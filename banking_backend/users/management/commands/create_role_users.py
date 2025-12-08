"""
Management command to create test users for all roles.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import UserProfile
import secrets
import string

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test users for all roles'

    def generate_secure_password(self, length=16):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password

    def handle(self, *args, **options):
        # Test users configuration
        test_users = [
            {
                'email': 'customer@test.com',
                'role': 'customer',
                'first_name': 'John',
                'last_name': 'Customer'
            },
            {
                'email': 'cashier@test.com',
                'role': 'cashier',
                'first_name': 'Sarah',
                'last_name': 'Cashier'
            },
            {
                'email': 'mobile@test.com',
                'role': 'mobile_banker',
                'first_name': 'Mike',
                'last_name': 'Mobile'
            },
            {
                'email': 'manager@test.com',
                'role': 'manager',
                'first_name': 'David',
                'last_name': 'Manager'
            },
            {
                'email': 'ops@test.com',
                'role': 'operations_manager',
                'first_name': 'Lisa',
                'last_name': 'Operations'
            },
            {
                'email': 'admin@test.com',
                'role': 'administrator',
                'first_name': 'Robert',
                'last_name': 'Admin'
            },
            {
                'email': 'super@test.com',
                'role': 'superuser',
                'first_name': 'Alice',
                'last_name': 'Super'
            }
        ]

        created_users = []

        for user_config in test_users:
            # Check if user already exists
            if User.objects.filter(email=user_config['email']).exists():
                self.stdout.write(self.style.WARNING(f'User {user_config["email"]} already exists, skipping...'))
                continue

            # Generate secure password
            password = self.generate_secure_password()

            try:
                # Create user
                user = User.objects.create_user(
                    email=user_config['email'],
                    password=password,
                    first_name=user_config['first_name'],
                    last_name=user_config['last_name'],
                    role=user_config['role']
                )

                # Create user profile
                UserProfile.objects.create(
                    user=user,
                    phone='+1234567890'
                )

                created_users.append({
                    'email': user_config['email'],
                    'password': password,
                    'role': user_config['role'],
                    'name': f"{user_config['first_name']} {user_config['last_name']}"
                })

                self.stdout.write(self.style.SUCCESS(f'Created user: {user_config["email"]} ({user_config["role"]})'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user {user_config["email"]}: {str(e)}'))
                continue

        if created_users:
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('TEST USERS CREATED SUCCESSFULLY'))
            self.stdout.write(self.style.SUCCESS('='*60))

            for user in created_users:
                self.stdout.write(self.style.SUCCESS(f'Email: {user["email"]}'))
                self.stdout.write(self.style.SUCCESS(f'Password: {user["password"]}'))
                self.stdout.write(self.style.SUCCESS(f'Role: {user["role"]}'))
                self.stdout.write(self.style.SUCCESS(f'Name: {user["name"]}'))
                self.stdout.write(self.style.SUCCESS('-' * 40))

            self.stdout.write(self.style.SUCCESS(f'\nTotal users created: {len(created_users)}'))
            self.stdout.write(self.style.WARNING('\n⚠️  IMPORTANT: Save these credentials securely!'))
            self.stdout.write(self.style.WARNING('These are for testing purposes only.'))
        else:
            self.stdout.write(self.style.WARNING('No new users were created.'))