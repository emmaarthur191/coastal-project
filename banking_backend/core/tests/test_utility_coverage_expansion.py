import pytest
from core.utils.field_encryption import encrypt_field, decrypt_field, hash_field, is_encrypted
from users.services import SendexaService
from core.models.reliability import SmsOutbox, GlobalSequence
from unittest.mock import patch

@pytest.mark.django_db
class TestUtilityExpansion:
    def test_encryption_roundtrip(self):
        val = 'SecretID-123456'
        encrypted = encrypt_field(val)
        assert encrypted != val
        assert is_encrypted(encrypted)
        assert decrypt_field(encrypted) == val

    def test_hash_stability(self):
        val = ' SEARCH-ME '
        h1 = hash_field(val)
        h2 = hash_field(val)
        assert h1 == h2
        assert len(h1) == 64

    def test_phone_normalization(self):
        assert SendexaService.normalize_phone_number("0244123456") == "+233244123456"

    @patch('httpx.Client')
    def test_send_sms_outbox_logging(self, mock_client_cls):
        from django.test import override_settings
        mock_response = mock_client_cls.return_value.__enter__.return_value.post.return_value
        mock_response.status_code = 200
        mock_response.text = "Success"
        phone = "0244123456"
        msg = "Test Coastal Message"
        with override_settings(SENDEXA_AUTH_TOKEN="test-token"):
            success, info = SendexaService.send_sms(phone, msg)
        assert success is True
        p_hash = hash_field("+233244123456")
        outbox = SmsOutbox.objects.get(phone_number_hash=p_hash)
        assert outbox.status == "sent"
        assert outbox.message == msg

    def test_global_sequence_atomicity(self):
        v1 = GlobalSequence.get_next_value('staff_id', initial_value=100)
        v2 = GlobalSequence.get_next_value('staff_id')
        assert v1 == 100
        assert v2 == 101

    def test_gcm_encryption_details(self):
        val = 'Secret-Value-123'
        enc1 = encrypt_field(val)
        enc2 = encrypt_field(val)

        # 1. Assert modern version tag prefix
        assert enc1.startswith("v2GCM:")
        assert enc2.startswith("v2GCM:")

        # 2. Assert unique ciphertexts (different nonces) for identical plaintexts
        assert enc1 != enc2

        # 3. Assert successful decryption
        assert decrypt_field(enc1) == val
        assert decrypt_field(enc2) == val

        # 4. Assert unrecognized prefix fails closed
        with pytest.raises(ValueError) as exc:
            decrypt_field("v3GCM:somethinginvalid")
        assert "Unsupported encryption format version prefix" in str(exc.value)

    def test_legacy_fernet_compatibility(self):
        from cryptography.fernet import Fernet
        from core.utils.secret_service import SecretManager

        val = 'Legacy-Credential-123'
        key = SecretManager.get_encryption_key()

        # Generate a standard Fernet encrypted token (starts with gAAAAA)
        f = Fernet(key)
        legacy_token = f.encrypt(val.encode()).decode()
        assert legacy_token.startswith("gAAAAA")

        # Verify decryption handles standard Fernet input correctly (backward compatibility)
        assert decrypt_field(legacy_token) == val

    def test_kms_fallback_gating(self):
        from core.utils.secret_service import SecretManager
        from django.core.exceptions import ImproperlyConfigured

        # Test 1: Fallback disabled, invalid base64 key or KMS failure should raise ImproperlyConfigured
        with patch.dict('os.environ', {'KMS_PROVIDER': 'aws', 'ALLOW_LOCAL_KEK_FALLBACK': 'False'}):
            with pytest.raises(ImproperlyConfigured):
                SecretManager._decrypt_via_kms('FIELD_ENCRYPTION_KEY', 'invalid-base64-key-material-that-fails')

        # Test 2: Fallback enabled, invalid key should return raw string
        with patch.dict('os.environ', {'KMS_PROVIDER': 'aws', 'ALLOW_LOCAL_KEK_FALLBACK': 'True'}):
            raw_val = 'fallback-val'
            res = SecretManager._decrypt_via_kms('FIELD_ENCRYPTION_KEY', raw_val)
            assert res == raw_val.encode()

    def test_startup_guard_violations(self):
        from django.core.exceptions import ImproperlyConfigured
        from django.apps import apps

        config = apps.get_app_config('core')

        # Test 1: Prod mode with KMS_PROVIDER missing
        with patch('django.conf.settings.DEBUG', False):
            with patch.dict('os.environ', {'ENV': 'production', 'KMS_PROVIDER': ''}):
                with pytest.raises(ImproperlyConfigured) as exc:
                    config.ready()
                assert "KMS_PROVIDER is not set" in str(exc.value)

        # Test 2: Prod mode with fallback allowed
        with patch('django.conf.settings.DEBUG', False):
            with patch.dict('os.environ', {'ENV': 'production', 'KMS_PROVIDER': 'aws', 'ALLOW_LOCAL_KEK_FALLBACK': 'True'}):
                with pytest.raises(ImproperlyConfigured) as exc:
                    config.ready()
                assert "ALLOW_LOCAL_KEK_FALLBACK is enabled in production" in str(exc.value)

        # Test 3: Prod mode with invalid provider
        with patch('django.conf.settings.DEBUG', False):
            with patch.dict('os.environ', {'ENV': 'production', 'KMS_PROVIDER': 'invalid'}):
                with pytest.raises(ImproperlyConfigured) as exc:
                    config.ready()
                assert "KMS_PROVIDER 'invalid' is invalid" in str(exc.value)

        # Test 4: Break glass bypasses checks via emergency command argument
        with patch('django.conf.settings.DEBUG', False):
            with patch('sys.argv', ['manage.py', 'emergency_shell']):
                with patch.dict('os.environ', {
                    'ENV': 'production',
                    'KMS_PROVIDER': 'aws',
                    'ALLOW_LOCAL_KEK_FALLBACK': 'True'
                }):
                    # Should not raise any exception for local fallback because we are running an emergency command
                    config.ready()
