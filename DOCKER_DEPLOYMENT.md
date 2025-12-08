# Docker Deployment Guide - Coastal Banking

## Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- Port 80 and 443 available
- At least 4GB RAM available for Docker

### 2. Initial Setup

```bash
# Navigate to project root
cd e:\coastal

# Copy environment template
copy .env.docker .env

# Edit .env file with your configuration
notepad .env
```

### 3. Generate Security Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Generate ENCRYPTION_KEY
python -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"

# Generate ENCRYPTION_SALT
python -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(16)).decode())"
```

### 4. Configure Network Access

#### For Local Network Access:
1. Find your local IP: `ipconfig` (look for IPv4 Address)
2. Update `.env`:
   ```
   ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.XXX
   CORS_ALLOWED_ORIGINS=http://localhost,http://192.168.1.XXX
   ```

#### For Internet Access:
1. Find your public IP: Visit https://whatismyipaddress.com
2. Configure port forwarding on your router:
   - Forward port 80 to your machine's local IP
   - Forward port 443 to your machine's local IP (for HTTPS)
3. Update `.env` with your public IP or domain

### 5. Build and Start

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Create Superuser

```bash
# Access backend container
docker exec -it coastal_backend bash

# Create superuser
python manage.py createsuperuser

# Exit container
exit
```

### 7. Access Application

- **Frontend**: http://localhost or http://your-ip
- **Backend API**: http://localhost/api or http://your-ip/api
- **Admin Panel**: http://localhost/admin or http://your-ip/admin

## Network Configuration

### Local Network Access

Users on the same network can access using:
```
http://192.168.1.XXX
```

### Internet Access

#### Option 1: Port Forwarding (Home Network)
1. Access your router admin panel (usually 192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server" settings
3. Add rules:
   - External Port: 80 → Internal IP: 192.168.1.XXX, Internal Port: 80
   - External Port: 443 → Internal IP: 192.168.1.XXX, Internal Port: 443
4. Users access via: `http://your-public-ip`

#### Option 2: Dynamic DNS (Recommended)
1. Sign up for free DDNS service (No-IP, DuckDNS, etc.)
2. Get a domain like: `coastal-banking.ddns.net`
3. Configure DDNS client on your router or computer
4. Update `.env` with your domain
5. Users access via: `http://coastal-banking.ddns.net`

#### Option 3: Cloud Deployment (Production)
For production, deploy to:
- AWS EC2 / Lightsail
- DigitalOcean Droplet
- Google Cloud Platform
- Azure VM

## SSL/HTTPS Configuration

### Using Let's Encrypt (Free SSL)

```bash
# Install certbot
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d your-domain.com

# Update docker-compose.yml to mount certificates
# Restart with SSL profile
docker-compose --profile production up -d
```

## Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart specific service
docker-compose restart backend

# View logs for specific service
docker-compose logs -f backend

# Execute command in container
docker exec -it coastal_backend python manage.py migrate

# Backup database
docker exec coastal_postgres pg_dump -U coastal_user coastal_banking > backup.sql

# Restore database
docker exec -i coastal_postgres psql -U coastal_user coastal_banking < backup.sql

# Update and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Firewall Configuration

### Windows Firewall
```powershell
# Allow port 80
netsh advfirewall firewall add rule name="Coastal Banking HTTP" dir=in action=allow protocol=TCP localport=80

# Allow port 443
netsh advfirewall firewall add rule name="Coastal Banking HTTPS" dir=in action=allow protocol=TCP localport=443
```

### Check if ports are open
```bash
# Test from another machine
curl http://your-ip
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check if ports are in use
netstat -ano | findstr :80
netstat -ano | findstr :443
```

### Database connection errors
```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

### Cannot access from other devices
1. Check firewall settings
2. Verify ALLOWED_HOSTS in .env
3. Ensure Docker is binding to 0.0.0.0, not 127.0.0.1
4. Check router port forwarding

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong SECRET_KEY
- [ ] Generated unique ENCRYPTION_KEY and SALT
- [ ] Configured ALLOWED_HOSTS properly
- [ ] Enabled HTTPS/SSL
- [ ] Configured firewall
- [ ] Set up regular backups
- [ ] Disabled DEBUG mode
- [ ] Reviewed CORS settings
- [ ] Set up monitoring

## Monitoring

### Health Checks
- Backend: http://your-ip/health/
- Database: `docker exec coastal_postgres pg_isready`
- Redis: `docker exec coastal_redis redis-cli ping`

### Resource Usage
```bash
docker stats
```

## Production Recommendations

1. **Use HTTPS**: Always use SSL certificates in production
2. **Regular Backups**: Automate database and media backups
3. **Monitoring**: Set up Sentry, Prometheus, or similar
4. **Scaling**: Use Docker Swarm or Kubernetes for multiple servers
5. **CDN**: Use CloudFlare or similar for static files
6. **Database**: Use managed database service (AWS RDS, etc.)
7. **Load Balancer**: Use Nginx or HAProxy for multiple backends

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review documentation: README.md, DEPLOYMENT.md
- Check Docker status: `docker-compose ps`
