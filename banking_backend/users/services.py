import logging
import re
import time

from django.conf import settings
from django.utils import timezone

import httpx

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

        Converts formats like 0244123456 to +233244123456.
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
    def send_sms(phone_number: str, message: str, max_retries: int = 3) -> tuple[bool, str]:
        """Send an SMS via Sendexa with retry logic."""
        if not phone_number:
            logger.error("Sendexa: Phone number is required")
            return False, "Phone number is required"

        # 1. Normalize and Verify
        normalized_phone = SendexaService.normalize_phone_number(phone_number)
        if not SendexaService.is_valid_e164(normalized_phone):
            logger.error(f"Sendexa: Invalid phone format provided for SMS delivery.")
            return False, "Invalid phone format"

        # 2. Persistence with Encryption (PII Protection)
        from core.models.reliability import SmsOutbox

        outbox = SmsOutbox.objects.create(status="pending", retry_count=0)
        outbox.phone_number = normalized_phone
        outbox.message = message
        outbox.save()

        # 3. Configure Client & Resolve Authentication
        url = getattr(settings, "SENDEXA_API_URL", "https://api.sendexa.co/v1/messages")
        sender_id = getattr(settings, "SENDEXA_SENDER_ID", "CACCU")

        auth_token = getattr(settings, "SENDEXA_AUTH_TOKEN", "")
        server_key = getattr(settings, "SENDEXA_SERVER_KEY", "")
        api_key = getattr(settings, "SENDEXA_API_KEY", "")
        api_secret = getattr(settings, "SENDEXA_API_SECRET", "")

        auth_header_value = None

        # Resolve auth mechanism
        if auth_token:
            auth_header_value = f"Bearer {auth_token}"
        elif server_key:
            auth_header_value = f"Bearer {server_key}"
        elif api_key and api_secret:
            import base64
            credentials = f"{api_key}:{api_secret}"
            b64_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
            auth_header_value = f"Basic {b64_credentials}"

        # 4. Debug Mocking & Validation
        if settings.DEBUG and not auth_header_value:
            logger.info("Sendexa [DEBUG MOCK]: SMS entry validated")
            outbox.status = "sent"
            outbox.sent_at = timezone.now()
            outbox.save()
            return True, "Mock success"

        if not auth_header_value:
            msg = "SMS failed: No valid Sendexa credentials configured (SENDEXA_AUTH_TOKEN, SENDEXA_SERVER_KEY, or SENDEXA_API_KEY + SENDEXA_API_SECRET missing)."
            outbox.status = "failed"
            outbox.error_message = msg
            outbox.save()
            return False, msg

        payload: dict[str, str] = {
            "to": normalized_phone, 
            "sender_id": sender_id, 
            "message": message,
            "channel": "sms"
        }

        headers = {
            "Authorization": auth_header_value,
            "Content-Type": "application/json",
            "User-Agent": "CoastalBanking-FinOps/1.0",
            "Accept": "application/json",
        }

        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=25) as client:
                    response = client.post(url, json=payload, headers=headers)
                
                outbox.retry_count = attempt

                if response.status_code in [200, 201]:
                    outbox.status = "sent"
                    outbox.sent_at = timezone.now()
                    outbox.save()
                    return True, "Sent successfully"

                outbox.status = "failed"
                outbox.error_message = f"HTTP {response.status_code}: {response.text[:1000]}"
                outbox.save()
                return False, outbox.error_message or "Unknown error"

            except Exception as e:
                logger.exception(f"Sendexa: Attempt {attempt+1} failed.")
                if attempt == max_retries - 1:
                    outbox.status = "failed"
                    outbox.error_message = str(e)[:1000]
                    outbox.save()
                    return False, str(e)
                time.sleep(2**attempt)

        return False, "Max retries exceeded"
