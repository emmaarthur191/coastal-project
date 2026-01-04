import os

from django.contrib.auth import get_user_model
from django.test import Client

User = get_user_model()


def verify_endpoints():
    print("Verifying Mobile Banker Endpoints...")

    # Create or get a test user
    username = "mobile_test_user"
    password = os.environ.get("TEST_PASSWORD", "testpassword123")
    email = "mobile_test@example.com"

    user, created = User.objects.get_or_create(username=username, email=email, defaults={"role": "staff"})
    if created:
        user.set_password(password)
        user.save()
        print(f"Created test user: {username}")
    else:
        print(f"Using existing test user: {username}")

    client = Client()

    # Login
    login_response = client.post(
        "/api/users/auth/login/", {"email": email, "password": password}, content_type="application/json"
    )
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code} - {login_response.content}")
        return False

    token = login_response.data["access"]
    auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
    print("Logged in successfully.")

    endpoints = [
        "/api/operations/messages/",
        "/api/operations/visit_schedules/",
        "/api/operations/mobile-banker-metrics/",
    ]

    errors = 0

    for endpoint in endpoints:
        print(f"Testing {endpoint}...")
        response = client.get(endpoint, **auth_headers)
        if response.status_code == 200:
            print(f"  SUCCESS: {endpoint} returned 200 OK")
        else:
            print(f"  FAILURE: {endpoint} returned {response.status_code}")
            print(f"  Response: {response.content}")
            errors += 1

    if errors == 0:
        print("\nAll endpoints verified successfully!")
        return True
    else:
        print(f"\n{errors} endpoints failed verification.")
        return False


if __name__ == "__main__":
    verify_endpoints()
