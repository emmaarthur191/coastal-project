from django.test import TestCase, RequestFactory, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from messaging.models import MessageThread, Message
from messaging.serializers import CreateMessageThreadSerializer
from rest_framework import status
import json

User = get_user_model()

class MessageThreadComprehensiveTest(TestCase):
    """Comprehensive test for MessageThread creation fix."""

    def setUp(self):
        """Set up test data."""
        self.test_user = User.objects.create_user(
            username='testuser_comprehensive',
            email='test_comprehensive@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

        self.participant_user = User.objects.create_user(
            username='participant_comprehensive',
            email='participant_comprehensive@example.com',
            password='testpass123',
            first_name='Participant',
            last_name='User'
        )

        self.client = Client()
        self.client.force_login(self.test_user)

    def test_backend_api_endpoint(self):
        """Test the backend API endpoint for MessageThread creation."""
        print("\n" + "=" * 60)
        print("Testing Backend API Endpoint")
        print("=" * 60)

        test_data = {
            'subject': 'Test Message Thread API',
            'participants': [str(self.participant_user.id)],
            'initial_message': 'This is a test message from API'
        }

        response = self.client.post(
            reverse('messagethread-list'),
            data=json.dumps(test_data),
            content_type='application/json'
        )

        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json()}")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()

        # Verify the created_by field is set correctly
        self.assertEqual(str(data['created_by']), str(self.test_user.id))
        print("✓ created_by field is correctly set to the current user")

        # Verify participants include both users
        participant_ids = [str(p['id']) for p in data['participants']]
        self.assertIn(str(self.test_user.id), participant_ids)
        self.assertIn(str(self.participant_user.id), participant_ids)
        print("✓ Participants correctly include both creator and specified users")

    def test_created_by_field_assignment(self):
        """Test that the created_by field is automatically set to the current user."""
        print("\n" + "=" * 60)
        print("Testing created_by Field Assignment")
        print("=" * 60)

        # Create a mock request with the test user
        factory = RequestFactory()
        request = factory.post('/api/banking/message-threads/')
        request.user = self.test_user

        test_data = {
            'subject': 'Test created_by Assignment',
            'participants': [self.participant_user.id],
            'initial_message': 'This is a test message for created_by'
        }

        # Test the serializer
        serializer = CreateMessageThreadSerializer(
            data=test_data,
            context={'request': request}
        )

        self.assertTrue(serializer.is_valid())
        print("✓ Serializer validation passed")

        # Create the MessageThread
        message_thread = serializer.save()

        print(f"✓ MessageThread created with ID: {message_thread.id}")
        print(f"✓ Subject: {message_thread.subject}")
        print(f"✓ Created by: {message_thread.created_by.username} (ID: {message_thread.created_by.id})")

        # Verify the created_by field is set correctly
        self.assertEqual(message_thread.created_by, self.test_user)
        print("✓ SUCCESS: created_by field is correctly set to the current user")

        # Verify participants are set correctly
        self.assertEqual(message_thread.participants.count(), 2)  # test_user + participant_user
        print("✓ SUCCESS: Participants are correctly set")

        # Verify initial message was created
        self.assertTrue(message_thread.messages.exists())
        initial_message = message_thread.messages.first()
        self.assertEqual(initial_message.sender, self.test_user)
        print("✓ SUCCESS: Initial message was created with correct sender")

    def test_error_scenarios(self):
        """Test various error scenarios to ensure proper error messages are returned."""
        print("\n" + "=" * 60)
        print("Testing Error Scenarios")
        print("=" * 60)

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
                    'participants': [str(self.test_user.id)],
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

        for test_case in test_cases:
            print(f"\nTesting: {test_case['name']}")

            response = self.client.post(
                reverse('messagethread-list'),
                data=json.dumps(test_case['data']),
                content_type='application/json'
            )

            print(f"Response status: {response.status_code}")

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            error_data = response.json()
            print(f"✓ Validation correctly failed with status 400")
            print(f"Error details: {error_data}")

            # Check if the expected error field is in the response
            self.assertIn(test_case['expected_error'], str(error_data))
            print(f"✓ Expected error field '{test_case['expected_error']}' found in response")

    def test_frontend_error_handling(self):
        """Test that frontend error handling shows real backend errors instead of generic messages."""
        print("\n" + "=" * 60)
        print("Testing Frontend Error Handling")
        print("=" * 60)

        # Test case: Invalid participant ID should return specific error message
        test_data = {
            'subject': 'Test Thread',
            'participants': ['999999-9999-9999-9999-999999999999'],  # Non-existent user UUID
            'initial_message': 'Test message'
        }

        response = self.client.post(
            reverse('messagethread-list'),
            data=json.dumps(test_data),
            content_type='application/json'
        )

        print(f"Response status: {response.status_code}")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_data = response.json()
        print(f"✓ Backend returned specific error: {error_data}")

        # Check that the error is specific and not generic
        error_str = str(error_data)
        self.assertIn('participants', error_str)
        self.assertTrue('does not exist' in error_str or 'invalid' in error_str.lower())
        print("✓ SUCCESS: Backend provides specific error message for frontend to display")
        print(f"Specific error message: {error_data}")

    def test_integration_scenarios(self):
        """Test integration scenarios between frontend and backend."""
        print("\n" + "=" * 60)
        print("Testing Integration Scenarios")
        print("=" * 60)

        # Test successful integration scenario
        test_data = {
            'subject': 'Integration Test Thread',
            'participants': [str(self.participant_user.id)],
            'initial_message': 'This is an integration test message'
        }

        # Step 1: Create thread via API
        response = self.client.post(
            reverse('messagethread-list'),
            data=json.dumps(test_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        print("✓ Thread creation successful via API")
        thread_data = response.json()
        thread_id = thread_data['id']

        # Step 2: Verify thread can be retrieved
        retrieve_response = self.client.get(f'/api/banking/message-threads/{thread_id}/')

        self.assertEqual(retrieve_response.status_code, status.HTTP_200_OK)
        print("✓ Thread retrieval successful")
        retrieved_data = retrieve_response.json()

        # Verify created_by is preserved
        self.assertEqual(str(retrieved_data['created_by']), str(self.test_user.id))
        print("✓ created_by field preserved in retrieval")

        # Step 3: Verify messages endpoint works
        messages_response = self.client.get(f'/api/banking/message-threads/{thread_id}/messages/')

        self.assertEqual(messages_response.status_code, status.HTTP_200_OK)
        print("✓ Messages endpoint works correctly")
        messages_data = messages_response.json()

        self.assertGreater(len(messages_data), 0)
        print("✓ Initial message was created and is accessible")

    def tearDown(self):
        """Clean up test data."""
        MessageThread.objects.filter(
            subject__in=[
                'Test Message Thread API',
                'Test created_by Assignment',
                'Integration Test Thread'
            ]
        ).delete()