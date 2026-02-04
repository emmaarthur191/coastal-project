"""Data migration to encrypt existing PII data.

This migration encrypts existing id_number and phone_number values
into the new encrypted fields.
"""

from django.db import migrations


def encrypt_existing_pii(apps, schema_editor):
    """Encrypt existing plaintext PII into encrypted fields."""
    from core.utils import encrypt_field

    User = apps.get_model("users", "User")
    for user in User.objects.all():
        updated = False

        if user.id_number and not user.id_number_encrypted:
            try:
                user.id_number_encrypted = encrypt_field(user.id_number)
                updated = True
            except Exception:
                pass  # Skip if encryption fails

        if user.phone_number and not user.phone_number_encrypted:
            try:
                user.phone_number_encrypted = encrypt_field(user.phone_number)
                updated = True
            except Exception:
                pass  # Skip if encryption fails

        if updated:
            user.save(update_fields=["id_number_encrypted", "phone_number_encrypted"])


def noop(apps, schema_editor):
    """Do nothing on reverse migration."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0009_add_encrypted_pii_fields"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_pii, noop),
    ]
