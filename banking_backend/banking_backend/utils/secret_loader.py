"""Centralized helper to safely hydrate secrets from multiple providers.

This module is intentionally import-safe inside ``config.settings`` to ensure
sensitive values can be sourced from:

1. Process environment variables (the default for local development)
2. JSON payloads injected via files, base64 blobs, or vault adapters
3. AWS Secrets Manager (opt-in when SECURE_SECRETS_PROVIDER=aws)

The helpers exposed here never log or print secret values. They only raise
clear configuration errors when a required secret is missing.
"""
from __future__ import annotations

import base64
import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]


def _strtobool(value: Any) -> bool:
    """Return True for truthy string-ish values."""
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _read_file_bytes(path: str) -> Optional[bytes]:
    candidate = Path(path)
    if not candidate.exists():
        return None
    return candidate.read_bytes()


def _fernet_decrypt(raw_bytes: bytes, key: str) -> bytes:
    try:
        from cryptography.fernet import Fernet, InvalidToken
    except ImportError as exc:  # pragma: no cover - import guard
        raise ImproperlyConfigured(
            "cryptography must be installed to decrypt secure secret payloads"
        ) from exc

    key_bytes = key.encode() if isinstance(key, str) else key
    try:
        decrypted = Fernet(key_bytes).decrypt(raw_bytes)
    except InvalidToken as exc:
        raise ImproperlyConfigured("Unable to decrypt secure secret payload") from exc
    return decrypted


def _load_json(payload: Any, *, source: str) -> Dict[str, Any]:
    if payload is None:
        return {}
    if isinstance(payload, (bytes, bytearray)):
        payload = payload.decode()
    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ImproperlyConfigured(f"Secret payload from {source} is not valid JSON") from exc
    if not isinstance(data, dict):
        raise ImproperlyConfigured(
            f"Secret payload from {source} must decode to a JSON object"
        )
    # Normalize keys to uppercase for easier lookups
    return {str(key).upper(): value for key, value in data.items()}


def _load_from_inline_json() -> Dict[str, Any]:
    raw_json = os.getenv("SECURE_SECRETS_JSON")
    if not raw_json:
        return {}
    return _load_json(raw_json, source="SECURE_SECRETS_JSON")


def _load_from_json_file() -> Dict[str, Any]:
    path = os.getenv("SECURE_SECRETS_FILE")
    if not path:
        return {}
    raw_bytes = _read_file_bytes(path)
    if raw_bytes is None:
        raise ImproperlyConfigured(f"Secure secrets file '{path}' does not exist")
    if _strtobool(os.getenv("SECURE_SECRETS_FILE_BASE64")):
        raw_bytes = base64.b64decode(raw_bytes)
    if _strtobool(os.getenv("SECURE_SECRETS_FILE_ENCRYPTED")):
        key = os.getenv("SECURE_SECRETS_FERNET_KEY")
        if not key:
            raise ImproperlyConfigured(
                "SECURE_SECRETS_FERNET_KEY must be set to decrypt SECURE_SECRETS_FILE"
            )
        raw_bytes = _fernet_decrypt(raw_bytes, key)
    return _load_json(raw_bytes, source="SECURE_SECRETS_FILE")


def _load_from_b64_blob() -> Dict[str, Any]:
    blob = os.getenv("SECURE_SECRETS_B64")
    if not blob:
        return {}
    try:
        raw_bytes = base64.b64decode(blob)
    except Exception as exc:
        raise ImproperlyConfigured("SECURE_SECRETS_B64 is not valid base64") from exc
    if _strtobool(os.getenv("SECURE_SECRETS_B64_ENCRYPTED")):
        key = os.getenv("SECURE_SECRETS_FERNET_KEY")
        if not key:
            raise ImproperlyConfigured(
                "SECURE_SECRETS_FERNET_KEY must be set to decrypt SECURE_SECRETS_B64"
            )
        raw_bytes = _fernet_decrypt(raw_bytes, key)
    return _load_json(raw_bytes, source="SECURE_SECRETS_B64")


def _load_from_aws() -> Dict[str, Any]:
    provider = os.getenv("SECURE_SECRETS_PROVIDER", "env").lower()
    if provider not in {"aws", "aws_secrets_manager"}:
        return {}

    secret_id = os.getenv("SECURE_SECRETS_AWS_SECRET_ID")
    if not secret_id:
        raise ImproperlyConfigured(
            "SECURE_SECRETS_AWS_SECRET_ID must be defined when using the AWS provider"
        )
    region = (
        os.getenv("SECURE_SECRETS_AWS_REGION")
        or os.getenv("AWS_REGION")
        or os.getenv("AWS_DEFAULT_REGION")
        or "us-east-1"
    )
    try:
        import boto3  # pragma: disable=import-error
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise ImproperlyConfigured(
            "boto3 is required to fetch secrets from AWS Secrets Manager"
        ) from exc

    session = boto3.session.Session(region_name=region)
    client = session.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_id)
    payload = response.get("SecretString")
    if not payload:
        binary_secret = response.get("SecretBinary")
        if not binary_secret:
            raise ImproperlyConfigured("AWS secret response did not contain data")
        payload = base64.b64decode(binary_secret)
    return _load_json(payload, source=f"aws:{secret_id}")


@lru_cache()
def _collect_external_secrets() -> Dict[str, Any]:
    secrets: Dict[str, Any] = {}
    loaders = (
        _load_from_inline_json,
        _load_from_json_file,
        _load_from_b64_blob,
        _load_from_aws,
    )
    for loader in loaders:
        try:
            secrets.update(loader())
        except ImproperlyConfigured:
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.warning("Failed to load secret payload via %s: %s", loader.__name__, exc)
    return secrets


def refresh_secret_cache() -> None:
    """Clear caches so new secret payloads are reloaded."""
    _collect_external_secrets.cache_clear()  # type: ignore[attr-defined]


def get_secret(name: str, default: Any = None, cast: Optional[Callable[[Any], Any]] = None,
               *, required: bool = False) -> Any:
    """Fetch a secret value via env, secure payloads, or fall back to ``default``."""
    if not name:
        raise ImproperlyConfigured("Secret name cannot be empty")

    env_value = os.getenv(name)
    if env_value is None:
        secrets_map = _collect_external_secrets()
        env_value = secrets_map.get(name.upper())

    if env_value is None:
        if required:
            raise ImproperlyConfigured(
                f"Required secret '{name}' was not provided via env or secure payload"
            )
        return default

    if cast is None:
        return env_value

    try:
        if cast is bool:
            return _strtobool(env_value)
        return cast(env_value)
    except Exception as exc:
        raise ImproperlyConfigured(
            f"Failed to cast secret '{name}' using {cast}: {exc}"
        ) from exc


def get_secret_bool(name: str, default: Optional[bool] = None) -> Optional[bool]:
    value = get_secret(name)
    if value is None:
        return default
    return _strtobool(value)


def get_secret_json(name: str, *, required: bool = False) -> Dict[str, Any]:
    raw = get_secret(name)
    if raw is None:
        if required:
            raise ImproperlyConfigured(f"JSON secret '{name}' was not supplied")
        return {}
    return _load_json(raw, source=name)


def dump_secret_cache() -> Dict[str, Any]:
    """Return a shallow copy of the cached secure-secret dictionary."""
    return dict(_collect_external_secrets())


__all__ = [
    "dump_secret_cache",
    "get_secret",
    "get_secret_bool",
    "get_secret_json",
    "refresh_secret_cache",
]
