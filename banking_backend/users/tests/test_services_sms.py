import httpx
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
    @patch("httpx.Client.post")
    def test_send_sms_success(self, mock_post, settings):
        """Test successful SMS delivery with Basic Auth."""
        settings.SENDEXA_SERVER_KEY = "test_key"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_post.return_value = mock_response

        success, result = SendexaService.send_sms("0244123456", "Hello Test")

        assert success is True
        
        # Verify Basic Auth header (base64 of test_key + ":")
        
        # Extract arguments
        call_args = mock_post.call_args
        assert call_args[1]["headers"]["Authorization"] == "Bearer test_key"
        assert SmsOutbox.objects.filter(status="sent", phone_number_hash=hash_field("+233244123456")).exists()

    @patch("httpx.Client.post")
    def test_send_sms_failure(self, mock_post, settings):
        """Test handling of API failures."""
        settings.SENDEXA_SERVER_KEY = "wrong_key"
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_post.return_value = mock_response

        success, result = SendexaService.send_sms("0244123456", "Hello Test")

        assert success is False
        assert "HTTP 401" in result
        assert mock_post.call_count == 1

    @patch("httpx.Client.post")
    def test_send_sms_auth_token_priority(self, mock_post, settings):
        """Test SENDEXA_AUTH_TOKEN priority Bearer Token auth."""
        settings.SENDEXA_AUTH_TOKEN = "custom_token"
        settings.SENDEXA_SERVER_KEY = "ignored_key"
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_post.return_value = mock_response

        success, result = SendexaService.send_sms("0244123456", "Hello Priority Token")

        assert success is True
        call_args = mock_post.call_args
        assert call_args[1]["headers"]["Authorization"] == "Bearer custom_token"

    @patch("httpx.Client.post")
    def test_send_sms_basic_auth_fallback(self, mock_post, settings):
        """Test fallback Basic Auth generated from API Key + API Secret."""
        settings.SENDEXA_AUTH_TOKEN = ""
        settings.SENDEXA_SERVER_KEY = ""
        settings.SENDEXA_API_KEY = "my_api_key"
        settings.SENDEXA_API_SECRET = "my_api_secret"
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_post.return_value = mock_response

        success, result = SendexaService.send_sms("0244123456", "Hello Basic Auth")

        assert success is True
        call_args = mock_post.call_args
        # base64.b64encode(b"my_api_key:my_api_secret") -> b"bXlfYXBpX2tleTpteV9hcGlfc2VjcmV0"
        assert call_args[1]["headers"]["Authorization"] == "Basic bXlfYXBpX2tleTpteV9hcGlfc2VjcmV0"
