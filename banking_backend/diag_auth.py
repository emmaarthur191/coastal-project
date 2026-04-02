import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import authenticate, get_user_model

User = get_user_model()

email = "test_user@example.com"
password = "TestPassword123!"

# Clean up
User.objects.filter(email=email).delete()

# Create
user = User.objects.create_user(email=email, password=password, username="test_username")
user.is_approved = True
user.save()

print(f"User created: {user.email}, is_approved: {user.is_approved}, is_active: {user.is_active}")

# Authenticate with email
check = authenticate(email=email, password=password)
print(f"Authenticate(email=...) result: {check}")

# Try lowercased email if original was mixed case (unlikely but good to check)
check_lower = authenticate(email=email.lower(), password=password)
print(f"Authenticate(email.lower()=...) result: {check_lower}")

# Authenticate with username just in case backend is weird
check_username = authenticate(username="test_username", password=password)
print(f"Authenticate(username=...) result: {check_username}")
