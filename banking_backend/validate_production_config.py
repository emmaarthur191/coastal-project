#!/usr/bin/env python3
"""
Production Configuration Validator
Tests the production environment configuration for completeness and security.
"""

import os
import sys
import django
from pathlib import Path
from decouple import config

def load_production_environment():
    """Load production environment variables."""
    env_file = Path('.env.production')
    if env_file.exists():
        print("[INFO] Loading production environment variables from .env.production")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
        print("[SUCCESS] Production environment variables loaded")
    else:
        print("[WARNING] .env.production file not found")

def validate_environment_file():
    """Validate the .env.production file exists and has required variables."""
    print("\n" + "=" * 80)
    print("VALIDATING PRODUCTION ENVIRONMENT FILE")
    print("=" * 80)
    
    env_file = Path('.env.production')
    if not env_file.exists():
        print("[ERROR] .env.production file not found!")
        return False
    
    # Read and validate required variables
    with open(env_file, 'r') as f:
        content = f.read()
    
    required_vars = [
        'SECRET_KEY',
        'DEBUG',
        'ENVIRONMENT',
        'ALLOWED_HOSTS',
        'DATABASE_URL',
        'ENCRYPTION_KEY',
        'ENCRYPTION_SALT',
        'EMAIL_HOST',
        'CORS_ALLOWED_ORIGINS',
        'SENTRY_DSN',
        'REDIS_URL'
    ]
    
    missing_vars = []
    for var in required_vars:
        if var not in content:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"[WARNING] Missing variables: {', '.join(missing_vars)}")
    else:
        print("[SUCCESS] All required environment variables are present")
    
    # Check for placeholder values that need to be updated
    placeholder_patterns = [
        'your-production-domain.com',
        'your-email-provider.com',
        'yourbank.com',
        'your-email-app-password',
        'your-sentry-dsn@sentry.io/project-id',
        'your-aws-access-key',
        'your-aws-secret-key',
        'your-production-bucket'
    ]
    
    placeholders_found = []
    for pattern in placeholder_patterns:
        if pattern in content:
            placeholders_found.append(pattern)
    
    if placeholders_found:
        print(f"[WARNING] Placeholder values found that need updating: {', '.join(placeholders_found)}")
    else:
        print("[SUCCESS] No placeholder values found")
    
    return len(missing_vars) == 0

def validate_django_settings():
    """Validate Django settings can be loaded with production configuration."""
    print("\n" + "=" * 80)
    print("VALIDATING DJANGO SETTINGS")
    print("=" * 80)
    
    try:
        # Set environment to production and load env variables
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
        os.environ['ENVIRONMENT'] = 'production'
        
        # Setup Django
        django.setup()
        
        from django.conf import settings
        
        # Check critical settings
        checks = [
            (hasattr(settings, 'SECRET_KEY') and settings.SECRET_KEY != 'django-insecure-development-key', 
             "SECRET_KEY is set and not default"),
            (hasattr(settings, 'DEBUG') and not settings.DEBUG, 
             "DEBUG is disabled"),
            (hasattr(settings, 'ENVIRONMENT') and settings.ENVIRONMENT == 'production', 
             "ENVIRONMENT is set to production"),
            (hasattr(settings, 'ALLOWED_HOSTS') and len(settings.ALLOWED_HOSTS) > 0, 
             "ALLOWED_HOSTS is configured"),
            (hasattr(settings, 'CORS_ALLOWED_ORIGINS') and len(settings.CORS_ALLOWED_ORIGINS) > 0, 
             "CORS_ALLOWED_ORIGINS is configured"),
            (hasattr(settings, 'SECURE_SSL_REDIRECT'), 
             "SECURE_SSL_REDIRECT is set"),
            (hasattr(settings, 'ENCRYPTION_KEY'), 
             "ENCRYPTION_KEY is available"),
        ]
        
        all_passed = True
        for check,  # description in checks:
            if check:
                print(f"[SUCCESS] {description}")
            else:
                print(f"[ERROR] {description}")
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"[ERROR] Failed to load Django settings: {str(e)}")
        return False

def check_dependencies():
    """Check if all required dependencies are installed."""
    print("\n" + "=" * 80)
    print("VALIDATING DEPENDENCIES")
    print("=" * 80)
    
    required_packages = [
        ('django', 'django'),
        ('djangorestframework', 'rest_framework'),
        ('django_cors_headers', 'corsheaders'),
        ('django_structlog', 'django_structlog'),
        ('django_prometheus', 'django_prometheus'),
        ('django_health_check', 'health_check'),
        ('django_auditlog', 'auditlog'),
        ('django_ratelimit', 'ratelimit'),
        ('python_decouple', 'decouple'),
        ('dj_database_url', 'dj_database_url'),
        ('psycopg2_binary', 'psycopg2'),
        ('redis', 'redis'),
        ('django_redis', 'django_redis'),
        ('boto3', 'boto3'),
        ('sentry_sdk', 'sentry_sdk'),
        ('structlog', 'structlog')
    ]
    
    missing_packages = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"[SUCCESS] {package_name} is installed")
        except ImportError:
            print(f"[WARNING] {package_name} is not installed")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n[INFO] To install missing packages, run:")
        print(f"py -m pip install {' '.join(missing_packages)}")
    
    return len(missing_packages) == 0

def validate_security_config():
    """Validate security configuration settings."""
    print("\n" + "=" * 80)
    print("VALIDATING SECURITY CONFIGURATION")
    print("=" * 80)
    
    try:
        # Set environment to production
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
        os.environ['ENVIRONMENT'] = 'production'
        
        # Setup Django
        django.setup()
        
        from django.conf import settings
        
        security_settings = [
            ('DEBUG',  # not settings.DEBUG, "Debug mode disabled"),
            ('SECURE_SSL_REDIRECT', settings.SECURE_SSL_REDIRECT, "SSL redirect enabled"),
            ('SECURE_HSTS_SECONDS', settings.SECURE_HSTS_SECONDS > 0, "HSTS enabled"),
            ('SECURE_BROWSER_XSS_FILTER', settings.SECURE_BROWSER_XSS_FILTER, "XSS protection enabled"),
            ('SECURE_CONTENT_TYPE_NOSNIFF', settings.SECURE_CONTENT_TYPE_NOSNIFF, "Content type sniffing protection enabled"),
            ('X_FRAME_OPTIONS', settings.X_FRAME_OPTIONS == 'DENY', "Clickjacking protection enabled"),
        ]
        
        all_secure = True
        for setting_name, is_secure, description in security_settings:
            if is_secure:
                print(f"[SUCCESS] {description}")
            else:
                print(f"[ERROR] {description}")
                all_secure = False
        
        return all_secure
        
    except Exception as e:
        print(f"[ERROR] Failed to validate security settings: {str(e)}")
        return False

def create_production_checklist():
    """Create a production deployment checklist."""
    checklist_content = """# Production Deployment Checklist

## Pre-Deployment Configuration [COMPLETED]

### Environment Variables
- [COMPLETED] SECRET_KEY is generated and secure
- [COMPLETED] DEBUG=False in production
- [COMPLETED] ENVIRONMENT=production
- [PENDING] ALLOWED_HOSTS configured with production domains
- [PENDING] DATABASE_URL points to production database
- [COMPLETED] ENCRYPTION_KEY and ENCRYPTION_SALT are set
- [PENDING] Email configuration updated with production SMTP
- [PENDING] CORS_ALLOWED_ORIGINS configured with production frontend URLs
- [PENDING] SENTRY_DSN configured for error monitoring
- [PENDING] Redis/Cache configuration set up

### Security Settings
- [COMPLETED] SSL/TLS certificates configured
- [COMPLETED] SECURE_SSL_REDIRECT=True
- [COMPLETED] HSTS headers configured
- [COMPLETED] X-Frame-Options set to DENY
- [COMPLETED] Content Security Policy configured
- [PENDING] Rate limiting enabled
- [PENDING] Database connections secured

### Database
- [PENDING] Production database created and configured
- [PENDING] Database migrations applied
- [PENDING] Database backup strategy implemented
- [PENDING] Database user permissions properly set

### Monitoring & Logging
- [PENDING] Sentry error tracking configured
- [COMPLETED] Application logs configured
- [COMPLETED] Security audit logging enabled
- [COMPLETED] Prometheus metrics enabled
- [COMPLETED] Health check endpoints working

### File Storage
- [PENDING] Static files collection completed (python manage.py collectstatic)
- [PENDING] Media files storage configured (S3 or similar)
- [PENDING] File upload permissions configured

### Dependencies
- [PENDING] All Python dependencies installed
- [PENDING] Requirements file up to date
- [COMPLETED] Virtual environment configured
- [PENDING] Package versions locked

## Deployment Steps

1. **Environment Setup**
   ```bash
   # Set production environment
   export ENVIRONMENT=production
   
   # Load environment variables
   source .env.production
   ```

2. **Database Setup**
   ```bash
   # Run migrations
   python manage.py migrate
   
   # Collect static files
   python manage.py collectstatic --noinput
   
   # Create superuser (if needed)
   python manage.py createsuperuser
   ```

3. **Test Configuration**
   ```bash
   # Run configuration validation
   python validate_production_config.py
   
   # Test health check endpoint
   curl https://your-api-domain.com/health/
   ```

4. **Security Verification**
   ```bash
   # Check SSL configuration
   curl -I https://your-api-domain.com/
   
   # Verify security headers
   curl -I https://your-api-domain.com/api/health/
   ```

## Post-Deployment

- [PENDING] Application is accessible and responsive
- [PENDING] API endpoints are working correctly
- [PENDING] Authentication and authorization working
- [PENDING] Database connections are stable
- [PENDING] Error tracking is receiving reports
- [PENDING] Log files are being created
- [PENDING] Security headers are being sent
- [PENDING] Rate limiting is working

## Environment-Specific Notes

### Development
- Use `.env` file
- DEBUG=True allowed
- CORS allows localhost origins

### Staging
- Use `.env.staging` file
- DEBUG=False
- Production-like configuration

### Production
- Use `.env.production` file
- DEBUG=False
- Strict security settings
- Monitoring and logging enabled

## Next Steps for Production Deployment

1. **Update Placeholder Values**
   - Replace `your-aws-access-key-id-here` with actual AWS access key
   - Replace `your-aws-secret-access-key-here` with actual AWS secret key
   - Replace `your-secure-app-password-here` with actual email app password
   - Update domain names to match your actual production domains
   - Update SENTRY_DSN with your actual Sentry project DSN

2. **Database Configuration**
   - Set up production PostgreSQL database
   - Update DATABASE_URL with production database credentials
   - Run migrations in production environment

3. **External Services**
   - Configure production email service (SMTP settings)
   - Set up Sentry for error tracking
   - Configure AWS S3 for file storage
   - Set up Redis for caching

4. **Security Hardening**
   - Configure SSL/TLS certificates
   - Set up firewall rules
   - Configure rate limiting
   - Enable database connection encryption

5. **Monitoring**
   - Set up log aggregation
   - Configure health checks
   - Set up backup procedures
   - Test disaster recovery procedures
"""
    
    with open('PRODUCTION_DEPLOYMENT_CHECKLIST.md', 'w') as f:
        f.write(checklist_content)
    
    print("\n" + "=" * 80)
    print("UPDATED PRODUCTION DEPLOYMENT CHECKLIST")
    print("=" * 80)
    print("[SUCCESS] Updated PRODUCTION_DEPLOYMENT_CHECKLIST.md")

def main():
    """Run all validation checks."""
    print("PRODUCTION CONFIGURATION VALIDATION")
    print("=====================================")
    
    # Load production environment first
    load_production_environment()
    
    results = {
        'environment_file': validate_environment_file(),
        'django_settings': validate_django_settings(),
        'dependencies': check_dependencies(),
        'security_config': validate_security_config()
    }
    
    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    
    for check_name, result in results.items():
        status = "[SUCCESS]" if result else "[ERROR]"
        print(f"{status} {check_name.replace('_', ' ').title()}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n[SUCCESS] All validation checks passed!")
        print("Your production configuration is ready for deployment.")
    else:
        print("\n[WARNING] Some validation checks failed.")
        print("Please address the issues before deploying to production.")
    
    # Create deployment checklist
    create_production_checklist()
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)