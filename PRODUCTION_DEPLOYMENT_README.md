# 🚀 Coastal Banking Production Deployment Guide

This guide provides step-by-step instructions for deploying the Coastal Banking application to production using Docker and the single Nginx reverse proxy architecture.

## 📋 Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)
- At least 2GB RAM, 2 CPU cores, 20GB storage

## 🛠️ Pre-Deployment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/coastal-banking
cd /opt/coastal-banking
```

### 2. Clone Repository

```bash
# Clone your repository (replace with your actual repo)
git clone https://github.com/yourusername/coastal-banking.git .
cd coastal-banking
```

### 3. SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot -y

# Get SSL certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx/ssl directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set proper permissions
sudo chown -R 101:101 nginx/ssl  # nginx user
```

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.production.template .env

# Edit with your production values
nano .env

# Generate new secret keys
python3 -c "import secrets; print(secrets.token_urlsafe(50))"  # For SECRET_KEY
python3 -c "import os; print(os.urandom(32).hex())"  # For ENCRYPTION_KEY
python3 -c "import os; print(os.urandom(32).hex())"  # For ENCRYPTION_SALT
```

### 5. Update Nginx Configuration

```bash
# Update domain name in nginx configuration
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx/conf.d/default.conf
```

## 🚀 Deployment

### Automated Deployment (Recommended)

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput --clear

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 🔍 Post-Deployment Verification

### Check Service Status

```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Test Application

```bash
# Test HTTPS access
curl -I https://yourdomain.com

# Test API
curl https://yourdomain.com/api/health/

# Test frontend
curl -I https://yourdomain.com
```

## 🔧 Maintenance Commands

### Service Management

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart nginx

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Database Management

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U coastal_user coastal_banking > backup_$(date +%Y%m%d).sql

# Access database
docker-compose -f docker-compose.prod.yml exec db psql -U coastal_user -d coastal_banking
```

### SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificates
sudo certbot renew

# Reload nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 📊 Monitoring

### Health Checks

The application includes built-in health checks:
- `/health/` - General health check
- `/api/health/` - API health check

### Log Monitoring

```bash
# Nginx access logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log

# Django logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔒 Security Considerations

### Firewall Configuration

```bash
# UFW example
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

### SSL/TLS Configuration

- SSL certificates are configured for TLS 1.2/1.3
- Security headers are automatically applied
- Rate limiting protects against abuse
- Network segmentation isolates backend services

### Backup Strategy

```bash
# Database backup script (add to crontab)
0 2 * * * /opt/coastal-banking/scripts/backup_database.sh

# File system backup
0 3 * * * rsync -av /opt/coastal-banking /backup/
```

## 🚨 Troubleshooting

### Common Issues

1. **Nginx fails to start**
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   # Check for SSL certificate issues or configuration errors
   ```

2. **Database connection issues**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell
   # Check database connectivity
   ```

3. **Static files not loading**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
   ```

### Performance Tuning

- Monitor resource usage: `docker stats`
- Adjust Gunicorn workers based on CPU cores
- Configure Redis memory limits
- Set up log rotation

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review this documentation
3. Check the application documentation in the repository

## 🔄 Updates and Rollbacks

### Zero-downtime Updates

```bash
# Update code
git pull origin main

# Deploy with zero downtime
docker-compose -f docker-compose.prod.yml up -d --build --scale backend=2
docker-compose -f docker-compose.prod.yml up -d --scale backend=1
```

### Rollback

```bash
# Rollback to previous version
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

---

**🎉 Your Coastal Banking application is now deployed and production-ready!**

Remember to:
- Set up monitoring and alerting
- Configure backups
- Keep SSL certificates updated
- Monitor logs regularly
- Apply security updates