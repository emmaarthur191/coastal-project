"""
Management command to create a test user with proper email format.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import UserProfile
import secrets
import string

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a test user with proper email format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='test@example.com',
            help='Email for test user'
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for test user (will generate random if not provided)'
        )

    def generate_secure_password(self, length=16):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password

    def handle(self, *args, **options):
        email = options['email']
        custom_password = options.get('password')

        # Check if user already exists
        try:
            existing_user = User.objects.get(email=email)
            self.stdout.write(self.style.ERROR(f'Test user with email {email} already exists.'))
            return
        except User.DoesNotExist:
            pass

        # Generate password if not provided
        if not custom_password:
            password = self.generate_secure_password()
        else:
            password = custom_password

        try:
            # Create user
            user = User.objects.create_superuser(
                email=email,
                password=password,
                first_name='Test',
                last_name='User',
                role='operations_manager'
            )

            # Create user profile
            UserProfile.objects.create(
                user=user,
                phone='+1234567890'
            )

            self.stdout.write(self.style.SUCCESS(f'Successfully created test user'))
            self.stdout.write(self.style.SUCCESS(f'Email: {email}'))
            self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
            self.stdout.write(self.style.SUCCESS(f'Role: operations_manager'))
            self.stdout.write(self.style.WARNING('Please save these credentials securely!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating test user: {str(e)}'))
            raise