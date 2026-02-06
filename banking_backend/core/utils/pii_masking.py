"""PII Masking Utilities for API Responses.

This module provides functions to mask sensitive data in API responses,
ensuring compliance with data protection standards (GDPR, PCI-DSS).
"""

import re


def mask_id_number(id_number: str | None) -> str | None:
    """Mask a government ID number, showing only the last 4 characters.

    Example: "GHA-123456789012" -> "GHA-XXXXXXXX9012"
    """
    if not id_number or len(id_number) < 4:
        return id_number
    # Keep prefix and last 4 digits
    prefix_match = re.match(r"^([A-Z]{2,4}[-\s]?)", id_number.upper())
    if prefix_match:
        prefix = prefix_match.group(1)
        suffix = id_number[-4:]
        masked_middle = "X" * (len(id_number) - len(prefix) - 4)
        return f"{prefix}{masked_middle}{suffix}"
    # Fallback: show only last 4
    return "X" * (len(id_number) - 4) + id_number[-4:]


def mask_phone_number(phone: str | None) -> str | None:
    """Mask a phone number, showing only the last 4 digits.

    Example: "+233201234567" -> "+233XXXXX567"
    """
    if not phone or len(phone) < 4:
        return phone
    # Keep country code if present (+XXX)
    if phone.startswith("+"):
        country_code = phone[:4]  # +233
        suffix = phone[-3:]
        masked_middle = "X" * (len(phone) - len(country_code) - 3)
        return f"{country_code}{masked_middle}{suffix}"
    # Fallback
    return "X" * (len(phone) - 4) + phone[-4:]


def mask_income(income) -> str:
    """Mask income by showing a range instead of exact value.

    Example: 5500.00 -> "5,000 - 6,000"
    """
    if income is None:
        return None
    try:
        value = float(income)
        lower = int(value // 1000) * 1000
        upper = lower + 1000
        return f"{lower:,} - {upper:,}"
    except (ValueError, TypeError):
        return "N/A"


def mask_date_of_birth(dob) -> str | None:
    """Mask date of birth, showing only the year.

    Example: "1990-05-15" -> "****-**-** (1990)"
    """
    if not dob:
        return None
    try:
        # Handle both string and date objects
        if hasattr(dob, "year"):
            return f"****-**-** ({dob.year})"
        # String format
        year = str(dob)[:4]
        return f"****-**-** ({year})"
    except Exception:
        return "N/A"


def mask_generic(value: str | None, length: int = 4) -> str | None:
    """Mask a generic string, showing 'X' for the specified length.

    Useful for addresses, names, etc. when full privacy is needed.
    """
    if not value:
        return value

    if length == 4 and " " not in value and len(value) > 1:
        # If it looks like a single name/word, show first char + ***
        return value[0] + "*" * 3

    return "X" * length
