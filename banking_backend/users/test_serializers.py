import pytest
from django.test import TestCase
from users.serializers import UserProfileSerializer, NotificationSettingsSerializer


class UserProfileSerializerTestCase(TestCase):
    """Test cases for UserProfileSerializer."""

    def setUp(self):
        """Set up test data."""
        from users.models import User, UserProfile
        self.user = User.objects.create_user(
            email='profile_serializer_test@example.com',
            first_name='Profile',
            last_name='Serializer',
            role='member',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            notify_email=True,
            notify_sms=False,
            notify_push=True
        )

    def test_user_profile_serializer_read(self):
        """Test reading user profile data."""
        serializer = UserProfileSerializer(self.profile)
        data = serializer.data
        self.assertEqual(data['first_name'], self.user.first_name)
        self.assertEqual(data['last_name'], self.user.last_name)
        self.assertEqual(data['email'], self.user.email)
        self.assertEqual(data['role'], self.user.role)

    def test_user_profile_serializer_update(self):
        """Test updating user profile data."""
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@example.com'
        }
        serializer = UserProfileSerializer(self.profile, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_profile = serializer.save()

        # Check that User model was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')
        self.assertEqual(self.user.email, 'updated@example.com')


class NotificationSettingsSerializerTestCase(TestCase):
    """Test cases for NotificationSettingsSerializer."""

    def setUp(self):
        """Set up test data."""
        from users.models import User, UserProfile
        self.user = User.objects.create_user(
            email='notification_test@example.com',
            first_name='Notification',
            last_name='Test',
            role='member',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            notify_email=True,
            notify_sms=False,
            notify_push=True
        )

    def test_notification_settings_serializer_read(self):
        """Test reading notification settings."""
        serializer = NotificationSettingsSerializer(self.profile)
        data = serializer.data
        self.assertEqual(data['notify_email'], True)
        self.assertEqual(data['notify_sms'], False)
        self.assertEqual(data['notify_push'], True)

    def test_notification_settings_serializer_update(self):
        """Test updating notification settings."""
        update_data = {
            'notify_email': False,
            'notify_sms': True,
            'notify_push': False
        }
        serializer = NotificationSettingsSerializer(self.profile, data=update_data)
        self.assertTrue(serializer.is_valid())
        updated_profile = serializer.save()

        self.assertEqual(updated_profile.notify_email, False)
        self.assertEqual(updated_profile.notify_sms, True)
        self.assertEqual(updated_profile.notify_push, False)


# Pytest-style tests
@pytest.mark.django_db
class TestUserSerializers:
    """Test user serializers with pytest."""

    def test_user_profile_serializer_validation(self, user_factory):
        """Test UserProfileSerializer validation."""
        user = user_factory()
        from users.models import UserProfile
        profile = UserProfile.objects.create(user=user)

        # Test valid data
        valid_data = {
            'first_name': 'Valid',
            'last_name': 'Name',
            'email': 'valid@example.com'
        }
        serializer = UserProfileSerializer(profile, data=valid_data, partial=True)
        assert serializer.is_valid()

        # Test invalid email
        invalid_data = {
            'email': 'invalid-email'
        }
        serializer = UserProfileSerializer(profile, data=invalid_data, partial=True)
        assert not serializer.is_valid()
        assert 'email' in serializer.errors

    def test_notification_settings_serializer_boolean_fields(self, user_factory):
        """Test NotificationSettingsSerializer handles boolean fields correctly."""
        user = user_factory()
        from users.models import UserProfile
        profile = UserProfile.objects.create(user=user)

        # Test all combinations
        test_cases = [
            {'notify_email': True, 'notify_sms': True, 'notify_push': True},
            {'notify_email': False, 'notify_sms': False, 'notify_push': False},
            {'notify_email': True, 'notify_sms': False, 'notify_push': True},
        ]

        for case in test_cases:
            serializer = NotificationSettingsSerializer(profile, data=case)
            assert serializer.is_valid()
            updated_profile = serializer.save()
            assert updated_profile.notify_email == case['notify_email']
            assert updated_profile.notify_sms == case['notify_sms']
            assert updated_profile.notify_push == case['notify_push']