import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator

from config.asgi import application
from core.models.accounts import Account
from core.services.transactions import TransactionService
from conftest import TEST_PASSWORD

User = get_user_model()


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_notification_websocket_flow():
    """Verify the end-to-end WebSocket notification flow for transactions."""
    # 1. Create a test user and their account
    user = await django_db_create_user(
        email="client.notify@coastal.com",
        username="client_notify",
        password=TEST_PASSWORD,
        role="customer",
        is_approved=True,
        is_active=True,
    )
    account = await django_db_create_account(user=user, account_number="999888777", balance=Decimal("500.00"))

    # 2. Generate access token
    token = str(AccessToken.for_user(user))

    # 3. Connect to the notifications WebSocket
    communicator = WebsocketCommunicator(
        application,
        f"ws/notifications/?token={token}",
        headers=[
            (b"origin", b"http://testserver"),
            (b"host", b"testserver"),
        ]
    )
    connected, subprotocol = await communicator.connect()
    assert connected is True

    # 4. Trigger a transaction notification broadcast
    await django_db_broadcast_notification(account, "deposit", Decimal("250.00"), 12345)

    # 5. Assert the WebSocket received the correct payload
    response = await communicator.receive_json_from()
    assert response["type"] == "transaction"
    assert response["transaction_type"] == "deposit"
    assert response["amount"] == 250.00
    assert response["reference"] == "12345"
    assert response["account_number"] == "999888777"
    assert response["new_balance"] == 500.00
    assert "processed successfully" in response["message"]

    # 6. Disconnect
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_notification_websocket_unauthenticated():
    # Verify that unauthenticated connections are rejected.
    communicator = WebsocketCommunicator(
        application,
        "ws/notifications/",
        headers=[
            (b"origin", b"http://testserver"),
            (b"host", b"testserver"),
        ]
    )
    connected, subprotocol = await communicator.connect()
    assert connected is False


# Helper functions to run database operations inside async tests
@database_sync_to_async
def django_db_create_user(**kwargs):
    return User.objects.create_user(**kwargs)


@database_sync_to_async
def django_db_create_account(**kwargs):
    return Account.objects.create(**kwargs)


@database_sync_to_async
def django_db_broadcast_notification(account, transaction_type, amount, tx_id):
    TransactionService._broadcast_transaction_notification(account, transaction_type, amount, tx_id)

