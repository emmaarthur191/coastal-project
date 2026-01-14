# Generated manually for Resilience models

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Adds SmsOutbox and IdempotencyKey models for system resilience.
    """
    dependencies = [
        ("core", "0026_add_credential_dispatch_to_account_opening"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SmsOutbox",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone_number", models.CharField(max_length=20)),
                ("message", models.TextField()),
                ("status", models.CharField(choices=[("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed")], default="pending", max_length=20)),
                ("error_message", models.TextField(blank=True, null=True)),
                ("retry_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "SMS Outbox",
                "verbose_name_plural": "SMS Outboxes",
                "db_table": "sms_outbox",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="IdempotencyKey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.UUIDField(unique=True)),
                ("response_data", models.JSONField(null=True)),
                ("status_code", models.PositiveIntegerField(null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "Idempotency Key",
                "verbose_name_plural": "Idempotency Keys",
                "db_table": "idempotency_key",
                "indexes": [models.Index(fields=["key", "user"], name="idempotency_key_877f97_idx")],
            },
        ),
    ]
