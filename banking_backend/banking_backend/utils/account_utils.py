"""
Account number generation utilities for the banking system.
"""
import random
from django.db import transaction
from banking.models import Account


def generate_unique_account_number():
    """
    Generate a unique 13-digit account number starting with "2231000".

    Format: 2231000XXXXX where XXXXX are sequential digits.
    Ensures uniqueness by checking against existing accounts.

    Returns:
        str: Unique 13-digit account number

    Raises:
        RuntimeError: If unable to generate unique account number after max attempts
    """
    base_prefix = "2231000"
    max_attempts = 1000

    for attempt in range(max_attempts):
        # Generate 6 random digits (since we need 13 total: 7 prefix + 6 digits = 13)
        random_digits = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        account_number = f"{base_prefix}{random_digits}"

        # Check if this account number already exists
        if not Account.objects.filter(account_number=account_number).exists():
            return account_number

    # If we can't generate a unique number after max attempts, raise error
    raise RuntimeError("Unable to generate unique account number after maximum attempts")


def get_next_sequential_account_number():
    """
    Generate the next sequential 13-digit account number starting with "2231000".

    This method finds the highest existing account number and increments it.
    If no accounts exist, starts from 2231000000001.

    Returns:
        str: Next sequential 13-digit account number

    Raises:
        RuntimeError: If unable to generate account number
    """
    base_prefix = "2231000"

    # Get all account numbers starting with our prefix
    existing_accounts = Account.objects.filter(
        account_number__startswith=base_prefix
    ).values_list('account_number', flat=True)

    if not existing_accounts:
        # No existing accounts, start with the first number
        return f"{base_prefix}000001"

    # Extract the numeric part after the prefix and find the maximum
    max_number = 0
    for account_number in existing_accounts:
        try:
            # Extract the last 6 digits
            numeric_part = int(account_number[-6:])
            max_number = max(max_number, numeric_part)
        except (ValueError, IndexError):
            # Skip invalid account numbers
            continue

    # Increment to get the next number
    next_number = max_number + 1

    # Ensure we don't exceed 6 digits (999999)
    if next_number > 999999:
        raise RuntimeError("Maximum account number limit reached")

    # Format with leading zeros
    return f"{base_prefix}{next_number:06d}"


@transaction.atomic
def create_account_with_unique_number(owner, account_type='Savings Account', **kwargs):
    """
    Create a new account with a unique account number.

    Args:
        owner: User instance
        account_type: Type of account
        **kwargs: Additional Account model fields

    Returns:
        Account: Created account instance

    Raises:
        RuntimeError: If unable to generate unique account number
    """
    account_number = get_next_sequential_account_number()

    account = Account.objects.create(
        owner=owner,
        account_number=account_number,
        type=account_type,
        **kwargs
    )

    return account