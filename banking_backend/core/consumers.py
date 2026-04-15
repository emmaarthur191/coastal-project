"""Simple Chat Consumer for WhatsApp-style messaging.
Uses Django Channels with cookie-based JWT authentication.
"""

import json
from django.utils import timezone
from django.contrib.auth import get_user_model

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat.
    Connects to a specific room and broadcasts messages.
    """

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"
        self.user = self.scope.get("user")

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
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming messages from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get("type", "message")

            if message_type == "message":
                content = data.get("content", "").strip()
                parent_id = data.get("parent_id")
                if not content:
                    return

                # Save message to database
                message = await self.save_message(content, parent_id=parent_id)

                # Broadcast to room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "id": message["id"],
                        "content": message["content"],
                        "sender_id": message["sender_id"],
                        "sender_name": message["sender_name"],
                        "created_at": message["created_at"],
                        "parent_id": parent_id,
                    },
                )

            elif message_type in ["typing_start", "typing_stop"]:
                # Broadcast typing indicator
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "typing_indicator",
                        "event_type": message_type,
                        "user_id": self.user.id,
                        "user_name": self.user.get_full_name() or self.user.email,
                    },
                )

            elif message_type in ["reaction_added", "reaction_removed"]:
                # Persist reaction to database
                message_id = data.get("message_id")
                emoji = data.get("emoji")
                action = "add" if message_type == "reaction_added" else "remove"
                await self.update_reaction(message_id, emoji, action)

                # Broadcast reaction update
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "reaction_broadcast",
                        "event_type": message_type,
                        "message_id": message_id,
                        "emoji": emoji,
                        "user_id": self.user.id,
                    },
                )

            elif message_type in ["call_offer", "call_answer", "new_ice_candidate", "call_reject", "call_end"]:
                # Signaling for WebRTC
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "signaling_broadcast",
                        "event_type": message_type,
                        "payload": data.get("payload"),
                        "sender_id": self.user.id,
                    },
                )

            elif message_type == "presence_update":
                # User's online status
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "presence_broadcast",
                        "user_id": self.user.id,
                        "status": data.get("status", "online"),
                    },
                )

            elif message_type == "message_read":
                # Handle read receipt from client
                message_id = data.get("message_id")
                if message_id:
                    await self.handle_read_receipt(message_id)

            elif message_type == "ping":
                # Heartbeat from client
                await self.send(text_data=json.dumps({"type": "pong"}))

        except json.JSONDecodeError:
            pass

    async def chat_message(self, event):
        """Send message to WebSocket."""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "id": event["id"],
                    "content": event["content"],
                    "sender_id": event["sender_id"],
                    "sender_name": event["sender_name"],
                    "created_at": event["created_at"],
                    "parent_id": event.get("parent_id"),
                }
            )
        )

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket."""
        # Don't send to the user who is typing
        if event["user_id"] != self.user.id:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": event["event_type"],
                        "user_id": event["user_id"],
                        "user_name": event["user_name"],
                    }
                )
            )

    async def reaction_broadcast(self, event):
        """Send reaction update to WebSocket."""
        await self.send(
            text_data=json.dumps(
                {
                    "type": event["event_type"],
                    "message_id": event["message_id"],
                    "emoji": event["emoji"],
                    "user_id": event["user_id"],
                }
            )
        )

    async def signaling_broadcast(self, event):
        """Relay WebRTC signals to all other participants."""
        if event["sender_id"] != self.user.id:
            await self.send(
                text_data=json.dumps(
                    {"type": event["event_type"], "payload": event["payload"], "sender_id": event["sender_id"]}
                )
            )

    async def presence_broadcast(self, event):
        """Send presence status update."""
        if event["user_id"] != self.user.id:
            await self.send(
                text_data=json.dumps({"type": "presence_update", "user_id": event["user_id"], "status": event["status"]})
            )

    async def read_receipt(self, event):
        """Send read receipt update to WebSocket."""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "read_receipt",
                    "message_id": event["message_id"],
                    "read_by": event["read_by"],
                    "read_at": event["read_at"],
                }
            )
        )

    async def handle_read_receipt(self, message_id):
        """Handle read receipt: Persist to DB and broadcast."""
        updated = await self.mark_message_as_read(message_id)

        if updated:
            # Broadcast to everyone in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "read_receipt",
                    "message_id": message_id,
                    "read_by": self.user.id,
                    "read_at": timezone.now().isoformat(),
                },
            )

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        """Update message read status in database."""
        from .models import ChatMessage

        try:
            message = ChatMessage.objects.get(id=message_id, room_id=self.room_id)
            # Only mark if not already read by this user and not sent by this user
            if message.sender_id != self.user.id:
                if not message.read_by.filter(id=self.user.id).exists():
                    message.is_read = True
                    message.read_at = timezone.now()
                    message.read_by.add(self.user)
                    message.save()
                    return True
            return False
        except ChatMessage.DoesNotExist:
            return False

    @database_sync_to_async
    def check_room_membership(self):
        """Check if user is a member of the room."""
        from .models import ChatRoom

        return ChatRoom.objects.filter(id=self.room_id, members=self.user).exists()

    @database_sync_to_async
    def update_reaction(self, message_id, emoji, action="add"):
        """Persist reaction state to ChatMessage JSONField."""
        from .models import ChatMessage

        try:
            message = ChatMessage.objects.get(id=message_id, room_id=self.room_id)
            reactions = message.reactions or {}
            user_id_str = str(self.user.id)

            if action == "add":
                if emoji not in reactions:
                    reactions[emoji] = []
                if user_id_str not in reactions[emoji]:
                    reactions[emoji].append(user_id_str)
            elif action == "remove":
                if emoji in reactions and user_id_str in reactions[emoji]:
                    reactions[emoji].remove(user_id_str)
                    if not reactions[emoji]:
                        del reactions[emoji]

            message.reactions = reactions
            message.save()
            return True
        except ChatMessage.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content, parent_id=None):
        """Save message to database and return serialized data."""
        from .models import ChatMessage, ChatRoom

        room = ChatRoom.objects.get(id=self.room_id)
        message = ChatMessage.objects.create(room=room, sender=self.user, content=content, parent_id=parent_id)

        # Update room's updated_at for ordering
        room.save()

        return {
            "id": message.id,
            "content": message.content,
            "sender_id": self.user.id,
            "sender_name": f"{self.user.first_name} {self.user.last_name}".strip() or self.user.email,
            "created_at": message.created_at.isoformat(),
            "parent_id": parent_id,
        }
