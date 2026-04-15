"""Simple Chat Consumer for WhatsApp-style messaging.
Uses Django Channels with cookie-based JWT authentication.
"""

import json

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
                if not content:
                    return

                # Save message to database
                message = await self.save_message(content)

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
                # Broadcast reaction update
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "reaction_broadcast",
                        "event_type": message_type,
                        "message_id": data.get("message_id"),
                        "emoji": data.get("emoji"),
                        "user_id": self.user.id,
                    },
                )

            elif message_type in ["call_offer", "call_answer", "new_ice_candidate"]:
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

    @database_sync_to_async
    def check_room_membership(self):
        """Check if user is a member of the room."""
        from .models import ChatRoom

        return ChatRoom.objects.filter(id=self.room_id, members=self.user).exists()

    @database_sync_to_async
    def save_message(self, content):
        """Save message to database and return serialized data."""
        from .models import ChatMessage, ChatRoom

        room = ChatRoom.objects.get(id=self.room_id)
        message = ChatMessage.objects.create(room=room, sender=self.user, content=content)

        # Update room's updated_at for ordering
        room.save()

        return {
            "id": message.id,
            "content": message.content,
            "sender_id": self.user.id,
            "sender_name": f"{self.user.first_name} {self.user.last_name}".strip() or self.user.email,
            "created_at": message.created_at.isoformat(),
        }
