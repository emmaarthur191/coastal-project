"""
SMS utility for sending SMS messages via API.

Uses the provided SMS API with Basic authentication.
API Key: sms_76720964
Base64 Token: c21zXzc2NzIwOTY0OjcxNTQ3YTRkMjM4N2ZlZjQ=
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
    
    elif sms_provider == 'api':
        # Production mode - send via SMS API
        try:
            api_url = getattr(settings, 'SMS_API_URL', 'https://sms.arkesel.com/api/v2/sms/send')
            api_token = getattr(settings, 'SMS_API_TOKEN', '')
            sender_id = getattr(settings, 'SMS_SENDER_ID', 'CoastalBank')
            
            if not api_token:
                logger.error("SMS_API_TOKEN not configured")
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
                logger.info(f"SMS sent successfully to {phone_number}")
                return {
                    'success': True,
                    'message': 'SMS sent successfully',
                    'provider': 'api',
                    'response': response.json()
                }
            else:
                logger.error(f"SMS API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'SMS API returned status {response.status_code}',
                    'details': response.text
                }
                
        except requests.exceptions.Timeout:
            logger.error(f"SMS API timeout for {phone_number}")
            return {
                'success': False,
                'error': 'SMS service timeout'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"SMS API request failed: {str(e)}")
            return {
                'success': False,
                'error': 'SMS service unavailable'
            }
        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {str(e)}")
            return {
                'success': False,
                'error': 'Internal error sending SMS'
            }
    
    else:
        logger.warning(f"Unknown SMS provider: {sms_provider}")
        return {
            'success': False,
            'error': 'Invalid SMS provider configuration'
        }


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
