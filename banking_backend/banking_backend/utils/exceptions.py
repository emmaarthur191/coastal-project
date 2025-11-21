from rest_framework.exceptions import APIException
from rest_framework import status


class BankingException(APIException):
    """Base exception for banking operations."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A banking error occurred."
    default_code = "banking_error"


class InsufficientFundsException(BankingException):
    """Raised when account has insufficient funds."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Insufficient funds in account."
    default_code = "insufficient_funds"


class InvalidTransactionException(BankingException):
    """Raised for invalid transaction operations."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid transaction operation."
    default_code = "invalid_transaction"


class AccountNotFoundException(BankingException):
    """Raised when account is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Account not found."
    default_code = "account_not_found"


class PermissionDeniedException(BankingException):
    """Raised when user lacks permission for operation."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Permission denied for this operation."
    default_code = "permission_denied"


class RateLimitExceededException(BankingException):
    """Raised when rate limit is exceeded."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Rate limit exceeded. Please try again later."
    default_code = "rate_limit_exceeded"


class ValidationException(BankingException):
    """Raised for validation errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Validation error occurred."
    default_code = "validation_error"


class EncryptionException(BankingException):
    """Raised for encryption/decryption errors."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "Encryption operation failed."
    default_code = "encryption_error"