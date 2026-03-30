from datetime import timedelta

from django.utils import timezone

import pytest

from core.utils.field_encryption import hash_field
from users.models import OTPVerification


@pytest.mark.django_db
class TestOTPSecurity:
    """Security tests for the new OTPVerification model."""

    def test_otp_creation_hashing(self):
        """Verify that OTP codes are stored as hashes (Zero-Plaintext)."""
        phone = "+233244123456"
        otp_obj, raw_code = OTPVerification.create_otp(phone)

        # Plaintext code should NOT be in the database
        assert raw_code != otp_obj.otp_code_hash
        assert hash_field(raw_code) == otp_obj.otp_code_hash

        # Phone should be hashed
        assert otp_obj.phone_number_hash == hash_field(phone)

    def test_otp_expiry(self):
        """Verify that expired OTPs cannot be verified."""
        phone = "+233244123456"
        otp_obj, raw_code = OTPVerification.create_otp(phone)

        # Force expiration
        otp_obj.expires_at = timezone.now() - timedelta(minutes=1)
        otp_obj.save()

        success, message = otp_obj.verify(raw_code)
        assert not success
        assert "expired" in message

    def test_otp_brute_force_lockout(self):
        """Verify that 5 failed attempts locks the OTP."""
        phone = "+233244123456"
        otp_obj, raw_code = OTPVerification.create_otp(phone)

        # Fail 5 times
        for _ in range(5):
            success, message = otp_obj.verify("000000")
            assert not success

        # 6th attempt with correct code should still fail
        success, message = otp_obj.verify(raw_code)
        assert not success
        assert "Too many failed attempts" in message

    def test_otp_one_time_use(self):
        """Verify that an OTP becomes invalid after successful verification."""
        phone = "+233244123456"
        otp_obj, raw_code = OTPVerification.create_otp(phone)

        success, message = otp_obj.verify(raw_code)
        assert success

        # Second attempt should fail
        success, message = otp_obj.verify(raw_code)
        assert not success
        assert "already used" in message
