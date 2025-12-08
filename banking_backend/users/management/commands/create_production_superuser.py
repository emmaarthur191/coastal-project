"""
Production superuser creation command.
Reads credentials from environment variables to avoid hardcoding.
Environment variables:
  - DJANGO_SUPERUSER_EMAIL (required)
  - DJANGO_SUPERUSER_PASSWORD (required)
  - DJANGO_SUPERUSER_FIRST_NAME (optional)
  - DJANGO_SUPERUSER_LAST_NAME (optional)
"""
import os
import logging
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import UserProfile, ImmutableAuditLog

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Create production superuser from environment variables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-if-exists',
            action='store_true',
            help='Skip creation if superuser already exists (for idempotent deployments)',
        )
        parser.add_argument(
            '--update-password',
            action='store_true',
            help='Update password if user already exists',
        )

    def handle(self, *args, **options):
        # Get credentials from environment variables
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
        last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')

        # Validate required environment variables
        if not email:
            raise CommandError(
                'DJANGO_SUPERUSER_EMAIL environment variable is required. '
                'Set it before running this command.'
            )
        if not password:
            raise CommandError(
                'DJANGO_SUPERUSER_PASSWORD environment variable is required. '
                'Set it before running this command.'
            )

        # Validate password strength
        if len(password) < 12:
            raise CommandError(
                'Password must be at least 12 characters for production superuser.'
            )

        # Check if user already exists
        existing_user = User.objects.filter(email=email).first()
        
        if existing_user:
            if options['skip_if_exists']:
                self.stdout.write(
                    self.style.WARNING(f'Superuser {email} already exists. Skipping.')
                )
                return
            
            if options['update_password']:
                existing_user.set_password(password)
                existing_user.password_changed_at = timezone.now()
                existing_user.save(update_fields=['password', 'password_changed_at'])
                
                # Log password update
                logger.info(f'Production superuser password updated: {email}')
                self.stdout.write(
                    self.style.SUCCESS(f'Updated password for superuser {email}')
                )
                return
            
            raise CommandError(
                f'User {email} already exists. Use --skip-if-exists or --update-password.'
            )

        # Create superuser
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='superuser',
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        user.password_changed_at = timezone.now()
        user.save(update_fields=['password_changed_at'])

        # Create user profile
        UserProfile.objects.get_or_create(user=user)

        # Create immutable audit log entry
        ImmutableAuditLog.objects.create(
            user=user,
            action='production_superuser_created',
            description=f'Production superuser {email} created via management command',
            metadata={
                'created_at': timezone.now().isoformat(),
                'role': 'superuser',
                'created_via': 'create_production_superuser command',
            }
        )

        # Log creation (without sensitive data)
        logger.info(f'Production superuser created: {email}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created production superuser: {email} (ID: {user.id})'
            )
        )
