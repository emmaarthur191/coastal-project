# Production Environment Configuration Documentation

## Overview

Complete production environment configuration for Coastal Banking Application including both backend (Django) and frontend (React/Vite) environment variables.

## Backend Environment Variables (.env.production)

### Core Settings
- `SECRET_KEY`: Django cryptographic signing key
- `DEBUG`: Must be False in production
- `ENVIRONMENT`: Set to 'production'
- `ALLOWED_HOSTS`: Production domain names
- `SECURE_SSL_REDIRECT`: Force HTTPS (True)

### Security & Encryption
- `ENCRYPTION_KEY`: 32-byte base64 encryption key
- `ENCRYPTION_SALT`: 16-byte base64 salt
- `JWT_SIGNING_KEY`: JWT signing key
- `API_AUTH_KEY`: API authentication key
- `SESSION_KEY`: Session security key

### Database
- `DATABASE_URL`: Production database connection string

### Email Configuration
- `EMAIL_HOST`: SMTP server (e.g., smtp.gmail.com)
- `EMAIL_HOST_USER`: SMTP username
- `EMAIL_HOST_PASSWORD`: SMTP password/app password
- `DEFAULT_FROM_EMAIL`: Sender email address

### CORS & Security
- `CORS_ALLOWED_ORIGINS`: HTTPS frontend domains only
- `CSRF_TRUSTED_ORIGINS`: Trusted CSRF origins
- `RATELIMIT_ENABLE`: Rate limiting enabled
- `ANON_RATE_LIMIT`: Anonymous rate limit (50/hour)
- `USER_RATE_LIMIT`: User rate limit (500/hour)

### Monitoring
- `SENTRY_DSN`: Error tracking DSN
- `SENTRY_TRACES_SAMPLE_RATE`: Trace sampling (1.0)
- `RELEASE_VERSION`: Application version

## Frontend Environment Variables (.env.production)

### API Configuration
- `VITE_PROD_API_URL`: Production API base URL
- `VITE_API_TIMEOUT`: API timeout (30000ms)

### Security
- `VITE_ENABLE_CSP`: Enable CSP (true)
- `VITE_DEBUG_API`: Debug logging (false)

### Features
- `VITE_ENABLE_PRODUCTION_FEATURES`: Production features (true)

### Monitoring
- `VITE_SENTRY_DSN`: Frontend error tracking DSN
- `VITE_AMPLITUDE_API_KEY`: Analytics API key

## Security Best Practices

1. **Key Generation**: All keys cryptographically secure and randomly generated
2. **Environment Isolation**: Different keys for each environment
3. **HTTPS Enforcement**: All production URLs use HTTPS
4. **CSP Headers**: Strict Content Security Policy
5. **Rate Limiting**: Protection against brute force attacks

## Quick Setup Commands

```bash
# Generate production keys
cd banking_backend
python generate_production_keys.py

# Validate configuration
python validate_production_config.py

# Frontend build
cd ../frontend
npm install
npm run build
```

## Production Checklist

- [ ] All placeholder values replaced
- [ ] Domain names updated to production
- [ ] Email configuration set up
- [ ] Sentry DSNs configured
- [ ] Database connection string updated
- [ ] HTTPS certificates installed
- [ ] Security headers verified
- [ ] Rate limiting tested

## Key Files Created

1. `banking_backend/.env.production` - Complete production configuration
2. `frontend/.env.production` - Frontend production settings
3. `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Deployment checklist
4. `generate_production_keys.py` - Key generation script
5. `validate_production_config.py` - Configuration validation script

## Support

For issues:
1. Run validation script: `python validate_production_config.py`
2. Check application logs
3. Verify environment variables
4. Test in staging environment first