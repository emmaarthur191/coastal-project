#!/usr/bin/env python3
import secrets
import base64
import os

def generate_encryption_keys():
    """Generate secure encryption keys for production."""
    # Generate secure encryption key (32 bytes for Fernet)
    encryption_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    # Generate secure salt (16 bytes for PBKDF2)
    encryption_salt = base64.urlsafe_b64encode(secrets.token_bytes(16)).decode()
    
    print('=== PRODUCTION ENCRYPTION KEYS ===')
    print(f'ENCRYPTION_KEY={encryption_key}')
    print(f'ENCRYPTION_SALT={encryption_salt}')
    print('=================================')
    print()
    print('Add these to your production environment variables:')
    print(f'export ENCRYPTION_KEY="{encryption_key}"')
    print(f'export ENCRYPTION_SALT="{encryption_salt}"')
    print()
    
    # Create .env.production file
    with open('.env.production', 'w') as f:
        f.write(f'ENCRYPTION_KEY={encryption_key}\n')
        f.write(f'ENCRYPTION_SALT={encryption_salt}\n')
    
    print('Created .env.production file with the keys')
    
    return encryption_key, encryption_salt

if __name__ == "__main__":
    generate_encryption_keys()