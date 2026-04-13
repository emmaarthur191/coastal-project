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

from django.conf import settings

from core.utils.secret_service import SecretManager

logger = logging.getLogger(__name__)

# Fernet key must be 32 url-safe base64-encoded bytes
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Store in environment variable for security


def get_fernet_key(version: int = None):
    """Get the Fernet encryption key via SecretManager, with optional version support."""
    return SecretManager.get_encryption_key(version=version)


def encrypt_field(value: str, version: int = None) -> str:
    """Encrypt a string value for database storage using the specified key version.

    Args:
        value: The plaintext string to encrypt.
        version: Optional integer version of the key to use. If None, uses the current default.

    Returns:
        Base64-encoded encrypted string, or empty string if value is None/empty.

    """
    if not value:
        return ""

    try:
        from cryptography.fernet import Fernet

        f = Fernet(get_fernet_key(version=version))
        encrypted = f.encrypt(value.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise ValueError("Failed to encrypt sensitive data") from e


def decrypt_field(encrypted_value: str, version: int = None) -> str:
    """Decrypt a previously encrypted string value using the specified key version.

    Args:
        encrypted_value: The base64-encoded encrypted string.
        version: Optional integer version of the key to use.

    Returns:
        Decrypted plaintext string, or empty string if value is None/empty.

    """
    if not encrypted_value:
        return ""

    try:
        from cryptography.fernet import Fernet

        f = Fernet(get_fernet_key(version=version))
        decrypted = f.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Decryption failed for version {version}: {e}")
        raise ValueError("Failed to decrypt sensitive data") from e


def is_encrypted(value: str) -> bool:
    """Check if a value appears to be Fernet-encrypted.

    Fernet tokens start with 'gAAAAA' (base64 prefix of version byte 0x80).
    """
    if not value:
        return False
    return value.startswith("gAAAAA")


def hash_field(value: str) -> str:
    """Generate a stable HMAC-SHA256 hash for searchable PII.

    This allows for exact-match database lookups without storing plaintext PII.
    The hash is salted using PII_HASH_KEY.

    Args:
        value: The plaintext string to hash.

    Returns:
        Hex-encoded HMAC hash, or empty string if input is empty.

    """
    if not value:
        return ""

    import hashlib
    import hmac

    key = SecretManager.get_hash_key()

    # Use HMAC-SHA256 for collision resistance and to prevent pre-computation attacks
    h = hmac.new(key.encode(), value.strip().encode(), hashlib.sha256)
    return h.hexdigest()
