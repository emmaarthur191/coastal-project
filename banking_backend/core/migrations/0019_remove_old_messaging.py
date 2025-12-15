# Generated manually - removes old messaging models replaced by ChatRoom/ChatMessage
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_chatroom_chatmessage'),
    ]

    operations = [
        # Delete old messaging tables (replaced by ChatRoom/ChatMessage)
        migrations.DeleteModel(
            name='BlockedUser',
        ),
        migrations.DeleteModel(
            name='UserMessagePreferences',
        ),
        migrations.DeleteModel(
            name='MessageThread',
        ),
        migrations.DeleteModel(
            name='BankingMessage',
        ),
    ]
