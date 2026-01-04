from django.contrib.auth import get_user_model
from django.test import TestCase

from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from .consumers import BankingMessageConsumer, FraudAlertConsumer, NotificationConsumer
from .services import BankingMessageService, FraudAlertService

User = get_user_model()


class WebSocketTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123", role="customer"
        )
        self.token = str(AccessToken.for_user(self.user))


class BankingMessageConsumerTest(WebSocketTestCase):
    async def test_connect(self):
        """Test WebSocket connection for banking messages"""
        communicator = WebsocketCommunicator(
            BankingMessageConsumer.as_asgi(), f"/ws/messages/{self.user.id}/?token={self.token}"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_receive_mark_read(self):
        """Test marking a message as read via WebSocket"""
        # Create a message
        message = BankingMessageService.create_message(self.user, "Test Subject", "Test Body")

        communicator = WebsocketCommunicator(
            BankingMessageConsumer.as_asgi(), f"/ws/messages/{self.user.id}/?token={self.token}"
        )
        await communicator.connect()

        # Send mark_read command
        await communicator.send_json_to({"type": "mark_read", "message_id": message.id})

        # Receive response
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message_update")
        self.assertTrue(response["message"]["is_read"])

        await communicator.disconnect()

    async def test_message_broadcast(self):
        """Test that new messages are broadcasted"""
        communicator = WebsocketCommunicator(
            BankingMessageConsumer.as_asgi(), f"/ws/messages/{self.user.id}/?token={self.token}"
        )
        await communicator.connect()

        # Create a new message (this should trigger broadcast)
        _message = BankingMessageService.create_message(self.user, "Broadcast Test", "This should be broadcasted")

        # Receive the broadcast
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message_update")
        self.assertEqual(response["message"]["subject"], "Broadcast Test")

        await communicator.disconnect()


class FraudAlertConsumerTest(WebSocketTestCase):
    async def test_connect(self):
        """Test WebSocket connection for fraud alerts"""
        communicator = WebsocketCommunicator(
            FraudAlertConsumer.as_asgi(), f"/ws/fraud-alerts/{self.user.id}/?token={self.token}"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_alert_broadcast(self):
        """Test that new fraud alerts are broadcasted"""
        communicator = WebsocketCommunicator(
            FraudAlertConsumer.as_asgi(), f"/ws/fraud-alerts/{self.user.id}/?token={self.token}"
        )
        await communicator.connect()

        # Create a new alert (this should trigger broadcast)
        _alert = FraudAlertService.create_alert(self.user, "Suspicious activity detected", "high")

        # Receive the broadcast
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "fraud_alert_update")
        self.assertEqual(response["alert"]["message"], "Suspicious activity detected")

        await communicator.disconnect()


class NotificationConsumerTest(WebSocketTestCase):
    async def test_connect(self):
        """Test WebSocket connection for notifications"""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(), f"/ws/notifications/{self.user.id}/?token={self.token}"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()


class JWTAuthMiddlewareTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123", role="customer"
        )

    async def test_invalid_token(self):
        """Test connection with invalid token"""
        communicator = WebsocketCommunicator(
            BankingMessageConsumer.as_asgi(), f"/ws/messages/{self.user.id}/?token=invalid_token"
        )
        connected, subprotocol = await communicator.connect()
        # Should not connect with invalid token
        self.assertFalse(connected)

    async def test_no_token(self):
        """Test connection without token"""
        communicator = WebsocketCommunicator(BankingMessageConsumer.as_asgi(), f"/ws/messages/{self.user.id}/")
        connected, subprotocol = await communicator.connect()
        # Should not connect without token
        self.assertFalse(connected)
