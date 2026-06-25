import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import ChatRoom, ChatMessage
from core.views.chat_views import ChatRoomSerializer

User = get_user_model()

@pytest.mark.django_db
class TestChatAPI:
    """Tests for the Simple Chat API views and security logic."""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def customer(self):
        return User.objects.create_user(
            email="customer@gmail.com", username="customer", password="Password123!", 
            first_name="Customer", last_name="User",
            role="customer", is_approved=True
        )

    @pytest.fixture
    def staff(self):
        return User.objects.create_user(
            email="staff@coastal.com", username="staff", password="Password123!", 
            first_name="Staff", last_name="Member",
            role="cashier", is_approved=True
        )

    @pytest.fixture
    def manager(self):
        return User.objects.create_user(
            email="manager@coastal.com", username="manager", password="Password123!", 
            first_name="Manager", last_name="Boss",
            role="manager", is_approved=True
        )

    def test_chatroom_list_authenticated(self, api_client, customer, staff):
        """Verify user can only see rooms they are members of."""
        room1 = ChatRoom.objects.create()
        room1.members.add(customer, staff)
        
        room2 = ChatRoom.objects.create() # Private room for others
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-room-list")
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["id"] == room1.id

    def test_chatroom_create_direct_success(self, api_client, customer, staff):
        """Verify customer can start a chat with staff."""
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-room-create")
        data = {"member_ids": [staff.id], "is_group": False}
        
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["is_group"] is False
        
        # Verify idempotency (returns existing room)
        response2 = api_client.post(url, data)
        assert response2.status_code == status.HTTP_200_OK
        assert response2.data["id"] == response.data["id"]

    def test_chatroom_create_customer_to_customer_blocked(self, api_client, customer):
        """Verify security rule: customers cannot initiate chat with other customers."""
        victim = User.objects.create_user(
            email="victim@gmail.com", username="victim", password="Password123!", role="customer"
        )
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-room-create")
        data = {"member_ids": [victim.id], "is_group": False}
        
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "only initiate chats with staff" in response.data["error"]

    def test_chatroom_create_group(self, api_client, staff, manager):
        """Verify staff can create a group chat."""
        api_client.force_authenticate(user=staff)
        url = reverse("core:chat-room-create")
        data = {
            "member_ids": [manager.id],
            "name": "Audit Team",
            "is_group": True
        }
        
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Audit Team"
        assert response.data["is_group"] is True

    def test_chat_message_flow(self, api_client, customer, staff):
        """Test sending and receiving messages in a room."""
        room = ChatRoom.objects.create()
        room.members.add(customer, staff)
        
        # Send message
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-send", kwargs={"room_id": room.id})
        response = api_client.post(url, {"content": "Hello Staff!"})
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["content"] == "Hello Staff!"
        
        # Get history
        history_url = reverse("core:chat-messages", kwargs={"room_id": room.id})
        history_resp = api_client.get(history_url)
        assert history_resp.status_code == status.HTTP_200_OK
        assert len(history_resp.data["results"]) == 1
        
        # Unread count for staff
        api_client.force_authenticate(user=staff)
        room_url = reverse("core:chat-room-detail", kwargs={"pk": room.id})
        room_resp = api_client.get(room_url)
        assert room_resp.data["unread_count"] == 1
        
        # Mark as read
        read_url = reverse("core:chat-mark-read", kwargs={"room_id": room.id})
        api_client.post(read_url)
        
        room_resp2 = api_client.get(room_url)
        assert room_resp2.data["unread_count"] == 0

    def test_chat_unauthorized_access(self, api_client, customer):
        """Verify users cannot see messages in rooms they don't belong to."""
        room = ChatRoom.objects.create() # Empty room, customer not in it
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-messages", kwargs={"room_id": room.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_chat_message_empty_content(self, api_client, customer, staff):
        """Verify empty messages are rejected."""
        room = ChatRoom.objects.create()
        room.members.add(customer, staff)
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-send", kwargs={"room_id": room.id})
        response = api_client.post(url, {"content": "  "})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_chatroom_create_nonexistent_user(self, api_client, staff):
        """Verify error when member_ids contains nonexistent ID."""
        api_client.force_authenticate(user=staff)
        url = reverse("core:chat-room-create")
        data = {"member_ids": [99999], "is_group": False}
        
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "users not found" in response.data["error"]

    def test_chatroom_serializers_methods(self, api_client, customer, staff):
        """Verify serializer methods like display_name and last_message."""
        room = ChatRoom.objects.create(name="Support Group", is_group=True)
        room.members.add(customer, staff)
        
        ChatMessage.objects.create(room=room, sender=customer, content="First message precisely long long long.")
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-room-detail", kwargs={"pk": room.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["display_name"] == "Support Group"
        assert response.data["unread_count"] == 0 # Sent by current user
        assert response.data["last_message"]["content"].startswith("First message")
        
        # Check direct room display name
        room_dir = ChatRoom.objects.create(is_group=False)
        room_dir.members.add(customer, staff)
        url_dir = reverse("core:chat-room-detail", kwargs={"pk": room_dir.id})
        response_dir = api_client.get(url_dir)
        # Should be the name of the other user
        assert response_dir.data["display_name"] == f"{staff.first_name} {staff.last_name}".strip()

    def test_chatroom_serializer_no_context(self, customer, staff):
        """Test serializer methods when request context is missing (for coverage)."""
        room = ChatRoom.objects.create(is_group=False)
        room.members.add(customer, staff)
        
        serializer = ChatRoomSerializer(instance=room)
        # Should call obj.get_display_name() without for_user
        assert serializer.data["display_name"] == "Direct Chat"
        # Check actual model return for empty context
        assert serializer.data["unread_count"] == 0

    def test_add_reaction_success(self, api_client, customer, staff):
        """Verify adding an emoji reaction to a message."""
        room = ChatRoom.objects.create()
        room.members.add(customer, staff)
        message = ChatMessage.objects.create(room=room, sender=staff, content="Hello!")
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-add-reaction", kwargs={"room_id": room.id, "message_id": message.id})
        
        # Test add emoji
        response = api_client.post(url, {"emoji": "🚀"})
        assert response.status_code == status.HTTP_200_OK
        assert "🚀" in response.data["reactions"]
        assert customer.id in response.data["reactions"]["🚀"]
        
        # Verify persistence
        message.refresh_from_db()
        assert message.reactions["🚀"] == [customer.id]

    def test_remove_reaction_success(self, api_client, customer, staff):
        """Verify removing an emoji reaction from a message."""
        room = ChatRoom.objects.create()
        room.members.add(customer, staff)
        message = ChatMessage.objects.create(room=room, sender=staff, content="Hello!", reactions={"👍": [customer.id]})
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-remove-reaction", kwargs={"room_id": room.id, "message_id": message.id})
        
        response = api_client.post(url, {"emoji": "👍"})
        assert response.status_code == status.HTTP_200_OK
        assert "👍" not in response.data["reactions"]
        
        # Verify persistence
        message.refresh_from_db()
        assert "👍" not in message.reactions

    def test_chat_message_serialization_new_fields(self, api_client, customer, staff):
        """Verify new fields (attachment_url, reactions, created_at) are present in serialized output."""
        room = ChatRoom.objects.create()
        room.members.add(customer, staff)
        message = ChatMessage.objects.create(
            room=room, 
            sender=staff, 
            content="Check this tool!",
            attachment_url="https://example.com/tool.pdf",
            attachment_name="tool.pdf",
            reactions={"🔧": [customer.id]}
        )
        
        api_client.force_authenticate(user=customer)
        url = reverse("core:chat-messages", kwargs={"room_id": room.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        msg_data = response.data["results"][0]
        
        assert "attachment_url" in msg_data
        assert msg_data["attachment_url"] == "https://example.com/tool.pdf"
        assert "attachment_name" in msg_data
        assert "reactions" in msg_data
        assert "🔧" in msg_data["reactions"]
        assert "created_at" in msg_data  # Verified standardized field name
        assert "edited_at" in msg_data
