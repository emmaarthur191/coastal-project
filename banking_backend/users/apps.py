"""Users app configuration."""

from django.apps import AppConfig
from django.core.checks import Warning, register


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"
    verbose_name = "User Management"

    def ready(self):
        """Import signals when the app is ready."""
        import users.signals  # noqa: F401


@register()
def sendexa_config_check(app_configs, **kwargs):
    """Django system check: warn if Sendexa SMS credentials are missing."""
    from django.conf import settings

    errors = []
    auth_token = getattr(settings, "SENDEXA_AUTH_TOKEN", "")
    server_key = getattr(settings, "SENDEXA_SERVER_KEY", "")
    api_key = getattr(settings, "SENDEXA_API_KEY", "")
    api_secret = getattr(settings, "SENDEXA_API_SECRET", "")

    # We are missing credentials if none of the auth paths are fully populated:
    # 1. SENDEXA_AUTH_TOKEN is provided
    # 2. SENDEXA_SERVER_KEY is provided
    # 3. Both SENDEXA_API_KEY and SENDEXA_API_SECRET are provided
    has_auth_token = bool(auth_token)
    has_server_key = bool(server_key)
    has_api_credentials = bool(api_key and api_secret)

    if not (has_auth_token or has_server_key or has_api_credentials):
        errors.append(
            Warning(
                "Sendexa SMS credentials are not configured. SMS sending will fail at runtime.",
                hint="Set SENDEXA_AUTH_TOKEN, SENDEXA_SERVER_KEY, or both SENDEXA_API_KEY and SENDEXA_API_SECRET in your environment variables.",
                id="users.W001",
            )
        )

    return errors
