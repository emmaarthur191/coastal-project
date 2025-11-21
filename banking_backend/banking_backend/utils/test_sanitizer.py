import pytest
from django.core.exceptions import ValidationError
from banking_backend.utils.sanitizer import Sanitizer


class TestSanitizer:
    """Comprehensive tests for the Sanitizer utility class."""

    def test_sanitize_html_basic(self):
        """Test basic HTML sanitization."""
        dirty_html = '<script>alert("xss")</script><p>Hello <strong>world</strong></p>'
        expected = '<p>Hello <strong>world</strong></p>'
        result = Sanitizer.sanitize_html(dirty_html)
        assert result == expected

    def test_sanitize_html_with_custom_tags(self):
        """Test HTML sanitization with custom allowed tags."""
        dirty_html = '<p>Hello <em>world</em> <u>underline</u></p>'
        allowed_tags = ['p', 'em']
        result = Sanitizer.sanitize_html(dirty_html, allow_tags=allowed_tags)
        assert '<u>' not in result
        assert '<em>' in result

    def test_sanitize_html_none_input(self):
        """Test sanitization with None input."""
        result = Sanitizer.sanitize_html(None)
        assert result == ''

    def test_sanitize_html_non_string_input(self):
        """Test sanitization with non-string input."""
        result = Sanitizer.sanitize_html(123)
        assert result == ''

    def test_sanitize_html_xss_prevention(self):
        """Test XSS prevention in HTML sanitization."""
        xss_attempts = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            '<a href="javascript:alert(1)">Click me</a>',
            '<iframe src="evil.com"></iframe>',
            '<object data="evil.swf"></object>'
        ]
        for xss in xss_attempts:
            result = Sanitizer.sanitize_html(xss)
            assert '<script>' not in result.lower()
            assert 'javascript:' not in result.lower()
            assert 'onerror' not in result.lower()

    def test_sanitize_text_basic(self):
        """Test basic text sanitization."""
        dirty_text = '<script>alert("xss")</script>Hello world'
        expected = 'Hello world'
        result = Sanitizer.sanitize_text(dirty_text)
        assert result == expected

    def test_sanitize_text_none_input(self):
        """Test text sanitization with None input."""
        result = Sanitizer.sanitize_text(None)
        assert result == ''

    def test_sanitize_text_non_string_input(self):
        """Test text sanitization with non-string input."""
        result = Sanitizer.sanitize_text(123)
        assert result == ''

    def test_validate_and_sanitize_description_valid(self):
        """Test valid description sanitization."""
        description = 'This is a <strong>test</strong> description.'
        result = Sanitizer.validate_and_sanitize_description(description)
        assert '<strong>' in result
        assert '<script>' not in result

    def test_validate_and_sanitize_description_too_long(self):
        """Test description validation with excessive length."""
        long_description = 'A' * 501
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_and_sanitize_description(long_description)
        assert 'cannot exceed 500 characters' in str(exc_info.value)

    def test_validate_and_sanitize_description_none_input(self):
        """Test description validation with None input."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_and_sanitize_description(None)
        assert 'must be a string' in str(exc_info.value)

    def test_validate_and_sanitize_description_html_injection(self):
        """Test description sanitization prevents HTML injection."""
        malicious_description = '<script>alert("xss")</script>Normal text'
        result = Sanitizer.validate_and_sanitize_description(malicious_description)
        assert '<script>' not in result
        assert 'Normal text' in result

    def test_validate_and_sanitize_name_valid(self):
        """Test valid name sanitization."""
        name = 'John Doe'
        result = Sanitizer.validate_and_sanitize_name(name)
        assert result == 'John Doe'

    def test_validate_and_sanitize_name_empty(self):
        """Test name validation with empty string."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_and_sanitize_name('')
        assert 'cannot be empty' in str(exc_info.value)

    def test_validate_and_sanitize_name_whitespace_only(self):
        """Test name validation with whitespace only."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_and_sanitize_name('   ')
        assert 'cannot be empty' in str(exc_info.value)

    def test_validate_and_sanitize_name_too_long(self):
        """Test name validation with excessive length."""
        long_name = 'A' * 101
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_and_sanitize_name(long_name)
        assert 'cannot exceed 100 characters' in str(exc_info.value)

    def test_validate_and_sanitize_name_none_input(self):
        """Test name validation with None input."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_and_sanitize_name(None)
        assert 'must be a string' in str(exc_info.value)

    def test_validate_and_sanitize_name_html_stripping(self):
        """Test name sanitization strips HTML."""
        name_with_html = 'John <script>alert(1)</script>Doe'
        result = Sanitizer.validate_and_sanitize_name(name_with_html)
        assert result == 'John Doe'
        assert '<script>' not in result

    def test_validate_account_number_valid(self):
        """Test valid account number validation."""
        account_number = '123456789012'
        result = Sanitizer.validate_account_number(account_number)
        assert result == '123456789012'

    def test_validate_account_number_with_non_digits(self):
        """Test account number validation strips non-digits."""
        account_number = '12-3456-7890-AB'
        result = Sanitizer.validate_account_number(account_number)
        assert result == '1234567890'

    def test_validate_account_number_too_short(self):
        """Test account number validation with insufficient digits."""
        account_number = '1234567'
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_account_number(account_number)
        assert 'must be at least 8 digits long' in str(exc_info.value)

    def test_validate_account_number_too_long(self):
        """Test account number validation with excessive digits."""
        account_number = '1' * 21
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_account_number(account_number)
        assert 'cannot exceed 20 digits' in str(exc_info.value)

    def test_validate_account_number_none_input(self):
        """Test account number validation with None input."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_account_number(None)
        assert 'must be a string' in str(exc_info.value)

    def test_validate_amount_valid_integer(self):
        """Test valid integer amount validation."""
        amount = 100
        result = Sanitizer.validate_amount(amount)
        assert result == 100.0

    def test_validate_amount_valid_float(self):
        """Test valid float amount validation."""
        amount = 99.99
        result = Sanitizer.validate_amount(amount)
        assert result == 99.99

    def test_validate_amount_valid_string(self):
        """Test valid string amount validation."""
        amount = '50.25'
        result = Sanitizer.validate_amount(amount)
        assert result == 50.25

    def test_validate_amount_zero(self):
        """Test amount validation with zero."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_amount(0)
        assert 'must be positive' in str(exc_info.value)

    def test_validate_amount_negative(self):
        """Test amount validation with negative value."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_amount(-10)
        assert 'must be positive' in str(exc_info.value)

    def test_validate_amount_invalid_string(self):
        """Test amount validation with invalid string."""
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_amount('not-a-number')
        assert 'must be a valid number' in str(exc_info.value)

    def test_validate_amount_exceeds_max(self):
        """Test amount validation with maximum limit."""
        amount = 1000
        max_amount = 500
        with pytest.raises(ValidationError) as exc_info:
            Sanitizer.validate_amount(amount, max_amount)
        assert 'cannot exceed 500' in str(exc_info.value)

    def test_validate_amount_none_max(self):
        """Test amount validation without maximum limit."""
        amount = 1000
        result = Sanitizer.validate_amount(amount, None)
        assert result == 1000.0