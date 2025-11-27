import os
import pytest
from unittest.mock import patch, Mock
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import check_password
from users.models import User


class TestPasswordResetTokenHandling(TestCase):
    """Comprehensive tests for password reset token handling."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            first_name='Test',
            last_name='User'
        )

    def test_set_reset_token_creates_hashed_token(self):
        """Test that set_reset_token creates a properly hashed token."""
        token = 'test-reset-token-123'
        self.user.set_reset_token(token)

        # Token should be hashed,  # not stored in plain text
        assert self.user.reset_token != token
        assert self.user.reset_token_created_at is not None

        # Should be able to verify with check_password
        assert check_password(token, self.user.reset_token)

    def test_set_reset_token_sets_timestamp(self):
        """Test that set_reset_token sets the creation timestamp."""
        before = timezone.now()
        self.user.set_reset_token('token123')
        after = timezone.now()

        assert before <= self.user.reset_token_created_at <= after

    def test_check_reset_token_valid_token(self):
        """Test check_reset_token with valid token within time limit."""
        token = 'valid-token-123'
        self.user.set_reset_token(token)

        assert self.user.check_reset_token(token) is True

    def test_check_reset_token_expired_token(self):
        """Test check_reset_token with expired token."""
        token = 'expired-token-123'
        self.user.set_reset_token(token)

        # Manually set timestamp to be expired (16 minutes ago)
        self.user.reset_token_created_at = timezone.now() - timedelta(minutes=16)
        self.user.save()

        assert self.user.check_reset_token(token) is False

    def test_check_reset_token_no_token_set(self):
        """Test check_reset_token when no token is set."""
        assert self.user.check_reset_token('any-token') is False

    def test_check_reset_token_no_timestamp(self):
        """Test check_reset_token when timestamp is not set."""
        self.user.reset_token = 'hashed-token'
        self.user.reset_token_created_at = None
        self.user.save()

        assert self.user.check_reset_token('plain-token') is False

    def test_check_reset_token_wrong_token(self):
        """Test check_reset_token with wrong token."""
        self.user.set_reset_token('correct-token')
        assert self.user.check_reset_token('wrong-token') is False

    def test_check_reset_token_boundary_time(self):
        """Test check_reset_token at the boundary of expiration time."""
        token = 'boundary-token'
        self.user.set_reset_token(token)

        # Set timestamp to exactly 15 minutes ago (should be invalid)
        self.user.reset_token_created_at = timezone.now() - timedelta(minutes=15)
        self.user.save()

        assert self.user.check_reset_token(token) is False

        # Set timestamp to just over 15 minutes ago (should be expired)
        self.user.reset_token_created_at = timezone.now() - timedelta(minutes=15, seconds=1)
        self.user.save()

        assert self.user.check_reset_token(token) is False

    def test_clear_reset_token(self):
        """Test clear_reset_token removes token and timestamp."""
        self.user.set_reset_token('token-to-clear')
        assert self.user.reset_token is not None
        assert self.user.reset_token_created_at is not None

        self.user.clear_reset_token()

        assert self.user.reset_token is None
        assert self.user.reset_token_created_at is None

    def test_clear_reset_token_no_token_set(self):
        """Test clear_reset_token when no token is set."""
        self.user.reset_token = None
        self.user.reset_token_created_at = None

        # Should not raise any errors
        self.user.clear_reset_token()

        assert self.user.reset_token is None
        assert self.user.reset_token_created_at is None

    def test_reset_token_expiration_window(self):
        """Test that tokens expire after exactly 15 minutes."""
        token = 'expiration-test-token'
        self.user.set_reset_token(token)

        # Test at various time points
        test_times = [14, 15, 16]  # minutes

        for minutes in test_times:
            self.user.refresh_from_db()
            self.user.reset_token_created_at = timezone.now() - timedelta(minutes=minutes)
            self.user.save()

            is_valid = self.user.check_reset_token(token)
            expected_valid = minutes < 15

            assert is_valid == expected_valid, f"Token should {'be' if expected_valid else 'not be'} valid at {minutes} minutes"

    def test_reset_token_hashing_security(self):
        """Test that reset tokens are properly hashed and not vulnerable to timing attacks."""
        token1 = 'token123'
        token2 = 'token124'  # Similar but different

        self.user.set_reset_token(token1)

        # Should validate correct token
        assert self.user.check_reset_token(token1) is True

        # Should not validate different token
        assert self.user.check_reset_token(token2) is False

        # Should not validate empty token
        assert self.user.check_reset_token('') is False

        # Should not validate very long token
        long_token = 'a' * 1000
        assert self.user.check_reset_token(long_token) is False

    def test_reset_token_multiple_users_isolation(self):
        """Test that reset tokens are properly isolated between users."""
        # Create another user
        user2 = User.objects.create_user(
            email='test2@example.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            first_name='Test2',
            last_name='User2'
        )

        token1 = 'token-user1'
        token2 = 'token-user2'

        self.user.set_reset_token(token1)
        user2.set_reset_token(token2)

        # Each user should only validate their own token
        assert self.user.check_reset_token(token1) is True
        assert self.user.check_reset_token(token2) is False
        assert user2.check_reset_token(token1) is False
        assert user2.check_reset_token(token2) is True

    def test_reset_token_database_storage(self):
        """Test that reset tokens are properly stored and retrieved from database."""
        token = 'database-test-token'
        self.user.set_reset_token(token)

        # Refresh from database to ensure persistence
        self.user.refresh_from_db()

        assert self.user.reset_token is not None
        assert self.user.reset_token_created_at is not None
        assert self.user.check_reset_token(token) is True

    def test_reset_token_concurrent_usage(self):
        """Test reset token behavior with concurrent operations."""
        token1 = 'token1'
        token2 = 'token2'

        # Set first token
        self.user.set_reset_token(token1)
        assert self.user.check_reset_token(token1) is True

        # Set second token (should overwrite first)
        self.user.set_reset_token(token2)
        assert self.user.check_reset_token(token1) is False  # Old token should be invalid
        assert self.user.check_reset_token(token2) is True   # New token should be valid

    def test_reset_token_edge_cases(self):
        """Test reset token handling with edge cases."""
        # Test with special characters in token
        special_token = 'token-with-!@#$%^&*()_+{}|:<>?[]\\;\'",./'
        self.user.set_reset_token(special_token)
        assert self.user.check_reset_token(special_token) is True

        # Test with unicode characters
        unicode_token = 'tökén-wíth-ünicödé'
        self.user.set_reset_token(unicode_token)
        assert self.user.check_reset_token(unicode_token) is True

        # Test with very short token
        short_token = 'a'
        self.user.set_reset_token(short_token)
        assert self.user.check_reset_token(short_token) is True

    def test_reset_token_after_password_change(self):
        """Test that reset tokens work correctly after password changes."""
        token = 'password-change-test'
        self.user.set_reset_token(token)

        # Change password
        self.user.set_password('newpassword123')
        self.user.save()

        # Token should still be valid (independent of password)
        assert self.user.check_reset_token(token) is True

        # Clear token after use
        self.user.clear_reset_token()
        assert self.user.check_reset_token(token) is False