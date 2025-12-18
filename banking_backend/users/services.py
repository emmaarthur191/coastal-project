import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SendexaService:
    """
    Service for sending SMS via Sendexa API.
    """
    
    @staticmethod
    def send_sms(phone_number, message):
        """
        Send an SMS to a single recipient.
        """
        if not phone_number:
            logger.error("Sendexa: Phone number is required")
            return False, "Phone number is required"
            
        # User provided configuration for Sendexa.co
        url = getattr(settings, 'SENDEXA_API_URL', 'https://api.sendexa.co/v1/sms/send')
        api_key = getattr(settings, 'SENDEXA_API_KEY', '')
        api_secret = getattr(settings, 'SENDEXA_API_SECRET', '')
        sender_id = getattr(settings, 'SENDEXA_SENDER_ID', 'CACCU')
        
        # Prepare headers - Sendexa requires Basic Auth, NOT Bearer
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Prepare payload
        payload = {
            'to': [phone_number],
            'sender': sender_id,
            'message': message
        }
        
        try:
            # In development, just log unless force_send is on
            if settings.DEBUG:
                logger.info(f"[SENDEXA MOCK] Would send to {phone_number}: {message}")
                return True, "Mock SMS sent successfully"
            
            # Use Basic Auth: auth=(username, password) -> (api_key, api_secret)
            response = requests.post(url, json=payload, headers=headers, auth=(api_key, api_secret), timeout=15)
            # Log raw response for debugging if 502 persists (removed after verify)
            if response.status_code not in [200, 201]:
                 logger.error(f"Sendexa Failed: {response.text}")

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
