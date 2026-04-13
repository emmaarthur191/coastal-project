import logging
import re
import time

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
        """Send an SMS via Sendexa with Cloudflare bypass and retry logic."""
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

        # 3. Configure Client
        url = getattr(settings, "SENDEXA_API_URL", "https://server.sendexa.co/v1/sms/send")
        api_token_b64 = getattr(settings, "SENDEXA_SERVER_KEY", "")
        sender_id = getattr(settings, "SENDEXA_SENDER_ID", "CACCU")

        if settings.DEBUG and not api_token_b64:
            logger.info("Sendexa [DEBUG MOCK]: SMS entry validated")
            outbox.status = "sent"
            outbox.sent_at = timezone.now()
            outbox.save()
            return True, "Mock success"

        if not api_token_b64:
            msg = "SMS failed: No SENDEXA_SERVER_KEY configured for Basic auth."
            outbox.status = "failed"
            outbox.error_message = msg
            outbox.save()
            return False, msg

        # 4. Authentication (Standard Basic Auth)
        # Standard format: Base64(server_key + ":")
        import base64
        
        # If the token is already base64, we use it directly. 
        # Otherwise, we encode it correctly for Basic Auth.
        is_token_b64 = False
        try:
            if api_token_b64 and len(api_token_b64) % 4 == 0:
                base64.b64decode(api_token_b64)
                is_token_b64 = True
        except Exception:
            pass

        auth_header = api_token_b64
        if not is_token_b64:
            # Encode raw key for Basic Auth (username is empty/null in most Sendexa configs)
            raw_auth = f"{api_token_b64}:"
            auth_header = base64.b64encode(raw_auth.encode()).decode()

        payload: dict[str, str] = {"recipient": normalized_phone, "senderId": sender_id, "message": message}

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/json",
            "User-Agent": "CoastalBanking-FinOps/1.0",
            "Accept": "application/json",
        }

        for attempt in range(max_retries):
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=25)
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
