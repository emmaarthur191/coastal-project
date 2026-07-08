import pytest
from decimal import Decimal
from django.urls import reverse
from django.db import OperationalError, IntegrityError
from django.test import override_settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from users.models import AuditLog
from core.apps import local_storage

from django.db import transaction

User = get_user_model()


@pytest.mark.django_db
class TestAuditLogImmutabilityTriggers:
    def test_audit_log_immutable_by_default(self, db):
        """Verify that audit log updates and deletes are blocked by the database trigger."""
        user = User.objects.create_user(username="audit_test_user", email="audit@ex.com", password="password123")
        log = AuditLog.objects.create(
            user=user,
            action="create",
            model_name="User",
            object_id=str(user.id),
            object_repr=user.username,
            changes={"role": "customer"}
        )

        # 1. Attempt UPDATE should raise OperationalError or IntegrityError due to SQLite trigger RAISE(FAIL)
        # Wrap in transaction.atomic() to isolate the error and keep the connection transaction clean
        with pytest.raises((OperationalError, IntegrityError)) as exc_info:
            with transaction.atomic():
                log.action = "update"
                log.save()
        assert "Audit log entries are immutable" in str(exc_info.value)

        # 2. Attempt DELETE should raise OperationalError or IntegrityError due to SQLite trigger RAISE(FAIL)
        with pytest.raises((OperationalError, IntegrityError)) as exc_info:
            with transaction.atomic():
                log.delete()
        assert "Audit log entries are immutable" in str(exc_info.value)

    def test_audit_log_bypass_works(self, db):
        """Verify that when local_storage.bypass_audit_trigger is set to True, modifications are permitted."""
        user = User.objects.create_user(username="audit_test_user_2", email="audit2@ex.com", password="password123")
        log = AuditLog.objects.create(
            user=user,
            action="create",
            model_name="User",
            object_id=str(user.id),
            object_repr=user.username,
            changes={"role": "customer"}
        )

        local_storage.bypass_audit_trigger = True
        try:
            # Update should succeed under bypass
            log.action = "update"
            log.save()
            log.refresh_from_db()
            assert log.action == "update"

            # Delete should succeed under bypass
            log.delete()
            assert not AuditLog.objects.filter(pk=log.pk).exists()
        finally:
            local_storage.bypass_audit_trigger = False


@pytest.mark.django_db
class TestMTLSScopingBehavior:
    @override_settings(SKIP_MTLS_IN_DEV=False)
    def test_mtls_enforced_on_protected_endpoints(self):
        """Verify that accessing protected paths without Cloudflare/legacy mTLS headers results in a 403 Forbidden."""
        staff = User.objects.create_user(
            username="staff_mtls", email="staff_mtls@example.com", password="password123", role="staff", is_staff=True
        )
        client = APIClient()
        client.force_authenticate(user=staff)

        # Protected endpoints
        protected_urls = [
            reverse("core:operations-metrics"),
            reverse("core:system-health"),
        ]

        for url in protected_urls:
            response = client.get(url)
            # The middleware raises PermissionDenied, which Django handles as 403 Forbidden
            assert response.status_code == status.HTTP_403_FORBIDDEN

    @override_settings(SKIP_MTLS_IN_DEV=False)
    def test_mtls_bypassed_on_customer_endpoints(self):
        """Verify that customer-facing and authentication endpoints do NOT require mTLS and pass through normally."""
        client = APIClient()
        # Ordinary customer/guest paths
        public_urls = [
            reverse("users:login"),
            reverse("users:send-otp"),
            reverse("core:account-opening-submit-request"),
        ]

        for url in public_urls:
            if url == reverse("core:account-opening-submit-request"):
                response = client.post(url, {"account_data": {"first_name": "Anon"}}, format="json")
            elif url == reverse("users:login"):
                response = client.post(url, {"email": "bad@ex.com", "password": "wrong"}, format="json")
            else:
                response = client.post(url, {}, format="json")
            
            # The key assertion is that these endpoints do NOT return 403 Forbidden (mTLS is bypassed)
            assert response.status_code != status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCountLegacyEncryptedFields:
    def test_legacy_encrypted_fields_counted(self):
        """Verify that count_legacy_encrypted_fields command identifies legacy Fernet rows."""
        from django.core.management import call_command
        from io import StringIO
        
        # 1. Clear database legacy rows (if any)
        User.objects.all().delete()
        
        # 2. Create one user with legacy Fernet encrypted name
        # We manually bypass validation/auto-encryption logic by directly setting the raw field value
        user = User.objects.create(
            username="legacy_user", 
            email="legacy@ex.com",
            first_name_encrypted="gAAAAABl-legacy-fernet-token"
        )
        
        out = StringIO()
        call_command("count_legacy_encrypted_fields", stdout=out)
        output = out.getvalue()
        
        # 3. Assert that the scan identified our user row containing the 'gAAAAA' prefix
        assert "User" in output
        assert "1 rows containing legacy Fernet" in output
