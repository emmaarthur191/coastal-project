import time
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from django.test import RequestFactory, override_settings
from rest_framework import serializers

from core.permissions import IsSuperUser
from core.utils.cache import FallbackRedisCache
from core.middleware.anomaly_detection import TransactionVelocityMiddleware
from users.models import PasswordHistory, UserActivity, AdminNotification, PasswordResetToken
from users.serializers import ChangePasswordSerializer, PasswordResetConfirmSerializer

User = get_user_model()


@pytest.mark.django_db
class TestSprint3Hardening:
    """Test suite for Sprint 3 security hardening implementations."""

    # =========================================================================
    # 1. FallbackRedisCache (H-06)
    # =========================================================================
    def test_fallback_cache_success_and_failure(self):
        """Test FallbackRedisCache redirects to LocMemCache when Redis fails, and recovers."""
        # Instantiate cache with local settings
        fallback_cache = FallbackRedisCache("127.0.0.1:6379", {})
        
        # Mock the underlying redis cache get/set/has_key methods
        fallback_cache._redis_cache = MagicMock()
        fallback_cache._locmem_cache = MagicMock()
        
        # Test case 1: Redis is healthy
        fallback_cache._redis_cache.get.return_value = "redis_value"
        val = fallback_cache.get("test_key")
        assert val == "redis_value"
        fallback_cache._redis_cache.get.assert_called_once_with("test_key", default=None, version=None)
        
        # Test case 2: Redis fails, switches to LocMemCache
        fallback_cache._redis_cache.get.side_effect = Exception("Redis connection refused")
        fallback_cache._locmem_cache.get.return_value = "locmem_value"
        
        # Reset mock calls
        fallback_cache._redis_cache.get.reset_mock()
        
        val2 = fallback_cache.get("test_key2")
        assert val2 == "locmem_value"
        # Redis should be tried, raise exception, set fallback active, then LocMem is called
        assert fallback_cache._fallback_active
        fallback_cache._locmem_cache.get.assert_called_once_with("test_key2", default=None, version=None)

        # Test case 3: Recovery attempt
        # Modify check interval to 0 and reset last check to force immediate retry
        fallback_cache._check_interval = 0
        fallback_cache._last_redis_check = 0
        fallback_cache._redis_cache.has_key.return_value = True
        fallback_cache._redis_cache.get.side_effect = None
        fallback_cache._redis_cache.get.return_value = "recovered_redis"
        
        val3 = fallback_cache.get("test_key3")
        assert not fallback_cache._fallback_active
        assert val3 == "recovered_redis"

    # =========================================================================
    # 2. Password History (H-08)
    # =========================================================================
    def test_password_history_created_on_save(self):
        """Test password history automatically saved when user password is set/changed."""
        # Create a new user
        user = User.objects.create_user(
            email="history_test@coastalbank.com",
            phone_number="0241234567",
            password="InitialSecurePassword123!"
        )
        
        # Ensure a password history entry is created
        assert PasswordHistory.objects.filter(user=user).count() == 1
        history_entry = PasswordHistory.objects.filter(user=user).first()
        assert history_entry.password_hash == user.password
        
        # Change password and verify new history entry is appended
        old_hash = user.password
        user.set_password("SecondarySecurePassword456!")
        user.save()
        
        assert PasswordHistory.objects.filter(user=user).count() == 2
        latest_entry = PasswordHistory.objects.filter(user=user).first()
        assert latest_entry.password_hash == user.password
        assert latest_entry.password_hash != old_hash

    def test_change_password_serializer_checks_history(self):
        """Test ChangePasswordSerializer rejects passwords matching history."""
        user = User.objects.create_user(
            email="reuse_test@coastalbank.com",
            phone_number="0241234568",
            password="FirstSecurePassword123!"
        )
        
        # Create a request mock
        request = MagicMock()
        request.user = user
        
        # Attempt to change password to the same password (reuse)
        serializer = ChangePasswordSerializer(
            data={
                "old_password": "FirstSecurePassword123!",
                "new_password": "FirstSecurePassword123!",
                "confirm_password": "FirstSecurePassword123!"
            },
            context={"request": request}
        )
        
        with pytest.raises(serializers.ValidationError) as excinfo:
            serializer.is_valid(raise_exception=True)
        assert "You cannot reuse a previously used password." in str(excinfo.value)

    def test_password_reset_confirm_serializer_checks_history(self):
        """Test PasswordResetConfirmSerializer rejects reuse during password reset confirmation."""
        user = User.objects.create_user(
            email="reset_reuse@coastalbank.com",
            phone_number="0241234569",
            password="OriginalPassword999!"
        )
        
        # Create password reset token
        reset_token = PasswordResetToken.create_for_user(user, None)
        
        # Attempt to confirm reset using the same original password
        serializer = PasswordResetConfirmSerializer(
            data={
                "token": reset_token.token,
                "new_password": "OriginalPassword999!",
                "confirm_password": "OriginalPassword999!"
            }
        )
        
        with pytest.raises(serializers.ValidationError) as excinfo:
            serializer.is_valid(raise_exception=True)
        assert "You cannot reuse a previously used password." in str(excinfo.value)

    # =========================================================================
    # 3. Transaction Velocity Middleware (M-01)
    # =========================================================================
    def test_transaction_velocity_frequency_limit(self):
        """Test TransactionVelocityMiddleware rate limits frequent requests."""
        # Create staff user and client user
        user = User.objects.create_user(
            email="velocity_client@coastalbank.com",
            phone_number="0241234570",
            password="SecurePassword123!"
        )
        
        factory = RequestFactory()
        middleware = TransactionVelocityMiddleware(lambda r: MagicMock(status_code=200))
        
        # Clear existing keys
        cache.delete(f"tx_velocity_freq_{user.id}")
        
        # 3 quick transactions should pass
        for _ in range(3):
            request = factory.post("/api/transactions/", data={"amount": "100.00"}, content_type="application/json")
            request.user = user
            middleware(request)
            
        # 4th transaction within 1 minute should be blocked with PermissionDenied
        request_fail = factory.post("/api/transactions/", data={"amount": "100.00"}, content_type="application/json")
        request_fail.user = user
        with pytest.raises(PermissionDenied) as excinfo:
            middleware(request_fail)
        assert "Transaction frequency limit exceeded" in str(excinfo.value)
        
        # Verify critical AdminNotification was created
        assert AdminNotification.objects.filter(priority="critical", title="Suspicious Transaction Velocity").exists()

    def test_transaction_velocity_amount_limit(self):
        """Test TransactionVelocityMiddleware blocks cumulative high-value transactions."""
        user = User.objects.create_user(
            email="velocity_amount@coastalbank.com",
            phone_number="0241234571",
            password="SecurePassword123!"
        )
        
        factory = RequestFactory()
        middleware = TransactionVelocityMiddleware(lambda r: MagicMock(status_code=200))
        
        # Clear existing keys
        cache.delete(f"tx_velocity_freq_{user.id}")
        cache.delete(f"tx_velocity_amount_{user.id}")
        
        # High value transaction ($6,000) - first transaction passes
        request1 = factory.post("/api/transactions/", data={"amount": "6000.00"}, content_type="application/json")
        request1.user = user
        middleware(request1)
        
        # Second high value transaction ($5,000) - cumulative becomes $11,000 (exceeds $10,000 limit)
        request2 = factory.post("/api/transactions/", data={"amount": "5000.00"}, content_type="application/json")
        request2.user = user
        with pytest.raises(PermissionDenied) as excinfo:
            middleware(request2)
        assert "Cumulative high-value transaction limit exceeded" in str(excinfo.value)

    # =========================================================================
    # 4. IsSuperUser Permission class (M-07)
    # =========================================================================
    def test_is_superuser_permission(self):
        """Test IsSuperUser base permission logic."""
        regular_user = User.objects.create_user(
            email="regular@coastalbank.com",
            phone_number="0241234572",
            password="SecurePassword123!",
            role="manager"
        )
        superuser = User.objects.create_superuser(
            email="superuser_permission@coastalbank.com",
            phone_number="0241234573",
            password="SecurePassword123!"
        )
        
        permission = IsSuperUser()
        
        request_regular = MagicMock()
        request_regular.user = regular_user
        
        request_super = MagicMock()
        request_super.user = superuser
        
        assert not permission.has_permission(request_regular, None)
        assert permission.has_permission(request_super, None)
