import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.serializers import ClientAssignmentSerializer
from users.models import User

# Test serializer validation with string IDs
print("Testing serializer validation...")
data = {"mobile_banker": "4", "client": "2", "priority": "high", "location": "Test"}
s = ClientAssignmentSerializer(data=data)
is_valid = s.is_valid()
print(f"Is valid: {is_valid}")
print(f"Errors: {s.errors}")

# Check user 4's role
try:
    user = User.objects.get(id=4)
    print(f"\nUser 4: {user.email}, Role: {user.role}")
except User.DoesNotExist:
    print("\nUser 4 does not exist!")

# List all mobile bankers
print("\nAll users with role='mobile_banker':")
for u in User.objects.filter(role="mobile_banker"):
    print(f"  ID: {u.id}, Email: {u.email}")
