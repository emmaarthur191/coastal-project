"""
SMS Test Script - Tests the Sendexa SMS configuration for Coastal Banking

Run this script to verify your SMS configuration is working correctly.
Usage: python test_sms.py [phone_number]

Example: python test_sms.py +233557155186
"""
import os
import sys

# Add the banking_backend to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from banking_backend.utils.sms import send_sms, send_otp_sms


def test_sms_configuration():
    """Test SMS configuration"""
    print("=" * 50)
    print("SMS Configuration Test")
    print("=" * 50)
    
    # Check configuration
    sms_provider = getattr(settings, 'SMS_PROVIDER', 'not set')
    sms_api_url = getattr(settings, 'SMS_API_URL', 'not set')
    sms_api_token = getattr(settings, 'SMS_API_TOKEN', '')
    sms_sender_id = getattr(settings, 'SMS_SENDER_ID', 'not set')
    
    print(f"\nSMS Provider: {sms_provider}")
    print(f"SMS API URL: {sms_api_url}")
    print(f"SMS API Token: {'*' * 20 + sms_api_token[-8:] if sms_api_token else 'NOT SET'}")
    print(f"SMS Sender ID: {sms_sender_id}")
    
    if sms_provider == 'console':
        print("\n[WARNING] SMS is in CONSOLE mode (development)")
        print("   Messages will be logged but not sent.")
        print("   Set SMS_PROVIDER=sendexa in your .env file for production.")
    elif sms_provider == 'sendexa':
        if not sms_api_token:
            print("\n[ERROR] SMS_API_TOKEN is not set!")
            return False
        print("\n[OK] SMS is configured for PRODUCTION (Sendexa)")
    
    return True


def send_test_message(phone_number):
    """Send a test SMS message"""
    print("\n" + "=" * 50)
    print(f"Sending test SMS to: {phone_number}")
    print("=" * 50)
    
    result = send_sms(
        phone_number,
        "This is a test message from Coastal Banking. If you received this, SMS is working correctly!"
    )
    
    print(f"\nResult: {result}")
    
    if result.get('success'):
        print("\n[SUCCESS] SMS sent successfully!")
    else:
        print(f"\n[FAILED] SMS failed: {result.get('error', 'Unknown error')}")
    
    return result


def send_test_otp(phone_number):
    """Send a test OTP"""
    print("\n" + "=" * 50)
    print(f"Sending test OTP to: {phone_number}")
    print("=" * 50)
    
    result = send_otp_sms(phone_number, "123456")
    
    print(f"\nResult: {result}")
    
    if result.get('success'):
        print("\n[SUCCESS] OTP SMS sent successfully!")
    else:
        print(f"\n[FAILED] OTP SMS failed: {result.get('error', 'Unknown error')}")
    
    return result


if __name__ == "__main__":
    # Test configuration first
    config_ok = test_sms_configuration()
    
    if len(sys.argv) > 1:
        phone = sys.argv[1]
        print(f"\n[INFO] Testing with phone number: {phone}")
        
        # Ask user what to send
        print("\nOptions:")
        print("1. Send test message")
        print("2. Send test OTP")
        print("3. Send both")
        
        choice = input("\nEnter choice (1/2/3): ").strip()
        
        if choice == "1":
            send_test_message(phone)
        elif choice == "2":
            send_test_otp(phone)
        elif choice == "3":
            send_test_message(phone)
            send_test_otp(phone)
        else:
            print("Invalid choice")
    else:
        print("\n[TIP] To send a test SMS, run:")
        print("   python test_sms.py +233XXXXXXXXX")
