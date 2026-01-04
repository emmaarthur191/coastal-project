"""Custom exceptions for the Coastal Banking application.

These exceptions provide granular, banking-specific error handling
for financial operations, enabling structured error responses and logging.
"""


class BankingException(Exception):
    """Base exception for all banking-related errors.

    Attributes:
        code (str): A machine-readable error code for client handling.
        message (str): A human-readable error message.
        details (dict): Optional additional context for debugging.

    """

    code = "BANKING_ERROR"

    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class InsufficientFundsError(BankingException):
    """Raised when an account has insufficient funds for a transaction.

    Example:
        >>> raise InsufficientFundsError(
        ...     message="Cannot withdraw GHS 500.00. Available balance: GHS 100.00",
        ...     details={"account_id": 123, "requested": 500, "available": 100}
        ... )

    """

    code = "INSUFFICIENT_FUNDS"


class AccountNotFoundError(BankingException):
    """Raised when a specified account does not exist or is inaccessible."""

    code = "ACCOUNT_NOT_FOUND"


class AccountSuspendedError(BankingException):
    """Raised when attempting to transact on a suspended or inactive account."""

    code = "ACCOUNT_SUSPENDED"


class InvalidTransactionError(BankingException):
    """Raised for invalid transaction parameters (e.g., negative amount, same-account transfer)."""

    code = "INVALID_TRANSACTION"


class TransactionLimitExceededError(BankingException):
    """Raised when a transaction exceeds a defined limit (daily, per-transaction, etc.)."""

    code = "LIMIT_EXCEEDED"


class DuplicateTransactionError(BankingException):
    """Raised when a potentially duplicate transaction is detected."""

    code = "DUPLICATE_TRANSACTION"


class OperationalError(BankingException):
    """Raised for internal system errors (database issues, service unavailability).
    These errors should typically be logged and result in a 500 response.
    """

    code = "OPERATIONAL_ERROR"
