import requests
from django.conf import settings
import logging
import re

logger = logging.getLogger(__name__)

class SendexaService:
    """
    Service for sending SMS via Sendexa API.
    Uses Basic Auth with pre-encoded Base64 token.
    """
    
    @staticmethod
    def normalize_phone_number(phone_number: str) -> str:
        """
        Normalize phone number to E.164 format for Ghana.
        Converts formats like 0244123456 to +233244123456
        """
        if not phone_number:
            return phone_number
        
        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', phone_number)
        
        # If starts with +, assume it's already E.164
        if cleaned.startswith('+'):
            return cleaned
        
        # If starts with 00, replace with +
        if cleaned.startswith('00'):
            return '+' + cleaned[2:]
        
        # Ghana-specific: if starts with 0, replace with +233
        if cleaned.startswith('0') and len(cleaned) == 10:
            return '+233' + cleaned[1:]
        
        # If starts with 233, add +
        if cleaned.startswith('233'):
            return '+' + cleaned
        
        # Otherwise return as-is with + prefix
        return '+' + cleaned if not cleaned.startswith('+') else cleaned
    
    @staticmethod
    def send_sms(phone_number, message):
        """
        Send an SMS to a single recipient.
        """
        if not phone_number:
            logger.error("Sendexa: Phone number is required")
            return False, "Phone number is required"
        
        # Normalize phone number to E.164 format
        normalized_phone = SendexaService.normalize_phone_number(phone_number)
        logger.info(f"Sendexa: Normalized phone from '{phone_number}' to '{normalized_phone}'")
            
        # Configuration from settings
        url = getattr(settings, 'SENDEXA_API_URL', 'https://api.sendexa.co/v1/sms/send')
        auth_token = getattr(settings, 'SENDEXA_AUTH_TOKEN', '')
        sender_id = getattr(settings, 'SENDEXA_SENDER_ID', 'CACCU')
        
        if not auth_token:
            logger.error("Sendexa: SENDEXA_AUTH_TOKEN is not configured")
            return False, "SMS service not configured (missing auth token)"
        
        # Prepare headers with pre-encoded Base64 token
        headers = {
            'Authorization': f'Basic {auth_token}',
            'Content-Type': 'application/json'
        }
        
        # Prepare payload
        # Prepare payload
        # User requested to keep the +233 format
        # Sending as string with + prefix
        payload = {
            'to': normalized_phone, 
            'sender': sender_id,
            'message': message
        }
        
        try:
            # In development, just log
            if settings.DEBUG:
                logger.info(f"[SENDEXA MOCK] Would send to {normalized_phone}: {message}")
                return True, "Mock SMS sent successfully"
            
            logger.info(f"Sendexa Request: URL={url} Payload={payload} AuthHeader=Basic ...{auth_token[-4:] if auth_token else 'NONE'}")
            
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            
            # Log response for debugging
            logger.info(f"Sendexa Response: Status={response.status_code} Body={response.text}")
            logger.info(f"Sendexa Response Headers: {response.headers}")

            return SendexaService._handle_response(response)
            
        except requests.RequestException as e:
            logger.error(f"Sendexa connection error: {str(e)}")
            return False, f"Connection error: {str(e)}"
            
    @staticmethod
    def _handle_response(response):
        try:
            if response.status_code in [200, 201]:
                return True, response.json()
            else:
                logger.error(f"Sendexa Error {response.status_code}: {response.text}")
                return False, f"Provider error: {response.text}"
        except Exception as e:
            return False, f"Response parsing error: {str(e)}"

