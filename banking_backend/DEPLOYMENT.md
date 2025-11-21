# Banking Backend Production Deployment Guide

This document provides comprehensive instructions for deploying the Banking Backend application to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup Configuration](#backup-configuration)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Maintenance Procedures](#maintenance-procedures)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or CentOS 7+ (recommended)
- **Memory**: Minimum 4GB RAM, recommended 8GB+
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection

### Software Dependencies

- Docker Engine 20.10+
- Docker Compose 2.0+
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Nginx (for production deployment)
- SSL certificate (Let's Encrypt recommended)

### Required Tools

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.17.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install required system packages
sudo apt-get update
sudo apt-get install -y postgresql-client redis-tools nginx certbot python3-certbot-nginx
```

## Environment Setup

##. Clone Repository

```bash
git clone <repository-url> banking-backend
cd banking-backend
```

##. Create Production Environment File

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production values:

```bash
# Django Core Settings
SECRET_KEY=your-production-secret-key-change-this-immediately
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,api.your-domain.com
ENVIRONMENT=production
RELEASE_VERSION=1.0.0

# Database Configuration
DB_NAME=banking_db_prod
DB_USER=banking_user_prod
DB_PASSWORD=your-secure-database-password-here
DB_PORT=5432

# Redis Configuration
REDIS_PASSWORD=your-secure-redis-password-here
REDIS_PORT=6379

# Security Settings
ENCRYPTION_KEY=your-32-character-encryption-key-for-sensitive-data
BACKUP_ENCRYPTION_KEY=your-32-character-backup-encryption-key

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@your-domain.com
EMAIL_HOST_PASSWORD=your-email-app-password

# Monitoring
SENTRY_DSN=https://your-sentry-dsn-here@sentry.io/project-id
GRAFANA_ADMIN_PASSWORD=your-secure-grafana-admin-password
```

##. Set Environment Variables

```bash
# Copy environment file to production location
sudo cp .env.production /etc/banking-backend/.env.production
sudo chmod 600 /etc/banking-backend/.env.production
```

## Security Configuration

##. SSL/TLS Setup

```bash
# Obtain SSL certificate using Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify certificate renewal
sudo certbot renew --dry-run
```

##. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Verify firewall status
sudo ufw status
```

##. Security Hardening

```bash
# Disable root login via SSH
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban for SSH protection
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Database Setup

##. Create Production Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE banking_db_prod;
CREATE USER banking_user_prod WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE banking_db_prod TO banking_user_prod;
ALTER USER banking_user_prod CREATEDB;
\q
```

##. Run Database Migrations

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml run --rm web python manage.py migrate

# Or using local Python environment
python manage.py migrate
```

##. Create Superuser

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml run --rm web python manage.py createsuperuser

# Or using local Python environment
python manage.py createsuperuser
```

## Application Deployment

##. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

##. Run Initial Setup

```bash
# Collect static files
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput

# Create cache table
docker-compose -f docker-compose.prod.yml exec web python manage.py createcachetable

# Run health check
curl -f http://localhost/health/
```

##. Configure Nginx

Update `/etc/nginx/sites-available/banking-backend` with SSL configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/static/files/;
        expires 1y;
    }

    location /media/ {
        alias /path/to/media/files/;
        expires 30d;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/banking-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Monitoring Setup

##. Access Grafana

```bash
# Get Grafana admin password from environment
echo $GRAFANA_ADMIN_PASSWORD

# Access Grafana at http://your-domain.com:3001
# Default credentials: admin / $GRAFANA_ADMIN_PASSWORD
```

##. Configure Dashboards

1. Import the banking overview dashboard from `monitoring/grafana/dashboards/banking-overview.json`
2. Configure alerting rules for critical metrics
3. Set up notification channels (email, Slack, etc.)

##. Health Check Monitoring

```bash
# Test health check endpoint
curl -f https://your-domain.com/health/

# Run comprehensive health check
docker-compose -f docker-compose.prod.yml exec web python scripts/health_check.py
```

## Backup Configuration

##. Automated Backups

```bash
# Run initial backup
docker-compose -f docker-compose.prod.yml exec web python manage.py backup_database create --compress --encrypt

# List available backups
docker-compose -f docker-compose.prod.yml exec web python manage.py backup_database list
```

##. Backup Schedule

Add to crontab for automated backups:

```bash
# Edit crontab
crontab -e

# Add backup schedule (daily at 2 AM)
0 2 * * * cd /path/to/banking-backend && docker-compose -f docker-compose.prod.yml exec -T web python manage.py backup_database create --compress --encrypt

# Add cleanup schedule (weekly on Sunday)
0 3 * * 0 cd /path/to/banking-backend && docker-compose -f docker-compose.prod.yml exec -T web python manage.py backup_database cleanup --keep-days 30
```

##. Backup Verification

```bash
# Test backup restoration (use test environment)
docker-compose -f docker-compose.prod.yml exec web python manage.py backup_database restore <backup-file> --no-confirm
```

## SSL/TLS Configuration

##. Certificate Management

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Force renewal if needed
sudo certbot certonly --force-renewal -d your-domain.com
```

##. SSL Configuration Testing

```bash
# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check SSL rating
curl -s -I https://your-domain.com | head -n 1
```

## Maintenance Procedures

##. Application Updates

```bash
# Pull latest changes
git pull origin main

# Build and deploy updates
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
```

##. Database Maintenance

```bash
# Vacuum database
docker-compose -f docker-compose.prod.yml exec db vacuumdb --all --analyze

# Reindex database
docker-compose -f docker-compose.prod.yml exec db reindexdb --all
```

##. Log Rotation

```bash
# Configure logrotate for application logs
sudo nano /etc/logrotate.d/banking-backend

# Add configuration:
/var/log/banking-backend/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f /path/to/docker-compose.prod.yml restart web
    endscript
}
```

##. Security Audits

```bash
# Run security audit
docker-compose -f docker-compose.prod.yml exec web python scripts/security_audit.py

# Check for dependency vulnerabilities
docker-compose -f docker-compose.prod.yml exec web pip list --outdated
```

## Troubleshooting

### Common Issues

###. Application Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs web

# Check environment variables
docker-compose -f docker-compose.prod.yml exec web env

# Verify database connectivity
docker-compose -f docker-compose.prod.yml exec web python manage.py dbshell
```

###. Database Connection Issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec db pg_isready -U banking_user_prod -d banking_db_prod

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

###. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout

# Renew certificate manually
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com
```

###. Performance Issues

```bash
# Check system resources
docker stats

# Monitor application performance
docker-compose -f docker-compose.prod.yml exec web python scripts/health_check.py --format json

# Check database performance
docker-compose -f docker-compose.prod.yml exec db psql -U banking_user_prod -d banking_db_prod -c "SELECT * FROM pg_stat_activity;"
```

### Log Locations

- **Application logs**: `/app/logs/` (inside containers)
- **Nginx logs**: `/var/log/nginx/`
- **Docker logs**: `docker-compose -f docker-compose.prod.yml logs`
- **System logs**: `/var/log/syslog`

### Emergency Contacts

- **System Administrator**: admin@your-domain.com
- **Security Issues**: security@your-domain.com
- **Monitoring Alerts**: alerts@your-domain.com

## Additional Resources

- [Django Deployment Documentation](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

---

**Note**: This deployment guide should be reviewed and updated regularly to reflect changes in the application and infrastructure requirements.