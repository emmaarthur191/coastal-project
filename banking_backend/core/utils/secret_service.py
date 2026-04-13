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
    @lru_cache(maxsize=32)
    def get_encryption_key(version: int = None) -> bytes:
        """Retrieve the symmetric encryption key by version (AES-128-CBC)."""
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

        return key.encode() if isinstance(key, str) else key

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


# Helper for DRF ImproperlyConfigured
from django.core.exceptions import ImproperlyConfigured
