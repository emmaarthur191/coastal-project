import pytest
from core.utils.field_encryption import encrypt_field, decrypt_field, hash_field, is_encrypted
from users.services import SendexaService
from core.models.reliability import SmsOutbox, GlobalSequence
from unittest.mock import patch

@pytest.mark.django_db
class TestUtilityExpansion:
    def test_encryption_roundtrip(self):
        val = 'SecretID-123456'
        encrypted = encrypt_field(val)
        assert encrypted != val
        assert is_encrypted(encrypted)
        assert decrypt_field(encrypted) == val

    def test_hash_stability(self):
        val = ' SEARCH-ME '
        h1 = hash_field(val)
        h2 = hash_field(val)
        assert h1 == h2
        assert len(h1) == 64

    def test_phone_normalization(self):
        assert SendexaService.normalize_phone_number("0244123456") == "+233244123456"

    @patch('httpx.Client.post')
    def test_send_sms_outbox_logging(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.text = "Success"
        phone = "0244123456"
        msg = "Test Coastal Message"
        success, info = SendexaService.send_sms(phone, msg)
        assert success is True
        p_hash = hash_field("+233244123456")
        outbox = SmsOutbox.objects.get(phone_number_hash=p_hash)
        assert outbox.status == "sent"
        assert outbox.message == msg

    def test_global_sequence_atomicity(self):
        v1 = GlobalSequence.get_next_value('staff_id', initial_value=100)
        v2 = GlobalSequence.get_next_value('staff_id')
        assert v1 == 100
        assert v2 == 101
