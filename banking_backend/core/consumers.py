import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from .models import BankingMessage, FraudAlert
from .serializers import BankingMessageSerializer, FraudAlertSerializer

User = get_user_model()


class BankingMessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        # SECURITY FIX (CVE-COASTAL-001): Verify the authenticated user matches the URL user_id
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            # Reject unauthenticated connections
            await self.close(code=4001)
            return
            
        # Allow admins or the specific user
        # Note: Depending on business rules, admins might need access (e.g., support)
        # For strict privacy, only the user themselves.
        # Assuming staff/admins might need access for debugging, but let's default to strict ownership for security.
        # If user.role == 'admin': allow? Let's check strict ID match first.
        if str(user.id) != str(self.user_id):
            if not user.is_superuser: # Escape hatch for superusers only
                await self.close(code=4003) # Forbidden
                return

        self.room_group_name = f'messages_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'mark_read':
            message_id = text_data_json.get('message_id')
            await self.mark_message_read(message_id)
        
        elif message_type in ['call_offer', 'call_answer', 'new_ice_candidate', 'call_end', 'call_busy']:
            # Relay calling signals to the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_signal',
                    'signal_data': text_data_json
                }
            )

    # Send message to room group
    async def message_update(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message_update',
            'message': message
        }))

    # Send call signal to room group
    async def call_signal(self, event):
        signal_data = event['signal_data']
        
        # Send signal to WebSocket
        await self.send(text_data=json.dumps(signal_data))

    @database_sync_to_async
    def mark_message_read(self, message_id):
        try:
            message = BankingMessage.objects.get(id=message_id, user_id=self.user_id)
            if not message.is_read:
                message.is_read = True
                message.save()
                # Broadcast the update
                serializer = BankingMessageSerializer(message)
                self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'message_update',
                        'message': serializer.data
                    }
                )
        except ObjectDoesNotExist:
            pass


class FraudAlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        # SECURITY FIX (CVE-COASTAL-001): Verify ownership
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        if str(user.id) != str(self.user_id) and not user.is_superuser:
            await self.close(code=4003)
            return

        self.room_group_name = f'fraud_alerts_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Send alert to room group
    async def fraud_alert_update(self, event):
        alert = event['alert']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'fraud_alert_update',
            'alert': alert
        }))


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        # SECURITY FIX (CVE-COASTAL-001): Verify ownership
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        if str(user.id) != str(self.user_id) and not user.is_superuser:
            await self.close(code=4003)
            return

        self.room_group_name = f'notifications_{self.user_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Send notification to room group
    async def notification_update(self, event):
        notification = event['notification']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification_update',
            'notification': notification
        }))