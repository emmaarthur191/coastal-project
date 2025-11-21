from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import UserProfile
from django.utils import timezone
import random
import string

User = get_user_model()


class Command(BaseCommand):
    help = 'Create comprehensive test users for all roles in the banking system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--roles',
            nargs='+',
            choices=['administrator', 'operations_manager', 'manager', 'cashier', 'mobile_banker', 'customer'],
            help='Specific roles to create (default: all roles)'
        )
        parser.add_argument(
            '--count',
            type=int,
            default=1,
            help='Number of users per role to create (default: 1)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if users already exist'
        )

    def handle(self, *args, **options):
        roles = options['roles'] or ['administrator', 'operations_manager', 'manager', 'cashier', 'mobile_banker', 'customer']
        count = options['count']
        force = options['force']
        
        password = 'SecurePass123!'
        
        for role in roles:
            self.stdout.write(f"\nCreating {count} user(s) with role: {role}")
            
            for i in range(count):
                email = f"{role}.{i+1}@banking.test"
                
                # Check if user already exists
                if User.objects.filter(email=email).exists() and not force:
                    self.stdout.write(self.style.WARNING(f"User {email} already exists, skipping..."))
                    continue
                
                # Create user
                user_data = {
                    'email': email,
                    'first_name': self.get_first_name(role),
                    'last_name': self.get_last_name(),
                    'role': role,
                    'is_active': True,
                    'is_staff': role != 'customer'
                }
                
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults=user_data
                )
                
                if created or force:
                    if not created:
                        # Update existing user
                        for key, value in user_data.items():
                            setattr(user, key, value)
                    
                    user.set_password(password)
                    user.last_login = timezone.now()
                    user.save()
                    
                    # Create or update profile
                    profile, profile_created = UserProfile.objects.get_or_create(user=user)
                    profile.phone = f"+1234567890{i}"
                    profile.notify_email = True
                    profile.notify_sms = i % 2 == 0
                    profile.notify_push = True
                    profile.save()
                    
                    if created:
                        self.stdout.write(self.style.SUCCESS(f"Created: {user.email} (Password: {password})"))
                    else:
                        self.stdout.write(self.style.WARNING(f"Updated: {user.email} (Password: {password})"))
                
        self.stdout.write(self.style.SUCCESS(f"\nTest user creation completed! Default password: {password}"))
        
        # Print summary
        self.stdout.write("\nCreated users summary:")
        for role in roles:
            count = User.objects.filter(role=role).count()
            self.stdout.write(f"  {role}: {count} user(s)")

    def get_first_name(self, role):
        """Get appropriate first name based on role."""
        names = {
            'administrator': 'Admin',
            'operations_manager': 'Ops',
            'manager': 'Manager',
            'cashier': 'Cashier',
            'mobile_banker': 'Mobile',
            'customer': 'Customer'
        }
        return names.get(role, 'User')

    def get_last_name(self):
        """Generate a random last name."""
        surnames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
            'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
        ]
        return random.choice(surnames)