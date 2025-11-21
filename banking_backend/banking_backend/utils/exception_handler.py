import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from .exceptions import BankingException

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides detailed error responses
    and logs security-related events.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Log security-related errors
        if hasattr(exc, 'default_code'):
            if exc.default_code in ['permission_denied', 'rate_limit_exceeded']:
                logger.warning(
                    f"Security event: {exc.default_code} - User: {context.get('request').user if context.get('request') else 'Unknown'} - Path: {context.get('request').path if context.get('request') else 'Unknown'}"
                )
        return response

    # Handle custom banking exceptions
    if isinstance(exc, BankingException):
        logger.error(f"Banking exception: {exc.detail} - Code: {exc.default_code}")
        return Response(
            {
                'error': exc.detail,
                'code': exc.default_code
            },
            status=exc.status_code
        )

    # Handle Django validation errors
    if isinstance(exc, ValidationError):
        logger.warning(f"Validation error: {str(exc)}")
        return Response(
            {
                'error': 'Validation failed',
                'details': exc.messages if hasattr(exc, 'messages') else str(exc)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Handle database integrity errors
    if isinstance(exc, IntegrityError):
        logger.error(f"Database integrity error: {str(exc)}")
        return Response(
            {
                'error': 'Database constraint violation',
                'code': 'integrity_error'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Handle unexpected errors
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return Response(
        {
            'error': 'An unexpected error occurred',
            'code': 'internal_error'
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )