"""
Management command to create the 'spper' user for restricted authentication.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
import logging
import secrets
import string

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create the spper user for restricted authentication'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            help='Password for spper user (will generate random if not provided)'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='spper@bankingapp.local',
            help='Email for spper user (default: spper@bankingapp.local)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recreation if user already exists'
        )

    def generate_secure_password(self, length=16):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password

    def handle(self, *args, **options):
        username = 'spper'
        email = options['email']
        custom_password = options.get('password')
        force = options.get('force', False)

        # Check if user already exists
        try:
            existing_user = User.objects.get(email=username)
            if force:
                self.stdout.write(self.style.WARNING(f'Deleting existing spper user...'))
                existing_user.delete()
            else:
                self.stdout.write(self.style.ERROR(f'Spper user already exists. Use --force to recreate.'))
                return
        except User.DoesNotExist:
            pass

        # Generate password if not provided
        if not custom_password:
            password = self.generate_secure_password()
            self.stdout.write(self.style.SUCCESS(f'Generated secure password for spper user'))
        else:
            password = custom_password

        try:
            with transaction.atomic():
                # Create the spper user using create_superuser method
                # Note: USERNAME_FIELD is 'email',  # so we use email=username (which is 'spper')
                user = User.objects.create_superuser(
                    email=username,  # Using email field for username
                    password=password,
                    first_name='Super',
                    last_name='User',
                    role='operations_manager'  # Give highest permissions
                )

                # Create user profile
                from users.models import UserProfile
                UserProfile.objects.create(
                    user=user,
                    phone='+1234567890'
                )

                self.stdout.write(self.style.SUCCESS(f'Successfully created spper user'))
                self.stdout.write(self.style.SUCCESS(f'Username: {username}'))
                self.stdout.write(self.style.SUCCESS(f'Email: {email}'))
                self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
                self.stdout.write(self.style.WARNING('Please save these credentials securely!'))

                # Log the creation
                logger.info(f"Spper user created successfully by management command")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating spper user: {str(e)}'))
            logger.error(f"Error creating spper user: {str(e)}")
            raise