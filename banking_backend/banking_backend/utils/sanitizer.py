import bleach
from django.core.exceptions import ValidationError


class Sanitizer:
    """
    Utility class for sanitizing user input to prevent XSS and injection attacks.
    """

    # Allowed HTML tags for rich text content
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
    ]

    # Allowed HTML attributes
    ALLOWED_ATTRIBUTES = {
        '*': ['class', 'id'],
        'a': ['href', 'title', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height']
    }

    # Allowed CSS properties for style attributes
    ALLOWED_STYLES = [
        'color', 'background-color', 'font-weight', 'font-style',
        'text-decoration', 'text-align'
    ]

    @staticmethod
    def sanitize_html(dirty_html, allow_tags=None, allow_attributes=None):
        """
        Sanitize HTML content using bleach.

        Args:
            dirty_html (str): The potentially unsafe HTML string
            allow_tags (list): List of allowed HTML tags (optional)
            allow_attributes (dict): Dictionary of allowed attributes (optional)

        Returns:
            str: Sanitized HTML string
        """
        if not isinstance(dirty_html, str):
            return ''

        tags = allow_tags or Sanitizer.ALLOWED_TAGS
        attrs = allow_attributes or Sanitizer.ALLOWED_ATTRIBUTES

        return bleach.clean(
            dirty_html,
            tags=tags,
            attributes=attrs,
            strip=True
        )

    @staticmethod
    def sanitize_text(text):
        """
        Sanitize plain text by escaping HTML entities.

        Args:
            text (str): The plain text to sanitize

        Returns:
            str: Sanitized text
        """
        if not isinstance(text, str):
            return ''

        # Escape HTML entities
        return bleach.clean(text, tags=[], strip=True)

    @staticmethod
    def validate_and_sanitize_description(description, max_length=500):
        """
        Validate and sanitize description fields.

        Args:
            description (str): The description to validate and sanitize
            max_length (int): Maximum allowed length

        Returns:
            str: Sanitized description

        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(description, str):
            raise ValidationError("Description must be a string.")

        if len(description) > max_length:
            raise ValidationError(f"Description cannot exceed {max_length} characters.")

        # For descriptions, we'll allow basic formatting
        return Sanitizer.sanitize_html(description, allow_tags=['strong', 'em', 'u'])

    @staticmethod
    def validate_and_sanitize_name(name, max_length=100):
        """
        Validate and sanitize name fields.

        Args:
            name (str): The name to validate and sanitize
            max_length (int): Maximum allowed length

        Returns:
            str: Sanitized name

        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(name, str):
            raise ValidationError("Name must be a string.")

        if len(name.strip()) == 0:
            raise ValidationError("Name cannot be empty.")

        if len(name) > max_length:
            raise ValidationError(f"Name cannot exceed {max_length} characters.")

        # Names should be plain text only
        sanitized = Sanitizer.sanitize_text(name.strip())
        return sanitized

    @staticmethod
    def validate_account_number(account_number):
        """
        Validate account number format.

        Args:
            account_number (str): The account number to validate

        Returns:
            str: Sanitized account number

        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(account_number, str):
            raise ValidationError("Account number must be a string.")

        # Remove any non-digit characters
        sanitized = ''.join(filter(str.isdigit, account_number))

        if len(sanitized) < 8:
            raise ValidationError("Account number must be at least 8 digits long.")

        if len(sanitized) > 20:
            raise ValidationError("Account number cannot exceed 20 digits.")

        return sanitized

    @staticmethod
    def validate_amount(amount, max_amount=None):
        """
        Validate monetary amount.

        Args:
            amount (float or str): The amount to validate
            max_amount (float): Maximum allowed amount (optional)

        Returns:
            float: Validated amount

        Raises:
            ValidationError: If validation fails
        """
        try:
            if isinstance(amount, str):
                amount = float(amount)
        except (ValueError, TypeError):
            raise ValidationError("Amount must be a valid number.")

        if amount <= 0:
            raise ValidationError("Amount must be positive.")

        if max_amount and amount > max_amount:
            raise ValidationError(f"Amount cannot exceed {max_amount}.")

        return amount