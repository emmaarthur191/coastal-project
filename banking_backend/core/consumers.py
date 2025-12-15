from channels.generic.websocket import AsyncWebsocketConsumer
import json

class SimpleMessagingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Check authentication (from middleware)
        if self.scope['user'].is_anonymous:
            await self.close(code=4003)
            return

        # Join global room
        self.room_group_name = "global-messaging"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', '')
        
        if not message:
            return

        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.scope['user'].username or str(self.scope['user']),
                'sender_id': self.scope['user'].id,
            }
        )

    async def chat_message(self, event):
        # Send to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': {
                'id': f"msg_{event.get('sender_id')}_{event.get('message')[:5]}", # Mock ID for now
                'content': event['message'],
                'sender': event['sender'],
                'sender_id': event['sender_id'],
                # Mock structure to match frontend expectations
                'preview': event['message'],
                'sender_name': event['sender'],
            }
        }))