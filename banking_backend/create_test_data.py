"""Create test data for ClientAssignments."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from datetime import timedelta

from django.utils import timezone

from core.models import ClientAssignment
from users.models import User

# Create test customers
test_customers = [
    ("abena.mensah@test.com", "Abena", "Mensah"),
    ("kofi.appiah@test.com", "Kofi", "Appiah"),
    ("ama.osei@test.com", "Ama", "Osei"),
]

for email, first, last in test_customers:
    user, created = User.objects.get_or_create(
        email=email,
        defaults={"username": email.split("@")[0], "first_name": first, "last_name": last, "role": "customer"},
    )
    if created:
        user.set_password("TestPass123!")
        user.save()
        print(f"Created user: {email}")
    else:
        print(f"Exists: {email}")

# Get mobile banker
banker = User.objects.filter(role="mobile_banker").first()
print(f'Mobile Banker: {banker.email if banker else "None"}')

# Create assignments
assignments_data = [
    ("abena.mensah@test.com", "Madina", "loan_application", None, "medium", 1),
    ("kofi.appiah@test.com", "Tema", "account_opening", None, "medium", 0),
    ("ama.osei@test.com", "Dansoman", "overdue_payment", 2500, "urgent", 0),
]

for email, loc, status, amount, priority, days in assignments_data:
    client = User.objects.get(email=email)
    obj, created = ClientAssignment.objects.get_or_create(
        mobile_banker=banker,
        client=client,
        defaults={
            "client_name": f"{client.first_name} {client.last_name}",
            "location": loc,
            "status": status,
            "amount_due": amount,
            "priority": priority,
            "next_visit": timezone.now() + timedelta(days=days),
        },
    )
    status_text = "Created" if created else "Exists"
    print(f"{status_text}: {obj.client_name}")

print(f"\nTotal: {ClientAssignment.objects.count()} assignments")
