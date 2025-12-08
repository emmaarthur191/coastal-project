#!/usr/bin/env python3
"""
Comprehensive Test Script for All Banking System Fixes
Tests implemented fixes for frontend-backend integration issues
"""

import requests
import json
import time
from typing import Any

class BankingSystemTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
    
    def log_test(self, test_name: str, status: str, details: str, response_data: Any = None):
        """Log test results"""
        self.test_results.append({
            'test': test_name,
            'status': status,
            'details': details,
            'response_data': response_data,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        })
        print(f"[{status}] {test_name}: {details}")
    
    def authenticate(self) -> bool:
        """Authenticate user and get token"""
        print("\n=== AUTHENTICATION TEST ===")
        try:
            auth_data = {
                'email': 'spper',
                'password': 'Test123!@#'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/users/auth/login/",
                json=auth_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token') or data.get('token')
                if self.auth_token:
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.auth_token}'
                    })
                    self.log_test(
                        "User Authentication", 
                        "PASS", 
                        f"Successfully authenticated with token: {self.auth_token[:20]}..."
                    )
                    return True
                else:
                    self.log_test(
                        "User Authentication", 
                        "FAIL", 
                        "No token in response", 
                        response.json()
                    )
                    return False
            else:
                self.log_test(
                    "User Authentication", 
                    "FAIL", 
                    f"Authentication failed: {response.status_code}", 
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("User Authentication", "ERROR", f"Exception: {str(e)}")
            return False
    
    def test_health_endpoints(self):
        """Test system health endpoints"""
        print("\n=== HEALTH ENDPOINTS TEST ===")
        health_endpoints = [
            '/health/',
            '/health/system/',
            '/health/banking/'
        ]
        
        for endpoint in health_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                if response.status_code == 200:
                    self.log_test(
                        f"Health Check {endpoint}", 
                        "PASS", 
                        f"Status: {response.status_code}", 
                        response.json()
                    )
                else:
                    self.log_test(
                        f"Health Check {endpoint}", 
                        "FAIL", 
                        f"Status: {response.status_code}", 
                        response.text
                    )
            except Exception as e:
                self.log_test(f"Health Check {endpoint}", "ERROR", f"Exception: {str(e)}")
    
    def test_missing_endpoints_implementation(self):
        """Test newly implemented endpoints"""
        print("\n=== MISSING ENDPOINTS IMPLEMENTATION TEST ===")
        
        # Test account-summary endpoint
        try:
            response = self.session.get(f"{self.base_url}/api/banking/account-summary/")
            if response.status_code in [200, 401, 403]:  # Valid responses
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        "Account Summary Endpoint", 
                        "PASS", 
                        f"Status: {response.status_code}, Data structure: {type(data)}", 
                        data
                    )
                else:
                    self.log_test(
                        "Account Summary Endpoint", 
                        "PASS", 
                        f"Expected authentication error: {response.status_code}", 
                        response.text
                    )
            else:
                self.log_test(
                    "Account Summary Endpoint", 
                    "FAIL", 
                    f"Unexpected status: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("Account Summary Endpoint", "ERROR", f"Exception: {str(e)}")
        
        # Test pending loans endpoint
        try:
            response = self.session.get(f"{self.base_url}/api/banking/loans/pending/")
            if response.status_code in [200, 401, 403]:  # Valid responses
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        "Pending Loans Endpoint", 
                        "PASS", 
                        f"Status: {response.status_code}, Data structure: {type(data)}", 
                        data
                    )
                else:
                    self.log_test(
                        "Pending Loans Endpoint", 
                        "PASS", 
                        f"Expected authentication error: {response.status_code}", 
                        response.text
                    )
            else:
                self.log_test(
                    "Pending Loans Endpoint", 
                    "FAIL", 
                    f"Unexpected status: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("Pending Loans Endpoint", "ERROR", f"Exception: {str(e)}")
    
    def test_data_structure_fixes(self):
        """Test new serializers and data structures"""
        print("\n=== DATA STRUCTURE FIXES TEST ===")
        
        # Test accounts endpoint with new serializer
        try:
            response = self.session.get(f"{self.base_url}/api/banking/accounts/")
            if response.status_code == 200:
                data = response.json()
                # Check if data is list and has expected structure
                if isinstance(data, list) and len(data) > 0:
                    first_item = data[0]
                    required_fields = ['id', 'name', 'balance']
                    has_required = all(field in first_item for field in required_fields)
                    if has_required:
                        self.log_test(
                            "Account List Serializer", 
                            "PASS", 
                            f"Correct structure: {list(first_item.keys())}", 
                            first_item
                        )
                    else:
                        missing = [f for f in required_fields if f not in first_item]
                        self.log_test(
                            "Account List Serializer", 
                            "FAIL", 
                            f"Missing required fields: {missing}", 
                            first_item
                        )
                else:
                    self.log_test(
                        "Account List Serializer", 
                        "FAIL", 
                        f"Unexpected data structure: {type(data)}", 
                        data
                    )
            elif response.status_code in [401, 403]:
                self.log_test(
                    "Account List Serializer", 
                    "PASS", 
                    f"Authentication required: {response.status_code}", 
                    response.text
                )
            else:
                self.log_test(
                    "Account List Serializer", 
                    "FAIL", 
                    f"Unexpected status: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("Account List Serializer", "ERROR", f"Exception: {str(e)}")
        
        # Test transactions endpoint with new serializer
        try:
            response = self.session.get(f"{self.base_url}/api/transactions/transactions/")
            if response.status_code == 200:
                data = response.json()
                # Check if data is list and has expected structure
                if isinstance(data, list) and len(data) > 0:
                    first_item = data[0]
                    required_fields = ['id', 'date', 'description', 'amount']
                    has_required = all(field in first_item for field in required_fields)
                    if has_required:
                        # Check date format (YYYY-MM-DD)
                        date_field = first_item.get('date', '')
                        if date_field and len(date_field) == 10 and '-' in date_field:
                            self.log_test(
                                "Transaction List Serializer", 
                                "PASS", 
                                f"Correct structure with date format: {list(first_item.keys())}", 
                                first_item
                            )
                        else:
                            self.log_test(
                                "Transaction List Serializer", 
                                "FAIL", 
                                f"Incorrect date format: {date_field}", 
                                first_item
                            )
                    else:
                        missing = [f for f in required_fields if f not in first_item]
                        self.log_test(
                            "Transaction List Serializer", 
                            "FAIL", 
                            f"Missing required fields: {missing}", 
                            first_item
                        )
                else:
                    self.log_test(
                        "Transaction List Serializer", 
                        "FAIL", 
                        f"Unexpected data structure: {type(data)}", 
                        data
                    )
            elif response.status_code in [401, 403]:
                self.log_test(
                    "Transaction List Serializer", 
                    "PASS", 
                    f"Authentication required: {response.status_code}", 
                    response.text
                )
            else:
                self.log_test(
                    "Transaction List Serializer", 
                    "FAIL", 
                    f"Unexpected status: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("Transaction List Serializer", "ERROR", f"Exception: {str(e)}")
    
    def test_error_handling_standardization(self):
        """Test standardized error handling"""
        print("\n=== ERROR HANDLING STANDARDIZATION TEST ===")
        
        # Test authentication error
        session_no_auth = requests.Session()
        try:
            response = session_no_auth.get(f"{self.base_url}/api/banking/accounts/")
            if response.status_code in [401, 403]:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                has_error_structure = 'detail' in data or 'error' in data or 'message' in data
                self.log_test(
                    "Authentication Error Handling", 
                    "PASS" if has_error_structure else "FAIL", 
                    f"Status: {response.status_code}, Error structure: {bool(has_error_structure)}", 
                    data
                )
            else:
                self.log_test(
                    "Authentication Error Handling", 
                    "FAIL", 
                    f"Expected 401/403, got: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("Authentication Error Handling", "ERROR", f"Exception: {str(e)}")
        
        # Test invalid endpoint
        try:
            response = self.session.get(f"{self.base_url}/api/invalid/endpoint/")
            if response.status_code == 404:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test(
                    "404 Error Handling", 
                    "PASS", 
                    f"Proper 404 handling", 
                    data
                )
            else:
                self.log_test(
                    "404 Error Handling", 
                    "FAIL", 
                    f"Expected 404, got: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("404 Error Handling", "ERROR", f"Exception: {str(e)}")
    
    def test_transaction_consolidation(self):
        """Test transaction model consolidation"""
        print("\n=== TRANSACTION CONSOLIDATION TEST ===")
        
        try:
            response = self.session.get(f"{self.base_url}/api/transactions/")
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Transaction Consolidation", 
                    "PASS", 
                    f"Transactions endpoint accessible", 
                    data
                )
            elif response.status_code in [401, 403]:
                self.log_test(
                    "Transaction Consolidation", 
                    "PASS", 
                    f"Authentication required: {response.status_code}", 
                    response.text
                )
            else:
                self.log_test(
                    "Transaction Consolidation", 
                    "FAIL", 
                    f"Unexpected status: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("Transaction Consolidation", "ERROR", f"Exception: {str(e)}")
    
    def test_overall_system_validation(self):
        """Test overall system functionality"""
        print("\n=== OVERALL SYSTEM VALIDATION TEST ===")
        
        # Test API schema endpoint
        try:
            response = self.session.get(f"{self.base_url}/api/schema/")
            if response.status_code == 200:
                self.log_test(
                    "API Schema Endpoint", 
                    "PASS", 
                    f"Schema accessible", 
                    "Schema documentation available"
                )
            else:
                self.log_test(
                    "API Schema Endpoint", 
                    "FAIL", 
                    f"Unexpected status: {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_test("API Schema Endpoint", "ERROR", f"Exception: {str(e)}")
        
        # Test CORS headers
        try:
            response = requests.options(f"{self.base_url}/api/banking/accounts/")
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            has_cors = any(cors_headers.values())
            self.log_test(
                "CORS Headers", 
                "PASS" if has_cors else "FAIL", 
                f"CORS headers present: {has_cors}", 
                cors_headers
            )
        except Exception as e:
            self.log_test("CORS Headers", "ERROR", f"Exception: {str(e)}")
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*80)
        print("COMPREHENSIVE TEST RESULTS SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        error_tests = len([r for r in self.test_results if r['status'] == 'ERROR'])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Errors: {error_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\nDETAILED RESULTS:")
        print("-" * 80)
        
        for result in self.test_results:
            print(f"\n[{result['status']}] {result['test']}")
            print(f"  Time: {result['timestamp']}")
            print(f"  Details: {result['details']}")
            if result['response_data']:
                print(f"  Response: {str(result['response_data'])[:200]}...")
        
        # Save detailed report to file
        with open('comprehensive_test_report.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\nDetailed report saved to: comprehensive_test_report.json")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'errors': error_tests,
            'success_rate': (passed_tests/total_tests)*100
        }

def main():
    """Main test execution"""
    print("Starting Comprehensive Banking System Test...")
    print("Testing all implemented fixes for frontend-backend integration")
    
    tester = BankingSystemTester()
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/health/", timeout=5)
        print(f"[OK] Server is running on port 8000 (Status: {response.status_code})")
    except:
        print("[ERROR] Server is not responding. Please ensure Django server is running on port 8000")
        return
    
    # Run all tests
    tester.test_health_endpoints()
    
    if tester.authenticate():
        tester.test_missing_endpoints_implementation()
        tester.test_data_structure_fixes()
        tester.test_error_handling_standardization()
        tester.test_transaction_consolidation()
        tester.test_overall_system_validation()
    
    # Generate final report
    summary = tester.generate_report()
    
    print(f"\nTest execution completed!")
    return summary

if __name__ == "__main__":
    main()