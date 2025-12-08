#!/usr/bin/env python3
"""
Security Audit Script for Banking Backend
Comprehensive security assessment and hardening checks.
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.contrib.auth.models import User
from django.db import connection


class SecurityAuditor:
    """Comprehensive security auditor for Django applications."""

    def __init__(self):
        self.findings = []
        self.score = 100

    def audit_all(self):
        """Run all security audits."""
        audits = [
            self.audit_django_settings,
            self.audit_database_security,
            self.audit_user_accounts,
            self.audit_file_permissions,
            self.audit_environment_variables,
            self.audit_dependencies,
            self.audit_ssl_configuration,
        ]

        for audit_func in audits:
            try:
                audit_func()
            except Exception as e:
                self.add_finding('ERROR', f'Audit failed: {str(e)}', 'high')

        return {
            'timestamp': datetime.utcnow().isoformat(),
            'score': self.score,
            'findings': self.findings,
            'summary': self.get_summary()
        }

    def add_finding(self, severity, description, risk_level='medium'):
        """Add a security finding."""
        finding = {
            'severity': severity,
            'description': description,
            'risk_level': risk_level,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.findings.append(finding)

        # Adjust score based on severity
        if risk_level == 'critical':
            self.score -= 25
        elif risk_level == 'high':
            self.score -= 15
        elif risk_level == 'medium':
            self.score -= 8
        elif risk_level == 'low':
            self.score -= 3

        self.score = max(0, self.score)

    def audit_django_settings(self):
        """Audit Django security settings."""
        # Check DEBUG setting
        if getattr(settings, 'DEBUG', False):
            self.add_finding('WARNING', 'DEBUG is enabled in production', 'high')

        # Check SECRET_KEY
        secret_key = getattr(settings, 'SECRET_KEY', '')
        if len(secret_key) < 32:
            self.add_finding('ERROR', 'SECRET_KEY is too short (should be at least 32 characters)', 'critical')

        if secret_key == 'django-insecure-development-key':
            self.add_finding('CRITICAL', 'Using default SECRET_KEY', 'critical')

        # Check ALLOWED_HOSTS
        allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
        if not allowed_hosts or allowed_hosts == ['*']:
            self.add_finding('ERROR', 'ALLOWED_HOSTS not properly configured', 'high')

        # Check security middleware
        middleware = getattr(settings, 'MIDDLEWARE', [])
        security_middleware = [
            'django.middleware.security.SecurityMiddleware',
            'django.middleware.csrf.CsrfViewMiddleware',
            'django.middleware.clickjacking.XFrameOptionsMiddleware'
        ]

        for mw in security_middleware:
            if mw not in middleware:
                self.add_finding('WARNING', f'Security middleware missing: {mw}', 'medium')

        # Check security headers
        if not hasattr(settings, 'SECURE_SSL_REDIRECT') or not settings.SECURE_SSL_REDIRECT:
            self.add_finding('WARNING', 'SECURE_SSL_REDIRECT not enabled', 'medium')

        if not hasattr(settings, 'SECURE_HSTS_SECONDS') or settings.SECURE_HSTS_SECONDS == 0:
            self.add_finding('WARNING', 'HSTS not configured', 'medium')

    def audit_database_security(self):
        """Audit database security configuration."""
        # Check database credentials
        db_settings = settings.DATABASES.get('default', {})

        if db_settings.get('PASSWORD') in ['password', '123456', 'admin', 'root']:
            self.add_finding('CRITICAL', 'Weak database password detected', 'critical')

        # Check for sensitive data in database
        try:
            with connection.cursor() as cursor:
                # Check for plaintext passwords (this is a simplified check)
                cursor.execute("""
                    SELECT COUNT(*) FROM users_user
                    WHERE password NOT LIKE 'pbkdf2_sha256$%%'
                    AND password NOT LIKE 'bcrypt$%%'
                    AND password NOT LIKE 'argon2$%%'
                """)
                weak_passwords = cursor.fetchone()[0]
                if weak_passwords > 0:
                    self.add_finding('ERROR', f'{weak_passwords} users have weak password hashes', 'high')

        except Exception as e:
            self.add_finding('WARNING', f'Could not check password hashes: {str(e)}', 'low')

    def audit_user_accounts(self):
        """Audit user account security."""
        # Check for admin/superuser accounts
        admin_users = User.objects.filter(is_superuser=True)
        if not admin_users.exists():
            self.add_finding('WARNING', 'No superuser accounts found', 'medium')

        # Check for inactive admin accounts
        inactive_admins = User.objects.filter(is_superuser=True, is_active=False)
        if inactive_admins.exists():
            self.add_finding('INFO', f'{inactive_admins.count()} inactive superuser accounts', 'low')

        # Check password strength (simplified)
        weak_users = []
        for user in User.objects.all():
            if len(user.password) < 20:  # Very basic check
                weak_users.append(user.username)

        if weak_users:
            self.add_finding('WARNING', f'Users with potentially weak passwords: {", ".join(weak_users[:5])}', 'medium')

    def audit_file_permissions(self):
        """Audit file and directory permissions."""
        sensitive_files = [
            'settings.py',
            '.env',
            '.env.production',
            'secrets.json',
            'key.pem',
            'cert.pem'
        ]

        for file_path in sensitive_files:
            full_path = Path(settings.BASE_DIR) / file_path
            if full_path.exists():
                # Check if file is readable by others
                mode = oct(full_path.stat().st_mode)[-3:]
                if mode[1] != '0' or mode[2] != '0':  # Group or others can read
                    self.add_finding('WARNING', f'File {file_path} has permissive permissions: {mode}', 'medium')

    def audit_environment_variables(self):
        """Audit environment variables for sensitive data."""
        sensitive_env_vars = [
            'SECRET_KEY',
            'DATABASE_URL',
            'REDIS_PASSWORD',
            'EMAIL_HOST_PASSWORD',
            'AWS_SECRET_ACCESS_KEY',
            'STRIPE_SECRET_KEY',
        ]

        for var in sensitive_env_vars:
            value = os.environ.get(var, '')
            if value:
                # Check for common weak patterns
                if any(weak in value.lower() for weak in ['password', '123456', 'admin', 'secret']):
                    self.add_finding('WARNING', f'Potentially weak value in {var}', 'medium')

    def audit_dependencies(self):
        """Audit Python dependencies for vulnerabilities."""
        try:
            # Check for known vulnerable packages (simplified)
            requirements_file = Path(settings.BASE_DIR) / 'requirements.txt'
            if requirements_file.exists():
                with open(requirements_file, 'r') as f:
                    content = f.read()

                # Check for outdated Django version
                if 'Django==' in content:
                    # This is a very basic check - in production,  # use tools like safety
                    self.add_finding('INFO', 'Consider using dependency scanning tools like safety or pip-audit', 'low')

        except Exception as e:
            self.add_finding('WARNING', f'Could not audit dependencies: {str(e)}', 'low')

    def audit_ssl_configuration(self):
        """Audit SSL/TLS configuration."""
        # Check if SSL is configured
        if not getattr(settings, 'SECURE_SSL_REDIRECT', False):
            self.add_finding('WARNING', 'SSL redirect not enabled', 'high')

        # Check certificate files if they exist
        cert_files = ['cert.pem', 'fullchain.pem']
        for cert_file in cert_files:
            cert_path = Path(settings.BASE_DIR) / cert_file
            if cert_path.exists():
                # Check certificate expiry (simplified)
                try:
                    result = subprocess.run(
                        ['openssl', 'x509', '-in', str(cert_path), '-noout', '-dates'],
                        capture_output=True, text=True, timeout=10
                    )
                    if 'notAfter=' in result.stdout:
                        # Parse expiry date (simplified)
                        self.add_finding('INFO', f'SSL certificate found: {cert_file}', 'low')
                except Exception:
                    self.add_finding('WARNING', f'Could not validate SSL certificate: {cert_file}', 'medium')

    def get_summary(self):
        """Get audit summary."""
        severity_counts = {}
        for finding in self.findings:
            severity = finding['severity']
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        return {
            'total_findings': len(self.findings),
            'severity_breakdown': severity_counts,
            'score': self.score,
            'grade': self.get_grade()
        }

    def get_grade(self):
        """Get security grade based on score."""
        if self.score >= 90:
            return 'A'
        elif self.score >= 80:
            return 'B'
        elif self.score >= 70:
            return 'C'
        elif self.score >= 60:
            return 'D'
        else:
            return 'F'


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description='Security audit for Banking Backend')
    parser.add_argument('--format', choices=['json', 'text'], default='text',
                       help='Output format')
    parser.add_argument('--output', help='Output file')

    args = parser.parse_args()

    auditor = SecurityAuditor()
    results = auditor.audit_all()

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Security audit results saved to {args.output}")
    elif args.format == 'json':
        print(json.dumps(results, indent=2))
    else:
        print(f"Security Audit Results")
        print(f"Grade: {results['summary']['grade']} (Score: {results['score']}/100)")
        print(f"Total Findings: {results['summary']['total_findings']}")
        print(f"Severity Breakdown: {results['summary']['severity_breakdown']}")
        print("\nFindings:")
        for finding in results['findings']:
            print(f"[{finding['severity']}] {finding['description']} (Risk: {finding['risk_level']})")


if __name__ == '__main__':
    main()