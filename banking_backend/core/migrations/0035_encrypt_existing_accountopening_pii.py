"""Data migration to encrypt existing AccountOpeningRequest PII data.

This migration encrypts existing id_number and phone values
into the new encrypted fields.
"""

from django.db import migrations


def encrypt_existing_pii(apps, schema_editor):
    """Encrypt existing plaintext PII into encrypted fields."""
    from core.utils import encrypt_field

    AccountOpeningRequest = apps.get_model("core", "AccountOpeningRequest")
    for request in AccountOpeningRequest.objects.all():
        updated = False

        if request.id_number and not request.id_number_encrypted:
            try:
                request.id_number_encrypted = encrypt_field(request.id_number)
                updated = True
            except Exception:
                pass  # Skip if encryption fails

        if request.phone and not request.phone_encrypted:
            try:
                request.phone_encrypted = encrypt_field(request.phone)
                updated = True
            except Exception:
                pass  # Skip if encryption fails

        if updated:
            request.save(update_fields=["id_number_encrypted", "phone_encrypted"])


def noop(apps, schema_editor):
    """Do nothing on reverse migration."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0034_add_encrypted_pii_to_accountopening"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_pii, noop),
    ]
