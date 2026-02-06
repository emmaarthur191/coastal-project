"""Encryption key rotation utility for Coastal Banking.

This script allows administrators to rotate the FIELD_ENCRYPTION_KEY by
re-encrypting all sensitive fields in the database with a new key.
"""

import logging

from django.db import transaction

from cryptography.fernet import Fernet

from core.models.accounts import AccountOpeningRequest
from users.models import User

logger = logging.getLogger(__name__)


def rotate_keys(old_key: str, new_key: str):
    """Iterate through models and re-encrypt data with the new key."""
    old_cipher = Fernet(old_key.encode())
    new_cipher = Fernet(new_key.encode())

    with transaction.atomic():
        # 1. Rotate Users
        users = User.objects.all()
        logger.info(f"Rotating keys for {users.count()} users...")
        for user in users:
            # Re-encrypt ID Number
            if user.id_number_encrypted:
                decrypted = old_cipher.decrypt(user.id_number_encrypted).decode()
                user.id_number_encrypted = new_cipher.encrypt(decrypted.encode())

            # Re-encrypt Phone
            if user.phone_number_encrypted:
                decrypted = old_cipher.decrypt(user.phone_number_encrypted).decode()
                user.phone_number_encrypted = new_cipher.encrypt(decrypted.encode())

            user.save(update_fields=["id_number_encrypted", "phone_number_encrypted"])

        # 2. Rotate Account Opening Requests
        requests = AccountOpeningRequest.objects.all()
        logger.info(f"Rotating keys for {requests.count()} account applications...")
        for req in requests:
            if req.id_number_encrypted:
                decrypted = old_cipher.decrypt(req.id_number_encrypted).decode()
                req.id_number_encrypted = new_cipher.encrypt(decrypted.encode())

            if req.phone_number_encrypted:
                decrypted = old_cipher.decrypt(req.phone_number_encrypted).decode()
                req.phone_number_encrypted = new_cipher.encrypt(decrypted.encode())

            req.save(update_fields=["id_number_encrypted", "phone_number_encrypted"])

    logger.info("Key rotation completed successfully.")
