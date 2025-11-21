def mask_account_number(account_number):
    """
    Mask account number to show only the last 4 digits.
    Example: '123456789012' -> '********9012'
    """
    if not account_number or len(account_number) < 4:
        return '*' * len(account_number) if account_number else ''
    return '*' * (len(account_number) - 4) + account_number[-4:]


def mask_phone_number(phone_number):
    """
    Mask phone number to hide middle digits.
    Assumes format like '+1234567890' or '1234567890'.
    Example: '+1234567890' -> '+12****7890'
    """
    if not phone_number:
        return ''
    # Remove non-digit characters for masking logic
    digits = ''.join(filter(str.isdigit, phone_number))
    if len(digits) < 4:
        return phone_number
    # Keep first 2 and last 4 digits, mask the rest
    masked_digits = digits[:2] + '*' * (len(digits) - 6) + digits[-4:]
    # Reconstruct with original format
    result = phone_number
    digit_index = 0
    for i, char in enumerate(phone_number):
        if char.isdigit():
            result = result[:i] + masked_digits[digit_index] + result[i+1:]
            digit_index += 1
    return result


def mask_email(email):
    """
    Mask email to show only first character of username and domain.
    Example: 'john.doe@example.com' -> 'j***@e***.com'
    """
    if not email or '@' not in email:
        return email
    username, domain = email.split('@', 1)
    if '.' not in domain:
        return email
    domain_name, tld = domain.rsplit('.', 1)
    masked_username = username[0] + '*' * (len(username) - 1) if len(username) > 1 else username
    masked_domain = domain_name[0] + '*' * (len(domain_name) - 1) if len(domain_name) > 1 else domain_name
    return f"{masked_username}@{masked_domain}.{tld}"