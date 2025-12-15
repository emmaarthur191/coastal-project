"""
Simple Chat Consumer for WhatsApp-style messaging.
Uses Django Channels with cookie-based JWT authentication.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat.
    Connects to a specific room and broadcasts messages.
    """

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope.get('user')

        # Require authentication
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Verify user is member of this room
        is_member = await self.check_room_membership()
        if not is_member:
            await self.close(code=4003)
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming messages from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'message':
                content = data.get('content', '').strip()
                if not content:
                    return

                # Save message to database
                message = await self.save_message(content)

                # Broadcast to room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message_id': message['id'],
                        'content': message['content'],
                        'sender_id': message['sender_id'],
                        'sender_name': message['sender_name'],
                        'timestamp': message['timestamp'],
                    }
                )

            elif message_type == 'typing':
                # Broadcast typing indicator
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user_id': self.user.id,
                        'user_name': self.user.first_name or self.user.email,
                        'is_typing': data.get('is_typing', True),
                    }
                )

        except json.JSONDecodeError:
            pass

    async def chat_message(self, event):
        """Send message to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'id': event['message_id'],
            'content': event['content'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'timestamp': event['timestamp'],
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket."""
        # Don't send to the user who is typing
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing'],
            }))

    @database_sync_to_async
    def check_room_membership(self):
        """Check if user is a member of the room."""
        from .models import ChatRoom
        return ChatRoom.objects.filter(
            id=self.room_id,
            members=self.user
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        """Save message to database and return serialized data."""
        from .models import ChatRoom, ChatMessage

        room = ChatRoom.objects.get(id=self.room_id)
        message = ChatMessage.objects.create(
            room=room,
            sender=self.user,
            content=content
        )

        # Update room's updated_at for ordering
        room.save()

        return {
            'id': message.id,
            'content': message.content,
            'sender_id': self.user.id,
            'sender_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.email,
            'timestamp': message.created_at.isoformat(),
        }