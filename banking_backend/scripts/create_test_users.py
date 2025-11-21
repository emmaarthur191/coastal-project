"""
Script to create test users with known passwords for testing the banking application.
Run this script with: python manage.py shell < scripts/create_test_users.py
Or: python scripts/create_test_users.py (if Django is properly configured)
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, UserProfile

def create_test_users():
    """Create test users with known passwords"""
    
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
    
    print("=" * 80)
    print("CREATING TEST USERS FOR BANKING APPLICATION")
    print("=" * 80)
    print()
    
    for user_data in users_data:
        email = user_data['email']
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            user.set_password(test_password)
            user.save()
            print(f" Updated existing user: {email}")
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
            print(f" Created new user: {email}")
        
        # Create or update user profile
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'notify_email': True,
                'notify_sms': True,
                'notify_push': True
            }
        )
    
    print()
    print("=" * 80)
    print("TEST USERS CREATED SUCCESSFULLY!")
    print("=" * 80)
    print()
    print("LOGIN CREDENTIALS:")
    print("-" * 80)
    print(f"Password for ALL users: {test_password}")
    print()
    print("User Accounts:")
    for user_data in users_data:
        print(f"  • {user_data['email']:30} | Role: {user_data['role']}")
    print()
    print("API Login Endpoint: POST /api/auth/login/")
    print("Request Body: {\"email\": \"<email>\", \"password\": \"Test123!@#\"}")
    print("=" * 80)

if __name__ == '__main__':
    create_test_users()