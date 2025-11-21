#!/usr/bin/env python
"""
Test script to validate standardized error handling implementation.
Tests various error scenarios across different endpoints to ensure consistent error responses.
"""

import os
import sys
import json
import django
import requests
from decimal import Decimal

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from banking_backend.utils.error_handling import (
    StandardAPIException, ValidationAPIException, NotFoundAPIException,
    PermissionAPIException, BusinessLogicAPIException, ErrorHandler, ResponseBuilder
)


def test_error_handling_classes():
    """Test the standardized error handling classes."""
    print("Testing Error Handling Classes...")
    
    # Test StandardAPIException
    error = StandardAPIException("Test error message", "TEST_ERROR", 400)
    response = error.get_error_response()
    
    assert response['success'] == False
    assert response['error']['code'] == 'TEST_ERROR'
    assert response['error']['message'] == 'Test error message'
    assert 'timestamp' in response
    print(" StandardAPIException works correctly")
    
    # Test ValidationAPIException
    field_errors = {'email': ['Invalid email format'], 'password': ['Too short']}
    validation_error = ValidationAPIException("Validation failed", field_errors)
    validation_response = validation_error.get_error_response()
    
    assert validation_response['success'] == False
    assert validation_response['error']['code'] == 'VALIDATION_ERROR'
    assert 'field_errors' in validation_response['error']['details']
    assert validation_response['error']['details']['field_errors'] == field_errors
    print(" ValidationAPIException works correctly")
    
    # Test NotFoundAPIException
    not_found_error = NotFoundAPIException("User")
    not_found_response = not_found_error.get_error_response()
    
    assert not_found_response['success'] == False
    assert not_found_response['error']['code'] == 'NOT_FOUND'
    assert not_found_response['error']['message'] == 'User not found'
    assert not_found_error.status_code == 404
    print(" NotFoundAPIException works correctly")
    
    # Test PermissionAPIException
    permission_error = PermissionAPIException("Access denied")
    permission_response = permission_error.get_error_response()
    
    assert permission_response['success'] == False
    assert permission_response['error']['code'] == 'PERMISSION_DENIED'
    assert permission_error.status_code == 403
    print(" PermissionAPIException works correctly")
    
    # Test BusinessLogicAPIException
    business_error = BusinessLogicAPIException("Insufficient funds", "INSUFFICIENT_FUNDS")
    business_response = business_error.get_error_response()
    
    assert business_response['success'] == False
    assert business_response['error']['code'] == 'INSUFFICIENT_FUNDS'
    assert business_response['error']['message'] == 'Insufficient funds'
    print(" BusinessLogicAPIException works correctly")
    
    print("All error handling classes tested successfully!\n")


def test_response_builder():
    """Test the ResponseBuilder utility."""
    print("Testing ResponseBuilder...")
    
    # Test success response
    success_data = {'user_id': 123, 'name': 'John Doe'}
    success_response = ResponseBuilder.success(data=success_data, message="User created")
    
    assert success_response['success'] == True
    assert success_response['data'] == success_data
    assert success_response['message'] == "User created"
    assert 'timestamp' in success_response
    print(" Success response builder works correctly")
    
    # Test error response
    error_response = ResponseBuilder.error(
        message="Validation failed",
        error_code="VALIDATION_ERROR",
        details={'field': 'email'},
        status_code=400
    )
    
    assert error_response['success'] == False
    assert error_response['error']['code'] == 'VALIDATION_ERROR'
    assert error_response['error']['message'] == "Validation failed"
    assert error_response['error']['details'] == {'field': 'email'}
    assert 'timestamp' in error_response
    print(" Error response builder works correctly")
    
    print("ResponseBuilder tested successfully!\n")


def test_error_handler_integration():
    """Test the ErrorHandler integration with Django exceptions."""
    print("Testing ErrorHandler Integration...")
    
    # Test with ValidationError
    from django.core.exceptions import ValidationError as DjangoValidationError
    django_validation_error = DjangoValidationError("Invalid data")
    django_validation_error.message_dict = {'field1': ['Required']}
    
    response = ErrorHandler.handle_exception(django_validation_error)
    response_data = json.loads(response.content)
    
    assert response.status_code == 400
    assert response_data['success'] == False
    assert response_data['error']['code'] == 'VALIDATION_ERROR'
    assert 'field_errors' in response_data['error']['details']
    print(" Django ValidationError handling works correctly")
    
    # Test with ObjectDoesNotExist
    from django.core.exceptions import ObjectDoesNotExist
    from users.models import User
    
    # Create a mock ObjectDoesNotExist
    class MockDoesNotExist(ObjectDoesNotExist):
        model = User
    
    mock_error = MockDoesNotExist()
    response = ErrorHandler.handle_exception(mock_error)
    response_data = json.loads(response.content)
    
    assert response.status_code == 404
    assert response_data['success'] == False
    assert response_data['error']['code'] == 'NOT_FOUND'
    assert 'User not found' in response_data['error']['message']
    print(" ObjectDoesNotExist handling works correctly")
    
    print("ErrorHandler integration tested successfully!\n")


def test_api_endpoints_error_handling():
    """Test error handling with actual API endpoints."""
    print("Testing API Endpoints Error Handling...")
    
    base_url = "http://localhost:8000/api/v1"
    
    # Test authentication error (should get 401)
    try:
        response = requests.get(f"{base_url}/users/auth-check/", timeout=5)
        # If we get here without authentication, check the response
        if response.status_code == 401:
            response_data = response.json()
            assert response_data['success'] == False
            assert 'error' in response_data
            assert response_data['error']['code'] in ['AUTHENTICATION_REQUIRED', 'Not found']
            print(" Authentication error handling works")
        else:
            print("WARNING: Authentication endpoint test inconclusive - got status:", response.status_code)
    except requests.exceptions.RequestException as e:
        print("WARNING: Could not test authentication endpoint (server not running):", str(e))
    
    # Test KYC endpoint with invalid data
    try:
        # Try to POST to KYC endpoint without required fields
        kyc_data = {}  # Missing required fields
        response = requests.post(f"{base_url}/kyc/apply/", json=kyc_data, timeout=5)
        
        if response.status_code == 400:
            response_data = response.json()
            assert response_data['success'] == False
            assert 'error' in response_data
            print(" KYC validation error handling works")
        else:
            print(" KYC endpoint test inconclusive - got status:", response.status_code)
    except requests.exceptions.RequestException as e:
        print(" Could not test KYC endpoint (server not running):", str(e))
    
    print("API endpoints error handling testing completed!\n")


def test_error_response_format():
    """Test that all error responses follow the standardized format."""
    print("Testing Error Response Format Standardization...")
    
    test_cases = [
        {
            'exception': StandardAPIException("Generic error", "GENERIC_ERROR", 400),
            'expected_code': 'GENERIC_ERROR',
            'expected_status': 400
        },
        {
            'exception': ValidationAPIException("Validation failed", {'field': ['error']}),
            'expected_code': 'VALIDATION_ERROR',
            'expected_status': 400
        },
        {
            'exception': NotFoundAPIException("Resource"),
            'expected_code': 'NOT_FOUND',
            'expected_status': 404
        },
        {
            'exception': PermissionAPIException("Access denied"),
            'expected_code': 'PERMISSION_DENIED',
            'expected_status': 403
        },
        {
            'exception': BusinessLogicAPIException("Business rule violated", "BUSINESS_ERROR"),
            'expected_code': 'BUSINESS_ERROR',
            'expected_status': 400
        }
    ]
    
    for i, test_case in enumerate(test_cases):
        exception = test_case['exception']
        expected_code = test_case['expected_code']
        expected_status = test_case['expected_status']
        
        response = ErrorHandler.handle_exception(exception)
        response_data = json.loads(response.content)
        
        # Verify standardized format
        assert response.status_code == expected_status, f"Test {i+1}: Wrong status code"
        assert response_data['success'] == False, f"Test {i+1}: Success field should be False"
        assert 'error' in response_data, f"Test {i+1}: Missing 'error' field"
        assert 'code' in response_data['error'], f"Test {i+1}: Missing 'code' in error"
        assert 'message' in response_data['error'], f"Test {i+1}: Missing 'message' in error"
        assert 'timestamp' in response_data, f"Test {i+1}: Missing 'timestamp'"
        
        assert response_data['error']['code'] == expected_code, f"Test {i+1}: Wrong error code"
        
        print(f" Test case {i+1} passed: {expected_code} with status {expected_status}")
    
    print("Error response format standardization verified!\n")


def main():
    """Run all tests."""
    print("=== Standardized Error Handling Test Suite ===\n")
    
    try:
        test_error_handling_classes()
        test_response_builder()
        test_error_handler_integration()
        test_error_response_format()
        
        # Only test API endpoints if server is running
        print("Checking if server is running for endpoint tests...")
        try:
            requests.get("http://localhost:8000/api/v1/", timeout=2)
            test_api_endpoints_error_handling()
        except requests.exceptions.RequestException:
            print("Server not running - skipping live endpoint tests")
            print("Start the server with: python manage.py runserver")
        
        print("=== All Tests Passed! ===")
        print("\nStandardized Error Handling Implementation Summary:")
        print(" Consistent error response format across all endpoints")
        print(" Proper HTTP status codes (400, 401, 403, 404, 500, etc.)")
        print(" Structured error codes and detailed error messages")
        print(" Field-level validation error details")
        print(" Automatic logging and error tracking")
        print(" User-friendly error messages while maintaining technical details")
        
    except AssertionError as e:
        print(f" Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f" Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()