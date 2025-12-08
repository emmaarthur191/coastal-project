#!/usr/bin/env python
"""
Comprehensive API Testing Script for Coastal Banking
Tests all critical endpoints for production readiness
"""

import os
import sys
import django
import json
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework import status
from users.models import UserProfile

User = get_user_model()

class APITester:
    def __init__(self):
        self.client = Client()
        self.results = {
            'passed': [],
            'failed': [],
            'warnings': []
        }
        self.test_user = None
        self.auth_token = None
        
    def setup_test_user(self):
        """Create a test user for API testing"""
        try:
            # Create superuser for testing
            self.test_user = User.objects.create_user(
                email='api_test@coastal.com',
                password='TestPass123!',
                first_name='API',
                last_name='Tester',
                role='superuser'
            )
            UserProfile.objects.create(user=self.test_user)
            print("✓ Test user created successfully")
        except Exception as e:
            print(f"✗ Failed to create test user: {e}")
            
    def cleanup_test_user(self):
        """Remove test user after testing"""
        if self.test_user:
            self.test_user.delete()
            print("✓ Test user cleaned up")
    
    def test_endpoint(self, name, method, url, data=None, auth_required=False, expected_status=200):
        """Generic endpoint tester"""
        try:
            headers = {}
            if auth_required and self.auth_token:
                headers['HTTP_AUTHORIZATION'] = f'Bearer {self.auth_token}'
            
            if method == 'GET':
                response = self.client.get(url, **headers)
            elif method == 'POST':
                response = self.client.post(url, data=data, content_type='application/json', **headers)
            elif method == 'PUT':
                response = self.client.put(url, data=data, content_type='application/json', **headers)
            elif method == 'DELETE':
                response = self.client.delete(url, **headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code == expected_status:
                self.results['passed'].append({
                    'name': name,
                    'url': url,
                    'method': method,
                    'status': response.status_code
                })
                print(f"✓ {name}: {method} {url} -> {response.status_code}")
                return True
            else:
                self.results['failed'].append({
                    'name': name,
                    'url': url,
                    'method': method,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': str(response.content[:200])
                })
                print(f"✗ {name}: {method} {url} -> Expected {expected_status}, got {response.status_code}")
                return False
        except Exception as e:
            self.results['failed'].append({
                'name': name,
                'url': url,
                'error': str(e)
            })
            print(f"✗ {name}: {method} {url} -> Error: {e}")
            return False
    
    def test_authentication_endpoints(self):
        """Test authentication-related endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Test login
        login_data = {
            'email': 'api_test@coastal.com',
            'password': 'TestPass123!'
        }
        response = self.client.post('/api/users/auth/login/', 
                                   data=json.dumps(login_data),
                                   content_type='application/json')
        
        if response.status_code == 200:
            try:
                data = response.json()
                self.auth_token = data.get('access')
                print(f"✓ Login successful, token obtained")
                self.results['passed'].append({
                    'name': 'User Login',
                    'url': '/api/users/auth/login/',
                    'status': 200
                })
            except:
                print(f"✗ Login response parsing failed")
                self.results['failed'].append({
                    'name': 'User Login',
                    'url': '/api/users/auth/login/',
                    'error': 'Failed to parse response'
                })
        else:
            print(f"✗ Login failed: {response.status_code}")
            self.results['failed'].append({
                'name': 'User Login',
                'url': '/api/users/auth/login/',
                'expected': 200,
                'actual': response.status_code
            })
        
        # Test auth check
        self.test_endpoint('Auth Check', 'GET', '/api/users/auth/check/', 
                          auth_required=True, expected_status=200)
        
        # Test logout
        self.test_endpoint('User Logout', 'POST', '/api/users/auth/logout/',
                          auth_required=True, expected_status=200)
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n=== Testing Health Check Endpoints ===")
        self.test_endpoint('Health Check', 'GET', '/health/', expected_status=200)
        self.test_endpoint('API Schema', 'GET', '/api/schema/', expected_status=200)
    
    def test_user_management_endpoints(self):
        """Test user management endpoints"""
        print("\n=== Testing User Management Endpoints ===")
        self.test_endpoint('User Profile', 'GET', '/api/users/profile/',
                          auth_required=True, expected_status=200)
        self.test_endpoint('Staff List', 'GET', '/api/users/staff/',
                          auth_required=True, expected_status=200)
    
    def test_banking_endpoints(self):
        """Test banking-related endpoints"""
        print("\n=== Testing Banking Endpoints ===")
        # These will likely fail without proper setup, but we test availability
        self.test_endpoint('Accounts List', 'GET', '/api/banking/accounts/',
                          auth_required=True, expected_status=200)
        self.test_endpoint('Transactions List', 'GET', '/api/banking/transactions/',
                          auth_required=True, expected_status=200)
    
    def test_messaging_endpoints(self):
        """Test messaging endpoints"""
        print("\n=== Testing Messaging Endpoints ===")
        self.test_endpoint('Messages List', 'GET', '/api/messaging/messages/',
                          auth_required=True, expected_status=200)
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "="*60)
        print("API TEST REPORT")
        print("="*60)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"\nPassed: {len(self.results['passed'])}")
        print(f"Failed: {len(self.results['failed'])}")
        print(f"Warnings: {len(self.results['warnings'])}")
        
        if self.results['failed']:
            print("\n--- Failed Tests ---")
            for failure in self.results['failed']:
                print(f"\n{failure['name']}:")
                print(f"  URL: {failure.get('url', 'N/A')}")
                if 'expected' in failure:
                    print(f"  Expected: {failure['expected']}, Got: {failure['actual']}")
                if 'error' in failure:
                    print(f"  Error: {failure['error']}")
        
        # Save report to file
        report_file = 'api_test_report.json'
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\nDetailed report saved to: {report_file}")
        
        return len(self.results['failed']) == 0
    
    def run_all_tests(self):
        """Run all API tests"""
        print("Starting Comprehensive API Testing...")
        print("="*60)
        
        self.setup_test_user()
        
        try:
            self.test_health_endpoints()
            self.test_authentication_endpoints()
            self.test_user_management_endpoints()
            self.test_banking_endpoints()
            self.test_messaging_endpoints()
        finally:
            self.cleanup_test_user()
        
        return self.generate_report()

if __name__ == '__main__':
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
