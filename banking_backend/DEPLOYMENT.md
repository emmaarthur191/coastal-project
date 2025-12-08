# Production Deployment Guide - Coastal Banking

## Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- Redis 6+ (optional, for caching and Channels)
- SMTP server for email
- SSL certificate

### Environment Setup

1. **Create `.env` file** (never commit to git):
```bash
# Core Django Settings
SECRET_KEY=your-secret-key-here-minimum-50-characters
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL recommended)
DATABASE_URL=postgresql://user:password@localhost:5432/coastal_banking

# Encryption Keys (generate with: python -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())")
ENCRYPTION_KEY=your-32-byte-base64-encoded-key
ENCRYPTION_SALT=your-16-byte-base64-encoded-salt

# CORS (HTTPS only in production)
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CORS_ALLOW_CREDENTIALS=True

# CSRF
CSRF_TRUSTED_ORIGINS=https://yourdomain.com

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<your-smtp-username>
EMAIL_HOST_PASSWORD=<your-smtp-password>
DEFAULT_FROM_EMAIL=<your-from-email>

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Optional: Redis
REDIS_URL=redis://localhost:6379/0

# Optional: Sentry Error Tracking
SENTRY_DSN=your-sentry-dsn
SENTRY_ENABLED=True
```

### Deployment Steps

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Collect Static Files**:
```bash
python manage.py collectstatic --noinput
```

3. **Run Migrations**:
```bash
python manage.py migrate
```

4. **Create Superuser**:
```bash
python manage.py create_production_superuser
```

5. **Test Configuration**:
```bash
python manage.py check --deploy
```

6. **Start Application**:

**Using Gunicorn** (recommended):
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

**Using uWSGI**:
```bash
uwsgi --http :8000 --module config.wsgi --master --processes 4
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Static files
    location /static/ {
        alias /path/to/coastal/banking_backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /path/to/coastal/banking_backend/media/;
    }

    # Proxy to Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Checklist

- [x] `DEBUG=False` in production
- [x] Strong `SECRET_KEY` (50+ characters)
- [x] HTTPS enforced (`SECURE_SSL_REDIRECT=True`)
- [x] HSTS enabled
- [x] CORS restricted to HTTPS origins only
- [x] Database uses strong password
- [x] Encryption keys properly generated and stored
- [x] Email credentials secured
- [x] Firewall configured (only ports 80, 443 open)
- [x] Database access restricted to localhost
- [x] Regular security updates scheduled
- [x] Backup strategy implemented
- [x] Monitoring and alerting configured

## Monitoring

### Health Checks
- System health: `https://yourdomain.com/health/system/`
- Banking metrics: `https://yourdomain.com/health/banking/`
- Prometheus metrics: `https://yourdomain.com/metrics/`

### Recommended Monitoring Tools
- **Sentry**: Error tracking and performance monitoring
- **Prometheus + Grafana**: Metrics visualization
- **CloudWatch/Datadog**: Infrastructure monitoring
- **UptimeRobot**: Uptime monitoring

## Backup Strategy

### Database Backups
```bash
# Daily automated backup
0 2 * * * pg_dump coastal_banking > /backups/db_$(date +\%Y\%m\%d).sql
```

### Media Files Backup
```bash
# Weekly backup to S3/cloud storage
0 3 * * 0 aws s3 sync /path/to/media/ s3://your-bucket/media/
```

## Troubleshooting

### Common Issues

**500 Error on deployment**:
- Check `DEBUG=False` is set
- Run `python manage.py check --deploy`
- Check logs: `tail -f /var/log/nginx/error.log`

**Static files not loading**:
- Run `python manage.py collectstatic --noinput`
- Check nginx static file path
- Verify `STATIC_ROOT` in settings

**Database connection error**:
- Verify `DATABASE_URL` format
- Check PostgreSQL is running
- Verify database user permissions

**CORS errors**:
- Ensure `CORS_ALLOWED_ORIGINS` includes frontend URL
- Must use HTTPS in production
- Check `CORS_ALLOW_CREDENTIALS=True`

## Performance Optimization

### Database
- Enable connection pooling
- Use read replicas for high traffic
- Regular VACUUM and ANALYZE

### Caching
```python
# Use Redis for caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### CDN
- Use CloudFlare or AWS CloudFront for static files
- Enable gzip compression
- Set proper cache headers

## Support

For issues or questions:
- Check logs: `/var/log/coastal_banking/`
- Review error tracking: Sentry dashboard
- Contact: support@yourdomain.com