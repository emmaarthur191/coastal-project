import os
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from conftest import TEST_PASSWORD
from django.test import override_settings
from django.conf import settings
from django.core.cache import cache

from users.security import SecurityService, validate_password_strength


@pytest.mark.django_db
class TestSecurityService:
    """Tests for SecurityService utilities in users/security.py."""

    def test_validate_password_strength(self):
        """Test password complexity validation logic."""
        # Valid password
        is_valid, errors = validate_password_strength("StrongPass123!")
        assert is_valid
        assert not errors

        # Too short (< 12)
        is_valid, errors = validate_password_strength("Short1!")
        assert not is_valid
        assert any("12 characters" in e for e in errors)

        # No uppercase
        is_valid, errors = validate_password_strength("weakpass123!")
        assert not is_valid
        assert any("uppercase" in e for e in errors)

        # No lowercase
        is_valid, errors = validate_password_strength("WEAKPASS123!")
        assert not is_valid
        assert any("lowercase" in e for e in errors)

        # No digit
        is_valid, errors = validate_password_strength("WeakPass!!!!")
        assert not is_valid
        assert any("digit" in e for e in errors)

        # No special char
        is_valid, errors = validate_password_strength("WeakPass1234")
        assert not is_valid
        assert any("special character" in e for e in errors)

    def test_get_client_ip_standard(self):
        """Test standard REMOTE_ADDR extraction."""
        request = MagicMock()
        request.META = {"REMOTE_ADDR": "192.168.1.1"}
        assert SecurityService.get_client_ip(request) == "192.168.1.1"

    @override_settings(TRUSTED_PROXIES=['127.0.0.1'])
    def test_get_client_ip_forwarded(self):
        """Test X-Forwarded-For extraction."""
        request = MagicMock()
        request.META = {
            "HTTP_X_FORWARDED_FOR": "203.0.113.195, 150.172.238.178",
            "REMOTE_ADDR": "127.0.0.1",
        }
        # In non-cloud env, it should trust local if configured
        assert SecurityService.get_client_ip(request) == "203.0.113.195"

    @override_settings(TRUSTED_PROXIES=['127.0.0.1'])
    def test_get_client_ip_spoof_detection(self):
        """Test that spoofed IPs from untrusted proxies are rejected."""
        request = MagicMock()
        request.META = {
            "HTTP_X_FORWARDED_FOR": "10.0.0.1",
            "REMOTE_ADDR": "192.168.50.50",
        }
        with patch.object(settings, "TRUSTED_PROXIES", ["127.0.0.1"]):
            # REMOTE_ADDR is not in trusted, so it returns REMOTE_ADDR instead of XFF
            assert SecurityService.get_client_ip(request) == "192.168.50.50"

    def test_get_client_ip_render_cloud(self):
        """Test that Render cloud environment trusts the proxy chain."""
        request = MagicMock()
        request.META = {
            "HTTP_X_FORWARDED_FOR": "203.0.113.195",
            "REMOTE_ADDR": "10.0.0.1", # Untrusted internal IP
        }
        with patch.dict(os.environ, {"RENDER": "true"}):
            # On Render, we trust the proxy chain implicitly
            assert SecurityService.get_client_ip(request) == "203.0.113.195"

    def test_rate_limiting_flow(self):
        """Test rate limit checking and recording."""
        request = MagicMock()
        request.META = {"REMOTE_ADDR": "1.2.3.4"}
        ip = "1.2.3.4"
        cache_key = f"login_attempts:{ip}"

        cache.delete(cache_key)
        assert not SecurityService.is_rate_limited(request)

        # Record attempts
        for _ in range(SecurityService.get_max_attempts() - 1):
            SecurityService.record_login_attempt(request)
        
        assert not SecurityService.is_rate_limited(request)
        
        # Last attempt to trigger limit
        SecurityService.record_login_attempt(request)
        assert SecurityService.is_rate_limited(request)

        cache.delete(cache_key)

    @patch("requests.get")
    def test_get_location_info_localhost(self, mock_get):
        """Verify localhost location info."""
        assert SecurityService.get_location_info("127.0.0.1") == "Localhost"
        mock_get.assert_not_called()

    @patch("requests.get")
    def test_get_location_info_remote_success(self, mock_get):
        """Verify remote IP location resolution success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "city": "Accra",
            "country": "Ghana"
        }
        mock_get.return_value = mock_response

        loc = SecurityService.get_location_info("8.8.8.8")
        assert loc == "Accra, Ghana"

    @patch("requests.get")
    def test_get_location_info_remote_failure_status(self, mock_get):
        """Verify remote IP location resolution with non-success status."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "fail"}
        mock_get.return_value = mock_response
        assert SecurityService.get_location_info("8.8.8.8") == "Unknown Location"

    @patch("requests.get")
    def test_get_location_info_remote_bad_status_code(self, mock_get):
        """Verify remote IP location resolution with non-200 status code."""
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        assert SecurityService.get_location_info("8.8.8.8") == "Unknown Location"

    def test_transaction_limit_logic(self, db):
        """Test daily transaction limit enforcement."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            email="limit_test@coastal.com",
            username="limit_user",
            password=TEST_PASSWORD,
            daily_transaction_limit=Decimal("1000.00")
        )

        # Within limit
        allowed, msg = SecurityService.check_transaction_limit(user, Decimal("500.00"))
        assert allowed
        assert msg == ""

        # Over limit
        allowed, msg = SecurityService.check_transaction_limit(user, Decimal("1500.00"))
        assert not allowed
        assert "exceeds daily limit" in msg

        # Record and check again
        SecurityService.record_transaction(user, Decimal("800.00"))
        user.refresh_from_db()
        assert user.daily_transaction_total == Decimal("800.00")

        allowed, msg = SecurityService.check_transaction_limit(user, Decimal("300.00"))
        assert not allowed
        assert "Remaining: 200.00" in msg

    def test_log_payload_anomaly_authenticated(self, db):
        """Test anomaly logging for authenticated users."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            email="anomaly@coastal.com", username="anomaly", password=TEST_PASSWORD, is_approved=True
        )
        
        request = MagicMock()
        request.user = user
        request.is_authenticated = True
        request.META = {"REMOTE_ADDR": "9.9.9.9", "HTTP_USER_AGENT": "TestAgent"}

        with patch("users.security.logger") as mock_logger:
            SecurityService.log_payload_anomaly(request, "TEST_ANOMALY", {"key": "val"})
            mock_logger.warning.assert_called()
        
        # Verify Activity record
        from users.models import UserActivity
        activity = UserActivity.objects.filter(user=user, action="payload_anomaly").first()
        assert activity is not None
        assert activity.details["message"] == "TEST_ANOMALY"
        assert activity.details["anomaly_details"]["key"] == "val"

    def test_login_handlers(self, db):
        """Test successful and failed login handlers."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            email="login_test@coastal.com", username="login_user", password=TEST_PASSWORD
        )
        user.failed_login_attempts = 3
        user.save()

        request = MagicMock()
        request.META = {"REMOTE_ADDR": "1.1.1.1", "HTTP_USER_AGENT": "TestAgent"}

        # Success path
        SecurityService.handle_successful_login(user, request)
        user.refresh_from_db()
        assert user.failed_login_attempts == 0
        from users.models import UserActivity
        assert UserActivity.objects.filter(user=user, action="login").exists()

        # Failure path - no lockout
        is_locked = SecurityService.handle_failed_login(user, request)
        user.refresh_from_db()
        assert not is_locked
        assert user.failed_login_attempts == 1
        assert UserActivity.objects.filter(user=user, action="failed_login").exists()

        # Failure path - trigger lockout
        user.failed_login_attempts = user.MAX_FAILED_ATTEMPTS - 1
        user.save()
        is_locked = SecurityService.handle_failed_login(user, request)
        assert is_locked
        assert UserActivity.objects.filter(user=user, action="account_locked").exists()

    def test_record_transaction_date_reset(self, db):
        """Test that record_transaction resets total on a new day."""
        from django.contrib.auth import get_user_model
        from datetime import date, timedelta
        User = get_user_model()
        user = User.objects.create_user(
            email="reset@coastal.com", 
            username="reset_user", 
            password=TEST_PASSWORD,
            daily_transaction_total=Decimal("500.00"),
            daily_limit_reset_date=date.today() - timedelta(days=1)
        )

        SecurityService.record_transaction(user, Decimal("100.00"))
        user.refresh_from_db()
        assert user.daily_transaction_total == Decimal("100.00")
        assert user.daily_limit_reset_date == date.today()

    @patch("users.security.SecurityService.get_location_info")
    def test_log_activity_with_location(self, mock_loc, db):
        """Test log_activity triggers location lookup for specific actions."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(email="loc@coastal.com", username="loc", password=TEST_PASSWORD)
        
        request = MagicMock()
        request.META = {"REMOTE_ADDR": "8.8.8.8", "HTTP_USER_AGENT": "TestAgent"}
        mock_loc.return_value = "Test City, Test Country"

        SecurityService.log_activity(user, "login", request)
        
        from users.models import UserActivity
        activity = UserActivity.objects.filter(user=user, action="login").first()
        assert activity.details["location"] == "Test City, Test Country"
        mock_loc.assert_called_with("8.8.8.8")

    def test_parse_user_agent_variations(self):
        """Test user agent parsing with various strings."""
        # 1. Device Brand + Model (iPhone)
        ua_string = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
        info = SecurityService.parse_user_agent(ua_string)
        assert "iPhone" in info["device"]
        
        # 2. Family only (Other)
        info = SecurityService.parse_user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        assert info["device"] in ("Other", "Unknown Device", "PC")

    def test_parse_user_agent_error_handling(self):
        """Test parse_user_agent exceptions."""
        with patch("user_agents.parse", side_effect=Exception("Parsing Error")):
            result = SecurityService.parse_user_agent("Garbage")
            assert result == {}

    def test_log_payload_anomaly_unauthenticated(self, db):
        """Test anomaly logging for anonymous users."""
        request = MagicMock()
        request.user = MagicMock()
        request.user.is_authenticated = False
        request.META = {"REMOTE_ADDR": "8.8.8.8", "HTTP_USER_AGENT": "Bot"}
        
        with patch("users.security.logger") as mock_logger:
            SecurityService.log_payload_anomaly(request, "ANON_ANOMALY")
            mock_logger.warning.assert_called()
        
        # Should NOT create UserActivity
        from users.models import UserActivity
        assert not UserActivity.objects.filter(action="payload_anomaly", ip_address="8.8.8.8").exists()

    def test_get_client_ip_render_cloud_trusted(self):
        """Test that Render cloud environment trusts the proxy chain (IS_RENDER=true)."""
        request = MagicMock()
        request.META = {
            "HTTP_X_FORWARDED_FOR": "203.0.113.195",
            "REMOTE_ADDR": "10.0.0.1",
        }
        with patch.dict(os.environ, {"IS_RENDER": "true"}):
            assert SecurityService.get_client_ip(request) == "203.0.113.195"

    def test_parse_user_agent_known_family(self):
        """Test user agent parsing when only family is known (no brand/model)."""
        ua_string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        info = SecurityService.parse_user_agent(ua_string)
        # Should fall back to device family if brand/model are missing
        assert info["device"] in ("Other", "PC", "Unknown Device")
