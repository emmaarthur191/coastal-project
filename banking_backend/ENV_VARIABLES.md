# Environment Variables Reference

## Required Variables

### Core Django
```bash
SECRET_KEY=                    # Strong random key (50+ chars)
DEBUG=False                    # NEVER True in production
ENVIRONMENT=production         # 'development' or 'production'
ALLOWED_HOSTS=                 # Comma-separated: domain.com,www.domain.com
```

### Database
```bash
DATABASE_URL=                  # postgresql://user:pass@host:port/dbname
```

### Encryption
```bash
ENCRYPTION_KEY=                # 32-byte base64-encoded key
ENCRYPTION_SALT=               # 16-byte base64-encoded salt
```

### CORS & CSRF
```bash
CORS_ALLOWED_ORIGINS=          # HTTPS only in production
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=          # Same as CORS origins
```

### Email
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=                    # SMTP server
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=               # Email username
EMAIL_HOST_PASSWORD=           # Email password
DEFAULT_FROM_EMAIL=            # From address
```

### Frontend
```bash
FRONTEND_URL=                  # Frontend application URL
```

### SMS Service (Sendexa)
```bash
SMS_PROVIDER=sendexa           # 'console' (dev logs), 'sendexa' (production), 'arkesel' (legacy)
SMS_API_URL=https://api.sendexa.co/v1/sms/send  # Sendexa API endpoint
SMS_API_TOKEN=                 # Your Sendexa API token (required for production)
SMS_SENDER_ID=CoastalBank      # Registered sender ID
```

### Security
```bash
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

## Optional Variables

### Redis
```bash
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Sentry
```bash
SENTRY_DSN=                    # Sentry project DSN
SENTRY_ENABLED=True
SENTRY_TRACES_SAMPLE_RATE=1.0
```

### Rate Limiting
```bash
ANON_RATE_LIMIT=100/hour
USER_RATE_LIMIT=1000/hour
```

### JWT Tokens
```bash
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=1
```

## Generating Secure Keys

### SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### ENCRYPTION_KEY (32 bytes)
```bash
python -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"
```

### ENCRYPTION_SALT (16 bytes)
```bash
python -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(16)).decode())"
```

## Example .env File

```bash
# Core
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=coastal-banking.com,www.coastal-banking.com

# Database
DATABASE_URL=postgresql://coastal_user:strong_password@localhost:5432/coastal_banking

# Encryption
ENCRYPTION_KEY=your-32-byte-base64-key-here
ENCRYPTION_SALT=your-16-byte-base64-salt-here

# CORS
CORS_ALLOWED_ORIGINS=https://coastal-banking.com
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=https://coastal-banking.com

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<your-smtp-username>
EMAIL_HOST_PASSWORD=<your-smtp-password>
DEFAULT_FROM_EMAIL=<your-from-email>

# Frontend
FRONTEND_URL=https://coastal-banking.com

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Optional
REDIS_URL=redis://localhost:6379/0
SENTRY_DSN=your-sentry-dsn
SENTRY_ENABLED=True
```

## Security Notes

1. **Never commit `.env` to version control**
2. Use different keys for development and production
3. Rotate keys periodically (quarterly recommended)
4. Store production keys in secure vault (AWS Secrets Manager, Azure Key Vault)
5. Use strong, unique passwords for all services
6. Enable 2FA on all service accounts
