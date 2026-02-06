import os
import django
import json
from datetime import date

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "banking_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from core.models.loans import Loan
from core.models.accounts import AccountOpeningRequest
from core.models.operational import ClientRegistration, VisitSchedule, ClientAssignment
from core.serializers.loans import LoanSerializer
from core.serializers.accounts import AccountOpeningRequestSerializer
from core.serializers.operational import ClientAssignmentSerializer, ClientRegistrationSerializer
from core.models.audit import AuditLog

User = get_user_model()

def verify_pii_phase8():
    print("--- Starting Phase 8 PII Verification ---")

    # 1. Setup Test Data
    user, _ = User.objects.get_or_create(username="test_pii_user_p8", defaults={"email": "pii_p8@example.com", "role": "customer"})
    manager, _ = User.objects.get_or_create(username="test_manager_p8", defaults={"email": "manager_p8@example.com", "role": "manager"})
    cashier, _ = User.objects.get_or_create(username="test_cashier_p8", defaults={"email": "cashier_p8@example.com", "role": "cashier"})

    # 2. Test Loan Encryption
    loan = Loan.objects.create(
        user=user,
        amount=5000,
        interest_rate=15,
        term_months=12,
        date_of_birth=date(1990, 1, 1),
        id_number="GHA-123456789",
        digital_address="GA-123-4567",
        next_of_kin_1_name="John Doe",
        next_of_kin_1_phone="+233201112222",
        guarantor_1_name="Jane Smith",
        guarantor_1_id_number="GHA-987654321"
    )

    # Reload from DB
    loan.refresh_from_db()

    # Check properties
    assert loan.id_number == "GHA-123456789"
    assert loan.next_of_kin_1_name == "John Doe"
    assert str(loan.date_of_birth) == "1990-01-01"

    # Check raw DB fields (should be encrypted)
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT id_number_encrypted, next_of_kin_1_name_encrypted FROM core_loan WHERE id = %s", [loan.id])
        row = cursor.fetchone()
        assert "GHA-123456789" not in row[0]
        assert "John Doe" not in row[1]
        assert row[0].startswith("enc:")
        print("✓ Loan PII is encrypted in DB.")

    # 3. Test AccountOpeningRequest Photo Encryption
    aor = AccountOpeningRequest.objects.create(
        user=user,
        first_name="Alice",
        last_name="Wonderland",
        occupation="Developer",
        photo="BASE64_STUFF_HERE",
        id_number="GHA-555"
    )
    aor.refresh_from_db()
    assert aor.occupation == "Developer"
    assert aor.photo == "BASE64_STUFF_HERE"

    with connection.cursor() as cursor:
        cursor.execute("SELECT occupation_encrypted, photo_encrypted FROM core_account_opening_request WHERE id = %s", [aor.id])
        row = cursor.fetchone()
        assert "Developer" not in row[0]
        assert "BASE64_STUFF_HERE" not in row[1]
        print("✓ AccountOpeningRequest occupation and photo are encrypted.")

    # 4. Test Serializer Masking (RBAC)
    # Context with standard staff
    serializer_staff = LoanSerializer(loan, context={'request': type('obj', (object,), {'user': cashier})})
    data_staff = serializer_staff.data
    assert data_staff['id_number'].startswith("GHA-XXXX")
    assert data_staff['next_of_kin_1_name'] == "XXXXXXXX"
    assert "1990" in data_staff['date_of_birth']
    assert "****" in data_staff['date_of_birth']
    print("✓ LoanSerializer masks PII for cashier.")

    # Context with manager
    serializer_manager = LoanSerializer(loan, context={'request': type('obj', (object,), {'user': manager})})
    data_manager = serializer_manager.data
    assert data_manager['id_number'] == "GHA-123456789"
    assert data_manager['next_of_kin_1_name'] == "John Doe"
    print("✓ LoanSerializer shows full PII for manager.")

    # Test ClientAssignment Masking
    ca = ClientAssignment.objects.create(
        mobile_banker=manager,
        client=user,
        client_name="Bob Brown",
        location="Accra Mall"
    )
    serializer_ca_staff = ClientAssignmentSerializer(ca, context={'request': type('obj', (object,), {'user': cashier})})
    assert serializer_ca_staff.data['client_name'] == "XXXXXXXX"
    assert serializer_ca_staff.data['location'] == "XXXXXXXX"
    print("✓ ClientAssignmentSerializer masks PII for cashier.")

    # 5. Test Audit Log Redaction
    # Trigger an update to a PII field
    loan.digital_address = "GA-999-0000"
    loan.save()

    # Audit log should be created (assuming signals are active)
    audit = AuditLog.objects.filter(object_id=str(loan.id), action="update").latest('timestamp')
    changes = json.loads(audit.changes_json)

    # Check digital_address and its encrypted variant
    if "digital_address" in changes:
         assert changes["digital_address"][1] == "[REDACTED]"
    if "digital_address_encrypted" in changes:
         assert changes["digital_address_encrypted"][1] == "[REDACTED]"

    print("✓ AuditLog redacts new Phase 8 fields.")

    print("--- Phase 8 Verification PASSED ---")

if __name__ == "__main__":
    verify_pii_phase8()
