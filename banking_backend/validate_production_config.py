#!/usr/bin/env python3
"""Production configuration validator with CI-friendly options."""

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

REQUIRED_ENV_VARS = [
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
    'REDIS_URL',
]

PLACEHOLDER_MARKERS = [
    'your-production-domain.com',
    'your-email-provider.com',
    '<your-domain>',
    '<your-smtp-password>',
    '<your-sentry-dsn>',
    'your-aws-access-key',
    'your-aws-secret-key',
    'your-production-bucket',
    'your-32-character-encryption-key-here',
    'your-16-character-salt-here',
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Validate production configuration settings.')
    parser.add_argument('--env-file', default='.env.production', help='Path to the production env file to validate')
    parser.add_argument('--allow-placeholders', action='store_true', help='Allow placeholder values (useful for template validation)')
    parser.add_argument('--schema-only', action='store_true', help='Only validate environment file structure (skip Django/dependency checks)')
    parser.add_argument('--skip-django', action='store_true', help='Skip Django settings validation step')
    parser.add_argument('--skip-security', action='store_true', help='Skip security header validation step')
    parser.add_argument('--skip-dependencies', action='store_true', help='Skip Python dependency presence check')
    parser.add_argument('--no-checklist', action='store_true', help='Do not rewrite PRODUCTION_DEPLOYMENT_CHECKLIST.md')
    return parser.parse_args()


def read_env_file(env_file: str) -> Dict[str, str]:
    env_map: Dict[str, str] = {}
    path = Path(env_file)
    if not path.exists():
        return env_map

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        env_map[key.strip()] = value.strip()
    return env_map


def load_environment(env_file: str) -> Dict[str, str]:
    env_map = read_env_file(env_file)
    for key, value in env_map.items():
        os.environ.setdefault(key, value)
    return env_map


def validate_environment_file(env_file: str, allow_placeholders: bool) -> Tuple[bool, List[str]]:
    env_map = read_env_file(env_file)
    if not env_map:
        print(f"[ERROR] Environment file '{env_file}' not found or empty")
        return False, []

    missing = [var for var in REQUIRED_ENV_VARS if var not in env_map]
    if missing:
        print(f"[ERROR] Missing environment variables: {', '.join(missing)}")
    else:
        print('[SUCCESS] All required environment variables are present')

    placeholder_hits: List[str] = []
    if not allow_placeholders:
        for key, value in env_map.items():
            if any(marker in value for marker in PLACEHOLDER_MARKERS):
                placeholder_hits.append(key)
        if placeholder_hits:
            print(f"[ERROR] Placeholder values detected: {', '.join(placeholder_hits)}")
        else:
            print('[SUCCESS] No placeholder values detected')
    else:
        print('[INFO] Placeholder detection skipped (allow-placeholders enabled)')

    return not missing and (allow_placeholders or not placeholder_hits), placeholder_hits


def validate_django_settings() -> bool:
    import django

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    os.environ.setdefault('ENVIRONMENT', 'production')
    try:
        django.setup()
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[ERROR] Failed to initialize Django settings: {exc}")
        return False

    from django.conf import settings

    checks = [
        (bool(getattr(settings, 'SECRET_KEY', None)) and settings.SECRET_KEY != 'django-insecure-development-key', 'SECRET_KEY is configured'),
        (not getattr(settings, 'DEBUG', True), 'DEBUG is disabled'),
        (getattr(settings, 'ENVIRONMENT', 'development') == 'production', 'ENVIRONMENT is set to production'),
        (bool(getattr(settings, 'ALLOWED_HOSTS', [])), 'ALLOWED_HOSTS configured'),
        (bool(getattr(settings, 'CORS_ALLOWED_ORIGINS', [])), 'CORS_ALLOWED_ORIGINS configured'),
        (getattr(settings, 'SECURE_SSL_REDIRECT', False), 'SECURE_SSL_REDIRECT enabled'),
        (bool(getattr(settings, 'ENCRYPTION_KEY', None)), 'ENCRYPTION_KEY available'),
    ]

    status = True
    for ok, description in checks:
        if ok:
            print(f"[SUCCESS] {description}")
        else:
            print(f"[ERROR] {description}")
            status = False
    return status


def check_dependencies() -> bool:
    required_packages = [
        ('django', 'django'),
        ('djangorestframework', 'rest_framework'),
        ('django_cors_headers', 'corsheaders'),
        ('django_structlog', 'django_structlog'),
        ('django_prometheus', 'django_prometheus'),
        ('django_health_check', 'health_check'),
        ('django_auditlog', 'auditlog'),
        ('python_decouple', 'decouple'),
        ('dj_database_url', 'dj_database_url'),
        ('psycopg2_binary', 'psycopg2'),
        ('redis', 'redis'),
        ('django_redis', 'django_redis'),
        ('boto3', 'boto3'),
        ('sentry_sdk', 'sentry_sdk'),
        ('structlog', 'structlog'),
    ]

    missing: List[str] = []
    for package_name, import_name in required_packages:
        try:
            __import__(import_name)
            print(f"[SUCCESS] {package_name} installed")
        except ImportError:
            print(f"[WARNING] {package_name} missing")
            missing.append(package_name)

    if missing:
        print(f"[INFO] Install missing packages with: py -m pip install {' '.join(missing)}")
    return not missing


def validate_security_config() -> bool:
    import django

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    os.environ.setdefault('ENVIRONMENT', 'production')
    try:
        django.setup()
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[ERROR] Failed to initialize Django settings for security checks: {exc}")
        return False

    from django.conf import settings

    checks = [
        (not getattr(settings, 'DEBUG', True), 'Debug mode disabled'),
        (getattr(settings, 'SECURE_SSL_REDIRECT', False), 'SSL redirect enabled'),
        (getattr(settings, 'SECURE_HSTS_SECONDS', 0) > 0, 'HSTS enabled'),
        (getattr(settings, 'SECURE_BROWSER_XSS_FILTER', False), 'XSS protection enabled'),
        (getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False), 'Content-Type sniffing protection enabled'),
        (getattr(settings, 'X_FRAME_OPTIONS', '').upper() == 'DENY', 'Clickjacking protection enabled'),
    ]

    status = True
    for ok, description in checks:
        if ok:
            print(f"[SUCCESS] {description}")
        else:
            print(f"[ERROR] {description}")
            status = False
    return status


def create_production_checklist():
    checklist = """# Production Deployment Checklist

## Pre-Deployment Configuration
- [ ] Secrets loaded via secure vault (SECURE_SECRETS_* variables)
- [ ] `.env.production` copied with real values
- [ ] Placeholder values removed from configuration files
- [ ] `python validate_production_config.py` executed with no errors
- [ ] `python manage.py sync_secure_superusers` run with vaulted credentials

## Infrastructure
- [ ] PostgreSQL database provisioned with network restrictions
- [ ] Redis cluster secured with passwords/TLS
- [ ] Object storage configured for media/static files
- [ ] HTTPS certificates (Let’s Encrypt or ACM) installed

## Application
- [ ] `python manage.py migrate` executed
- [ ] `python manage.py collectstatic --noinput` executed
- [ ] Application image built and pushed to registry
- [ ] Health check endpoints verified

## Security & Monitoring
- [ ] Sentry DSN configured via secrets
- [ ] Rate limiting verified in staging
- [ ] Prometheus/Grafana dashboards updated with new release
- [ ] Log shipping enabled (CloudWatch/ELK)

## Deployment Steps
1. `export ENVIRONMENT=production`
2. `python validate_production_config.py`
3. `python manage.py migrate`
4. `python manage.py collectstatic --noinput`
5. `python manage.py sync_secure_superusers`
6. Deploy Docker images via CI/CD pipeline
7. Run smoke tests and health checks

## Post-Deployment
- [ ] Admin portal accessible via HTTPS
- [ ] API end-points responding within SLA
- [ ] Background workers/Channels healthy
- [ ] Audit/Security logs storing new entries
"""
    Path('PRODUCTION_DEPLOYMENT_CHECKLIST.md').write_text(checklist)
    print('[INFO] PRODUCTION_DEPLOYMENT_CHECKLIST.md updated')


def summarize(results: Dict[str, bool]) -> bool:
    print('\n' + '=' * 80)
    print('VALIDATION SUMMARY')
    print('=' * 80)
    success = True
    for name, outcome in results.items():
        label = name.replace('_', ' ').title()
        if outcome:
            print(f"[SUCCESS] {label}")
        else:
            print(f"[ERROR] {label}")
            success = False
    if success:
        print('\n[SUCCESS] All validation checks passed')
    else:
        print('\n[WARNING] Some validation checks failed')
    return success


def main() -> int:
    args = parse_args()
    print('PRODUCTION CONFIGURATION VALIDATION')
    print('====================================')

    load_environment(args.env_file)
    results: Dict[str, bool] = {}

    env_ok, placeholders = validate_environment_file(args.env_file, allow_placeholders=args.allow_placeholders)
    results['environment_file'] = env_ok

    if not args.schema_only and not args.skip_dependencies:
        results['dependencies'] = check_dependencies()
    if not args.schema_only and not args.skip_django:
        results['django_settings'] = validate_django_settings()
    if not args.schema_only and not args.skip_security:
        results['security_config'] = validate_security_config()

    if not args.no_checklist:
        create_production_checklist()

    success = summarize(results)
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
