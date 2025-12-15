# Generated manually - removes old messaging models replaced by ChatRoom/ChatMessage
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_chatroom_chatmessage'),
    ]

    operations = [
        # Delete old messaging tables (replaced by ChatRoom/ChatMessage)
        # Order matters: delete dependent models first!
        
        # Message has FK to MessageThread, so delete it first
        migrations.DeleteModel(
            name='Message',
        ),
        # Now safe to delete MessageThread
        migrations.DeleteModel(
            name='MessageThread',
        ),
        migrations.DeleteModel(
            name='BlockedUser',
        ),
        migrations.DeleteModel(
            name='UserMessagePreferences',
        ),
        migrations.DeleteModel(
            name='BankingMessage',
        ),
    ]

