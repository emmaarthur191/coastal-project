#!/usr/bin/env python3
import secrets
import base64
from django.core.management.utils import get_random_secret_key

def generate_comprehensive_production_keys():
    """Generate all secure production keys for the banking application."""
    
    # Generate Django SECRET_KEY
    django_secret_key = get_random_secret_key()
    
    # Generate secure encryption key (32 bytes for Fernet)
    encryption_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    # Generate secure salt (16 bytes for PBKDF2)
    encryption_salt = base64.urlsafe_b64encode(secrets.token_bytes(16)).decode()
    
    # Generate JWT signing key (32 bytes)
    jwt_signing_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    # Generate API authentication key for enhanced security
    api_auth_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    # Generate session security key
    session_key = base64.urlsafe_b64encode(secrets.token_bytes(64)).decode()
    
    print('=' * 80)
    print('COMPREHENSIVE PRODUCTION SECURITY KEYS')
    print('=' * 80)
    print()
    print('[SECURITY] DJANGO SECRET KEY:')
    print(f'SECRET_KEY={django_secret_key}')
    print()
    print('[SECURITY] ENCRYPTION KEYS:')
    print(f'ENCRYPTION_KEY={encryption_key}')
    print(f'ENCRYPTION_SALT={encryption_salt}')
    print()
    print('[SECURITY] JWT SECURITY:')
    print(f'JWT_SIGNING_KEY={jwt_signing_key}')
    print()
    print('[SECURITY] API AUTHENTICATION:')
    print(f'API_AUTH_KEY={api_auth_key}')
    print()
    print('[SECURITY] SESSION SECURITY:')
    print(f'SESSION_KEY={session_key}')
    print()
    print('=' * 80)
    print('ENVIRONMENT VARIABLE EXPORTS:')
    print('=' * 80)
    print()
    print('# Django Core')
    print(f'export SECRET_KEY="{django_secret_key}"')
    print()
    print('# Encryption')
    print(f'export ENCRYPTION_KEY="{encryption_key}"')
    print(f'export ENCRYPTION_SALT="{encryption_salt}"')
    print()
    print('# JWT Security')
    print(f'export JWT_SIGNING_KEY="{jwt_signing_key}"')
    print()
    print('# API Authentication')
    print(f'export API_AUTH_KEY="{api_auth_key}"')
    print()
    print('# Session Security')
    print(f'export SESSION_KEY="{session_key}"')
    print()
    
    # Create comprehensive .env.production file
    env_production_content = f"""# =============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Banking Application - Secure Production Settings
# Generated on: {secrets.token_hex(8)}
# =============================================================================

# =============================================================================
# DJANGO CORE SETTINGS
# =============================================================================
SECRET_KEY={django_secret_key}
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=your-production-domain.com,api.your-production-domain.com
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL=postgresql://user:password@localhost:5432/banking_prod
# Alternative: mysql://user:password@localhost:3306/banking_prod
# Alternative: sqlite:///path/to/production.db

# =============================================================================
# ENCRYPTION & SECURITY KEYS
# =============================================================================
ENCRYPTION_KEY={encryption_key}
ENCRYPTION_SALT={encryption_salt}
JWT_SIGNING_KEY={jwt_signing_key}
API_AUTH_KEY={api_auth_key}
SESSION_KEY={session_key}

# =============================================================================
# EMAIL CONFIGURATION (Production SMTP)
# =============================================================================
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@yourbank.com
EMAIL_HOST_PASSWORD=your-email-app-password
DEFAULT_FROM_EMAIL=noreply@yourbank.com
FRONTEND_URL=https://your-frontend-domain.com

# =============================================================================
# CORS CONFIGURATION (Production)
# =============================================================================
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# =============================================================================
# RATE LIMITING (Production)
# =============================================================================
RATELIMIT_ENABLE=True
ANON_RATE_LIMIT=50/hour
USER_RATE_LIMIT=500/hour

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
ACCESS_TOKEN_LIFETIME_MINUTES=30
REFRESH_TOKEN_LIFETIME_DAYS=7

# =============================================================================
# AUDIT LOGGING
# =============================================================================
AUDITLOG_INCLUDE_ALL_MODELS=True
AUDITLOG_EXCLUDE_TRACKING_MODELS=auditlog.LogEntry
AUDITLOG_DISABLE_REMOTE_ADDR=False

# =============================================================================
# MONITORING & LOGGING
# =============================================================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_SEND_DEFAULT_PII=False
RELEASE_VERSION=1.0.0

# =============================================================================
# CACHE CONFIGURATION (Production Redis/Memcached)
# =============================================================================
# Redis Configuration
REDIS_URL=redis://localhost:6379/1
# Alternative: CACHE_BACKEND=django_redis.cache.RedisCache
CACHE_LOCATION=redis://localhost:6379/1

# =============================================================================
# FILE STORAGE (AWS S3 or similar)
# =============================================================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-production-bucket
AWS_S3_REGION_NAME=us-east-1
AWS_DEFAULT_ACL=None
AWS_S3_OBJECT_PARAMETERS={{'CacheControl': 'max-age=86400'}}

# =============================================================================
# SECURITY HEADERS
# =============================================================================
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS=DENY
SECURE_REFERRER_POLICY=strict-origin-when-cross-origin
SECURE_CROSS_ORIGIN_OPENER_POLICY=same-origin
SECURE_CROSS_ORIGIN_EMBEDDER_POLICY=require-corp

# =============================================================================
# CONTENT SECURITY POLICY
# =============================================================================
CSP_DEFAULT_SRC='self'
CSP_SCRIPT_SRC='self' 'https://cdn.jsdelivr.net'
CSP_STYLE_SRC='self' 'https://fonts.googleapis.com' 'https://cdn.jsdelivr.net'
CSP_FONT_SRC='self' 'https://fonts.gstatic.com'
CSP_IMG_SRC='self' 'data:' 'https:'
CSP_CONNECT_SRC='self'
CSP_FRAME_SRC='none'
CSP_OBJECT_SRC='none'
CSP_BASE_URI='self'
CSP_FORM_ACTION='self'
CSP_FRAME_ANCESTORS='none'

# =============================================================================
# ADDITIONAL SECURITY SETTINGS
# =============================================================================
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS=DENY

# =============================================================================
# PROMETHEUS MONITORING
# =============================================================================
PROMETHEUS_ENABLED=True
METRICS_INTERVAL=30

# =============================================================================
# TEST CONFIGURATION (Disabled in Production)
# =============================================================================
TEST_OUTPUT_DIR=/tmp/test-results
TEST_PARALLEL=1
"""
    
    with open('.env.production', 'w') as f:
        f.write(env_production_content)
    
    print('=' * 80)
    print('[SUCCESS] Created comprehensive .env.production file')
    print('=' * 80)
    print()
    print('[WARNING] SECURITY NOTES:')
    print('- Keep these keys secure and never commit them to version control')
    print('- Store .env.production in a secure location outside the project directory')
    print('- Use environment variables in production deployment platforms')
    print('- Rotate keys regularly as part of security best practices')
    print('- Use different keys for each environment (dev/staging/prod)')
    print()
    
    return {
        'secret_key': django_secret_key,
        'encryption_key': encryption_key,
        'encryption_salt': encryption_salt,
        'jwt_signing_key': jwt_signing_key,
        'api_auth_key': api_auth_key,
        'session_key': session_key
    }

if __name__ == "__main__":
    generate_comprehensive_production_keys()