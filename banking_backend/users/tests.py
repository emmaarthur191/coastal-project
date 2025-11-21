import pytest
from django.test import TestCase
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from users.models import User, UserProfile


class UserModelTestCase(TestCase):
    """Test cases for User model."""

    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'member',
            'password': 'testpass123'
        }

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.last_name, self.user_data['last_name'])
        self.assertEqual(user.role, self.user_data['role'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser."""
        superuser_data = self.user_data.copy()
        superuser_data.update({
            'email': 'admin@example.com',
            'role': 'manager'
        })
        superuser = User.objects.create_superuser(**superuser_data)
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_user_str_representation(self):
        """Test string representation of User."""
        user = User.objects.create_user(**self.user_data)
        expected_str = f"{self.user_data['email']} ({self.user_data['role']})"
        self.assertEqual(str(user), expected_str)

    def test_user_roles(self):
        """Test all user roles."""
        roles = ['member', 'cashier', 'mobile_banker', 'operations_manager', 'manager']
        for role in roles:
            with self.subTest(role=role):
                user_data = self.user_data.copy()
                user_data['email'] = f'{role}@example.com'
                user_data['role'] = role
                user = User.objects.create_user(**user_data)
                self.assertEqual(user.role, role)

    def test_email_uniqueness(self):
        """Test that email must be unique."""
        User.objects.create_user(**self.user_data)
        with self.assertRaises(Exception):  # IntegrityError
            User.objects.create_user(**self.user_data)

    def test_authentication(self):
        """Test user authentication."""
        user = User.objects.create_user(**self.user_data)
        authenticated_user = authenticate(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        self.assertEqual(authenticated_user, user)


class UserProfileModelTestCase(TestCase):
    """Test cases for UserProfile model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='profile@example.com',
            first_name='Profile',
            last_name='Test',
            role='member',
            password='testpass123'
        )

    def test_create_user_profile(self):
        """Test creating a user profile."""
        profile = UserProfile.objects.create(
            user=self.user,
            notify_email=True,
            notify_sms=False,
            notify_push=True
        )
        self.assertEqual(profile.user, self.user)
        self.assertTrue(profile.notify_email)
        self.assertFalse(profile.notify_sms)
        self.assertTrue(profile.notify_push)

    def test_profile_str_representation(self):
        """Test string representation of UserProfile."""
        profile = UserProfile.objects.create(user=self.user)
        expected_str = f"{self.user.email} Profile"
        self.assertEqual(str(profile), expected_str)

    def test_one_to_one_relationship(self):
        """Test one-to-one relationship between User and UserProfile."""
        profile1 = UserProfile.objects.create(user=self.user)
        # Creating another profile for the same user should fail
        with self.assertRaises(Exception):
            UserProfile.objects.create(user=self.user)


# Pytest-style tests
@pytest.mark.django_db
class TestUserManager:
    """Test UserManager with pytest."""

    def test_create_user_without_email_raises_error(self):
        """Test that creating user without email raises ValueError."""
        from users.models import UserManager
        manager = UserManager()
        with pytest.raises(ValueError, match="The Email field must be set"):
            manager.create_user(email=None, password='test')

    def test_normalize_email(self):
        """Test email normalization."""
        from users.models import UserManager
        manager = UserManager()
        user = manager.create_user(
            email='Test.Email@EXAMPLE.COM',
            password='test'
        )
        assert user.email == 'Test.Email@example.com'
