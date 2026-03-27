"""Tests for SendexaService SMS integration hardening.

Covers:
- Phone number normalization (Ghana formats)
- E.164 validation (rejects invalid numbers)
- SMS send: no auth, debug mock, success, API errors, connection errors
- Django system check for missing config
"""

from unittest.mock import MagicMock, patch

from django.test import override_settings

import pytest

from users.services import SendexaService

# =============================================================================
# Phone Number Normalization
# =============================================================================


class TestNormalizePhoneNumber:
    """Test Ghana-specific phone number normalization to E.164."""

    def test_normalize_valid_ghana_local(self):
        """0244123456 → +233244123456"""
        assert SendexaService.normalize_phone_number("0244123456") == "+233244123456"

    def test_normalize_already_e164(self):
        """+233244123456 stays unchanged."""
        assert SendexaService.normalize_phone_number("+233244123456") == "+233244123456"

    def test_normalize_without_plus(self):
        """233244123456 → +233244123456"""
        assert SendexaService.normalize_phone_number("233244123456") == "+233244123456"

    def test_normalize_international_double_zero(self):
        """00233244123456 → +233244123456"""
        assert SendexaService.normalize_phone_number("00233244123456") == "+233244123456"

    def test_normalize_with_spaces_and_dashes(self):
        """024-412 3456 → +233244123456"""
        assert SendexaService.normalize_phone_number("024-412 3456") == "+233244123456"

    def test_normalize_empty_returns_empty(self):
        assert SendexaService.normalize_phone_number("") == ""

    def test_normalize_none_returns_none(self):
        assert SendexaService.normalize_phone_number(None) is None


# =============================================================================
# E.164 Validation
# =============================================================================


class TestIsValidE164:
    """Test E.164 format validation."""

    def test_valid_ghana_number(self):
        assert SendexaService.is_valid_e164("+233244123456") is True

    def test_valid_uk_number(self):
        assert SendexaService.is_valid_e164("+447911123456") is True

    def test_missing_plus(self):
        assert SendexaService.is_valid_e164("233244123456") is False

    def test_too_short(self):
        assert SendexaService.is_valid_e164("+12345") is False

    def test_too_long(self):
        assert SendexaService.is_valid_e164("+1234567890123456") is False

    def test_contains_letters(self):
        assert SendexaService.is_valid_e164("+233ABC123456") is False

    def test_empty_string(self):
        assert SendexaService.is_valid_e164("") is False

    def test_none(self):
        assert SendexaService.is_valid_e164(None) is False


# =============================================================================
# SMS Sending
# =============================================================================


@pytest.mark.django_db
class TestSendSms:
    """Test SMS sending with outbox persistence and error handling."""

    @override_settings(
        SENDEXA_AUTH_TOKEN="",
        SENDEXA_API_KEY="",
        SENDEXA_API_SECRET="",
        DEBUG=False,
    )
    def test_send_sms_no_auth_fails_gracefully(self):
        """No auth configured, DEBUG=False → explicit failure."""
        success, msg = SendexaService.send_sms("+233244123456", "Hello")

        assert success is False
        assert "not configured" in msg

        from core.models.reliability import SmsOutbox

        entry = SmsOutbox.objects.latest("created_at")
        assert entry.status == "failed"
        assert "not configured" in entry.error_message

    @override_settings(
        SENDEXA_AUTH_TOKEN="",
        SENDEXA_API_KEY="",
        SENDEXA_API_SECRET="",
        DEBUG=True,
    )
    def test_send_sms_debug_mock(self):
        """DEBUG=True + no auth → mock success with warning log."""
        success, msg = SendexaService.send_sms("+233244123456", "Hello")

        assert success is True
        assert "Mock" in msg

        from core.models.reliability import SmsOutbox

        entry = SmsOutbox.objects.latest("created_at")
        assert entry.status == "sent"
        assert entry.sent_at is not None

    def test_send_sms_invalid_phone_rejected(self):
        """Short/invalid phone numbers are rejected before API call."""
        success, msg = SendexaService.send_sms("123", "Hello")

        assert success is False
        assert "Invalid phone number format" in msg

        from core.models.reliability import SmsOutbox

        entry = SmsOutbox.objects.latest("created_at")
        assert entry.status == "failed"

    def test_send_sms_empty_phone_rejected(self):
        """Empty phone number returns early with clear error."""
        success, msg = SendexaService.send_sms("", "Hello")

        assert success is False
        assert "required" in msg.lower()

    @override_settings(
        SENDEXA_AUTH_TOKEN="dGVzdDp0ZXN0",  # base64("test:test")
        SENDEXA_API_URL="https://api.sendexa.co/v1/sms/send",
        SENDEXA_SENDER_ID="CACCU",
    )
    @patch("users.services.requests.post")
    def test_send_sms_success_updates_outbox(self, mock_post):
        """200 response → outbox status 'sent'."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_post.return_value = mock_response

        success, result = SendexaService.send_sms("+233244123456", "Hello")

        assert success is True
        mock_post.assert_called_once()

        from core.models.reliability import SmsOutbox

        entry = SmsOutbox.objects.latest("created_at")
        assert entry.status == "sent"
        assert entry.sent_at is not None

    @override_settings(
        SENDEXA_AUTH_TOKEN="dGVzdDp0ZXN0",
        SENDEXA_API_URL="https://api.sendexa.co/v1/sms/send",
        SENDEXA_SENDER_ID="CACCU",
    )
    @patch("users.services.requests.post")
    def test_send_sms_api_error_updates_outbox(self, mock_post):
        """500 response → outbox status 'failed' with error message."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response

        success, result = SendexaService.send_sms("+233244123456", "Hello")

        assert success is False
        assert "Provider error" in result

        from core.models.reliability import SmsOutbox

        entry = SmsOutbox.objects.latest("created_at")
        assert entry.status == "failed"
        assert "Internal Server Error" in entry.error_message

    @override_settings(
        SENDEXA_AUTH_TOKEN="dGVzdDp0ZXN0",
        SENDEXA_API_URL="https://api.sendexa.co/v1/sms/send",
    )
    @patch("users.services.requests.post")
    def test_send_sms_connection_error(self, mock_post):
        """requests.RequestException → outbox status 'failed'."""
        import requests

        mock_post.side_effect = requests.ConnectionError("DNS failed")

        success, result = SendexaService.send_sms("+233244123456", "Hello")

        assert success is False
        assert "Connection error" in result

        from core.models.reliability import SmsOutbox

        entry = SmsOutbox.objects.latest("created_at")
        assert entry.status == "failed"

    @override_settings(
        SENDEXA_AUTH_TOKEN="",
        SENDEXA_API_KEY="mykey",
        SENDEXA_API_SECRET="mysecret",
        SENDEXA_API_URL="https://api.sendexa.co/v1/sms/send",
        SENDEXA_SENDER_ID="CACCU",
    )
    @patch("users.services.requests.post")
    def test_send_sms_auto_generates_token_from_keys(self, mock_post):
        """When AUTH_TOKEN is empty but API_KEY+SECRET exist, token is auto-generated."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_post.return_value = mock_response

        success, _result = SendexaService.send_sms("+233244123456", "Hello")

        assert success is True
        # Verify the Authorization header contains a Base64-encoded token
        call_kwargs = mock_post.call_args
        auth_header = call_kwargs.kwargs.get("headers", {}).get("Authorization", "")
        assert auth_header.startswith("Basic ")
        assert len(auth_header) > len("Basic ")


# =============================================================================
# Django System Check
# =============================================================================


class TestSendexaConfigCheck:
    """Test the Django system check for Sendexa configuration."""

    @override_settings(
        SENDEXA_AUTH_TOKEN="",
        SENDEXA_API_KEY="",
        SENDEXA_API_SECRET="",
    )
    def test_system_check_warns_missing_config(self):
        from users.apps import sendexa_config_check

        warnings = sendexa_config_check(app_configs=None)
        assert len(warnings) == 1
        assert warnings[0].id == "users.W001"
        assert "not configured" in warnings[0].msg

    @override_settings(SENDEXA_AUTH_TOKEN="some-valid-token")
    def test_system_check_passes_with_token(self):
        from users.apps import sendexa_config_check

        warnings = sendexa_config_check(app_configs=None)
        assert len(warnings) == 0

    @override_settings(
        SENDEXA_AUTH_TOKEN="",
        SENDEXA_API_KEY="mykey",
        SENDEXA_API_SECRET="mysecret",
    )
    def test_system_check_passes_with_key_and_secret(self):
        from users.apps import sendexa_config_check

        warnings = sendexa_config_check(app_configs=None)
        assert len(warnings) == 0
