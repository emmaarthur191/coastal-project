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
    server_key = getattr(settings, "SENDEXA_SERVER_KEY", "")

    if not server_key:
        errors.append(
            Warning(
                "Sendexa SMS credentials are not configured. SMS sending will fail at runtime.",
                hint="Set SENDEXA_SERVER_KEY in your environment variables.",
                id="users.W001",
            )
        )

    return errors
