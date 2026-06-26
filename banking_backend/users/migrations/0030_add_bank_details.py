# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0029_add_gender_field"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="bank_name_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="user",
            name="bank_account_number_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="user",
            name="bank_branch_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
    ]
