import pytest
from banking_backend.utils.masking import mask_account_number, mask_phone_number, mask_email


class TestMasking:
    """Comprehensive tests for data masking utilities."""

    def test_mask_account_number_normal(self):
        """Test masking of normal account number."""
        account_number = '123456789012'
        result = mask_account_number(account_number)
        assert result == '********9012'
        assert len(result) == len(account_number)

    def test_mask_account_number_short(self):
        """Test masking of short account number."""
        account_number = '123'
        result = mask_account_number(account_number)
        assert result == '***'
        assert len(result) == len(account_number)

    def test_mask_account_number_empty(self):
        """Test masking of empty account number."""
        result = mask_account_number('')
        assert result == ''

    def test_mask_account_number_none(self):
        """Test masking with None input."""
        result = mask_account_number(None)
        assert result == ''

    def test_mask_account_number_four_digits(self):
        """Test masking of account number with exactly 4 digits."""
        account_number = '1234'
        result = mask_account_number(account_number)
        assert result == '1234'

    def test_mask_account_number_five_digits(self):
        """Test masking of account number with 5 digits."""
        account_number = '12345'
        result = mask_account_number(account_number)
        assert result == '*2345'

    def test_mask_account_number_long(self):
        """Test masking of long account number."""
        account_number = '12345678901234567890'  0 digits
        result = mask_account_number(account_number)
        assert result == '****************7890'
        assert len(result) == len(account_number)

    def test_mask_phone_number_standard(self):
        """Test masking of standard phone number."""
        phone_number = '+1234567890'
        result = mask_phone_number(phone_number)
        assert result == '+12****7890'

    def test_mask_phone_number_no_country_code(self):
        """Test masking of phone number without country code."""
        phone_number = '1234567890'
        result = mask_phone_number(phone_number)
        assert result == '12****7890'

    def test_mask_phone_number_with_dashes(self):
        """Test masking of phone number with dashes."""
        phone_number = '+1-234-567-8901'
        result = mask_phone_number(phone_number)
        assert result == '+1-2**-5*7-8901'

    def test_mask_phone_number_short(self):
        """Test masking of short phone number."""
        phone_number = '123'
        result = mask_phone_number(phone_number)
        assert result == '123'

    def test_mask_phone_number_empty(self):
        """Test masking of empty phone number."""
        result = mask_phone_number('')
        assert result == ''

    def test_mask_phone_number_none(self):
        """Test masking with None input."""
        result = mask_phone_number(None)
        assert result == ''

    def test_mask_phone_number_complex_format(self):
        """Test masking of complex phone number format."""
        phone_number = '(555) 123-4567'
        result = mask_phone_number(phone_number)
        assert result == '(5*5) 1*3-4567'

    def test_mask_phone_number_all_digits(self):
        """Test masking when phone number is all digits."""
        phone_number = '123456789012345'
        result = mask_phone_number(phone_number)
        assert result == '12**********345'

    def test_mask_email_standard(self):
        """Test masking of standard email."""
        email = 'john.doe@example.com'
        result = mask_email(email)
        assert result == 'j***@e***.com'

    def test_mask_email_simple(self):
        """Test masking of simple email."""
        email = 'test@gmail.com'
        result = mask_email(email)
        assert result == 't***@g***.com'

    def test_mask_email_long_username(self):
        """Test masking of email with long username."""
        email = 'verylongusername@example.com'
        result = mask_email(email)
        assert result == 'v****************@e***.com'

    def test_mask_email_long_domain(self):
        """Test masking of email with long domain."""
        email = 'user@verylongdomainname.com'
        result = mask_email(email)
        assert result == 'u***@v*****************.com'

    def test_mask_email_no_subdomain(self):
        """Test masking of email without subdomain."""
        email = 'user@gmail.com'
        result = mask_email(email)
        assert result == 'u***@g***.com'

    def test_mask_email_empty(self):
        """Test masking of empty email."""
        result = mask_email('')
        assert result == ''

    def test_mask_email_none(self):
        """Test masking with None input."""
        result = mask_email(None)
        assert result == ''

    def test_mask_email_no_at_symbol(self):
        """Test masking of invalid email without @ symbol."""
        email = 'invalidemail'
        result = mask_email(email)
        assert result == 'invalidemail'

    def test_mask_email_only_at(self):
        """Test masking of email with only @ symbol."""
        email = '@domain.com'
        result = mask_email(email)
        assert result == '@domain.com'

    def test_mask_email_username_only_at(self):
        """Test masking of email with username and @ only."""
        email = 'user@'
        result = mask_email(email)
        assert result == 'user@'

    def test_mask_email_single_char_username(self):
        """Test masking of email with single character username."""
        email = 'a@example.com'
        result = mask_email(email)
        assert result == 'a@example.com'

    def test_mask_email_single_char_domain(self):
        """Test masking of email with single character domain."""
        email = 'user@a.com'
        result = mask_email(email)
        assert result == 'u***@a.com'

    def test_mask_email_special_chars(self):
        """Test masking of email with special characters."""
        email = 'user+tag@example.co.uk'
        result = mask_email(email)
        assert result == 'u*******@e***.co.uk'

    def test_mask_email_multiple_dots_domain(self):
        """Test masking of email with multiple dots in domain."""
        email = 'user@example.co.uk'
        result = mask_email(email)
        assert result == 'u***@e***.co.uk'

    def test_mask_email_numeric(self):
        """Test masking of email with numeric characters."""
        email = 'user123@example456.com'
        result = mask_email(email)
        assert result == 'u******@e*******.com'

    def test_mask_email_case_preservation(self):
        """Test that email masking preserves case."""
        email = 'John.Doe@Example.Com'
        result = mask_email(email)
        assert result == 'J***@E***.Com'