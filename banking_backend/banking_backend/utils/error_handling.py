"""
Standardized Error Handling System for Banking Backend API

This module provides consistent error handling patterns across all views in the banking system.
It ensures uniform error responses, proper HTTP status codes, and comprehensive logging.
"""

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError, ObjectDoesNotExist, PermissionDenied
from django.db import IntegrityError, DatabaseError
from django.http import Http404

logger = logging.getLogger(__name__)


class StandardAPIException(APIException):
    """Standardized API exception with consistent error response format"""
    
    def __init__(self, message, error_code=None, status_code=None, details=None):
        self.error_code = error_code or 'GENERIC_ERROR'
        self.details = details or {}
        self.status_code = status_code or status.HTTP_400_BAD_REQUEST
        
        super().__init__(message, self.status_code)
    
    def get_error_response(self):
        """Return standardized error response format"""
        return {
            'success': False,
            'error': {
                'code': self.error_code,
                'message': str(self.detail),
                'details': self.details
            },
            'timestamp': self._get_timestamp()
        }
    
    def _get_timestamp(self):
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()


class ValidationAPIException(StandardAPIException):
    """Exception for validation errors"""
    
    def __init__(self, message, field_errors=None, **kwargs):
        self.field_errors = field_errors or {}
        details = {'field_errors': self.field_errors}
        super().__init__(message, error_code='VALIDATION_ERROR', **kwargs)
        self.details.update(details)


class NotFoundAPIException(StandardAPIException):
    """Exception for resource not found errors"""
    
    def __init__(self, resource='Resource', **kwargs):
        message = f"{resource} not found"
        super().__init__(message, error_code='NOT_FOUND', status_code=status.HTTP_404_NOT_FOUND, **kwargs)


class PermissionAPIException(StandardAPIException):
    """Exception for permission/authorization errors"""
    
    def __init__(self, message='Permission denied', **kwargs):
        super().__init__(message, error_code='PERMISSION_DENIED', status_code=status.HTTP_403_FORBIDDEN, **kwargs)


class AuthenticationAPIException(StandardAPIException):
    """Exception for authentication errors"""
    
    def __init__(self, message='Authentication required', **kwargs):
        super().__init__(message, error_code='AUTHENTICATION_REQUIRED', status_code=status.HTTP_401_UNAUTHORIZED, **kwargs)


class BusinessLogicAPIException(StandardAPIException):
    """Exception for business logic errors (e.g., insufficient funds)"""
    
    def __init__(self, message, business_code=None, **kwargs):
        code = business_code or 'BUSINESS_LOGIC_ERROR'
        super().__init__(message, error_code=code, **kwargs)


class RateLimitAPIException(StandardAPIException):
    """Exception for rate limiting errors"""
    
    def __init__(self, message='Rate limit exceeded', retry_after=None, **kwargs):
        details = {'retry_after': retry_after}
        super().__init__(message, error_code='RATE_LIMIT_EXCEEDED', status_code=status.HTTP_429_TOO_MANY_REQUESTS, details=details, **kwargs)


class DatabaseAPIException(StandardAPIException):
    """Exception for database errors"""
    
    def __init__(self, message='Database error occurred', **kwargs):
        super().__init__(message, error_code='DATABASE_ERROR', status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, **kwargs)


class ExternalServiceAPIException(StandardAPIException):
    """Exception for external service errors"""
    
    def __init__(self, message='External service error', service=None, **kwargs):
        details = {'service': service} if service else {}
        super().__init__(message, error_code='EXTERNAL_SERVICE_ERROR', status_code=status.HTTP_502_BAD_GATEWAY, details=details, **kwargs)


class ErrorHandler:
    """Centralized error handling utility"""
    
    @staticmethod
    def handle_exception(exc, context=None):
        """
        Handle exceptions and return standardized error response
        
        Args:
            exc: The exception to handle
            context: Additional context information
            
        Returns:
            Response with standardized error format
        """
        context = context or {}
        
        # Log the exception
        ErrorHandler._log_exception(exc, context)
        
        # Handle different exception types
        if isinstance(exc, StandardAPIException):
            return Response(exc.get_error_response(), status=exc.status_code)
        
        elif isinstance(exc, ValidationError):
            return ErrorHandler._handle_validation_error(exc)
        
        elif isinstance(exc, ObjectDoesNotExist):
            return ErrorHandler._handle_not_found_error(exc)
        
        elif isinstance(exc, Http404):
            return ErrorHandler._handle_not_found_error(exc)
        
        elif isinstance(exc, PermissionDenied):
            return ErrorHandler._handle_permission_error(exc)
        
        elif isinstance(exc, IntegrityError):
            return ErrorHandler._handle_integrity_error(exc)
        
        elif isinstance(exc, DatabaseError):
            return ErrorHandler._handle_database_error(exc)
        
        else:
            return ErrorHandler._handle_unexpected_error(exc)
    
    @staticmethod
    def _handle_validation_error(exc):
        """Handle Django validation errors"""
        field_errors = {}
        
        if hasattr(exc, 'message_dict'):
            field_errors = exc.message_dict
        elif hasattr(exc, 'messages'):
            field_errors = {'general': exc.messages}
        else:
            field_errors = {'error': [str(exc)]}
        
        error = ValidationAPIException(
            message="Validation failed",
            field_errors=field_errors
        )
        
        return Response(error.get_error_response(), status=error.status_code)
    
    @staticmethod
    def _handle_not_found_error(exc):
        """Handle not found errors"""
        resource = "Resource"
        if hasattr(exc, 'model'):
            resource = exc.model.__name__
        elif hasattr(exc, 'args') and exc.args:
            resource = str(exc.args[0])
        
        error = NotFoundAPIException(resource=resource)
        return Response(error.get_error_response(), status=error.status_code)
    
    @staticmethod
    def _handle_permission_error(exc):
        """Handle permission errors"""
        error = PermissionAPIException(str(exc) if exc.args else "Permission denied")
        return Response(error.get_error_response(), status=error.status_code)
    
    @staticmethod
    def _handle_integrity_error(exc):
        """Handle database integrity errors"""
        message = "Data integrity error occurred"
        
        # Extract more specific error information
        error_str = str(exc).lower()
        if 'unique' in error_str or 'duplicate' in error_str:
            message = "Duplicate data detected"
        elif 'foreign key' in error_str:
            message = "Referenced data not found"
        elif 'not null' in error_str:
            message = "Required data is missing"
        
        error = DatabaseAPIException(message)
        return Response(error.get_error_response(), status=error.status_code)
    
    @staticmethod
    def _handle_database_error(exc):
        """Handle general database errors"""
        error = DatabaseAPIException("Database operation failed")
        return Response(error.get_error_response(), status=error.status_code)
    
    @staticmethod
    def _handle_unexpected_error(exc):
        """Handle unexpected errors"""
        logger.error(f"Unexpected error: {type(exc).__name__}: {str(exc)}", exc_info=True)
        
        error = StandardAPIException(
            message="An unexpected error occurred",
            error_code='UNEXPECTED_ERROR',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
        return Response(error.get_error_response(), status=error.status_code)
    
    @staticmethod
    def _log_exception(exc, context):
        """Log exception with context"""
        log_data = {
            'exception_type': type(exc).__name__,
            'exception_message': str(exc),
            'context': context
        }
        
        if isinstance(exc, StandardAPIException):
            logger.warning(f"API Exception: {exc.error_code} - {str(exc.detail)}", extra=log_data)
        else:
            logger.error(f"Exception occurred: {str(exc)}", extra=log_data, exc_info=True)


class ResponseBuilder:
    """Builder class for standardized responses"""
    
    @staticmethod
    def success(data=None, message=None, status_code=status.HTTP_200_OK):
        """Build standardized success response"""
        response = {
            'success': True,
            'data': data,
            'timestamp': ResponseBuilder._get_timestamp()
        }
        
        if message:
            response['message'] = message
        
        return response
    
    @staticmethod
    def error(message, error_code=None, details=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Build standardized error response"""
        response = {
            'success': False,
            'error': {
                'code': error_code or 'ERROR',
                'message': message,
                'details': details or {}
            },
            'timestamp': ResponseBuilder._get_timestamp()
        }
        
        return response
    
    @staticmethod
    def _get_timestamp():
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()


class ViewMixin:
    """Mixin to add standardized error handling to views"""
    
    def handle_error(self, exc, **kwargs):
        """Handle errors in views"""
        context = {
            'view': self.__class__.__name__,
            'action': getattr(self, 'action', 'unknown'),
            'request_path': getattr(self.request, 'path', 'unknown'),
            'user': str(self.request.user) if hasattr(self.request, 'user') else 'anonymous'
        }
        context.update(kwargs)
        
        return ErrorHandler.handle_exception(exc, context)
    
    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK):
        """Return standardized success response"""
        response_data = ResponseBuilder.success(data=data, message=message)
        return Response(response_data, status=status_code)
    
    def error_response(self, message, error_code=None, details=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Return standardized error response"""
        response_data = ResponseBuilder.error(
            message=message, 
            error_code=error_code, 
            details=details,
            status_code=status_code
        )
        return Response(response_data, status=status_code)


# Convenience functions for common error scenarios
def raise_validation_error(message, field_errors=None):
    """Raise a validation error"""
    raise ValidationAPIException(message=message, field_errors=field_errors)


def raise_not_found_error(resource='Resource'):
    """Raise a not found error"""
    raise NotFoundAPIException(resource=resource)


def raise_permission_error(message='Permission denied'):
    """Raise a permission error"""
    raise PermissionAPIException(message=message)


def raise_business_error(message, business_code=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Raise a business logic error"""
    raise BusinessLogicAPIException(message=message, business_code=business_code, status_code=status_code)


def raise_auth_error(message='Authentication required'):
    """Raise an authentication error"""
    raise AuthenticationAPIException(message=message)


def raise_rate_limit_error(message='Rate limit exceeded', retry_after=None):
    """Raise a rate limit error"""
    raise RateLimitAPIException(message=message, retry_after=retry_after)


# Custom exception handler for Django REST Framework
def custom_exception_handler(exc, context):
    """
    Custom exception handler to standardize all error responses
    """
    # First, let REST framework handle the exception if it can
    if hasattr(exc, 'get_full_details'):
        # This is a DRF exception
        exc_detail = exc.get_full_details()
        
        # Create a standard API exception
        if exc.status_code == status.HTTP_400_BAD_REQUEST:
            error = ValidationAPIException(
                message="Validation failed",
                field_errors=exc_detail
            )
        elif exc.status_code == status.HTTP_404_NOT_FOUND:
            error = NotFoundAPIException()
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            error = PermissionAPIException()
        elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
            error = AuthenticationAPIException()
        else:
            error = StandardAPIException(
                message=str(exc.detail) if hasattr(exc, 'detail') else "An error occurred",
                status_code=exc.status_code
            )
        
        return ErrorHandler.handle_exception(error, context)
    
    # Handle Django core exceptions
    return ErrorHandler.handle_exception(exc, context)