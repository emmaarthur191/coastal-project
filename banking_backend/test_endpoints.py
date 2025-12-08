#!/usr/bin/env python3
"""
Test script to verify the newly implemented endpoints.
"""
import os
import requests
import json

API_BASE = "http://localhost:8000"

def login_and_get_token():
    """Login and return access token."""
    login_data = {
        "email": "admin@bankingapp.com",
        "password": "Test123!@#"
    }

    try:
        response = requests.post(f"{API_BASE}/api/users/auth/login/", json=login_data)
        print(f"Login status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"[DEBUG] Login response data: {data}")
            access_token = data.get('access')
            if access_token:
                print(f"[PASS] Successfully logged in and got access token")
                return access_token
            else:
                print(f"[FAIL] Login successful but no access token in response")
                return None
        else:
            print(f"[FAIL] Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
        return None

def test_account_summary(token):
    """Test account summary endpoint"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{API_BASE}/api/banking/account-summary/", headers=headers)
        print(f"\n=== Account Summary Test ===")
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Account Summary Response:")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"[FAIL] Account Summary failed: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Account Summary error: {e}")
        return False

def test_pending_loans(token):
    """Test pending loans endpoint"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f"{API_BASE}/api/banking/loans/pending/", headers=headers)
        print(f"\n=== Pending Loans Test ===")
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Pending Loans Response:")
            if isinstance(data, list):
                print(f"Found {len(data)} pending loan applications")
                for loan in data:
                    print(f"  - {loan.get('id', 'No ID')}: {loan.get('applicant_email', 'No email')}")
            else:
                print(json.dumps(data, indent=2))
            return True
        else:
            print(f"[FAIL] Pending Loans failed: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Pending Loans error: {e}")
        return False

def main():
    print("Testing Banking API Endpoints")
    print("=" * 40)

    # Login
    token = login_and_get_token()
    if not token:
        print("Cannot proceed without authentication")
        return

    # Test endpoints
    account_summary_ok = test_account_summary(token)
    pending_loans_ok = test_pending_loans(token)

    print(f"\n=== Test Summary ===")
    print(f"Account Summary: {'[PASS]' if account_summary_ok else '[FAIL]'}")
    print(f"Pending Loans: {'[PASS]' if pending_loans_ok else '[FAIL]'}")

    if account_summary_ok and pending_loans_ok:
        print("\n[SUCCESS] All endpoints working correctly!")
    else:
        print("\n[WARNING] Some endpoints failed")

if __name__ == "__main__":
    main()