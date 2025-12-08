#!/usr/bin/env python
"""
Test script to verify the MessageThread creation fix.
This script tests that the created_by field is properly set when creating MessageThreads.
"""

import os
import sys
import django
from django.test import RequestFactory
from django.contrib.auth.models import User
from banking.models import MessageThread
from banking.serializers import MessageThreadCreateSerializer

# Add the project directory to the Python path
sys.path.insert(0, 'e:/coastal/banking_backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_messagethread_creation():
    """Test that MessageThread creation properly sets created_by field."""
    print("Testing MessageThread creation fix...")

    # Create a test user
    test_user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    # Create another user for participants
    participant_user = User.objects.create_user(
        username='participant',
        email='participant@example.com',
        password='testpass123',
        first_name='Participant',
        last_name='User'
    )

    # Create a mock request with the test user
    factory = RequestFactory()
    request = factory.post('/api/banking/message-threads/create_thread/')
    request.user = test_user

    # Test data
    test_data = {
        'participants': [participant_user.id],
        'subject': 'Test Message Thread',
        'initial_message': 'This is a test message'
    }

    try:
        # Test the serializer
        serializer = MessageThreadCreateSerializer(
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
            print(f"✓ Participants count: {message_thread.participants.count()}")

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
                print("✓ SUCCESS: Initial message was created")
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
        if 'message_thread' in locals():
            message_thread.delete()
        test_user.delete()
        participant_user.delete()

def test_validation():
    """Test validation scenarios."""
    print("\nTesting validation scenarios...")

    # Create a test user
    test_user = User.objects.create_user(
        username='testuser2',
        email='test2@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

    # Create a mock request with the test user
    factory = RequestFactory()
    request = factory.post('/api/banking/message-threads/create_thread/')
    request.user = test_user

    # Test case 1: Missing participants
    test_data = {
        'subject': 'Test Thread',
        'initial_message': 'Test message'
    }

    serializer = MessageThreadCreateSerializer(
        data=test_data,
        context={'request': request}
    )

    if not serializer.is_valid():
        print("✓ Validation correctly failed for missing participants")
    else:
        print("✗ Validation should have failed for missing participants")

    # Test case 2: Invalid user ID
    test_data['participants'] = [999999]  # Non-existent user

    serializer = MessageThreadCreateSerializer(
        data=test_data,
        context={'request': request}
    )

    if not serializer.is_valid():
        print("✓ Validation correctly failed for invalid user ID")
    else:
        print("✗ Validation should have failed for invalid user ID")

    # Cleanup
    test_user.delete()

if __name__ == '__main__':
    print("=" * 60)
    print("MessageThread Creation Fix Test")
    print("=" * 60)

    success = test_messagethread_creation()
    test_validation()

    print("\n" + "=" * 60)
    if success:
        print("✓ ALL TESTS PASSED - MessageThread creation fix is working!")
    else:
        print("✗ TESTS FAILED - MessageThread creation fix needs more work")
    print("=" * 60)