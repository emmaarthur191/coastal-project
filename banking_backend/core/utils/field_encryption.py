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

    Uses AES-256-GCM (AEAD) with a fresh random 96-bit nonce generated per call.
    The resulting ciphertext is tagged with 'v2GCM:' prefix.

    Memory Hygiene Note:
        Decrypted keys, plaintext values, and intermediate key materials must never be 
        logged, cached persistently, or serialized. Keep them strictly in temporary 
        local variables.
    """
    if not value:
        return ""

    try:
        import base64
        import os
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM

        key_str = get_fernet_key(version=version)
        if isinstance(key_str, str):
            key_bytes = base64.urlsafe_b64decode(key_str.encode())
        else:
            key_bytes = base64.urlsafe_b64decode(key_str)

        # Generate a fresh 96-bit (12-byte) random nonce per encryption
        nonce = os.urandom(12)
        aesgcm = AESGCM(key_bytes)

        # Encrypt the plaintext using AES-256-GCM (tag is appended automatically)
        ciphertext = aesgcm.encrypt(nonce, value.encode('utf-8'), None)

        # Store format: "v2GCM:" prefix + base64(nonce + ciphertext)
        packed = nonce + ciphertext
        return "v2GCM:" + base64.b64encode(packed).decode('utf-8')
    except Exception as e:
        logger.error("Encryption failed")
        raise ValueError("Failed to encrypt sensitive data") from e


def decrypt_field(encrypted_value: str, version: int = None) -> str:
    """Decrypt a previously encrypted string value using the specified key version.

    Supports both legacy Fernet (prefixed with 'gAAAAA') and modern AES-256-GCM 
    (prefixed with 'v2GCM:'). Non-matching prefixes raise ValueError to prevent 
    unrecognized/downgrade payloads.
    """
    if not encrypted_value:
        return ""

    try:
        import base64

        # 1. Branch strictly based on known format version prefixes
        if encrypted_value.startswith("gAAAAA"):
            # Legacy Fernet (AES-128-CBC + HMAC-SHA256) read-only compatibility shim.
            # Do NOT use this algorithm for new writes.
            from cryptography.fernet import Fernet
            f = Fernet(get_fernet_key(version=version))
            decrypted = f.decrypt(encrypted_value.encode())
            return decrypted.decode('utf-8')

        elif encrypted_value.startswith("v2GCM:"):
            # Modern AES-256-GCM
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM

            payload_b64 = encrypted_value[len("v2GCM:"):]
            data = base64.b64decode(payload_b64.encode('utf-8'))
            if len(data) < 12:
                raise ValueError("Invalid AES-GCM payload: too short")

            nonce = data[:12]
            ciphertext = data[12:]

            key_str = get_fernet_key(version=version)
            if isinstance(key_str, str):
                key_bytes = base64.urlsafe_b64decode(key_str.encode())
            else:
                key_bytes = base64.urlsafe_b64decode(key_str)

            aesgcm = AESGCM(key_bytes)
            decrypted = aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted.decode('utf-8')

        else:
            # Unrecognized format prefix — fail closed immediately to prevent downgrade attacks
            raise ValueError(f"Unsupported encryption format version prefix: {encrypted_value[:10]}")

    except ValueError as e:
        # Re-raise explicit validation and format errors directly
        raise e
    except Exception as e:
        logger.error("Decryption failed")
        raise ValueError("Failed to decrypt sensitive data") from e


def is_encrypted(value: str) -> bool:
    """Check if a value appears to be encrypted (either legacy Fernet or modern AES-GCM)."""
    if not value:
        return False
    return value.startswith("gAAAAA") or value.startswith("v2GCM:")


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
