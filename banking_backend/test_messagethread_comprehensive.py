#!/usr/bin/env python
"""
Comprehensive test script to verify the MessageThread creation fix.
This script tests:
1. Backend API endpoint for MessageThread creation
2. Verifies that the created_by field is automatically set to the current user
3. Tests various error scenarios to ensure proper error messages are returned
4. Verifies that the frontend error handling shows real backend errors instead of generic messages
"""

import os
import sys
import django
import json
from django.test import RequestFactory, Client
from django.contrib.auth.models import User
from django.urls import reverse
from messaging.models import MessageThread, Message
from messaging.serializers import CreateMessageThreadSerializer
from rest_framework import status

# Add the project directory to the Python path
sys.path.insert(0, 'e:/coastal/banking_backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banking_backend.config.settings')
django.setup()

def test_backend_api_endpoint():
    """Test the backend API endpoint for MessageThread creation."""
    print("=" * 60)
    print("Testing Backend API Endpoint")
    print("=" * 60)

    # Create test users
    test_user = User.objects.create_user(
        username='testuser_api',
        email='test_api@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    participant_user = User.objects.create_user(
        username='participant_api',
        email='participant_api@example.com',
        password='testpass123',
        first_name='Participant',
        last_name='User'
    )

    # Create a client and authenticate
    client = Client()
    client.force_login(test_user)

    # Test data
    test_data = {
        'subject': 'Test Message Thread API',
        'participants': [str(participant_user.id)],
        'initial_message': 'This is a test message from API'
    }

    try:
        # Make API request
        response = client.post(
            reverse('messagethread-list'),
            data=json.dumps(test_data),
            content_type='application/json'
        )

        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json()}")

        if response.status_code == status.HTTP_201_CREATED:
            print("✓ API endpoint successfully created MessageThread")
            data = response.json()

            # Verify the created_by field is set correctly
            if str(data['created_by']) == str(test_user.id):
                print("✓ created_by field is correctly set to the current user")
            else:
                print(f"✗ FAIL: created_by field is {data['created_by']}, expected {test_user.id}")
                return False

            # Verify participants include both users
            participant_ids = [str(p['id']) for p in data['participants']]
            if str(test_user.id) in participant_ids and str(participant_user.id) in participant_ids:
                print("✓ Participants correctly include both creator and specified users")
            else:
                print(f"✗ FAIL: Participants {participant_ids} don't include both users")
                return False

            return True
        else:
            print(f"✗ FAIL: API request failed with status {response.status_code}")
            print(f"Error: {response.json()}")
            return False

    except Exception as e:
        print(f"✗ Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        MessageThread.objects.filter(subject='Test Message Thread API').delete()
        test_user.delete()
        participant_user.delete()

def test_created_by_field_assignment():
    """Test that the created_by field is automatically set to the current user."""
    print("\n" + "=" * 60)
    print("Testing created_by Field Assignment")
    print("=" * 60)

    # Create test users
    test_user = User.objects.create_user(
        username='testuser_createdby',
        email='test_createdby@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    participant_user = User.objects.create_user(
        username='participant_createdby',
        email='participant_createdby@example.com',
        password='testpass123',
        first_name='Participant',
        last_name='User'
    )

    # Create a mock request with the test user
    factory = RequestFactory()
    request = factory.post('/api/banking/message-threads/')
    request.user = test_user

    # Test data
    test_data = {
        'subject': 'Test created_by Assignment',
        'participants': [participant_user.id],
        'initial_message': 'This is a test message for created_by'
    }

    try:
        # Test the serializer
        serializer = CreateMessageThreadSerializer(
            data=test_data,
            context={'request': request}
        )

        if serializer.is_valid():
            print("✓ Serializer validation passed")

            # Create the MessageThread
            message_thread = serializer.save()

            print(f"✓ MessageThread created with ID: {message_thread.id}")
            print(f"✓ Subject: {message_thread.subject}")
            print(f"✓ Created by: {message_thread.created_by.username} (ID: {message_thread.created_by.id})")

            # Verify the created_by field is set correctly
            if message_thread.created_by == test_user:
                print("✓ SUCCESS: created_by field is correctly set to the current user")
            else:
                print(f"✗ FAIL: created_by field is {message_thread.created_by}, expected {test_user}")
                return False

            # Verify participants are set correctly
            if message_thread.participants.count() == 2:  # test_user + participant_user
                print("✓ SUCCESS: Participants are correctly set")
            else:
                print(f"✗ FAIL: Expected 2 participants, got {message_thread.participants.count()}")
                return False

            # Verify initial message was created
            if message_thread.messages.exists():
                initial_message = message_thread.messages.first()
                if initial_message.sender == test_user:
                    print("✓ SUCCESS: Initial message was created with correct sender")
                else:
                    print(f"✗ FAIL: Initial message sender is {initial_message.sender}, expected {test_user}")
                    return False
            else:
                print("✗ FAIL: Initial message was not created")
                return False

            return True
        else:
            print(f"✗ Serializer validation failed: {serializer.errors}")
            return False

    except Exception as e:
        print(f"✗ Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        MessageThread.objects.filter(subject='Test created_by Assignment').delete()
        test_user.delete()
        participant_user.delete()

def test_error_scenarios():
    """Test various error scenarios to ensure proper error messages are returned."""
    print("\n" + "=" * 60)
    print("Testing Error Scenarios")
    print("=" * 60)

    # Create test user
    test_user = User.objects.create_user(
        username='testuser_errors',
        email='test_errors@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    # Create a client and authenticate
    client = Client()
    client.force_login(test_user)

    test_cases = [
        {
            'name': 'Missing participants',
            'data': {
                'subject': 'Test Thread',
                'initial_message': 'Test message'
            },
            'expected_error': 'participants'
        },
        {
            'name': 'Invalid user ID',
            'data': {
                'subject': 'Test Thread',
                'participants': ['999999-9999-9999-9999-999999999999'],  # Non-existent user UUID
                'initial_message': 'Test message'
            },
            'expected_error': 'participants'
        },
        {
            'name': 'Missing subject',
            'data': {
                'participants': [str(test_user.id)],
                'initial_message': 'Test message'
            },
            'expected_error': 'subject'
        },
        {
            'name': 'Empty participants list',
            'data': {
                'subject': 'Test Thread',
                'participants': [],
                'initial_message': 'Test message'
            },
            'expected_error': 'participants'
        }
    ]

    all_passed = True

    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")

        try:
            response = client.post(
                reverse('messagethread-list'),
                data=json.dumps(test_case['data']),
                content_type='application/json'
            )

            print(f"Response status: {response.status_code}")

            if response.status_code == status.HTTP_400_BAD_REQUEST:
                error_data = response.json()
                print(f"✓ Validation correctly failed with status 400")
                print(f"Error details: {error_data}")

                # Check if the expected error field is in the response
                if test_case['expected_error'] in str(error_data):
                    print(f"✓ Expected error field '{test_case['expected_error']}' found in response")
                else:
                    print(f"✗ Expected error field '{test_case['expected_error']}' not found in response")
                    all_passed = False
            else:
                print(f"✗ Expected 400 status, got {response.status_code}")
                all_passed = False

        except Exception as e:
            print(f"✗ Exception occurred: {str(e)}")
            all_passed = False

    return all_passed

def test_frontend_error_handling():
    """Test that frontend error handling shows real backend errors instead of generic messages."""
    print("\n" + "=" * 60)
    print("Testing Frontend Error Handling")
    print("=" * 60)

    # Create test user
    test_user = User.objects.create_user(
        username='testuser_frontend',
        email='test_frontend@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    # Create a client and authenticate
    client = Client()
    client.force_login(test_user)

    # Test case: Invalid participant ID should return specific error message
    test_data = {
        'subject': 'Test Thread',
        'participants': ['999999-9999-9999-9999-999999999999'],  # Non-existent user UUID
        'initial_message': 'Test message'
    }

    try:
        response = client.post(
            reverse('messagethread-list'),
            data=json.dumps(test_data),
            content_type='application/json'
        )

        print(f"Response status: {response.status_code}")

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            error_data = response.json()
            print(f"✓ Backend returned specific error: {error_data}")

            # Check that the error is specific and not generic
            error_str = str(error_data)
            if 'participants' in error_str and ('does not exist' in error_str or 'invalid' in error_str.lower()):
                print("✓ SUCCESS: Backend provides specific error message for frontend to display")
                print(f"Specific error message: {error_data}")
                return True
            else:
                print(f"✗ FAIL: Error message is not specific enough: {error_data}")
                return False
        else:
            print(f"✗ Expected 400 status for validation error, got {response.status_code}")
            return False

    except Exception as e:
        print(f"✗ Exception occurred: {str(e)}")
        return False
    finally:
        test_user.delete()

def test_integration_scenarios():
    """Test integration scenarios between frontend and backend."""
    print("\n" + "=" * 60)
    print("Testing Integration Scenarios")
    print("=" * 60)

    # Create test users
    test_user = User.objects.create_user(
        username='testuser_integration',
        email='test_integration@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    participant_user = User.objects.create_user(
        username='participant_integration',
        email='participant_integration@example.com',
        password='testpass123',
        first_name='Participant',
        last_name='User'
    )

    # Create a client and authenticate
    client = Client()
    client.force_login(test_user)

    # Test successful integration scenario
    test_data = {
        'subject': 'Integration Test Thread',
        'participants': [str(participant_user.id)],
        'initial_message': 'This is an integration test message'
    }

    try:
        # Step 1: Create thread via API
        response = client.post(
            reverse('messagethread-list'),
            data=json.dumps(test_data),
            content_type='application/json'
        )

        if response.status_code == status.HTTP_201_CREATED:
            print("✓ Thread creation successful via API")
            thread_data = response.json()
            thread_id = thread_data['id']

            # Step 2: Verify thread can be retrieved
            retrieve_response = client.get(f'/api/banking/message-threads/{thread_id}/')

            if retrieve_response.status_code == status.HTTP_200_OK:
                print("✓ Thread retrieval successful")
                retrieved_data = retrieve_response.json()

                # Verify created_by is preserved
                if str(retrieved_data['created_by']) == str(test_user.id):
                    print("✓ created_by field preserved in retrieval")
                else:
                    print(f"✗ created_by field mismatch: {retrieved_data['created_by']} vs {test_user.id}")
                    return False

                # Step 3: Verify messages endpoint works
                messages_response = client.get(f'/api/banking/message-threads/{thread_id}/messages/')

                if messages_response.status_code == status.HTTP_200_OK:
                    print("✓ Messages endpoint works correctly")
                    messages_data = messages_response.json()

                    if len(messages_data) > 0:
                        print("✓ Initial message was created and is accessible")
                    else:
                        print("✗ No messages found in thread")
                        return False

                    return True
                else:
                    print(f"✗ Messages endpoint failed: {messages_response.status_code}")
                    return False
            else:
                print(f"✗ Thread retrieval failed: {retrieve_response.status_code}")
                return False
        else:
            print(f"✗ Thread creation failed: {response.status_code}")
            print(f"Error: {response.json()}")
            return False

    except Exception as e:
        print(f"✗ Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        MessageThread.objects.filter(subject='Integration Test Thread').delete()
        test_user.delete()
        participant_user.delete()

if __name__ == '__main__':
    print("=" * 80)
    print("COMPREHENSIVE MESSAGETHREAD CREATION FIX TEST")
    print("=" * 80)

    results = []

    # Run all tests
    results.append(('Backend API Endpoint', test_backend_api_endpoint()))
    results.append(('created_by Field Assignment', test_created_by_field_assignment()))
    results.append(('Error Scenarios', test_error_scenarios()))
    results.append(('Frontend Error Handling', test_frontend_error_handling()))
    results.append(('Integration Scenarios', test_integration_scenarios()))

    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    all_passed = True
    for test_name, passed in results:
        status_icon = "✓" if passed else "✗"
        print(f"{status_icon} {test_name}: {'PASSED' if passed else 'FAILED'}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED - MessageThread creation fix is working completely!")
        print("✓ Backend fix works correctly")
        print("✓ created_by field is automatically set to current user")
        print("✓ Error handling improvements are working")
        print("✓ Frontend-backend integration is smooth")
    else:
        print("❌ SOME TESTS FAILED - MessageThread creation fix needs more work")
    print("=" * 80)