from unittest.mock import MagicMock, patch

from django.conf import settings

import pytest

from core.models.reliability import SmsOutbox
from core.utils.field_encryption import hash_field
from users.services import SendexaService


@pytest.mark.django_db
class TestSendexaServiceNormalization:
    def test_normalize_ghana_local(self):
        """Test normalization of 0-prefixed Ghana numbers."""
        assert SendexaService.normalize_phone_number("0244123456") == "+233244123456"

    def test_normalize_ghana_intl(self):
        """Test normalization of 233-prefixed Ghana numbers."""
        assert SendexaService.normalize_phone_number("233244123456") == "+233244123456"

    def test_normalize_already_e164(self):
        """Test normalization of already E.164 numbers."""
        assert SendexaService.normalize_phone_number("+233244123456") == "+233244123456"

    def test_normalize_intl_prefix(self):
        """Test normalization of 00-prefixed numbers."""
        assert SendexaService.normalize_phone_number("00233244123456") == "+233244123456"


@pytest.mark.django_db
class TestSendexaServiceDelivery:
    @patch("requests.post")
    def test_send_sms_success(self, mock_post):
        """Test successful SMS delivery with Basic Auth."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_post.return_value = mock_response

        with patch.object(settings, "SENDEXA_API_KEY", "test_key"):
            success, result = SendexaService.send_sms("0244123456", "Hello Test")

        assert success is True
        # Verify Basic Auth header (base64 of test_key)
        import base64
        expected_auth = "Basic " + base64.b64encode(b"test_key").decode()
        
        args, kwargs = mock_post.call_args
        assert args[0] == "https://server.sendexa.co/v1/sms/send"
        assert kwargs["headers"]["Authorization"] == expected_auth
        assert SmsOutbox.objects.filter(status="sent", phone_number_hash=hash_field("+233244123456")).exists()

    @patch("requests.post")
    def test_send_sms_failure(self, mock_post):
        """Test handling of API failures."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_post.return_value = mock_response

        with patch.object(settings, "SENDEXA_API_KEY", "wrong_key"):
            success, result = SendexaService.send_sms("0244123456", "Hello Test")

        assert success is False
        assert "HTTP 401" in result
        assert mock_post.call_count == 1
