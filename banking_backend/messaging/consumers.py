import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import MessageThread, Message, MessageReaction

User = get_user_model()

class MessagingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'messaging_{self.thread_id}'

        # Check if user has access to this thread
        if await self.can_access_thread():
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

            # Send presence update
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.scope['user'].id,
                    'status': 'online'
                }
            )
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.scope['user'].id,
                    'status': 'offline'
                }
            )
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'new_message':
            await self.handle_new_message(data)
        elif message_type == 'add_reaction':
            await self.handle_add_reaction(data)
        elif message_type == 'remove_reaction':
            await self.handle_remove_reaction(data)
        elif message_type == 'mark_read':
            await self.handle_mark_read(data)
        elif message_type == 'typing_start':
            await self.handle_typing_start()
        elif message_type == 'typing_stop':
            await self.handle_typing_stop()
        elif message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def handle_new_message(self, data):
        # Save message to database
        message = await self.save_message(data)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'new_message',
                'message': {
                    'id': str(message.id),
                    'thread': str(message.thread.id),
                    'sender_id': message.sender.id,
                    'sender_name': f"{message.sender.first_name} {message.sender.last_name}",
                    'content': message.content,
                    'encrypted_content': message.encrypted_content,
                    'iv': message.iv,
                    'auth_tag': message.auth_tag,
                    'message_type': message.message_type,
                    'timestamp': message.timestamp.isoformat(),
                    'is_read': message.is_read,
                    'reply_to': str(message.reply_to.id) if message.reply_to else None,
                    'forwarded_from': str(message.forwarded_from.id) if message.forwarded_from else None,
                    'is_starred': message.is_starred
                }
            }
        )

    async def handle_typing_start(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_start',
                'user_id': self.scope['user'].id
            }
        )

    async def handle_typing_stop(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_stop',
                'user_id': self.scope['user'].id
            }
        )

    async def handle_add_reaction(self, data):
        # Save reaction to database
        reaction = await self.save_reaction(data)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'reaction_added',
                'reaction': {
                    'id': str(reaction.id),
                    'message_id': str(reaction.message.id),
                    'user_id': reaction.user.id,
                    'user_name': f"{reaction.user.first_name} {reaction.user.last_name}",
                    'emoji': reaction.emoji,
                    'created_at': reaction.created_at.isoformat()
                }
            }
        )

    async def handle_remove_reaction(self, data):
        # Remove reaction from database
        removed = await self.remove_reaction(data)

        if removed:
            # Broadcast to group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reaction_removed',
                    'message_id': data.get('message_id'),
                    'user_id': self.scope['user'].id,
                    'emoji': data.get('emoji')
                }
            )

    async def handle_mark_read(self, data):
        # Mark message as read
        await self.mark_message_read(data)

        # Broadcast read status update
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'message_read',
                'message_id': data.get('message_id'),
                'user_id': self.scope['user'].id,
                'device_id': data.get('device_id')
            }
        )

    # Receive message from room group
    async def new_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_start(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_stop(self, event):
        await self.send(text_data=json.dumps(event))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def reaction_added(self, event):
        await self.send(text_data=json.dumps(event))

    async def reaction_removed(self, event):
        await self.send(text_data=json.dumps(event))

    async def message_read(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def can_access_thread(self):
        try:
            thread = MessageThread.objects.get(id=self.thread_id, is_active=True)
            return thread.participants.filter(id=self.scope['user'].id).exists()
        except MessageThread.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, data):
        thread = MessageThread.objects.get(id=self.thread_id)
        return Message.objects.create(
            thread=thread,
            sender=self.scope['user'],
            content=data.get('content'),
            encrypted_content=data.get('encrypted_content'),
            iv=data.get('iv'),
            auth_tag=data.get('auth_tag'),
            message_type=data.get('message_type', 'text'),
            reply_to_id=data.get('reply_to')
        )

    @database_sync_to_async
    def save_reaction(self, data):
        message = Message.objects.get(id=data.get('message_id'))
        return MessageReaction.objects.create(
            message=message,
            user=self.scope['user'],
            emoji=data.get('emoji')
        )

    @database_sync_to_async
    def remove_reaction(self, data):
        try:
            reaction = MessageReaction.objects.get(
                message_id=data.get('message_id'),
                user=self.scope['user'],
                emoji=data.get('emoji')
            )
            reaction.delete()
            return True
        except MessageReaction.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_message_read(self, data):
        try:
            from .models import Device
            message = Message.objects.get(id=data.get('message_id'))
            device = Device.objects.get(device_id=data.get('device_id'), user=self.scope['user'])
            message.mark_as_read(self.scope['user'], device)
            return True
        except Exception as e:
            print(f"Error marking message as read: {e}")
            return False