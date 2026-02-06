import os
import sys

import django
from django.contrib.sessions.middleware import SessionMiddleware

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.accounts import Account, AccountOpeningRequest
from core.utils.field_encryption import hash_field
from core.views.accounts import AccountOpeningViewSet, StaffAccountsViewSet

User = get_user_model()


def verify_phase_5():
    print("--- Phase 5: PII Audit & Remediation Verification ---")
    sys.stdout.flush()

    # Setup
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = User.objects.create_superuser("admin_v5", "admin_v5@example.com", "AdminPass123!!")

    factory = APIRequestFactory()

    # 1. Test StaffAccountsViewSet Search (Hash-based)
    print("\n[1] Testing StaffAccountsViewSet PII Search...")
    test_id = "VERIFY-ID-12345"
    test_email = "tester_v11@example.com"
    User.objects.filter(email=test_email).delete()

    user = User.objects.create(
        username="pii_tester_v11", email=test_email, first_name="Search", last_name="Tester", role="customer"
    )
    user.id_number = test_id
    user.save()

    # Verify User Hash
    user.refresh_from_db()
    expected_hash = hash_field(test_id)
    if user.id_number_hash != expected_hash:
        print(f"FAILED: User hash mismatch! DB: {user.id_number_hash}, Expected: {expected_hash}")
        sys.stdout.flush()
        return

    # Create Account
    Account.objects.filter(user=user).delete()
    acc = Account.objects.create(user=user, account_number="ACC-V11-SER", balance=100)

    view = StaffAccountsViewSet.as_view({"get": "list"})
    request = factory.get(f"/api/staff/accounts/?search={test_id}")
    force_authenticate(request, user=admin)
    response = view(request)

    if response.status_code != 200:
        print(f"FAILED: View returned status {response.status_code}")
        sys.stdout.flush()
        return

    results = response.data.get("results", [])
    if not any(r["user"]["id"] == str(user.id) for r in results):
        print(f"FAILED: Search by ID number failed! Results count: {len(results)}")
        for r in results:
            print(f" - Got: {r['user']['full_name']} (ID: {r['user']['id']})")
        sys.stdout.flush()
        return

    print("Verified: StaffAccountsViewSet now uses hash-based PII searching.")

    # 2. Test Username Sanitization
    print("\n[2] Testing Username Sanitization...")
    AccountOpeningRequest.objects.filter(email="new_client@example.com").delete()
    opening_request = AccountOpeningRequest.objects.create(
        first_name="New",
        last_name="Client",
        phone_number="+233111222333",
        email="new_client@example.com",
        id_number="ID-777",
        submitted_by=admin,
        status="pending",
        date_of_birth="1990-01-01",
    )

    manager = User.objects.filter(role="manager").exclude(id=admin.id).first()
    if not manager:
        manager = User.objects.create(username="manager_v5", email="mgr_v5@example.com", role="manager")

    view_approve = AccountOpeningViewSet.as_view({"post": "approve"})
    request = factory.post(f"/api/accounts/opening/{opening_request.id}/approve/")
    force_authenticate(request, user=manager)
    response = view_approve(request, pk=opening_request.id)

    if response.status_code != 200:
        print(f"FAILED: Approve returned {response.status_code}: {response.data}")
        sys.stdout.flush()
        return

    client_user = User.objects.get(email="new_client@example.com")
    if "+233" in client_user.username:
        print(f"FAILED: Username contains PII: {client_user.username}")
        sys.stdout.flush()
        return
    print(f"Verified: Automated username sanitized (Value: {client_user.username})")

    # 3. Test OTP Session Privacy
    print("\n[3] Testing OTP Session Privacy...")
    phone_number = "+233999888777"
    view_otp = AccountOpeningViewSet.as_view({"post": "send_otp"})
    request = factory.post("/api/accounts/opening/send-otp/", {"phone_number": phone_number})
    force_authenticate(request, user=admin)

    middleware = SessionMiddleware(lambda r: None)
    middleware.process_request(request)
    request.session.save()

    response = view_otp(request)
    if response.status_code != 200:
        print(f"FAILED: Send OTP returned {response.status_code}")
        sys.stdout.flush()
        return

    if phone_number in response.data["phone_number"]:
        print("FAILED: Raw phone leaked in response!")
        sys.stdout.flush()
        return

    found_pii_key = False
    for key in request.session.keys():
        if phone_number in key:
            found_pii_key = True
            break

    if found_pii_key:
        print(f"FAILED: Raw phone leaked in session keys: {list(request.session.keys())}")
        sys.stdout.flush()
        return

    print("Verified: OTP sessions and responses now use hashed PII identifiers.")

    print("\n--- ALL PHASE 5 VERIFICATIONS PASSED ---")
    sys.stdout.flush()


if __name__ == "__main__":
    verify_phase_5()
