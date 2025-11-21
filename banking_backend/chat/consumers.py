import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import ChatSession, ChatMessage, ChatSessionAudit
from users.models import User

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for customer chat sessions."""

    async def connect(self):
        """Handle WebSocket connection."""
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'chat_{self.session_id}'

        # Get user from scope
        self.user = self.scope.get('user')

        # Validate session access
        if not await self.can_access_session():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'session_id': self.session_id,
            'user': self.user.email if self.user else 'anonymous'
        }))

        # Mark user as online in this session
        await self.mark_user_online()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Mark user as offline
        await self.mark_user_offline()

        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'typing_start':
                await self.handle_typing_start(data)
            elif message_type == 'typing_stop':
                await self.handle_typing_stop(data)
            elif message_type == 'read_receipt':
                await self.handle_read_receipt(data)
            elif message_type == 'file_upload':
                await self.handle_file_upload(data)

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error in chat consumer: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))

    async def handle_chat_message(self, data):
        """Handle incoming chat messages."""
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'text')

        if not content and message_type == 'text':
            return

        # Save message to database
        message = await self.save_message(content, message_type, data)

        # Broadcast message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': str(message.id),
                    'content': message.content,
                    'message_type': message.message_type,
                    'sender': message.sender.email,
                    'timestamp': message.timestamp.isoformat(),
                    'is_read': message.is_read,
                }
            }
        )

    async def handle_typing_start(self, data):
        """Handle typing start indicator."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_start',
                'user': self.user.email if self.user else 'anonymous'
            }
        )

    async def handle_typing_stop(self, data):
        """Handle typing stop indicator."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_stop',
                'user': self.user.email if self.user else 'anonymous'
            }
        )

    async def handle_read_receipt(self, data):
        """Handle read receipt for messages."""
        message_ids = data.get('message_ids', [])
        await self.mark_messages_read(message_ids)

        # Broadcast read receipt
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'read_receipt',
                'user': self.user.email if self.user else 'anonymous',
                'message_ids': message_ids
            }
        )

    async def handle_file_upload(self, data):
        """Handle file upload messages."""
        # This would be handled by the file upload endpoint
        # For now, just acknowledge
        await self.send(text_data=json.dumps({
            'type': 'file_upload_ack',
            'status': 'processing'
        }))

    # Database operations
    @database_sync_to_async
    def can_access_session(self):
        """Check if user can access this chat session."""
        try:
            session = ChatSession.objects.get(id=self.session_id)
            if self.user:
                # Cashiers can access assigned sessions, customers can access their own
                return (self.user == session.customer or
                       self.user == session.assigned_cashier or
                       self.user.has_role_permission('manager'))
            return False  # Anonymous users can't access sessions
        except ChatSession.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, message_type, data):
        """Save message to database."""
        session = ChatSession.objects.get(id=self.session_id)
        message = ChatMessage.objects.create(
            session=session,
            sender=self.user,
            content=content,
            message_type=message_type,
            metadata=data.get('metadata', {})
        )

        # Update session last message time
        session.update_last_message()

        return message

    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        """Mark messages as read."""
        ChatMessage.objects.filter(
            id__in=message_ids,
            session_id=self.session_id
        ).exclude(sender=self.user).update(
            is_read=True,
            read_at=timezone.now()
        )

    @database_sync_to_async
    def mark_user_online(self):
        """Mark user as online in this session."""
        if self.user:
            # This could be stored in cache or database
            # For now, we'll just log it
            logger.info(f"User {self.user.email} came online in session {self.session_id}")

    @database_sync_to_async
    def mark_user_offline(self):
        """Mark user as offline in this session."""
        if self.user:
            logger.info(f"User {self.user.email} went offline in session {self.session_id}")

    # Event handlers for room group messages
    async def chat_message(self, event):
        """Send chat message to WebSocket."""
        await self.send(text_data=json.dumps(event))

    async def typing_start(self, event):
        """Send typing start indicator."""
        await self.send(text_data=json.dumps(event))

    async def typing_stop(self, event):
        """Send typing stop indicator."""
        await self.send(text_data=json.dumps(event))

    async def read_receipt(self, event):
        """Send read receipt."""
        await self.send(text_data=json.dumps(event))


class SupportChatConsumer(ChatConsumer):
    """WebSocket consumer for support staff chat sessions."""

    async def connect(self):
        """Handle WebSocket connection for support staff."""
        await super().connect()

        # Additional support staff specific logic
        if self.user and self.user.role in ['cashier', 'manager', 'administrator']:
            # Mark cashier as available
            await self.mark_cashier_available()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection for support staff."""
        if self.user and self.user.role in ['cashier', 'manager', 'administrator']:
            # Mark cashier as unavailable
            await self.mark_cashier_unavailable()

        await super().disconnect(close_code)

    @database_sync_to_async
    def mark_cashier_available(self):
        """Mark cashier as available for new chats."""
        # This would typically update a cache or database field
        # For now, we'll just log it
        logger.info(f"Cashier {self.user.email} is now available")

    @database_sync_to_async
    def mark_cashier_unavailable(self):
        """Mark cashier as unavailable."""
        logger.info(f"Cashier {self.user.email} is now unavailable")