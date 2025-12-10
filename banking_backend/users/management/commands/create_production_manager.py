"""
Production manager creation command.
Reads credentials from environment variables to avoid hardcoding.
Environment variables:
  - DJANGO_MANAGER_EMAIL (required)
  - DJANGO_MANAGER_PASSWORD (required)
  - DJANGO_MANAGER_FIRST_NAME (optional)
  - DJANGO_MANAGER_LAST_NAME (optional)
  - DJANGO_MANAGER_PHONE (optional)
"""
import os
import logging
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import UserProfile, OTPVerification

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Create production manager from environment variables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-if-exists',
            action='store_true',
            help='Skip creation if manager already exists (for idempotent deployments)',
        )
        parser.add_argument(
            '--update-password',
            action='store_true',
            help='Update password if user already exists',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email address (overrides DJANGO_MANAGER_EMAIL)',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password (overrides DJANGO_MANAGER_PASSWORD)',
        )
        parser.add_argument(
            '--phone',
            type=str,
            help='Phone number (overrides DJANGO_MANAGER_PHONE)',
        )

    def handle(self, *args, **options):
        # Get credentials from command line or environment variables
        email = options.get('email') or os.environ.get('DJANGO_MANAGER_EMAIL')
        password = options.get('password') or os.environ.get('DJANGO_MANAGER_PASSWORD')
        first_name = os.environ.get('DJANGO_MANAGER_FIRST_NAME', 'Manager')
        last_name = os.environ.get('DJANGO_MANAGER_LAST_NAME', 'User')
        phone = options.get('phone') or os.environ.get('DJANGO_MANAGER_PHONE', '')

        # Validate required fields
        if not email:
            raise CommandError(
                'Email is required. Use --email or set DJANGO_MANAGER_EMAIL environment variable.'
            )
        if not password:
            raise CommandError(
                'Password is required. Use --password or set DJANGO_MANAGER_PASSWORD environment variable.'
            )

        # Check if user already exists
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user:
            if options['skip_if_exists']:
                self.stdout.write(
                    self.style.WARNING(f'User {email} already exists. Skipping.')
                )
                return
            
            if options['update_password']:
                existing_user.set_password(password)
                existing_user.role = 'manager'
                existing_user.is_staff = True
                existing_user.is_active = True
                existing_user.password_changed_at = timezone.now()
                existing_user.save()
                
                logger.info(f'Production manager updated: {email}')
                self.stdout.write(
                    self.style.SUCCESS(f'Updated manager user {email}')
                )
                return
            
            # Update existing user to manager role
            existing_user.role = 'manager'
            existing_user.is_staff = True
            existing_user.is_active = True
            existing_user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Updated existing user {email} to manager role')
            )
            return

        # Create manager user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='manager',
            is_staff=True,
            is_superuser=False,
            is_active=True,
        )
        user.password_changed_at = timezone.now()
        user.save(update_fields=['password_changed_at'])

        # Create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        if phone:
            profile.phone = phone
            profile.save(update_fields=['phone'])

        # Create verified OTP for the manager using the authenticated code
        OTPVerification.objects.create(
            phone_number=phone or '+233557155186',
            otp_code='112233',  # Use the authenticated OTP code that was sent and verified
            verification_type='staff_onboarding',
            is_verified=True,
            expires_at=timezone.now() + timezone.timedelta(days=365)
        )

        logger.info(f'Production manager created: {email}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created production manager: {email} (ID: {user.id})'
            )
        )
