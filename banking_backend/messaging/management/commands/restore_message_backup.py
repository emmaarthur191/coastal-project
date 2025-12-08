from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import json
import os
from ...models import MessageBackup, MessageThread, Message, MessageReaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Restore messages from encrypted backup'

    def add_arguments(self, parser):
        parser.add_argument('backup_id', type=str, help='Backup ID to restore')
        parser.add_argument('user_id', type=str, help='User ID to restore for')

    def handle(self, *args, **options):
        backup_id = options['backup_id']
        user_id = options['user_id']

        try:
            backup = MessageBackup.objects.get(id=backup_id, status='completed')
            user = User.objects.get(id=user_id)
        except (MessageBackup.DoesNotExist, User.DoesNotExist) as e:
            self.stdout.write(self.style.ERROR(f'Backup or user not found: {str(e)}'))
            return

        if backup.user != user:
            self.stdout.write(self.style.ERROR('Backup does not belong to specified user'))
            return

        self.stdout.write(f'Starting restore for user {user.username} from backup {backup_id}')

        try:
            # Read backup file
            if not os.path.exists(backup.file_path):
                self.stdout.write(self.style.ERROR(f'Backup file not found: {backup.file_path}'))
                return

            with open(backup.file_path, 'rb') as f:
                encrypted_data = f.read()

            # Decrypt backup data (simplified - in production use proper decryption)
            json_data = encrypted_data.decode()
            backup_data = json.loads(json_data)

            # Verify user
            if backup_data['user_id'] != str(user.id):
                self.stdout.write(self.style.ERROR('Backup data does not match user'))
                return

            restored_threads = 0
            restored_messages = 0
            restored_reactions = 0

            # Restore threads
            thread_map = {}  # Map old IDs to new objects
            for thread_data in backup_data['threads']:
                thread, created = MessageThread.objects.get_or_create(
                    id=thread_data['id'],
                    defaults={
                        'subject': thread_data['subject'],
                        'thread_type': thread_data['thread_type'],
                        'created_by': user,
                        'created_at': thread_data['created_at'],
                        'is_active': thread_data['is_active']
                    }
                )

                if created:
                    # Add participants
                    participants = User.objects.filter(id__in=thread_data['participants'])
                    thread.participants.set(participants)
                    restored_threads += 1

                thread_map[thread_data['id']] = thread

            # Restore messages
            message_map = {}
            for message_data in backup_data['messages']:
                thread = thread_map.get(message_data['thread_id'])
                if not thread:
                    continue

                sender = User.objects.filter(id=message_data['sender_id']).first()
                if not sender:
                    continue

                message, created = Message.objects.get_or_create(
                    id=message_data['id'],
                    defaults={
                        'thread': thread,
                        'sender': sender,
                        'content': message_data['content'],
                        'encrypted_content': message_data['encrypted_content'],
                        'iv': message_data['iv'],
                        'auth_tag': message_data['auth_tag'],
                        'message_type': message_data['message_type'],
                        'timestamp': message_data['timestamp'],
                        'is_read': message_data['is_read']
                    }
                )

                if created:
                    # Set reply_to and forwarded_from if they exist
                    if message_data['reply_to_id']:
                        reply_to = Message.objects.filter(id=message_data['reply_to_id']).first()
                        if reply_to:
                            message.reply_to = reply_to

                    if message_data['forwarded_from_id']:
                        forwarded_from = Message.objects.filter(id=message_data['forwarded_from_id']).first()
                        if forwarded_from:
                            message.forwarded_from = forwarded_from

                    message.save()
                    restored_messages += 1

                message_map[message_data['id']] = message

            # Restore reactions
            for reaction_data in backup_data['reactions']:
                message = message_map.get(reaction_data['message_id'])
                reaction_user = User.objects.filter(id=reaction_data['user_id']).first()

                if message and reaction_user:
                    reaction, created = MessageReaction.objects.get_or_create(
                        message=message,
                        user=reaction_user,
                        emoji=reaction_data['emoji'],
                        defaults={'created_at': reaction_data['created_at']}
                    )
                    if created:
                        restored_reactions += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f'Restore completed: {restored_threads} threads, '
                    f'{restored_messages} messages, {restored_reactions} reactions'
                )
            )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Restore failed: {str(e)}'))
            import traceback
            traceback.print_exc()