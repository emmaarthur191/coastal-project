"""Field-Level Encryption Utilities for Coastal Banking.

This module provides symmetric encryption for sensitive database fields
using Fernet (AES-128-CBC with HMAC-SHA256) from the cryptography library.

Usage:
    from core.utils import encrypt_field, decrypt_field

    # Encrypt before saving to database
    user.id_number_encrypted = encrypt_field(raw_id_number)

    # Decrypt when reading from database
    raw_id_number = decrypt_field(user.id_number_encrypted)
"""

import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)

# Fernet key must be 32 url-safe base64-encoded bytes
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Store in environment variable for security


def get_fernet_key():
    """Get or generate the Fernet encryption key."""
    key = getattr(settings, "FIELD_ENCRYPTION_KEY", None)
    if not key:
        key = os.environ.get("FIELD_ENCRYPTION_KEY")

    if not key:
        # For development only - generate a key and warn
        logger.warning(
            "FIELD_ENCRYPTION_KEY not set. Using a temporary key. "
            "Set FIELD_ENCRYPTION_KEY in environment for production!"
        )
        from cryptography.fernet import Fernet

        key = Fernet.generate_key().decode()
        # Cache it in settings for this session
        settings.FIELD_ENCRYPTION_KEY = key

    return key.encode() if isinstance(key, str) else key


def encrypt_field(value: str) -> str:
    """Encrypt a string value for database storage.

    Args:
        value: The plaintext string to encrypt.

    Returns:
        Base64-encoded encrypted string, or empty string if value is None/empty.

    """
    if not value:
        return ""

    try:
        from cryptography.fernet import Fernet

        f = Fernet(get_fernet_key())
        encrypted = f.encrypt(value.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise ValueError("Failed to encrypt sensitive data") from e


def decrypt_field(encrypted_value: str) -> str:
    """Decrypt a previously encrypted string value.

    Args:
        encrypted_value: The base64-encoded encrypted string.

    Returns:
        Decrypted plaintext string, or empty string if value is None/empty.

    """
    if not encrypted_value:
        return ""

    try:
        from cryptography.fernet import Fernet

        f = Fernet(get_fernet_key())
        decrypted = f.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise ValueError("Failed to decrypt sensitive data") from e


def is_encrypted(value: str) -> bool:
    """Check if a value appears to be Fernet-encrypted.

    Fernet tokens start with 'gAAAAA' (base64 prefix of version byte 0x80).
    """
    if not value:
        return False
    return value.startswith("gAAAAA")
