from django.core.management.base import BaseCommand
from users.models import User, UserProfile


class Command(BaseCommand):
    help = 'Create test users with known passwords for testing the banking application'

    def handle(self, *args, **options):
        # Common password for all test users
        test_password = "Test123!@#"
        
        users_data = [
            {
                'email': 'admin@bankingapp.com',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'manager',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'cashier@bankingapp.com',
                'first_name': 'John',
                'last_name': 'Cashier',
                'role': 'cashier',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'mobile@bankingapp.com',
                'first_name': 'Jane',
                'last_name': 'Mobile',
                'role': 'mobile_banker',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'ops@bankingapp.com',
                'first_name': 'Bob',
                'last_name': 'Operations',
                'role': 'operations_manager',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'member@bankingapp.com',
                'first_name': 'Alice',
                'last_name': 'Member',
                'role': 'member',
                'is_staff': False,
                'is_superuser': False,
            },
        ]
        
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("CREATING TEST USERS FOR BANKING APPLICATION"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        
        for user_data in users_data:
            email = user_data['email']
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                user = User.objects.get(email=email)
                user.set_password(test_password)
                user.first_name = user_data['first_name']
                user.last_name = user_data['last_name']
                user.role = user_data['role']
                user.is_staff = user_data['is_staff']
                user.is_superuser = user_data['is_superuser']
                user.is_active = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"[OK] Updated existing user: {email}"))
            else:
                user = User.objects.create_user(
                    email=email,
                    password=test_password,
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    role=user_data['role'],
                    is_staff=user_data['is_staff'],
                    is_superuser=user_data['is_superuser'],
                    is_active=True
                )
                self.stdout.write(self.style.SUCCESS(f"[OK] Created new user: {email}"))
            
            # Create or update user profile
            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'notify_email': True,
                    'notify_sms': True,
                    'notify_push': True
                }
            )
        
        self.stdout.write("")
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("TEST USERS CREATED SUCCESSFULLY!"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("LOGIN CREDENTIALS:"))
        self.stdout.write("-" * 80)
        self.stdout.write(self.style.WARNING(f"Password for ALL users: {test_password}"))
        self.stdout.write("")
        self.stdout.write("User Accounts:")
        for user_data in users_data:
            self.stdout.write(f"  • {user_data['email']:30} | Role: {user_data['role']}")
        self.stdout.write("")
        self.stdout.write("API Login Endpoint: POST /api/auth/login/")
        self.stdout.write('Request Body: {"email": "<email>", "password": "Test123!@#"}')
        self.stdout.write("=" * 80)