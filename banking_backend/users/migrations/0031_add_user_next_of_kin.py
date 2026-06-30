from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0030_add_bank_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='next_of_kin_encrypted',
            field=models.TextField(blank=True, default=''),
        ),
    ]
