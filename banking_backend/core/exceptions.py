import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom exception handler for Django REST Framework.
    Ensures that any exception (including TypeErrors or other standard Python exceptions)
    returns a JSON response instead of a Django HTML error page.
    """
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If it's not a DRF exception (like a TypeError), response will be None
    if response is None:
        logger.error(f"Internal Server Error: {exc!s}", exc_info=True)

        return Response(
            {
                "status": "error",
                "code": "INTERNAL_SERVER_ERROR",
                "message": ("An unexpected error occurred on the server. " "Our developers have been notified."),
                "detail": str(exc) if settings.DEBUG else None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Enhance standard DRF errors with consistent branding if needed
    if isinstance(response.data, dict):
        response.data.setdefault("status", "error")

    return response


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
