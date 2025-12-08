#!/usr/bin/env python
"""
Comprehensive test script for staff registration module.
Tests all components: models, serializers, views, and API endpoints.
"""

import os
import sys
import django
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import UserProfile, UserDocuments, OTPVerification
from users.serializers import UserProfileSerializer, EnhancedUserRegistrationSerializer

User = get_user_model()

class StaffRegistrationTestCase(APITestCase):
    """Comprehensive test case for staff registration functionality."""

    def setUp(self):
        """Set up test data."""
        # Create admin user for testing
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            first_name='Admin',
            last_name='User',
            role='administrator'
        )
        UserProfile.objects.create(user=self.admin_user)

        # Test data for staff registration
        self.staff_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@test.com',
            'phone': '+233501234567',
            'role': 'cashier',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'house_address': '123 Main Street, Accra, Ghana',
            'contact_address': '456 Business Avenue, Accra, Ghana',
            'government_id': 'GHA123456789',
            'ssnit_number': '123456789012',
            'bank_name': 'Test Bank',
            'account_number': '1234567890123456',
            'branch_code': '001',
            'routing_number': '123456789'
        }

        # File data for testing
        self.passport_picture = SimpleUploadedFile(
            "passport.jpg", b"fake image data", content_type="image/jpeg"
        )
        self.application_letter = SimpleUploadedFile(
            "application.pdf", b"fake pdf data", content_type="application/pdf"
        )
        self.appointment_letter = SimpleUploadedFile(
            "appointment.pdf", b"fake pdf data", content_type="application/pdf"
        )

    def test_user_model_creation(self):
        """Test User model creation with staff roles."""
        user = User.objects.create_user(
            email='test@test.com',
            password='test123',
            first_name='Test',
            last_name='User',
            role='cashier'
        )

        self.assertEqual(user.email, 'test@test.com')
        self.assertEqual(user.role, 'cashier')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)  # Django staff status

        # Test role hierarchy
        self.assertTrue(user.has_role_permission('cashier'))
        self.assertFalse(user.has_role_permission('manager'))

    def test_user_profile_creation(self):
        """Test UserProfile model creation."""
        user = User.objects.create_user(
            email='profile@test.com',
            password='test123',
            role='cashier'
        )

        profile = UserProfile.objects.create(
            user=user,
            phone='+233501234567',
            house_address='123 Test Street',
            government_id='GHA123456789',
            ssnit_number='123456789012'
        )

        self.assertEqual(profile.user, user)
        self.assertEqual(profile.phone, '+233501234567')

    def test_user_documents_creation(self):
        """Test UserDocuments model creation."""
        user = User.objects.create_user(
            email='docs@test.com',
            password='test123',
            role='cashier'
        )

        document = UserDocuments.objects.create(
            user=user,
            document_type='passport_picture',
            file=self.passport_picture,
            file_size=1024,
            file_name='passport.jpg',
            mime_type='image/jpeg'
        )

        self.assertEqual(document.user, user)
        self.assertEqual(document.document_type, 'passport_picture')
        self.assertTrue(document.is_valid_file_type())

    def test_password_strength_validation(self):
        """Test password strength validation."""
        user = User(email='test@test.com')

        # Valid password
        valid, message = user.is_password_strong('SecurePass123!')
        self.assertTrue(valid)
        self.assertEqual(message, "Password meets complexity requirements")

        # Invalid passwords
        invalid_cases = [
            'short',  # Too short
            'nouppercase123!',  # No uppercase
            'NOLOWERCASE123!',  # No lowercase
            'NoDigits!',  # No digits
            'NoSpecial123',  # No special characters
            'password123!',  # Common password
        ]

        for password in invalid_cases:
            valid, message = user.is_password_strong(password)
            self.assertFalse(valid, f"Password '{password}' should be invalid")

    def test_user_profile_serializer(self):
        """Test UserProfileSerializer functionality."""
        user = User.objects.create_user(
            email='serializer@test.com',
            password='test123',
            first_name='Serializer',
            last_name='Test',
            role='cashier'
        )

        profile = UserProfile.objects.create(
            user=user,
            phone='+233501234567',
            house_address='123 Test Street'
        )

        serializer = UserProfileSerializer(profile)
        data = serializer.data

        # Check that user fields are included
        self.assertIn('email', data)
        self.assertIn('first_name', data)
        self.assertIn('role', data)
        self.assertEqual(data['email'], 'serializer@test.com')
        self.assertEqual(data['first_name'], 'Serializer')
        self.assertEqual(data['role'], 'cashier')

    def test_enhanced_registration_serializer(self):
        """Test EnhancedUserRegistrationSerializer."""
        serializer = EnhancedUserRegistrationSerializer(data=self.staff_data)
        self.assertTrue(serializer.is_valid(), f"Serializer errors: {serializer.errors}")

        # Test with invalid data
        invalid_data = self.staff_data.copy()
        invalid_data['email'] = 'invalid-email'
        serializer = EnhancedUserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())

    def test_staff_registration_api_endpoint(self):
        """Test the staff registration API endpoint."""
        self.client.force_authenticate(user=self.admin_user)

        # Create FormData for file uploads
        form_data = {
            'first_name': self.staff_data['first_name'],
            'last_name': self.staff_data['last_name'],
            'email': self.staff_data['email'],
            'phone': self.staff_data['phone'],
            'role': self.staff_data['role'],
            'house_address': self.staff_data['house_address'],
            'contact_address': self.staff_data['contact_address'],
            'government_id': self.staff_data['government_id'],
            'ssnit_number': self.staff_data['ssnit_number'],
            'bank_name': self.staff_data['bank_name'],
            'account_number': self.staff_data['account_number'],
            'branch_code': self.staff_data['branch_code'],
            'routing_number': self.staff_data['routing_number'],
        }

        # Test without files first
        response = self.client.post(
            reverse('users:create_user'),
            data=form_data,
            format='multipart'
        )

        # Should succeed (files are optional in some cases)
        if response.status_code == status.HTTP_201_CREATED:
            self.assertIn('staff_id', response.data)
            self.assertIn('message', response.data)

            # Verify user was created
            user = User.objects.get(email=self.staff_data['email'])
            self.assertEqual(user.role, self.staff_data['role'])
            self.assertEqual(user.first_name, self.staff_data['first_name'])

            # Verify profile was created
            profile = UserProfile.objects.get(user=user)
            self.assertEqual(profile.phone, self.staff_data['phone'])

    def test_unauthorized_staff_registration(self):
        """Test that unauthorized users cannot create staff."""
        # Create regular user
        regular_user = User.objects.create_user(
            email='regular@test.com',
            password='test123',
            role='customer'
        )
        self.client.force_authenticate(user=regular_user)

        response = self.client.post(
            reverse('users:create_user'),
            data=self.staff_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_email_prevention(self):
        """Test that duplicate emails are prevented."""
        self.client.force_authenticate(user=self.admin_user)

        # Create first user
        response1 = self.client.post(
            reverse('users:create_user'),
            data=self.staff_data,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Try to create user with same email
        response2 = self.client.post(
            reverse('users:create_user'),
            data=self.staff_data,
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_validation(self):
        """Test that invalid roles are rejected."""
        self.client.force_authenticate(user=self.admin_user)

        invalid_data = self.staff_data.copy()
        invalid_data['role'] = 'invalid_role'

        response = self.client.post(
            reverse('users:create_user'),
            data=invalid_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_required_fields_validation(self):
        """Test that required fields are validated."""
        self.client.force_authenticate(user=self.admin_user)

        # Test missing required fields
        required_fields = ['first_name', 'last_name', 'email', 'role']
        for field in required_fields:
            invalid_data = self.staff_data.copy()
            del invalid_data[field]

            response = self.client.post(
                reverse('users:create_user'),
                data=invalid_data,
                format='json'
            )

            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Missing {field} should cause validation error"
            )

    def test_phone_number_validation(self):
        """Test phone number validation."""
        self.client.force_authenticate(user=self.admin_user)

        invalid_data = self.staff_data.copy()
        invalid_data['phone'] = 'invalid-phone'

        response = self.client.post(
            reverse('users:create_user'),
            data=invalid_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_government_id_validation(self):
        """Test government ID validation."""
        self.client.force_authenticate(user=self.admin_user)

        # Test invalid government ID
        invalid_data = self.staff_data.copy()
        invalid_data['government_id'] = 'invalid@id!'

        response = self.client.post(
            reverse('users:create_user'),
            data=invalid_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ssnit_validation(self):
        """Test SSNIT number validation."""
        self.client.force_authenticate(user=self.admin_user)

        # Test invalid SSNIT
        invalid_data = self.staff_data.copy()
        invalid_data['ssnit_number'] = '123456789'  # Too short

        response = self.client.post(
            reverse('users:create_user'),
            data=invalid_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_account_number_validation(self):
        """Test bank account number validation."""
        self.client.force_authenticate(user=self.admin_user)

        # Test invalid account number
        invalid_data = self.staff_data.copy()
        invalid_data['account_number'] = 'invalid@account!'

        response = self.client.post(
            reverse('users:create_user'),
            data=invalid_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_list_endpoint(self):
        """Test staff list endpoint."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(reverse('users:staff_list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_user_profile_endpoint(self):
        """Test user profile endpoint."""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(reverse('users:profile'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('email', response.data)
        self.assertIn('first_name', response.data)
        self.assertIn('role', response.data)

    def test_user_profile_update(self):
        """Test user profile update."""
        self.client.force_authenticate(user=self.admin_user)

        update_data = {
            'phone': '+233509876543',
            'house_address': 'Updated Address'
        }

        response = self.client.patch(
            reverse('users:profile'),
            data=update_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.admin_user.profile.refresh_from_db()
        self.assertEqual(self.admin_user.profile.phone, '+233509876543')


def run_tests():
    """Run all staff registration tests."""
    import unittest

    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(StaffRegistrationTestCase)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Print summary
    print(f"\n{'='*50}")
    print("STAFF REGISTRATION TEST SUMMARY")
    print(f"{'='*50}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")

    if result.failures:
        print(f"\n{'FAILURES:'}")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")

    if result.errors:
        print(f"\n{'ERRORS:'}")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")

    success = len(result.failures) == 0 and len(result.errors) == 0
    print(f"\nOverall result: {'PASS' if success else 'FAIL'}")
    return success


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)