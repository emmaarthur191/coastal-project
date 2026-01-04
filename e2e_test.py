#!/usr/bin/env python3
"""
End-to-End Integration Test for Banking System
Tests full user workflows: authentication, account management, transactions, fraud alerts, real-time messaging
"""

import requests
import json
import time
import sys
from typing import Dict, Any

class BankingE2ETest:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.access_token = None
        self.test_results = []

    def log(self, message: str, status: str = "INFO"):
        """Log test results"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
        self.test_results.append({
            "timestamp": timestamp,
            "status": status,
            "message": message
        })

    def test_user_registration(self) -> bool:
        """Test user registration workflow"""
        try:
            self.log("Testing user registration...")
            response = self.session.post(f"{self.base_url}/api/users/register/", json={
                "email": "e2e_test@example.com",
                "password": "testpass123",
                "first_name": "E2E",
                "last_name": "Test",
                "phone_number": "+1234567890"
            })

            if response.status_code == 201:
                self.log("User registration successful", "PASS")
                return True
            else:
                self.log(f"User registration failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"User registration error: {str(e)}", "ERROR")
            return False

    def test_user_login(self) -> bool:
        """Test user login and token retrieval"""
        try:
            self.log("Testing user login...")
            response = self.session.post(f"{self.base_url}/api/users/login/", json={
                "email": "e2e_test@example.com",
                "password": "testpass123"
            })

            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access")
                if self.access_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.access_token}"})
                    self.log("User login successful", "PASS")
                    return True
                else:
                    self.log("Login response missing access token", "FAIL")
                    return False
            else:
                self.log(f"User login failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"User login error: {str(e)}", "ERROR")
            return False

    def test_get_user_profile(self) -> bool:
        """Test retrieving user profile"""
        try:
            self.log("Testing get user profile...")
            response = self.session.get(f"{self.base_url}/api/users/me/")

            if response.status_code == 200:
                data = response.json()
                if data.get("email") == "e2e_test@example.com":
                    self.log("Get user profile successful", "PASS")
                    return True
                else:
                    self.log("User profile data incorrect", "FAIL")
                    return False
            else:
                self.log(f"Get user profile failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Get user profile error: {str(e)}", "ERROR")
            return False

    def test_account_management(self) -> bool:
        """Test account creation and retrieval"""
        try:
            self.log("Testing account creation...")
            response = self.session.post(f"{self.base_url}/api/accounts/", json={
                "account_type": "savings",
                "initial_balance": 1000.00
            })

            if response.status_code == 201:
                self.log("Account creation successful", "PASS")
            else:
                self.log(f"Account creation failed: {response.status_code} - {response.text}", "FAIL")
                return False

            # Test getting accounts
            self.log("Testing get accounts...")
            response = self.session.get(f"{self.base_url}/api/accounts/")

            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log("Get accounts successful", "PASS")
                    return True
                else:
                    self.log("No accounts returned", "FAIL")
                    return False
            else:
                self.log(f"Get accounts failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Account management error: {str(e)}", "ERROR")
            return False

    def test_transaction_workflow(self) -> bool:
        """Test transaction creation and retrieval"""
        try:
            self.log("Testing transaction creation...")
            response = self.session.post(f"{self.base_url}/api/transactions/", json={
                "account": 1,
                "amount": 500.00,
                "transaction_type": "deposit",
                "description": "E2E test deposit"
            })

            if response.status_code in [201, 200]:
                self.log("Transaction creation successful", "PASS")
            else:
                self.log(f"Transaction creation failed: {response.status_code} - {response.text}", "FAIL")
                return False

            # Test getting transactions
            self.log("Testing get transactions...")
            response = self.session.get(f"{self.base_url}/api/transactions/")

            if response.status_code == 200:
                data = response.json()
                if isinstance(data, (list, dict)):
                    self.log("Get transactions successful", "PASS")
                    return True
                else:
                    self.log("Invalid transactions response format", "FAIL")
                    return False
            else:
                self.log(f"Get transactions failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Transaction workflow error: {str(e)}", "ERROR")
            return False

    def test_loan_workflow(self) -> bool:
        """Test loan application and retrieval"""
        try:
            self.log("Testing loan application...")
            response = self.session.post(f"{self.base_url}/api/loans/", json={
                "amount": 5000.00,
                "purpose": "E2E test loan",
                "term_months": 24
            })

            if response.status_code in [201, 200]:
                self.log("Loan application successful", "PASS")
            else:
                self.log(f"Loan application failed: {response.status_code} - {response.text}", "WARN")
                # Don't fail the test for loan issues as it might require approval

            # Test getting loans
            self.log("Testing get loans...")
            response = self.session.get(f"{self.base_url}/api/loans/")

            if response.status_code == 200:
                self.log("Get loans successful", "PASS")
                return True
            else:
                self.log(f"Get loans failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Loan workflow error: {str(e)}", "ERROR")
            return False

    def test_fraud_alerts(self) -> bool:
        """Test fraud alerts retrieval"""
        try:
            self.log("Testing get fraud alerts...")
            response = self.session.get(f"{self.base_url}/api/fraud-alerts/")

            if response.status_code == 200:
                self.log("Get fraud alerts successful", "PASS")
                return True
            else:
                self.log(f"Get fraud alerts failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Fraud alerts error: {str(e)}", "ERROR")
            return False

    def test_messaging(self) -> bool:
        """Test messaging functionality"""
        try:
            # Test getting messages
            self.log("Testing get messages...")
            response = self.session.get(f"{self.base_url}/api/messages/")

            if response.status_code == 200:
                self.log("Get messages successful", "PASS")
            else:
                self.log(f"Get messages failed: {response.status_code} - {response.text}", "WARN")

            # Test sending message
            self.log("Testing send message...")
            response = self.session.post(f"{self.base_url}/api/messages/", json={
                "recipient": 1,
                "subject": "E2E Test Message",
                "content": "This is an automated test message",
                "message_type": "support"
            })

            if response.status_code in [201, 200]:
                self.log("Send message successful", "PASS")
                return True
            else:
                self.log(f"Send message failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Messaging error: {str(e)}", "ERROR")
            return False

    def test_system_health(self) -> bool:
        """Test system health monitoring"""
        try:
            self.log("Testing system health check...")
            response = self.session.get(f"{self.base_url}/api/performance/system-health/")

            if response.status_code == 200:
                self.log("System health check successful", "PASS")
                return True
            else:
                self.log(f"System health check failed: {response.status_code} - {response.text}", "FAIL")
                return False
        except Exception as e:
            self.log(f"System health error: {str(e)}", "ERROR")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all E2E tests"""
        self.log("Starting E2E Integration Tests", "INFO")

        tests = [
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Get User Profile", self.test_get_user_profile),
            ("Account Management", self.test_account_management),
            ("Transaction Workflow", self.test_transaction_workflow),
            ("Loan Workflow", self.test_loan_workflow),
            ("Fraud Alerts", self.test_fraud_alerts),
            ("Messaging", self.test_messaging),
            ("System Health", self.test_system_health),
        ]

        results = {}
        passed = 0
        failed = 0

        for test_name, test_func in tests:
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log(f"Test {test_name} crashed: {str(e)}", "ERROR")
                results[test_name] = False
                failed += 1

        summary = {
            "total_tests": len(tests),
            "passed": passed,
            "failed": failed,
            "success_rate": (passed / len(tests)) * 100 if tests else 0,
            "results": results,
            "detailed_logs": self.test_results
        }

        self.log(f"E2E Tests completed: {passed} passed, {failed} failed", "SUMMARY")
        return summary

def main():
    """Main function to run E2E tests"""
    print("Banking System E2E Integration Test")
    print("=" * 50)

    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/api/schema/", timeout=5)
        if response.status_code != 200:
            print("ERROR: Backend server not responding properly")
            sys.exit(1)
    except:
        print("ERROR: Cannot connect to backend server at http://localhost:8000")
        print("Please ensure the Django server is running")
        sys.exit(1)

    tester = BankingE2ETest()
    results = tester.run_all_tests()

    # Save results to file
    with open("e2e_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\nTest Results Summary:")
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(f"Success Rate: {results['success_rate']:.1f}%")
    print(f"\nDetailed results saved to e2e_test_results.json")

    # Exit with appropriate code
    if results['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
