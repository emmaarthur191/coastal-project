# Coastal Banking - Production Deployment Checklist

## Pre-Deployment

- [ ] Copy `.env.example` to `.env`
- [ ] Configure all environment variables in `.env`
- [ ] Generate new SECRET_KEY for production
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Set up PostgreSQL database
- [ ] Configure `DATABASE_URL`
- [ ] Set up Redis server
- [ ] Configure email settings (SMTP)
- [ ] Configure Sendexa SMS API keys
- [ ] Set up Sentry account and get DSN

## Deployment Steps

1. **Run deployment script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Configure Web Server** (Nginx recommended):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location /static/ {
           alias /path/to/coastal/banking_backend/staticfiles/;
       }

       location /media/ {
           alias /path/to/coastal/banking_backend/media/;
       }

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **SSL/TLS Certificate** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Process Manager** (systemd example):
   Create `/etc/systemd/system/coastal-banking.service`:
   ```ini
   [Unit]
   Description=Coastal Banking Gunicorn
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/coastal/banking_backend
   Environment="PATH=/path/to/venv/bin"
   ExecStart=/path/to/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 4

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start:
   ```bash
   sudo systemctl enable coastal-banking
   sudo systemctl start coastal-banking
   ```

## Post-Deployment

- [ ] Verify all API endpoints work
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify WebSocket connections
- [ ] Check Sentry error tracking
- [ ] Verify email delivery
- [ ] Test SMS OTP
- [ ] Run load tests
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring dashboards

## Security Verification

- [ ] Run `python manage.py check --deploy`
- [ ] Verify HTTPS is enforced
- [ ] Check CSP headers
- [ ] Verify CORS configuration
- [ ] Test rate limiting
- [ ] Review file permissions
- [ ] Audit user permissions
- [ ] Test backup restoration

## Monitoring

- [ ] Configure Sentry alerts
- [ ] Set up server monitoring (htop, netdata)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Database performance monitoring

## Maintenance

- [ ] Schedule database backups (daily)
- [ ] Schedule log rotation
- [ ] Plan for updates and patches
- [ ] Document deployment process
- [ ] Create rollback procedure
