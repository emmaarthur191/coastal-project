import base64
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from banking_backend.utils.secret_loader import dump_secret_cache, get_secret

logger = logging.getLogger(__name__)


def _strtobool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _decrypt_with_fernet(raw: bytes, key: str) -> bytes:
    try:
        from cryptography.fernet import Fernet, InvalidToken
    except ImportError as exc:  # pragma: no cover - optional dependency guard
        raise CommandError(
            "cryptography must be installed to decrypt SUPERUSER secret payloads"
        ) from exc

    key_bytes = key.encode() if isinstance(key, str) else key
    try:
        return Fernet(key_bytes).decrypt(raw)
    except InvalidToken as exc:  # pragma: no cover - defensive branch
        raise CommandError("Unable to decrypt SUPERUSER secret payload") from exc


def _read_secret_file(path: str) -> bytes:
    candidate = Path(path)
    if not candidate.exists():
        raise CommandError(f"SUPERUSER secret file '{path}' does not exist")
    return candidate.read_bytes()


def _load_raw_payload() -> str:
    """Load the superuser JSON payload from env/file/vault sources."""
    # 1. Explicit JSON string
    raw_json = get_secret('SUPERUSER_SECRETS_JSON')
    if raw_json:
        return raw_json

    # 2. Base64 blob (optionally encrypted)
    b64_blob = get_secret('SUPERUSER_SECRETS_B64')
    if b64_blob:
        try:
            decoded = base64.b64decode(b64_blob)
        except Exception as exc:
            raise CommandError("SUPERUSER_SECRETS_B64 is not valid base64") from exc
        fernet_key = get_secret('SUPERUSER_SECRETS_FERNET_KEY')
        if fernet_key:
            decoded = _decrypt_with_fernet(decoded, fernet_key)
        return decoded.decode()

    # 3. File reference (optionally base64/encrypted)
    file_path = get_secret('SUPERUSER_SECRETS_FILE') or os.getenv('SUPERUSER_SECRETS_FILE')
    if file_path:
        raw_bytes = _read_secret_file(file_path)
        if _strtobool(get_secret('SUPERUSER_SECRETS_FILE_BASE64') or os.getenv('SUPERUSER_SECRETS_FILE_BASE64')):
            raw_bytes = base64.b64decode(raw_bytes)
        fernet_key = get_secret('SUPERUSER_SECRETS_FERNET_KEY')
        if fernet_key:
            raw_bytes = _decrypt_with_fernet(raw_bytes, fernet_key)
        return raw_bytes.decode()

    # 4. As a fallback, inspect the aggregated secure secrets cache
    cache = dump_secret_cache()
    if 'SUPERUSER_SECRETS_JSON' in cache:
        return cache['SUPERUSER_SECRETS_JSON']
    if 'SUPERUSER_SECRETS_B64' in cache:
        try:
            decoded = base64.b64decode(cache['SUPERUSER_SECRETS_B64'])
        except Exception as exc:
            raise CommandError("Cached SUPERUSER_SECRETS_B64 is invalid base64") from exc
        fernet_key = cache.get('SUPERUSER_SECRETS_FERNET_KEY') or get_secret('SUPERUSER_SECRETS_FERNET_KEY')
        if fernet_key:
            decoded = _decrypt_with_fernet(decoded, fernet_key)
        return decoded.decode()

    raise CommandError(
        "No superuser secret source found. Provide SUPERUSER_SECRETS_JSON, "
        "SUPERUSER_SECRETS_B64, or SUPERUSER_SECRETS_FILE via a secure vault integration."
    )


def _parse_payload() -> List[Dict[str, Any]]:
    payload = json.loads(_load_raw_payload())
    if isinstance(payload, dict) and 'superusers' in payload:
        records = payload['superusers']
    elif isinstance(payload, list):
        records = payload
    else:
        raise CommandError(
            "Superuser secret payload must be a JSON list or {\"superusers\": [...]} object"
        )

    if not isinstance(records, list) or not records:
        raise CommandError("Superuser secret payload did not contain any records")

    return records


class Command(BaseCommand):
    help = "Synchronize privileged users from vaulted secrets without hardcoding credentials."

    def add_arguments(self, parser):
        parser.add_argument(
            '--allow-plaintext',
            action='store_true',
            help="Allow plaintext passwords in the secret payload (use only for first-time bootstrap).",
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Parse the secret payload and report planned changes without touching the database.",
        )

    def handle(self, *args, **options):
        allow_plaintext = options['allow_plaintext']
        dry_run = options['dry_run']
        records = _parse_payload()
        User = get_user_model()
        updated_users = []

        with transaction.atomic():
            for record in records:
                email = (record.get('email') or '').strip().lower()
                if not email:
                    raise CommandError("Each superuser record must include an 'email'")

                first_name = record.get('first_name', '')
                last_name = record.get('last_name', '')
                role = record.get('role', 'administrator')
                is_staff = record.get('is_staff', True)
                is_superuser = record.get('is_superuser', True)
                is_active = record.get('is_active', True)

                password_hash = record.get('password_hash')
                plaintext_password = record.get('password')
                if not password_hash and not plaintext_password:
                    raise CommandError(
                        f"Record for {email} must include either 'password_hash' or 'password'"
                    )

                if plaintext_password and not allow_plaintext:
                    raise CommandError(
                        f"Plaintext password supplied for {email} but --allow-plaintext not provided"
                    )

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'role': role,
                        'is_staff': is_staff,
                        'is_superuser': is_superuser,
                        'is_active': is_active,
                    },
                )

                changed_fields = []
                if user.first_name != first_name:
                    user.first_name = first_name
                    changed_fields.append('first_name')
                if user.last_name != last_name:
                    user.last_name = last_name
                    changed_fields.append('last_name')
                if user.role != role:
                    user.role = role
                    changed_fields.append('role')
                if user.is_staff != is_staff:
                    user.is_staff = is_staff
                    changed_fields.append('is_staff')
                if user.is_superuser != is_superuser:
                    user.is_superuser = is_superuser
                    changed_fields.append('is_superuser')
                if user.is_active != is_active:
                    user.is_active = is_active
                    changed_fields.append('is_active')

                if password_hash:
                    user.password = password_hash
                    changed_fields.append('password')
                elif plaintext_password:
                    user.password = make_password(plaintext_password)
                    changed_fields.append('password')

                user.failed_login_attempts = 0
                user.locked_until = None
                user.password_changed_at = timezone.now()

                if not dry_run:
                    user.save()

                groups = record.get('groups') or []
                if groups and not dry_run:
                    group_objs = [Group.objects.get_or_create(name=name)[0] for name in groups]
                    user.groups.set(group_objs)

                permissions = record.get('permissions') or []
                if permissions and not dry_run:
                    perms = list(Permission.objects.filter(codename__in=permissions))
                    user.user_permissions.set(perms)

                updated_users.append({
                    'email': email,
                    'created': created,
                    'fields_changed': changed_fields,
                    'groups': groups,
                    'permissions': permissions,
                })

            if dry_run:
                transaction.set_rollback(True)

        for summary in updated_users:
            action = 'created' if summary['created'] else 'updated'
            self.stdout.write(
                self.style.SUCCESS(
                    f"{action.title()} privileged user {summary['email']} (changed: {', '.join(summary['fields_changed'])})"
                )
            )
            if summary['groups']:
                self.stdout.write(f"  ↳ groups: {', '.join(summary['groups'])}")
            if summary['permissions']:
                self.stdout.write(f"  ↳ permissions: {', '.join(summary['permissions'])}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {len(updated_users)} privileged user(s) from secure secret payload"
            )
        )
