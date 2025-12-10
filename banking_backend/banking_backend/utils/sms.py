"""
SMS utility for sending SMS messages via API.

Supports multiple SMS providers:
- console: Development mode - logs messages to console
- sendexa: Sendexa SMS API (Ghana) - Production recommended
- arkesel: Arkesel SMS API (Ghana) - Legacy support

Environment Variables:
- SMS_PROVIDER: 'console', 'sendexa', or 'arkesel' (or 'api' for arkesel)
- SMS_API_URL: API endpoint URL
- SMS_API_TOKEN: API key/token for authentication
- SMS_SENDER_ID: Sender ID for SMS messages
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger('banking_security')


def send_sms(phone_number, message):
    """
    Send an SMS message to the specified phone number.
    
    Args:
        phone_number (str): The recipient's phone number (e.g., '+233557155186')
        message (str): The message content to send
        
    Returns:
        dict: Response with 'success' boolean and 'message' or 'error'
    """
    # Get SMS configuration from settings
    sms_provider = getattr(settings, 'SMS_PROVIDER', 'console')
    
    if sms_provider == 'console':
        # Development/testing mode - just log the message
        logger.info(f"[SMS] To: {phone_number} | Message: {message}")
        return {
            'success': True,
            'message': 'SMS logged to console (development mode)',
            'provider': 'console'
        }
    
    elif sms_provider == 'sendexa':
        # Sendexa SMS API (Ghana)
        return _send_via_sendexa(phone_number, message)
    
    elif sms_provider in ['api', 'arkesel']:
        # Arkesel SMS API (legacy support)
        return _send_via_arkesel(phone_number, message)
    
    else:
        logger.warning(f"Unknown SMS provider: {sms_provider}")
        return {
            'success': False,
            'error': 'Invalid SMS provider configuration'
        }


def _send_via_sendexa(phone_number, message):
    """
    Send SMS via Sendexa API.
    
    Sendexa API documentation: https://sendexa.co/docs
    
    Args:
        phone_number (str): The recipient's phone number
        message (str): The message content
        
    Returns:
        dict: Response with 'success' boolean and details
    """
    try:
        # Get configuration
        api_url = getattr(settings, 'SMS_API_URL', 'https://api.sendexa.co/v1/sms/send')
        api_token = getattr(settings, 'SMS_API_TOKEN', '')
        sender_id = getattr(settings, 'SMS_SENDER_ID', 'CoastalBank')
        
        if not api_token:
            logger.error("SMS_API_TOKEN not configured for Sendexa")
            return {
                'success': False,
                'error': 'SMS service not configured'
            }
        
        # Normalize phone number (ensure it starts with country code)
        normalized_phone = _normalize_phone_number(phone_number)
        
        # Sendexa API request
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        payload = {
            'from': sender_id,
            'to': normalized_phone,
            'message': message,
            'type': 'plain'  # plain text message
        }
        
        # Send the SMS
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=15
        )
        
        # Parse response
        try:
            response_data = response.json()
        except:
            response_data = {'raw': response.text}
        
        if response.status_code in [200, 201]:
            logger.info(f"SMS sent via Sendexa to {normalized_phone}")
            return {
                'success': True,
                'message': 'SMS sent successfully',
                'provider': 'sendexa',
                'response': response_data
            }
        else:
            logger.error(f"Sendexa API error: {response.status_code} - {response.text}")
            return {
                'success': False,
                'error': f'SMS API returned status {response.status_code}',
                'details': response_data
            }
            
    except requests.exceptions.Timeout:
        logger.error(f"Sendexa API timeout for {phone_number}")
        return {
            'success': False,
            'error': 'SMS service timeout'
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Sendexa API request failed: {str(e)}")
        return {
            'success': False,
            'error': 'SMS service unavailable'
        }
    except Exception as e:
        logger.error(f"Unexpected error sending SMS via Sendexa: {str(e)}")
        return {
            'success': False,
            'error': 'Internal error sending SMS'
        }


def _send_via_arkesel(phone_number, message):
    """
    Send SMS via Arkesel API (legacy support).
    
    Args:
        phone_number (str): The recipient's phone number
        message (str): The message content
        
    Returns:
        dict: Response with 'success' boolean and details
    """
    try:
        api_url = getattr(settings, 'SMS_API_URL', 'https://sms.arkesel.com/api/v2/sms/send')
        api_token = getattr(settings, 'SMS_API_TOKEN', '')
        sender_id = getattr(settings, 'SMS_SENDER_ID', 'CoastalBank')
        
        if not api_token:
            logger.error("SMS_API_TOKEN not configured for Arkesel")
            return {
                'success': False,
                'error': 'SMS service not configured'
            }
        
        # Prepare the request
        headers = {
            'Authorization': f'Basic {api_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'sender': sender_id,
            'recipients': [phone_number],
            'message': message
        }
        
        # Send the SMS
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"SMS sent via Arkesel to {phone_number}")
            return {
                'success': True,
                'message': 'SMS sent successfully',
                'provider': 'arkesel',
                'response': response.json()
            }
        else:
            logger.error(f"Arkesel API error: {response.status_code} - {response.text}")
            return {
                'success': False,
                'error': f'SMS API returned status {response.status_code}',
                'details': response.text
            }
            
    except requests.exceptions.Timeout:
        logger.error(f"Arkesel API timeout for {phone_number}")
        return {
            'success': False,
            'error': 'SMS service timeout'
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Arkesel API request failed: {str(e)}")
        return {
            'success': False,
            'error': 'SMS service unavailable'
        }
    except Exception as e:
        logger.error(f"Unexpected error sending SMS via Arkesel: {str(e)}")
        return {
            'success': False,
            'error': 'Internal error sending SMS'
        }


def _normalize_phone_number(phone_number):
    """
    Normalize phone number to international format.
    
    Args:
        phone_number (str): Phone number to normalize
        
    Returns:
        str: Normalized phone number
    """
    # Remove any whitespace or special characters
    phone = ''.join(c for c in phone_number if c.isdigit() or c == '+')
    
    # If starts with +, return as is
    if phone.startswith('+'):
        return phone
    
    # If starts with 0 (local Ghana format), convert to +233
    if phone.startswith('0') and len(phone) == 10:
        return '+233' + phone[1:]
    
    # If starts with 233 (without +), add +
    if phone.startswith('233') and len(phone) >= 12:
        return '+' + phone
    
    # Default: assume Ghana number, add +233
    if len(phone) == 9:
        return '+233' + phone
    
    return phone


def send_otp_sms(phone_number, otp_code):
    """
    Send an OTP verification code via SMS.
    
    Args:
        phone_number (str): The recipient's phone number
        otp_code (str): The OTP code to send
        
    Returns:
        dict: Response from send_sms
    """
    message = f"Your Coastal Banking verification code is: {otp_code}. Valid for 5 minutes. Do not share this code."
    return send_sms(phone_number, message)


def send_notification_sms(phone_number, notification_message):
    """
    Send a notification SMS.
    
    Args:
        phone_number (str): The recipient's phone number
        notification_message (str): The notification message
        
    Returns:
        dict: Response from send_sms
    """
    return send_sms(phone_number, notification_message)
