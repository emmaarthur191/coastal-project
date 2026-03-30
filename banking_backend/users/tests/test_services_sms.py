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
    @patch("cloudscraper.create_scraper")
    def test_send_sms_success(self, mock_create):
        """Test successful SMS delivery."""
        mock_scraper = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_scraper.post.return_value = mock_response
        mock_create.return_value = mock_scraper

        with patch.object(settings, "SENDEXA_AUTH_TOKEN", "mock_token"):
            success, result = SendexaService.send_sms("0244123456", "Hello Test")

        assert success is True
        assert SmsOutbox.objects.filter(status="sent", phone_number_hash=hash_field("+233244123456")).exists()

    @patch("cloudscraper.create_scraper")
    def test_send_sms_cloudflare_retry(self, mock_create):
        """Test detection of Cloudflare challenges and retry behavior."""
        mock_scraper = MagicMock()
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.text = "Just a moment... challenge-platform"
        mock_scraper.post.return_value = mock_response
        mock_create.return_value = mock_scraper

        with patch("time.sleep"):
            with patch.object(settings, "SENDEXA_AUTH_TOKEN", "mock_token"):
                success, result = SendexaService.send_sms("0244123456", "Hello Test", max_retries=2)

        assert success is False
        assert "HTTP 403" in result
        assert mock_scraper.post.call_count == 2
