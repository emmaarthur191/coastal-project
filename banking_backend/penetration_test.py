#!/usr/bin/env python
"""
Security Penetration Testing Script for Coastal Banking
Simulates various attack vectors to identify vulnerabilities
"""

import os
import sys
import django
import json
import time
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework import status
from users.models import UserProfile

User = get_user_model()

class PenetrationTester:
    def __init__(self):
        self.client = Client()
        self.results = {
            'critical': [],
            'high': [],
            'medium': [],
            'low': [],
            'info': []
        }
        self.test_user = None
        
    def log_finding(self, severity, category, title, description, recommendation):
        """Log a security finding"""
        finding = {
            'severity': severity,
            'category': category,
            'title': title,
            'description': description,
            'recommendation': recommendation,
            'timestamp': datetime.now().isoformat()
        }
        self.results[severity].append(finding)
        
        severity_emoji = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🔵',
            'info': 'ℹ️'
        }
        print(f"{severity_emoji[severity]} [{severity.upper()}] {category}: {title}")
    
    # ===== AUTHENTICATION ATTACKS =====
    
    def test_brute_force_protection(self):
        """Test if brute force attacks are properly mitigated"""
        print("\n=== Testing Brute Force Protection ===")
        
        # Attempt multiple failed logins
        failed_attempts = 0
        for i in range(10):
            response = self.client.post('/api/users/auth/login/', 
                                       data=json.dumps({
                                           'email': 'test@example.com',
                                           'password': f'wrongpass{i}'
                                       }),
                                       content_type='application/json')
            if response.status_code == 401:
                failed_attempts += 1
        
        # Check if account gets locked
        if failed_attempts >= 5:
            self.log_finding('info', 'Authentication', 
                           'Brute Force Protection Active',
                           'System allows multiple failed login attempts but should implement account lockout',
                           'Verify account lockout mechanism is working after 5 failed attempts')
    
    def test_account_enumeration(self):
        """Test if account enumeration is possible"""
        print("\n=== Testing Account Enumeration ===")
        
        # Test with valid vs invalid emails
        valid_response = self.client.post('/api/users/auth/login/',
                                         data=json.dumps({
                                             'email': 'admin@test.com',
                                             'password': 'wrongpass'
                                         }),
                                         content_type='application/json')
        
        invalid_response = self.client.post('/api/users/auth/login/',
                                           data=json.dumps({
                                               'email': 'nonexistent@test.com',
                                               'password': 'wrongpass'
                                           }),
                                           content_type='application/json')
        
        # Check if responses differ (potential enumeration)
        if valid_response.status_code != invalid_response.status_code:
            self.log_finding('medium', 'Authentication',
                           'Potential Account Enumeration',
                           'Different responses for valid vs invalid emails may allow attackers to enumerate accounts',
                           'Return generic error messages for both valid and invalid emails')
    
    def test_jwt_manipulation(self):
        """Test JWT token security"""
        print("\n=== Testing JWT Token Security ===")
        
        # Test with malformed tokens
        malformed_tokens = [
            'Bearer eyJhbGciOiJub25lIn0.eyJ1c2VyX2lkIjoxfQ.',  # None algorithm
            'Bearer ' + 'A' * 500,  # Oversized token
            'Bearer ../../../etc/passwd',  # Path traversal
        ]
        
        for token in malformed_tokens:
            response = self.client.get('/api/users/profile/',
                                      HTTP_AUTHORIZATION=token)
            if response.status_code != 401:
                self.log_finding('high', 'Authentication',
                               'JWT Token Validation Issue',
                               f'Malformed token not properly rejected: {token[:50]}...',
                               'Ensure strict JWT validation and reject malformed tokens')
    
    # ===== INJECTION ATTACKS =====
    
    def test_sql_injection(self):
        """Test for SQL injection vulnerabilities"""
        print("\n=== Testing SQL Injection ===")
        
        sql_payloads = [
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT NULL--",
            "1' AND 1=1--",
            "'; DROP TABLE users--"
        ]
        
        for payload in sql_payloads:
            response = self.client.post('/api/users/auth/login/',
                                       data=json.dumps({
                                           'email': payload,
                                           'password': 'test'
                                       }),
                                       content_type='application/json')
            
            # Check for SQL errors in response
            if response.status_code == 500:
                try:
                    data = response.json()
                    if 'SQL' in str(data) or 'syntax' in str(data).lower():
                        self.log_finding('critical', 'Injection',
                                       'Potential SQL Injection',
                                       f'SQL error exposed with payload: {payload}',
                                       'Use parameterized queries and ORM. Never expose SQL errors to users.')
                except:
                    pass
    
    def test_xss_vulnerabilities(self):
        """Test for XSS vulnerabilities"""
        print("\n=== Testing XSS Vulnerabilities ===")
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>"
        ]
        
        # Test in various input fields
        for payload in xss_payloads:
            response = self.client.post('/api/users/auth/login/',
                                       data=json.dumps({
                                           'email': payload,
                                           'password': 'test'
                                       }),
                                       content_type='application/json')
            
            if payload in str(response.content):
                self.log_finding('high', 'Injection',
                               'Potential XSS Vulnerability',
                               f'Unescaped user input reflected: {payload}',
                               'Implement proper output encoding and CSP headers')
    
    # ===== AUTHORIZATION ATTACKS =====
    
    def test_idor_vulnerabilities(self):
        """Test for Insecure Direct Object Reference"""
        print("\n=== Testing IDOR Vulnerabilities ===")
        
        # Create test user
        try:
            user1 = User.objects.create_user(
                email='pentest1@test.com',
                password='Test123!',
                role='customer'
            )
            UserProfile.objects.create(user=user1)
            
            user2 = User.objects.create_user(
                email='pentest2@test.com',
                password='Test123!',
                role='customer'
            )
            UserProfile.objects.create(user=user2)
            
            # Login as user1
            response = self.client.post('/api/users/auth/login/',
                                       data=json.dumps({
                                           'email': 'pentest1@test.com',
                                           'password': 'Test123!'
                                       }),
                                       content_type='application/json')
            
            if response.status_code == 200:
                token = response.json().get('access')
                
                # Try to access user2's profile
                response = self.client.get(f'/api/users/profile/{user2.id}/',
                                          HTTP_AUTHORIZATION=f'Bearer {token}')
                
                if response.status_code == 200:
                    self.log_finding('high', 'Authorization',
                                   'IDOR Vulnerability Detected',
                                   'User can access other users\' profiles without authorization',
                                   'Implement proper authorization checks for all object access')
            
            # Cleanup
            user1.delete()
            user2.delete()
            
        except Exception as e:
            print(f"IDOR test error: {e}")
    
    def test_privilege_escalation(self):
        """Test for privilege escalation vulnerabilities"""
        print("\n=== Testing Privilege Escalation ===")
        
        try:
            # Create low-privilege user
            user = User.objects.create_user(
                email='lowpriv@test.com',
                password='Test123!',
                role='customer'
            )
            UserProfile.objects.create(user=user)
            
            # Login
            response = self.client.post('/api/users/auth/login/',
                                       data=json.dumps({
                                           'email': 'lowpriv@test.com',
                                           'password': 'Test123!'
                                       }),
                                       content_type='application/json')
            
            if response.status_code == 200:
                token = response.json().get('access')
                
                # Try to access admin endpoints
                admin_endpoints = [
                    '/api/users/staff/',
                    '/api/users/create/',
                    '/api/operations/reports/',
                ]
                
                for endpoint in admin_endpoints:
                    response = self.client.get(endpoint,
                                              HTTP_AUTHORIZATION=f'Bearer {token}')
                    
                    if response.status_code == 200:
                        self.log_finding('critical', 'Authorization',
                                       'Privilege Escalation Possible',
                                       f'Low-privilege user accessed admin endpoint: {endpoint}',
                                       'Implement strict role-based access control on all endpoints')
            
            user.delete()
            
        except Exception as e:
            print(f"Privilege escalation test error: {e}")
    
    # ===== BUSINESS LOGIC ATTACKS =====
    
    def test_rate_limit_bypass(self):
        """Test if rate limits can be bypassed"""
        print("\n=== Testing Rate Limit Bypass ===")
        
        # Rapid requests to same endpoint
        responses = []
        for i in range(150):  # Exceed typical rate limit
            response = self.client.get('/api/users/auth/check/')
            responses.append(response.status_code)
        
        # Check if any requests were rate limited
        rate_limited = any(status == 429 for status in responses)
        
        if not rate_limited:
            self.log_finding('medium', 'Business Logic',
                           'Rate Limiting May Be Insufficient',
                           'Made 150 requests without hitting rate limit',
                           'Review and strengthen rate limiting configuration')
    
    # ===== API SECURITY =====
    
    def test_mass_assignment(self):
        """Test for mass assignment vulnerabilities"""
        print("\n=== Testing Mass Assignment ===")
        
        try:
            # Try to create user with elevated privileges
            response = self.client.post('/api/users/auth/register/',
                                       data=json.dumps({
                                           'email': 'hacker@test.com',
                                           'password': 'Test123!',
                                           'role': 'administrator',  # Attempt privilege escalation
                                           'is_superuser': True,
                                           'is_staff': True
                                       }),
                                       content_type='application/json')
            
            if response.status_code == 201:
                data = response.json()
                if data.get('role') == 'administrator':
                    self.log_finding('critical', 'API Security',
                                   'Mass Assignment Vulnerability',
                                   'User can set their own role during registration',
                                   'Whitelist allowed fields and never allow role assignment via API')
        except Exception as e:
            print(f"Mass assignment test error: {e}")
    
    def test_excessive_data_exposure(self):
        """Test for excessive data exposure"""
        print("\n=== Testing Excessive Data Exposure ===")
        
        try:
            # Create test user
            user = User.objects.create_user(
                email='datatest@test.com',
                password='Test123!',
                role='customer'
            )
            profile = UserProfile.objects.create(user=user)
            profile.set_ssnit_number('123456789012')
            profile.save()
            
            # Login and get profile
            response = self.client.post('/api/users/auth/login/',
                                       data=json.dumps({
                                           'email': 'datatest@test.com',
                                           'password': 'Test123!'
                                       }),
                                       content_type='application/json')
            
            if response.status_code == 200:
                token = response.json().get('access')
                response = self.client.get('/api/users/profile/',
                                          HTTP_AUTHORIZATION=f'Bearer {token}')
                
                if response.status_code == 200:
                    data = response.json()
                    # Check if sensitive data is exposed
                    sensitive_fields = ['ssnit_number', 'password', 'reset_token']
                    exposed = [field for field in sensitive_fields if field in str(data)]
                    
                    if exposed:
                        self.log_finding('high', 'Data Security',
                                       'Sensitive Data Exposure',
                                       f'Sensitive fields exposed in API: {exposed}',
                                       'Remove sensitive fields from API responses')
            
            user.delete()
            
        except Exception as e:
            print(f"Data exposure test error: {e}")
    
    # ===== INFRASTRUCTURE SECURITY =====
    
    def test_security_headers(self):
        """Test for security headers"""
        print("\n=== Testing Security Headers ===")
        
        response = self.client.get('/api/users/auth/check/')
        
        required_headers = {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age',
        }
        
        missing_headers = []
        for header, expected in required_headers.items():
            if header not in response:
                missing_headers.append(header)
            elif expected not in response[header]:
                missing_headers.append(f"{header} (incorrect value)")
        
        if missing_headers:
            self.log_finding('medium', 'Infrastructure',
                           'Missing Security Headers',
                           f'Missing or incorrect headers: {", ".join(missing_headers)}',
                           'Implement all recommended security headers')
    
    def test_cors_misconfiguration(self):
        """Test for CORS misconfiguration"""
        print("\n=== Testing CORS Configuration ===")
        
        # Test with various origins
        test_origins = [
            'http://evil.com',
            'https://evil.com',
            'null',
        ]
        
        for origin in test_origins:
            response = self.client.options('/api/users/auth/check/',
                                          HTTP_ORIGIN=origin)
            
            if 'Access-Control-Allow-Origin' in response:
                allowed_origin = response['Access-Control-Allow-Origin']
                if allowed_origin == '*' or allowed_origin == origin:
                    self.log_finding('high', 'Infrastructure',
                                   'CORS Misconfiguration',
                                   f'Dangerous origin allowed: {origin}',
                                   'Restrict CORS to trusted origins only')
    
    def generate_report(self):
        """Generate penetration testing report"""
        print("\n" + "="*80)
        print("PENETRATION TESTING REPORT")
        print("="*80)
        print(f"Timestamp: {datetime.now().isoformat()}\n")
        
        total_findings = sum(len(findings) for findings in self.results.values())
        print(f"Total Findings: {total_findings}")
        print(f"  🔴 Critical: {len(self.results['critical'])}")
        print(f"  🟠 High: {len(self.results['high'])}")
        print(f"  🟡 Medium: {len(self.results['medium'])}")
        print(f"  🔵 Low: {len(self.results['low'])}")
        print(f"  ℹ️  Info: {len(self.results['info'])}")
        
        # Print detailed findings
        for severity in ['critical', 'high', 'medium', 'low', 'info']:
            if self.results[severity]:
                print(f"\n{'='*80}")
                print(f"{severity.upper()} SEVERITY FINDINGS")
                print(f"{'='*80}")
                
                for finding in self.results[severity]:
                    print(f"\n[{finding['category']}] {finding['title']}")
                    print(f"Description: {finding['description']}")
                    print(f"Recommendation: {finding['recommendation']}")
        
        # Save report
        report_file = 'penetration_test_report.json'
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n\nDetailed report saved to: {report_file}")
        
        return total_findings
    
    def run_all_tests(self):
        """Run all penetration tests"""
        print("Starting Security Penetration Testing...")
        print("="*80)
        
        try:
            # Authentication tests
            self.test_brute_force_protection()
            self.test_account_enumeration()
            self.test_jwt_manipulation()
            
            # Injection tests
            self.test_sql_injection()
            self.test_xss_vulnerabilities()
            
            # Authorization tests
            self.test_idor_vulnerabilities()
            self.test_privilege_escalation()
            
            # Business logic tests
            self.test_rate_limit_bypass()
            
            # API security tests
            self.test_mass_assignment()
            self.test_excessive_data_exposure()
            
            # Infrastructure tests
            self.test_security_headers()
            self.test_cors_misconfiguration()
            
        except Exception as e:
            print(f"\nError during testing: {e}")
        
        return self.generate_report()

if __name__ == '__main__':
    tester = PenetrationTester()
    findings = tester.run_all_tests()
    sys.exit(0 if findings == 0 else 1)
