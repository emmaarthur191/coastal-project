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
    api_key = getattr(settings, "SENDEXA_API_KEY", "")
    api_secret = getattr(settings, "SENDEXA_API_SECRET", "")

    if not auth_token and not api_key:
        errors.append(
            Warning(
                "Sendexa SMS credentials are not configured. " "SMS sending will fail at runtime.",
                hint=(
                    "Set SENDEXA_AUTH_TOKEN or both SENDEXA_API_KEY and "
                    "SENDEXA_API_SECRET in your environment variables."
                ),
                id="users.W001",
            )
        )

    return errors
