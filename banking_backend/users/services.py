import base64
import logging
import re

from django.conf import settings
from django.utils import timezone

import requests

logger = logging.getLogger(__name__)

# E.164 international phone number pattern: + followed by 8-15 digits
_E164_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")


class SendexaService:
    """Service for sending SMS via Sendexa API.
    Uses Basic Auth with pre-encoded Base64 token.
    """

    @staticmethod
    def normalize_phone_number(phone_number: str) -> str:
        """Normalize phone number to E.164 format for Ghana.
        Converts formats like 0244123456 to +233244123456
        """
        if not phone_number:
            return phone_number

        # Remove all non-digit characters except +
        cleaned = re.sub(r"[^\d+]", "", phone_number)

        # If starts with +, assume it's already E.164
        if cleaned.startswith("+"):
            return cleaned

        # If starts with 00, replace with +
        if cleaned.startswith("00"):
            return "+" + cleaned[2:]

        # Ghana-specific: if starts with 0, replace with +233
        if cleaned.startswith("0") and len(cleaned) == 10:
            return "+233" + cleaned[1:]

        # If starts with 233, add +
        if cleaned.startswith("233"):
            return "+" + cleaned

        # Otherwise return as-is with + prefix
        return "+" + cleaned if not cleaned.startswith("+") else cleaned

    @staticmethod
    def is_valid_e164(phone_number: str) -> bool:
        """Validate that a phone number matches E.164 format.
        E.164: + followed by 8-15 digits, first digit non-zero.
        """
        if not phone_number:
            return False
        return bool(_E164_PATTERN.match(phone_number))

    @staticmethod
    def send_sms(phone_number, message):
        """Send an SMS to a single recipient with outbox persistence."""
        if not phone_number:
            logger.error("Sendexa: Phone number is required")
            return False, "Phone number is required"

        # Normalize phone number to E.164 format
        normalized_phone = SendexaService.normalize_phone_number(phone_number)

        # Validate E.164 format after normalization
        if not SendexaService.is_valid_e164(normalized_phone):
            # Avoid including raw phone numbers in logs or error messages to protect PII
            error_msg = (
                "Invalid phone number format after normalization. "
                "Expected E.164 format (e.g. +233244123456)."
            )
            logger.error("Sendexa: %s", error_msg)
            # Still create outbox entry for auditing
            from core.models.reliability import SmsOutbox

            outbox_entry = SmsOutbox(message=message, status="failed")
            outbox_entry.phone_number = normalized_phone
            outbox_entry.error_message = error_msg
            outbox_entry.save()
            return False, error_msg

        # 1. Create Outbox Entry
        from core.models.reliability import SmsOutbox

        outbox_entry = SmsOutbox(message=message, status="pending")
        outbox_entry.phone_number = normalized_phone
        outbox_entry.save()

        # Configuration from settings
        url = getattr(settings, "SENDEXA_API_URL", "https://api.sendexa.co/v1/sms/send")
        auth_token = getattr(settings, "SENDEXA_AUTH_TOKEN", "")
        sender_id = getattr(settings, "SENDEXA_SENDER_ID", "CACCU")
        api_key = getattr(settings, "SENDEXA_API_KEY", "")
        api_secret = getattr(settings, "SENDEXA_API_SECRET", "")

        # Fallback: Generate Basic Auth token if missing but keys exist
        if not auth_token and api_key and api_secret:
            credentials = f"{api_key}:{api_secret}"
            auth_token = base64.b64encode(credentials.encode()).decode()
            logger.info("Sendexa: Generated auth token from API credentials " f"(outbox_id={outbox_entry.pk})")

        if settings.DEBUG and not auth_token:
            logger.warning(
                f"⚠ [DEBUG MOCK] SMS not actually sent — no auth token configured. "
                f"Recipient: {normalized_phone}, outbox_id={outbox_entry.pk}. "
                f"Set SENDEXA_AUTH_TOKEN or SENDEXA_API_KEY+SENDEXA_API_SECRET "
                f"to send real SMS."
            )
            outbox_entry.status = "sent"
            outbox_entry.sent_at = timezone.now()
            outbox_entry.save()
            return True, "Mock SMS sent successfully"

        if not auth_token:
            error_msg = (
                "SMS service not configured: missing SENDEXA_AUTH_TOKEN and "
                "SENDEXA_API_KEY/SENDEXA_API_SECRET. "
                "Set these in your environment variables."
            )
            logger.error(f"Sendexa: {error_msg} (outbox_id={outbox_entry.pk})")
            outbox_entry.status = "failed"
            outbox_entry.error_message = error_msg
            outbox_entry.save()
            return False, error_msg

        # Prepare headers and payload
        headers = {"Authorization": f"Basic {auth_token}", "Content-Type": "application/json"}
        payload = {"to": normalized_phone, "sender": sender_id, "message": message}

        try:
            logger.info(
                f"Sendexa: Sending SMS to {normalized_phone} " f"(outbox_id={outbox_entry.pk}, sender={sender_id})"
            )
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            success, result = SendexaService._handle_response(response, outbox_entry.pk)

            if success:
                outbox_entry.status = "sent"
                outbox_entry.sent_at = timezone.now()
            else:
                outbox_entry.status = "failed"
                outbox_entry.error_message = str(result)

            outbox_entry.save()
            return success, result

        except requests.RequestException as e:
            error_msg = f"Connection error: {e!s}"
            logger.error(
                f"Sendexa: Connection error sending to {normalized_phone} " f"(outbox_id={outbox_entry.pk}): {e!s}"
            )
            outbox_entry.status = "failed"
            outbox_entry.error_message = error_msg
            outbox_entry.save()
            return False, error_msg

    @staticmethod
    def _handle_response(response, outbox_id=None):
        """Parse Sendexa API response and log outcomes."""
        try:
            if response.status_code in [200, 201]:
                logger.info(
                    f"Sendexa: SMS delivered successfully " f"(outbox_id={outbox_id}, status={response.status_code})"
                )
                return True, response.json()
            else:
                logger.error(
                    f"Sendexa: API error (outbox_id={outbox_id}, " f"status={response.status_code}): {response.text}"
                )
                return False, f"Provider error: {response.text}"
        except Exception as e:
            logger.error(f"Sendexa: Response parsing error (outbox_id={outbox_id}): {e!s}")
            return False, f"Response parsing error: {e!s}"
