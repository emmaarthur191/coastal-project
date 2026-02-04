"""Account-related services for Coastal Banking.

Handles account creation, balance updates, and account locking.
"""

import logging
import secrets
from decimal import Decimal

from django.db import IntegrityError, transaction

from core.exceptions import OperationalError
from core.models.accounts import Account

logger = logging.getLogger(__name__)


class AccountService:
    """Service class for account-related operations."""

    @staticmethod
    def _calculate_luhn(number: str) -> int:
        """Calculate the Luhn checksum for a numeric string."""
        digits = [int(d) for d in number]
        checksum = 0
        reverse_digits = digits[::-1]

        for i, digit in enumerate(reverse_digits):
            if i % 2 == 0:  # Even index in reverse (1st, 3rd...)
                doubled = digit * 2
                if doubled > 9:
                    doubled -= 9
                checksum += doubled
            else:
                checksum += digit

        return (10 - (checksum % 10)) % 10

    @staticmethod
    def create_account(user, account_type: str = "daily_susu", initial_balance: Decimal = Decimal("0.00")) -> Account:
        """Create a new account for a user with a unique structured account number."""
        branch_code = "2231"
        max_attempts = 10
        rng = secrets.SystemRandom()

        for attempt in range(max_attempts):
            try:
                serial = "".join([str(rng.randint(0, 9)) for _ in range(8)])
                partial_number = f"{branch_code}{serial}"
                checksum = AccountService._calculate_luhn(partial_number)
                account_number = f"{partial_number}{checksum}"

                with transaction.atomic():
                    if Account.objects.filter(account_number=account_number).exists():
                        continue

                    account = Account.objects.create(
                        user=user,
                        account_number=account_number,
                        account_type=account_type,
                        initial_balance=initial_balance,
                        balance=initial_balance,
                    )
                    logger.info(f"Account created: {account.account_number} for user {user.email}")
                    return account

            except IntegrityError:
                if attempt == max_attempts - 1:
                    raise OperationalError(message="Failed to generate unique account number.", details={})
                continue
            except Exception as e:
                logger.error(f"Failed to create account for user {user.email}: {e}")
                raise OperationalError(message="Failed to create account.", details={"error": str(e)})

    @staticmethod
    def get_user_accounts(user):
        """Retrieve all active accounts for a user."""
        return Account.objects.filter(user=user, is_active=True)

    @staticmethod
    def _mask_account_number(account_number: str) -> str:
        """Mask account number for logging."""
        if not account_number or len(account_number) < 4:
            return "****"
        return f"...{account_number[-4:]}"

    @staticmethod
    def update_balance(account: Account, amount: Decimal) -> Account:
        """Update an account's balance. This method MUST be called within a transaction.atomic() block."""
        account = Account.objects.select_for_update().get(pk=account.pk)
        account.balance += amount
        account.save(update_fields=["balance", "updated_at"])
        return account

    @staticmethod
    @transaction.atomic
    def lock_account(account: Account, reason: str = "") -> Account:
        """Freeze an account (is_active=False) with a reason."""
        account = Account.objects.select_for_update().get(pk=account.pk)
        account.is_active = False
        account.save(update_fields=["is_active", "updated_at"])

        from users.models import AuditLog

        AuditLog.objects.create(
            action="update",
            model_name="Account",
            object_id=str(account.id),
            object_repr=f"Lock Account {AccountService._mask_account_number(account.account_number)}",
            changes={"is_active": "False", "reason": reason},
        )
        logger.warning(f"Account {account.account_number} locked. Reason: {reason}")
        return account

    @staticmethod
    @transaction.atomic
    def unlock_account(account: Account) -> Account:
        """Unfreeze an account."""
        account = Account.objects.select_for_update().get(pk=account.pk)
        account.is_active = True
        account.save(update_fields=["is_active", "updated_at"])
        logger.info(f"Account {account.account_number} unlocked.")
        return account
