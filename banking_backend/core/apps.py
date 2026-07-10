import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


import threading

local_storage = threading.local()

def get_bypass_flag():
    return 1 if getattr(local_storage, "bypass_audit_trigger", False) else 0


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        import core.audit_signals  # noqa - Enable audit logging

        # Connection created signal to register SQLite custom functions for test bypass
        from django.db.backends.signals import connection_created
        from django.dispatch import receiver

        @receiver(connection_created)
        def register_sqlite_functions(sender, connection, **kwargs):
            if connection.vendor == 'sqlite':
                try:
                    # Register custom function on raw DB-API connection object
                    connection.connection.create_function("bypass_audit_trigger", 0, get_bypass_flag)
                except Exception:
                    pass

        # Monkey-patch Flush command to bypass triggers during test database flush/teardown
        try:
            from django.core.management.commands.flush import Command as FlushCommand
            original_handle = FlushCommand.handle

            def patched_handle(self, *args, **options):
                local_storage.bypass_audit_trigger = True
                try:
                    return original_handle(self, *args, **options)
                finally:
                    local_storage.bypass_audit_trigger = False

            FlushCommand.handle = patched_handle
        except Exception:
            pass

        # Phase 3 Security Hardening Startup Guards
        from django.conf import settings
        import os
        import sys
        from django.core.exceptions import ImproperlyConfigured

        # Determine if we are running in a production-like environment.
        is_prod = not settings.DEBUG or os.environ.get("ENV") == "production"

        if is_prod:
            kms_provider = os.environ.get("KMS_PROVIDER") or getattr(settings, "KMS_PROVIDER", None)

            # 1. Enforce KMS_PROVIDER presence and validity in production (never bypassable)
            #    'none' = direct key management without envelope encryption (e.g. Render)
            if not kms_provider:
                raise ImproperlyConfigured(
                    "Production Protection Guard: KMS_PROVIDER is not set! "
                    "Production environments must configure a KMS provider ('aws', 'gcp', or 'none') to secure field encryption keys."
                )
            if kms_provider not in ("aws", "gcp", "none"):
                raise ImproperlyConfigured(
                    f"Production Protection Guard: KMS_PROVIDER '{kms_provider}' is invalid! "
                    "Must be 'aws', 'gcp', or 'none' in production."
                )

            # 2. Prevent local fallback KEK in production unless running a designated emergency DR command
            fallback_allowed = os.environ.get("ALLOW_LOCAL_KEK_FALLBACK", "False").lower() in ("true", "1", "yes") or getattr(settings, "ALLOW_LOCAL_KEK_FALLBACK", False)
            if fallback_allowed:
                # Scoped bypass to audited disaster-recovery management commands only
                is_emergency = len(sys.argv) > 1 and sys.argv[1] in ("emergency_decrypt", "emergency_shell")
                if is_emergency:
                    sys.stderr.write("\n" + "!" * 80 + "\n")
                    sys.stderr.write("!!! WARNING: EMERGENCY LOCAL KEK FALLBACK ENABLED DURING DISASTER RECOVERY COMMAND !!!\n")
                    sys.stderr.write(f"!!! Command: {sys.argv[1]} is running with bypassed KMS constraints. !!!\n")
                    sys.stderr.write("!!! Ensure this session is fully monitored and audited. !!!\n")
                    sys.stderr.write("!" * 80 + "\n\n")
                    logger.critical(f"DISASTER RECOVERY EMERGENCY COMMAND '{sys.argv[1]}' INITIALIZED WITH LOCAL KEK FALLBACK.")
                else:
                    raise ImproperlyConfigured(
                        "Production Protection Guard: ALLOW_LOCAL_KEK_FALLBACK is enabled in production! "
                        "This is a critical security vulnerability that allows KEK decryption to silently fail-open. "
                        "To perform disaster recovery operations with local KEK fallback, you must execute a designated "
                        "emergency command (e.g. 'manage.py emergency_shell')."
                    )
