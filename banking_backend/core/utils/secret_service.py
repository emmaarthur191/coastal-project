"""Secret management abstraction for Coastal Banking.

Provides a unified interface for fetching sensitive keys, supporting
development (environment variables) and production (AWS KMS / GCP Cloud KMS)
without changing application logic.
"""

import logging
import os
from functools import lru_cache

from django.conf import settings

logger = logging.getLogger(__name__)


class SecretManager:
    """Manager for retrieving and caching sensitive encryption keys."""

    @staticmethod
    def _get_secret_from_file(key_name: str) -> str:
        """Helper to fetch a secret from a dedicated secret file."""
        # 1. Check for a defined SECRETS_DIR or standard Render path
        secrets_dir = os.environ.get("SECRETS_DIR", "/etc/secrets")
        secret_path = os.path.join(secrets_dir, key_name)
        
        if os.path.exists(secret_path):
            try:
                with open(secret_path, 'r') as f:
                    return f.read().strip()
            except Exception:
                logger.error(f"Failed to read secret from dedicated file.")
        
        # 2. Check for .env file in secrets dir (Render standard for env-group-files)
        env_file_path = os.path.join(secrets_dir, ".env")
        if os.path.exists(env_file_path):
            try:
                with open(env_file_path, 'r') as f:
                    for line in f:
                        if line.startswith(f"{key_name}="):
                            return line.split('=', 1)[1].strip().strip('"').strip("'")
            except Exception:
                logger.error(f"Failed to read from .env secret file.")
        
        return None

    @staticmethod
    def _decrypt_via_kms(key_name: str, key_val: str) -> bytes:
        """Decrypt a secret key via AWS/GCP KMS if KMS_PROVIDER is set.

        If decryption fails:
        - If ALLOW_LOCAL_KEK_FALLBACK is True, falls back to the raw key_val bytes.
        - Otherwise, raises ImproperlyConfigured.

        Memory Hygiene Note:
            Decrypted keys must never be logged, persistently cached, or written to disk.
            Keep them in local method variables only.
        """
        provider = os.environ.get("KMS_PROVIDER") or getattr(settings, "KMS_PROVIDER", None)
        if not provider or provider == "none":
            return key_val.encode() if isinstance(key_val, str) else key_val

        fallback_allowed = os.environ.get("ALLOW_LOCAL_KEK_FALLBACK", "False").lower() in ("true", "1", "yes") or getattr(settings, "ALLOW_LOCAL_KEK_FALLBACK", False)

        try:
            import base64
            # Attempt to decode base64 ciphertext
            ciphertext = base64.b64decode(key_val)

            if provider == "aws":
                import boto3
                kms_client = boto3.client("kms", region_name=os.environ.get("AWS_REGION", "us-east-1"))
                response = kms_client.decrypt(CiphertextBlob=ciphertext)
                return response["Plaintext"]

            elif provider == "gcp":
                from google.cloud import kms
                client = kms.KeyManagementServiceClient()
                kms_key_name = os.environ.get("GCP_KMS_KEY_NAME")
                if not kms_key_name:
                    raise ValueError("GCP_KMS_KEY_NAME must be set when using GCP KMS")
                response = client.decrypt(request={"name": kms_key_name, "ciphertext": ciphertext})
                return response.plaintext

            else:
                raise ValueError(f"Unsupported KMS provider: {provider}")

        except Exception as e:
            if not fallback_allowed:
                logger.critical(f"KMS Decryption failed for {key_name} and fallback is disabled: {e}")
                from django.core.exceptions import ImproperlyConfigured
                raise ImproperlyConfigured(f"KMS Decryption failed for {key_name}: {e}") from e

            logger.warning(f"KMS Decryption failed for {key_name}, falling back to local KEK: {e}")
            return key_val.encode() if isinstance(key_val, str) else key_val

    @staticmethod
    @lru_cache(maxsize=32)
    def get_encryption_key(version: int = None) -> bytes:
        """Retrieve the symmetric encryption key by version (AES-256-GCM)."""
        key_name = "FIELD_ENCRYPTION_KEY"
        if version and version > 1:
            key_name = f"FIELD_ENCRYPTION_KEY_V{version}"

        # 1. Check for a dedicated secret file (Most Secure - Render/Docker)
        key = SecretManager._get_secret_from_file(key_name)

        # 2. Check for manual override in settings
        if not key:
            key = getattr(settings, key_name, None)

        # 3. Check for environment variable (Standard fallback)
        if not key:
            key = os.environ.get(key_name)

        # 4. Fallback for v1 if specific V1 env var isn't set but primary is
        if not key and key_name == "FIELD_ENCRYPTION_KEY_V1":
             key = os.environ.get("FIELD_ENCRYPTION_KEY")

        if not key:
            # Fall-closed for security in non-DEBUG environments
            if not settings.DEBUG:
                logger.critical(f"{key_name} is missing in PRODUCTION!")
                from django.core.exceptions import ImproperlyConfigured
                raise ImproperlyConfigured(f"{key_name} must be set in production.")

            # Development/Build-only generation
            from cryptography.fernet import Fernet
            logger.warning(f"Using ephemeral encryption key for {key_name}. DATA WILL NOT BE PERSISTENT.")
            key = Fernet.generate_key().decode()

        # Route through KMS envelope decryption wrapper
        return SecretManager._decrypt_via_kms(key_name, key)

    @staticmethod
    @lru_cache(maxsize=32)
    def get_hash_key() -> str:
        """Retrieve the PII hashing salt (HMAC-SHA256)."""
        key = getattr(settings, "PII_HASH_KEY", None)
        if not key:
            key = os.environ.get("PII_HASH_KEY")

        if not key:
            if not settings.DEBUG:
                logger.critical("PII_HASH_KEY is missing in PRODUCTION!")
                raise ImproperlyConfigured("PII_HASH_KEY must be set in production.")
            key = "dev-fallback-pii-hash-key"

        return key

    @staticmethod
    def get_secret(key_name: str) -> str:
        """Retrieve a secret by name from file injection, settings, or environment variables."""
        # 1. File injection
        val = SecretManager._get_secret_from_file(key_name)
        # 2. Settings
        if not val:
            val = getattr(settings, key_name, None)
        # 3. Environment variables
        if not val:
            val = os.environ.get(key_name)
        return val



# Helper for DRF ImproperlyConfigured
from django.core.exceptions import ImproperlyConfigured
