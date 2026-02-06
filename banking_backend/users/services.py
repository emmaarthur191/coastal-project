import logging
import re

from django.conf import settings
from django.utils import timezone

import base64
import requests

logger = logging.getLogger(__name__)


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
    def send_sms(phone_number, message):
        """Send an SMS to a single recipient with outbox persistence."""
        if not phone_number:
            logger.error("Sendexa: Phone number is required")
            return False, "Phone number is required"

        # Normalize phone number to E.164 format
        normalized_phone = SendexaService.normalize_phone_number(phone_number)

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
            logger.info("Sendexa: Generated auth token from API Credentials")


        if settings.DEBUG and not auth_token:
            logger.info(f"[SENDEXA MOCK] Would send to {normalized_phone}: {message}")
            outbox_entry.status = "sent"
            outbox_entry.sent_at = timezone.now()
            outbox_entry.save()
            return True, "Mock SMS sent successfully"

        if not auth_token:
            error_msg = "SMS service not configured (missing auth token)"
            logger.error(f"Sendexa: {error_msg}")
            outbox_entry.status = "failed"
            outbox_entry.error_message = error_msg
            outbox_entry.save()
            return False, error_msg

        # Prepare headers and payload
        headers = {"Authorization": f"Basic {auth_token}", "Content-Type": "application/json"}
        payload = {"to": normalized_phone, "sender": sender_id, "message": message}

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            success, result = SendexaService._handle_response(response)

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
            logger.error(f"Sendexa connection error: {e!s}")
            outbox_entry.status = "failed"
            outbox_entry.error_message = error_msg
            outbox_entry.save()
            return False, error_msg

    @staticmethod
    def _handle_response(response):
        try:
            if response.status_code in [200, 201]:
                return True, response.json()
            else:
                logger.error(f"Sendexa Error {response.status_code}: {response.text}")
                return False, f"Provider error: {response.text}"
        except Exception as e:
            return False, f"Response parsing error: {e!s}"
