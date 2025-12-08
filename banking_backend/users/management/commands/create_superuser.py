from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from users.models import UserProfile
from banking.models import Account

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser account with superuser role'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Superuser email')
        parser.add_argument('--first-name', default='', help='First name')
        parser.add_argument('--last-name', default='', help='Last name')
        parser.add_argument('--password', help='Password (will prompt if not provided)')

    def handle(self, *args, **options):
        email = options['email']
        first_name = options['first_name']
        last_name = options['last_name']
        password = options['password']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            raise CommandError(f'User with email {email} already exists.')

        # Get password if not provided
        if not password:
            import getpass
            password = getpass.getpass('Enter password for superuser: ')
            confirm_password = getpass.getpass('Confirm password: ')
            if password != confirm_password:
                raise CommandError('Passwords do not match.')

        # Create superuser
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='superuser',
            is_staff=True,
            is_superuser=True
        )

        # Create user profile
        UserProfile.objects.create(user=user)

        # Create default account for superuser
        Account.objects.create(
            owner=user,
            account_number=f"SUP{user.id.hex[:8]}",
            type='savings'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Superuser {email} created successfully with ID {user.id}')
        )