import os
from cryptography.fernet import Fernet
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    def __init__(self):
        # Get encryption key from settings or generate one
        key = getattr(settings, 'ENCRYPTION_KEY', None)
        if not key:
            # In production, this should be set in environment variables
            key = os.environ.get('ENCRYPTION_KEY')
            if not key:
                raise ImproperlyConfigured(
                    "ENCRYPTION_KEY must be set in settings or environment variables"
                )
        
        # Get salt from settings
        salt = getattr(settings, 'ENCRYPTION_SALT', None)
        if not salt:
            salt = os.environ.get('ENCRYPTION_SALT')
            if not salt:
                raise ImproperlyConfigured(
                    "ENCRYPTION_SALT must be set in settings or environment variables"
                )
        
        # Ensure key is properly formatted for Fernet (32 url-safe base64-encoded bytes)
        try:
            # If key is a string,  # encode it
            if isinstance(key, str):
                # Check if it's already a valid Fernet key
                if len(key) == 44 and key.endswith('='):
                    # Likely already base64 encoded
                    key_bytes = key.encode()
                else:
                    # Generate a proper Fernet key from the string
                    from cryptography.hazmat.primitives import hashes
                    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
                    import base64
                    
                    # Use PBKDF2 to derive a proper key with the configured salt
                    salt_bytes = salt.encode() if isinstance(salt, str) else salt
                    kdf = PBKDF2HMAC(
                        algorithm=hashes.SHA256(),
                        length=32,
                        salt=salt_bytes,
                        iterations=100000,
                    )
                    key_bytes = base64.urlsafe_b64encode(kdf.derive(key.encode()))
            else:
                key_bytes = key
            
            self.fernet = Fernet(key_bytes)
        except Exception as e:
            raise ImproperlyConfigured(
                f"Invalid ENCRYPTION_KEY format. Must be a 32-byte base64-encoded key or a string. Error: {str(e)}"
            )

    def encrypt(self, data):
        """Encrypt string data."""
        if not isinstance(data, str):
            data = str(data)
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data):
        """Decrypt encrypted data."""
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {str(e)}")


# Global instance
encryption_service = EncryptionService()


def encrypt_field(value):
    """Encrypt a field value."""
    if value is None:
        return None
    return encryption_service.encrypt(value)


def decrypt_field(value):
    """Decrypt a field value."""
    if value is None:
        return None
    return encryption_service.decrypt(value)