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
            
        url = settings.SENDEXA_API_URL
        
        # Prepare headers with Base64 token (Basic Auth standard)
        headers = {
            'Authorization': f'Basic {settings.SENDEXA_AUTH_TOKEN}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Prepare payload
        payload = {
            'recipient': phone_number,
            'sender': settings.SENDEXA_SENDER_ID,
            'message': message,
            # Some APIs use 'to'/'from'/'text' - including alternatives if standard fails is hard without docs
            # But standard structure usually involves recipient, sender, message
        }
        
        try:
            # In development, just log unless force_send is on
            if settings.DEBUG:
                logger.info(f"[SENDEXA MOCK] Would send to {phone_number}: {message}")
                logger.info(f"[SENDEXA MOCK] Headers: {headers}")
                logger.info(f"[SENDEXA MOCK] Payload: {payload}")
                
                # Uncomment to actually send in dev
                # response = requests.post(url, json=payload, headers=headers)
                # return SendexaService._handle_response(response)
                return True, "Mock SMS sent successfully"
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
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
