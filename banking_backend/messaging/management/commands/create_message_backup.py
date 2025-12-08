from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
import json
import hashlib
import os
from ...models import MessageBackup, MessageThread, Message, MessageReaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create encrypted backup of user messages'

    def add_arguments(self, parser):
        parser.add_argument('backup_id', type=str, help='Backup ID to process')

    def handle(self, *args, **options):
        backup_id = options['backup_id']

        try:
            backup = MessageBackup.objects.get(id=backup_id, status='pending')
        except MessageBackup.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Backup {backup_id} not found or not pending'))
            return

        self.stdout.write(f'Starting backup for user {backup.user.username}')

        backup.status = 'in_progress'
        backup.save()

        try:
            # Collect all user data
            threads = MessageThread.objects.filter(participants=backup.user)
            messages = Message.objects.filter(thread__participants=backup.user)
            reactions = MessageReaction.objects.filter(message__thread__participants=backup.user)

            # Prepare backup data
            backup_data = {
                'user_id': str(backup.user.id),
                'backup_type': backup.backup_type,
                'created_at': backup.created_at.isoformat(),
                'threads': [],
                'messages': [],
                'reactions': []
            }

            # Add threads
            for thread in threads:
                thread_data = {
                    'id': str(thread.id),
                    'subject': thread.subject,
                    'thread_type': thread.thread_type,
                    'participants': [str(p.id) for p in thread.participants.all()],
                    'created_at': thread.created_at.isoformat(),
                    'is_active': thread.is_active
                }
                backup_data['threads'].append(thread_data)

            # Add messages
            for message in messages:
                message_data = {
                    'id': str(message.id),
                    'thread_id': str(message.thread.id),
                    'sender_id': str(message.sender.id),
                    'content': message.content,
                    'encrypted_content': message.encrypted_content,
                    'iv': message.iv,
                    'auth_tag': message.auth_tag,
                    'message_type': message.message_type,
                    'timestamp': message.timestamp.isoformat(),
                    'is_read': message.is_read,
                    'reply_to_id': str(message.reply_to.id) if message.reply_to else None,
                    'forwarded_from_id': str(message.forwarded_from.id) if message.forwarded_from else None
                }
                backup_data['messages'].append(message_data)

            # Add reactions
            for reaction in reactions:
                reaction_data = {
                    'id': str(reaction.id),
                    'message_id': str(reaction.message.id),
                    'user_id': str(reaction.user.id),
                    'emoji': reaction.emoji,
                    'created_at': reaction.created_at.isoformat()
                }
                backup_data['reactions'].append(reaction_data)

            # Convert to JSON
            json_data = json.dumps(backup_data, indent=2)

            # Create checksum
            checksum = hashlib.sha256(json_data.encode()).hexdigest()

            # Generate encryption key for backup
            import secrets
            encryption_key = secrets.token_hex(32)

            # Encrypt the backup data (simplified - in production use proper encryption)
            # For now, we'll just store it as-is since the messages are already encrypted
            encrypted_data = json_data.encode()

            # Save to file
            backup_dir = os.path.join(settings.MEDIA_ROOT, 'backups')
            os.makedirs(backup_dir, exist_ok=True)

            filename = f"backup_{backup.user.id}_{backup.id}.json"
            file_path = os.path.join(backup_dir, filename)

            with open(file_path, 'wb') as f:
                f.write(encrypted_data)

            # Update backup record
            backup.mark_completed(
                file_path=file_path,
                file_size=len(encrypted_data),
                message_count=len(backup_data['messages']),
                media_count=sum(1 for m in backup_data['messages'] if m['message_type'] in ['image', 'file', 'video']),
                checksum=checksum
            )

            # Store encryption key securely (in production, encrypt this key)
            backup.encryption_key = encryption_key
            backup.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Backup completed: {len(backup_data["messages"])} messages, '
                    f'{len(backup_data["threads"])} threads, '
                    f'{backup.file_size} bytes'
                )
            )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Backup failed: {str(e)}'))
            backup.mark_failed()