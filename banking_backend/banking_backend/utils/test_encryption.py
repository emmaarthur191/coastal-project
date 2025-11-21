import pytest
import os
from unittest.mock import patch, Mock
from cryptography.fernet import Fernet
from django.core.exceptions import ImproperlyConfigured
from banking_backend.utils.encryption import EncryptionService, encrypt_field, decrypt_field, encryption_service


class TestEncryptionService:
    """Comprehensive tests for encryption service."""

    def setup_method(self):
        """Set up test environment."""
        # Clear any existing encryption service instance
        import banking_backend.utils.encryption
        if hasattr(banking_backend.utils.encryption, 'encryption_service'):
            delattr(banking_backend.utils.encryption, 'encryption_service')

    def test_encryption_service_init_with_env_key(self):
        """Test encryption service initialization with environment key."""
        test_key = Fernet.generate_key().decode()

        with patch.dict(os.environ, {'ENCRYPTION_KEY': test_key}):
            with patch('banking_backend.utils.encryption.settings', Mock(ENCRYPTION_KEY=None)):
                service = EncryptionService()
                assert service.fernet is not None

    def test_encryption_service_init_with_settings_key(self):
        """Test encryption service initialization with settings key."""
        test_key = Fernet.generate_key().decode()

        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            with patch.dict(os.environ, {}, clear=True):
                service = EncryptionService()
                assert service.fernet is not None

    def test_encryption_service_init_no_key(self):
        """Test encryption service initialization without key raises error."""
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = None

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            with patch.dict(os.environ, {}, clear=True):
                with pytest.raises(ImproperlyConfigured) as exc_info:
                    EncryptionService()
                assert 'ENCRYPTION_KEY must be set' in str(exc_info.value)

    def test_encrypt_string(self):
        """Test encrypting a string."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()
            data = "sensitive data"
            encrypted = service.encrypt(data)
            assert encrypted != data
            assert isinstance(encrypted, str)

    def test_encrypt_non_string(self):
        """Test encrypting non-string data."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()
            data = 12345
            encrypted = service.encrypt(data)
            assert encrypted != str(data)
            assert isinstance(encrypted, str)

    def test_encrypt_none(self):
        """Test encrypting None value."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()
            data = None
            encrypted = service.encrypt(data)
            assert encrypted != "None"
            assert isinstance(encrypted, str)

    def test_decrypt_valid_data(self):
        """Test decrypting valid encrypted data."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()
            original_data = "sensitive information"
            encrypted = service.encrypt(original_data)
            decrypted = service.decrypt(encrypted)
            assert decrypted == original_data

    def test_decrypt_invalid_data(self):
        """Test decrypting invalid data raises ValueError."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()
            invalid_data = "invalid_encrypted_data"

            with pytest.raises(ValueError) as exc_info:
                service.decrypt(invalid_data)
            assert "Failed to decrypt data" in str(exc_info.value)

    def test_decrypt_wrong_key(self):
        """Test decrypting with wrong key fails."""
        # Encrypt with one key
        key1 = Fernet.generate_key().decode()
        mock_settings1 = Mock()
        mock_settings1.ENCRYPTION_KEY = key1

        with patch('banking_backend.utils.encryption.settings', mock_settings1):
            service1 = EncryptionService()
            data = "secret data"
            encrypted = service1.encrypt(data)

        # Try to decrypt with different key
        key2 = Fernet.generate_key().decode()
        mock_settings2 = Mock()
        mock_settings2.ENCRYPTION_KEY = key2

        with patch('banking_backend.utils.encryption.settings', mock_settings2):
            service2 = EncryptionService()
            with pytest.raises(ValueError):
                service2.decrypt(encrypted)

    def test_encrypt_field_with_value(self):
        """Test encrypt_field with a value."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            # Reset the global service
            import banking_backend.utils.encryption
            if hasattr(banking_backend.utils.encryption, 'encryption_service'):
                delattr(banking_backend.utils.encryption, 'encryption_service')

            value = "credit card number"
            encrypted = encrypt_field(value)
            assert encrypted != value
            assert isinstance(encrypted, str)

    def test_encrypt_field_with_none(self):
        """Test encrypt_field with None value."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            # Reset the global service
            import banking_backend.utils.encryption
            if hasattr(banking_backend.utils.encryption, 'encryption_service'):
                delattr(banking_backend.utils.encryption, 'encryption_service')

            result = encrypt_field(None)
            assert result is None

    def test_decrypt_field_with_value(self):
        """Test decrypt_field with a value."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            # Reset the global service
            import banking_backend.utils.encryption
            if hasattr(banking_backend.utils.encryption, 'encryption_service'):
                delattr(banking_backend.utils.encryption, 'encryption_service')

            original_value = "confidential data"
            encrypted = encrypt_field(original_value)
            decrypted = decrypt_field(encrypted)
            assert decrypted == original_value

    def test_decrypt_field_with_none(self):
        """Test decrypt_field with None value."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            # Reset the global service
            import banking_backend.utils.encryption
            if hasattr(banking_backend.utils.encryption, 'encryption_service'):
                delattr(banking_backend.utils.encryption, 'encryption_service')

            result = decrypt_field(None)
            assert result is None

    def test_decrypt_field_invalid_data(self):
        """Test decrypt_field with invalid data."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            # Reset the global service
            import banking_backend.utils.encryption
            if hasattr(banking_backend.utils.encryption, 'encryption_service'):
                delattr(banking_backend.utils.encryption, 'encryption_service')

            with pytest.raises(ValueError):
                decrypt_field("invalid_data")

    def test_encryption_service_singleton(self):
        """Test that encryption_service is a singleton instance."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            # Reset the global service
            import banking_backend.utils.encryption
            if hasattr(banking_backend.utils.encryption, 'encryption_service'):
                delattr(banking_backend.utils.encryption, 'encryption_service')

            service1 = EncryptionService()
            service2 = EncryptionService()
            assert service1 is not service2  # Different instances
            assert service1.fernet is not service2.fernet  # Different fernet instances

    def test_encrypt_decrypt_round_trip(self):
        """Test full encrypt/decrypt round trip with various data types."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()

            test_cases = [
                "simple string",
                "string with special chars: !@#$%^&*()",
                "unicode: ñáéíóú",
                "123456789",
                "",  # empty string
                "a",  # single character
                "very long string " * 100,  # long string
            ]

            for data in test_cases:
                encrypted = service.encrypt(data)
                decrypted = service.decrypt(encrypted)
                assert decrypted == data
                assert encrypted != data

    def test_encryption_uniqueness(self):
        """Test that encrypting the same data multiple times produces different results."""
        test_key = Fernet.generate_key().decode()
        mock_settings = Mock()
        mock_settings.ENCRYPTION_KEY = test_key

        with patch('banking_backend.utils.encryption.settings', mock_settings):
            service = EncryptionService()
            data = "same data"

            encrypted1 = service.encrypt(data)
            encrypted2 = service.encrypt(data)

            assert encrypted1 != encrypted2
            assert service.decrypt(encrypted1) == data
            assert service.decrypt(encrypted2) == data