#!/usr/bin/env python
"""
Comprehensive test script for superuser staff registration module.
Tests parity with admin staff registration.
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

class SuperuserStaffRegistrationTestCase(APITestCase):
    """Comprehensive test case for superuser staff registration functionality."""

    def setUp(self):
        """Set up test data."""
        # Create superuser for testing
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password='test123',
            first_name='Super',
            last_name='User',
            role='superuser'
        )
        UserProfile.objects.create(user=self.superuser)

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
            'routing_number': '123456789',
            'date_of_birth': '1990-01-01',
            'employment_date': '2023-01-01',
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

    def test_superuser_create_staff(self):
        """Test that superuser can create staff."""
        self.client.force_authenticate(user=self.superuser)

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
            'password': self.staff_data['password'],
            'password_confirm': self.staff_data['password_confirm'],
        }

        response = self.client.post(
            reverse('users:create_user'),
            data=form_data,
            format='multipart'
        )


        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['email'], self.staff_data['email'])
        
        # Verify user was created
        user = User.objects.get(email=self.staff_data['email'])
        self.assertEqual(user.role, self.staff_data['role'])

    def test_superuser_staff_list_access(self):
        """Test superuser access to staff list."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(reverse('users:staff_list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_enhanced_registration(self):
        """Test superuser access to enhanced registration view."""
        self.client.force_authenticate(user=self.superuser)
        
        # Prepare data including files
        data = self.staff_data.copy()
        data['passport_picture'] = self.passport_picture
        data['application_letter'] = self.application_letter
        data['appointment_letter'] = self.appointment_letter
        
        response = self.client.post(
            reverse('users:enhanced_staff_registration'),
            data=data,
            format='multipart'
        )
        

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
