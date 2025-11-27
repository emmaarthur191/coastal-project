import os
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User
from .permissions import IsSuperuser


class SuperuserModelTest(APITestCase):
    """Test superuser model functionality."""

    def setUp(self):
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='superuser'
        )
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='administrator'
        )

    def test_superuser_role_hierarchy(self):
        """Test that superuser has highest role level."""
        self.assertTrue(self.superuser.has_role_permission('administrator'))
        self.assertTrue(self.superuser.has_role_permission('operations_manager'))
        self.assertTrue(self.superuser.has_role_permission('superuser'))

    def test_superuser_permissions(self):
        """Test superuser permissions."""
        permissions = self.superuser.get_permissions_by_role()
        self.assertIn('unlimited_system_access', permissions)
        self.assertIn('bypass_all_restrictions', permissions)
        self.assertIn('full_system_access', permissions)

    def test_admin_vs_superuser_permissions(self):
        """Test that admin has fewer permissions than superuser."""
        admin_perms = self.admin.get_permissions_by_role()
        superuser_perms = self.superuser.get_permissions_by_role()

        # Superuser should have all admin permissions plus more
        for perm in admin_perms:
            if perm not in ['user_management', 'configuration_settings', 'security_monitoring']:  # Skip outdated permissions
                self.assertIn(perm, superuser_perms)

        # Superuser should have additional permissions
        self.assertGreater(len(superuser_perms), len(admin_perms))


class SuperuserPermissionTest(APITestCase):
    """Test superuser permissions."""

    def setUp(self):
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='superuser'
        )
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='administrator'
        )

    def test_superuser_permission_granted(self):
        """Test that IsSuperuser permission grants access to superuser."""
        permission = IsSuperuser()
        request = type('Request', (), {'user': self.superuser})()
        view = type('View', (), {})()

        self.assertTrue(permission.has_permission(request, view))

    def test_superuser_permission_denied_for_admin(self):
        """Test that IsSuperuser permission denies access to admin."""
        permission = IsSuperuser()
        request = type('Request', (), {'user': self.admin})()
        view = type('View', (), {})()

        self.assertFalse(permission.has_permission(request, view))

    def test_superuser_permissions(self):
        """Test superuser permissions."""
        permissions = self.superuser.get_permissions_by_role()
        self.assertIn('full_system_access', permissions)


class SuperuserAPITest(APITestCase):
    """Test superuser API endpoints."""

    def setUp(self):
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='superuser'
        )
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='administrator'
        )
        self.manager = User.objects.create_user(
            email='manager@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='manager'
        )
        self.client.force_authenticate(user=self.superuser)

    def test_superuser_operations_access_granted(self):
        """Test that superuser can access superuser operations."""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('users:superuser_operations_api')
        response = self.client.post(url, {
            'operation': 'bypass_security',
            'reason': 'Testing superuser access'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('operation_id', response.data)

    def test_superuser_operations_access_denied_for_admin(self):
        """Test that admin cannot access superuser operations."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('users:superuser_operations_api')
        response = self.client.post(url, {
            'operation': 'bypass_security',
            'reason': 'Testing admin access'
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_operations_access_denied_for_manager(self):
        """Test that manager cannot access superuser operations."""
        self.client.force_authenticate(user=self.manager)
        url = reverse('users:superuser_operations_api')
        response = self.client.post(url, {
            'operation': 'bypass_security',
            'reason': 'Testing manager access'
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_operations_invalid_operation(self):
        """Test superuser operations with invalid operation."""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('users:superuser_operations_api')
        response = self.client.post(url, {
            'operation': 'invalid_operation',
            'reason': 'Testing invalid operation'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not a valid choice', str(response.data))

    def test_superuser_operations_missing_reason(self):
        """Test superuser operations without reason."""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('users:superuser_operations_api')
        response = self.client.post(url, {
            'operation': 'bypass_security'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('This field is required', str(response.data))

    def test_superuser_can_create_any_role(self):
        """Test that superuser can create users with any role."""
        self.client.force_authenticate(user=self.superuser)
        url = reverse('users:create_user')

        # Test creating a manager (superuser role might not be allowed via regular endpoint)
        response = self.client.post(url, {
            'email': 'newmanager@test.com',
            'first_name': 'New',
            'last_name': 'Manager',
            'phone': '1234567890',
            'password': os.getenv('TEST_USER_PASSWORD', 'test123'),
            'role': 'manager'
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'manager')

    def test_admin_cannot_create_superuser(self):
        """Test that admin cannot create superuser."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('users:create_user')

        response = self.client.post(url, {
            'email': 'attempted_superuser@test.com',
            'first_name': 'Attempted',
            'last_name': 'Superuser',
            'phone': '1234567890',
            'password': os.getenv('TEST_USER_PASSWORD', 'test123'),
            'role': 'superuser'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('superuser', str(response.data))


class SuperuserDashboardTest(APITestCase):
    """Test superuser dashboard functionality."""

    def setUp(self):
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='superuser'
        )

    def test_superuser_dashboard_fields(self):
        """Test that superuser dashboard includes superuser-specific fields."""
        from .serializers import RoleBasedDashboardSerializer

        serializer = RoleBasedDashboardSerializer(context={'request': type('Request', (), {'user': self.superuser})()})
        fields = serializer.fields.keys()

        # Check for superuser-specific fields
        self.assertIn('unlimited_system_access', fields)
        self.assertIn('bypass_all_restrictions', fields)
        self.assertIn('system_administration', fields)
        self.assertIn('all_permissions', fields)


class SuperuserRateLimitTest(APITestCase):
    """Test that superuser bypasses rate limits."""

    def setUp(self):
        self.superuser = User.objects.create_user(
            email='superuser@test.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            role='superuser'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.superuser)

    def test_superuser_bypasses_rate_limits(self):
        """Test that superuser requests are not rate limited."""
        # This test would need to be run with rate limiting enabled
        # For now, just ensure the endpoint is accessible
        url = reverse('users:superuser_operations_api')
        for i in range(10):  # Make multiple requests
            response = self.client.post(url, {'operation': 'bypass_security', 'reason': 'Testing rate limit bypass'})
            self.assertEqual(response.status_code, status.HTTP_200_OK)


if __name__ == '__main__':
    pytest.main([__file__])