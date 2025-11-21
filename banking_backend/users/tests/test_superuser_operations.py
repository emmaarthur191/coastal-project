import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
from users.models import UserProfile
from banking.models import Account

User = get_user_model()


class SuperuserOperationsTestCase(APITestCase):
    """Test cases for superuser operations."""

    def setUp(self):
        """Set up test data."""
        # Create superuser
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password='testpass123',
            first_name='Super',
            last_name='User',
            role='superuser'
        )
        UserProfile.objects.create(user=self.superuser)

        # Create regular users for testing
        self.regular_user = User.objects.create_user(
            email='regular@test.com',
            password='testpass123',
            first_name='Regular',
            last_name='User',
            role='customer'
        )
        UserProfile.objects.create(user=self.regular_user)

        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='administrator'
        )
        UserProfile.objects.create(user=self.admin_user)

    def test_superuser_can_access_operations(self):
        """Test that superuser can access superuser operations."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'system_health',
            'reason': 'Testing system health check'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)

    def test_regular_user_cannot_access_operations(self):
        """Test that regular users cannot access superuser operations."""
        self.client.force_authenticate(user=self.regular_user)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'system_health',
            'reason': 'Testing system health check'
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_user_operation(self):
        """Test creating a user via superuser operations."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'create_user',
            'reason': 'Creating test user',
            'email': 'newuser@test.com',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'customer'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        # Check that user was created
        new_user = User.objects.get(email='newuser@test.com')
        self.assertEqual(new_user.role, 'customer')
        self.assertEqual(new_user.first_name, 'New')

    def test_modify_user_role_operation(self):
        """Test modifying user role via superuser operations."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'modify_user_role',
            'reason': 'Promoting user to manager',
            'target': str(self.regular_user.id),
            'role': 'manager'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.role, 'manager')

    def test_activate_user_operation(self):
        """Test activating user via superuser operations."""
        # Deactivate user first
        self.regular_user.is_active = False
        self.regular_user.save()

        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'activate_user',
            'reason': 'Activating user account',
            'target': str(self.regular_user.id)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_active)

    def test_deactivate_user_operation(self):
        """Test deactivating user via superuser operations."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'deactivate_user',
            'reason': 'Deactivating user account',
            'target': str(self.regular_user.id)
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh user from database
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)

    @patch('users.views.psutil')
    def test_system_health_operation(self, mock_psutil):
        """Test system health check operation."""
        # Mock psutil functions
        mock_psutil.cpu_percent.return_value = 45.5
        mock_psutil.virtual_memory.return_value = MagicMock(
            percent=60.0,
            used=6144000000,
            total=10240000000
        )
        mock_psutil.disk_usage.return_value = MagicMock(percent=75.0)
        mock_psutil.boot_time.return_value = 1609459200.0  # 2021-01-01 00:00:00

        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser_operations')
        response = self.client.post(url, {
            'operation': 'system_health',
            'reason': 'Checking system health'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertIn('database', data)
        self.assertIn('system', data)
        self.assertIn('timestamp', data)

        self.assertEqual(data['system']['cpu_percent'], 45.5)
        self.assertEqual(data['system']['memory_percent'], 60.0)

    @patch('users.views.subprocess.run')
    def test_backup_database_operation(self, mock_subprocess):
        """Test database backup operation."""
        # Mock subprocess.run to return success
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "Backup completed successfully"
        mock_subprocess.return_value = mock_result

        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'backup_database',
            'reason': 'Creating database backup'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertEqual(data['status'], 'success')
        self.assertIn('output', data)

    def test_monitor_activity_operation(self):
        """Test monitoring activity operation."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'monitor_activity',
            'reason': 'Monitoring system activity'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertIn('active_users_24h', data)
        self.assertIn('recent_logs', data)
        self.assertIn('recent_security_events', data)
        self.assertIn('timestamp', data)

    def test_invalid_operation(self):
        """Test invalid operation handling."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'invalid_operation',
            'reason': 'Testing invalid operation'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_missing_reason(self):
        """Test missing reason handling."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'system_health'
            # Missing reason
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bypass_security_operation(self):
        """Test security bypass operation."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'bypass_security',
            'reason': 'Testing security bypass',
            'target': 'test_system'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertEqual(data['status'], 'bypassed')
        self.assertEqual(data['target'], 'test_system')

    def test_emergency_access_operation(self):
        """Test emergency access operation."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'emergency_access',
            'reason': 'Granting emergency access',
            'target': 'emergency_system'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertEqual(data['status'], 'granted')
        self.assertEqual(data['target'], 'emergency_system')

    def test_system_reset_operation(self):
        """Test system reset operation."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'system_reset',
            'reason': 'Initiating system reset'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertEqual(data['status'], 'initiated')

    def test_audit_bypass_operation(self):
        """Test audit bypass operation."""
        self.client.force_authenticate(user=self.superuser)

        url = reverse('superuser-operations')
        response = self.client.post(url, {
            'operation': 'audit_bypass',
            'reason': 'Testing audit bypass',
            'target': 'audit_system'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        self.assertEqual(data['status'], 'bypassed')
        self.assertEqual(data['target'], 'audit_system')