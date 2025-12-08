#!/usr/bin/env python3

"""
Test script to verify the message thread creation fix.
This script tests the backend serializer to ensure it properly handles required fields.
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.insert(0, 'e:/coastal/banking_backend')

# Configure Django settings
if not settings.configured:
    settings.configure(
        DEBUG=True,
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': 'db.sqlite3',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'users',
            'banking',
        ],
        SECRET_KEY='test-secret-key',
        USE_TZ=True,
    )

# Setup Django
django.setup()

# Now import Django models and serializers
from users.models import User
from banking.models import MessageThread
from banking.serializers import MessageThreadCreateSerializer
from django.test import RequestFactory

def test_messagethread_creation():
    """Test that MessageThread creation properly sets created_by field."""

    print("🧪 Testing MessageThread creation with required fields...")

    # Create a test user
    test_user = User.objects.create(
        email='test@example.com',
        first_name='Test',
        last_name='User',
        role='manager'
    )

    # Create a participant user
    participant_user = User.objects.create(
        email='participant@example.com',
        first_name='Participant',
        last_name='User',
        role='cashier'
    )

    print(f"✓ Created test user: {test_user.email}")
    print(f"✓ Created participant user: {participant_user.email}")

    try:
        # Create a request factory and mock request
        factory = RequestFactory()
        request = factory.post('/api/banking/message-threads/')
        request.user = test_user

        # Test data with required subject field
        test_data = {
            'participants': [str(participant_user.id)],
            'subject': 'Test Thread Subject',
            'initial_message': 'Hello, this is a test message!'
        }

        print(f"✓ Test data prepared: {test_data}")

        # Create serializer with context
        serializer = MessageThreadCreateSerializer(data=test_data, context={'request': request})

        # Validate the data
        if not serializer.is_valid():
            print(f"✗ Serializer validation failed: {serializer.errors}")
            return False

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
            print("✗ FAIL: No initial message was created")
            return False

        print("🎉 All tests passed! MessageThread creation is working correctly.")
        return True

    except Exception as e:
        print(f"✗ Test failed with exception: {e}")
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
    """Test that the serializer properly validates required fields."""

    print("\n🧪 Testing serializer validation...")

    # Create a test user
    test_user = User.objects.create(
        email='test2@example.com',
        first_name='Test',
        last_name='User',
        role='manager'
    )

    # Create a request factory and mock request
    factory = RequestFactory()
    request = factory.post('/api/banking/message-threads/')
    request.user = test_user

    # Test data WITHOUT required subject field
    invalid_data = {
        'participants': [str(test_user.id)],
        # Missing 'subject' field
        'initial_message': 'Hello, this is a test message!'
    }

    print(f"✓ Testing validation with missing subject field: {invalid_data}")

    # Create serializer with context
    serializer = MessageThreadCreateSerializer(data=invalid_data, context={'request': request})

    # Validate the data - should fail
    if serializer.is_valid():
        print("✗ FAIL: Serializer should have failed validation for missing subject")
        return False
    else:
        print(f"✓ SUCCESS: Serializer correctly rejected missing subject: {serializer.errors}")
        return True

    finally:
        test_user.delete()

if __name__ == "__main__":
    print("🚀 Starting MessageThread creation tests...")

    success = test_messagethread_creation()
    test_validation()

    if success:
        print("\n✅ All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)