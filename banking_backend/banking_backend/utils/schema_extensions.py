"""
Custom OpenAPI schema extensions for enhanced API documentation.
"""
from drf_spectacular.utils import OpenApiExample, OpenApiParameter
from drf_spectacular.types import OpenApiTypes


# Authentication examples
LOGIN_EXAMPLE = OpenApiExample(
    'Login Example',
    value={
        'email': 'user@example.com',
        'password': 'securepassword123'
    },
    request_only=True
)

LOGIN_RESPONSE_EXAMPLE = OpenApiExample(
    'Login Response Example',
    value={
        'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
        'access': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
        'user': {
            'id': '123e4567-e89b-12d3-a456-426614174000',
            'email': 'user@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'member',
            'is_active': True,
            'is_staff': False
        }
    },
    response_only=True
)

# Transaction examples
DEPOSIT_EXAMPLE = OpenApiExample(
    'Deposit Transaction',
    value={
        'member_id': '123e4567-e89b-12d3-a456-426614174000',
        'amount': '100.00',
        'type': 'Deposit'
    },
    request_only=True
)

WITHDRAWAL_EXAMPLE = OpenApiExample(
    'Withdrawal Transaction',
    value={
        'member_id': '123e4567-e89b-12d3-a456-426614174000',
        'amount': '50.00',
        'type': 'Withdrawal'
    },
    request_only=True
)

TRANSACTION_RESPONSE_EXAMPLE = OpenApiExample(
    'Transaction Response',
    value={
        'message': 'Transaction successful. New balance: $150.00',
        'receipt_id': '123e4567-e89b-12d3-a456-426614174001'
    },
    response_only=True
)

# Error examples
INSUFFICIENT_FUNDS_ERROR = OpenApiExample(
    'Insufficient Funds Error',
    value={
        'error': 'Insufficient funds for withdrawal'
    },
    response_only=True
)

VALIDATION_ERROR = OpenApiExample(
    'Validation Error',
    value={
        'error': 'Invalid amount format'
    },
    response_only=True
)

PERMISSION_DENIED_ERROR = OpenApiExample(
    'Permission Denied',
    value={
        'detail': 'You do not have permission to perform this action.'
    },
    response_only=True
)

AUTHENTICATION_ERROR = OpenApiExample(
    'Authentication Required',
    value={
        'detail': 'Authentication credentials were not provided.'
    },
    response_only=True
)

# Loan application examples
LOAN_APPLICATION_EXAMPLE = OpenApiExample(
    'Loan Application',
    value={
        'amount_requested': '5000.00',
        'term_months': 12,
        'interest_rate': '8.5',
        'purpose': 'Business expansion'
    },
    request_only=True
)

# KYC application examples
KYC_APPLICATION_EXAMPLE = OpenApiExample(
    'KYC Application',
    value={
        'applicant_name': 'John Doe',
        'document_urls': ['https://example.com/id.jpg', 'https://example.com/proof.jpg'],
        'geotag': '40.7128,-74.0060'
    },
    request_only=True
)

# Common parameters
MEMBER_ID_PARAM = OpenApiParameter(
    name='member_id',
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.QUERY,
    description='UUID of the member',
    required=False
)

ACCOUNT_ID_PARAM = OpenApiParameter(
    name='account_id',
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.QUERY,
    description='UUID of the account',
    required=False
)

TRANSACTION_TYPE_PARAM = OpenApiParameter(
    name='type',
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description='Type of transaction',
    enum=['Deposit', 'Withdrawal', 'Transfer'],
    required=False
)

DATE_FROM_PARAM = OpenApiParameter(
    name='date_from',
    type=OpenApiTypes.DATE,
    location=OpenApiParameter.QUERY,
    description='Filter from date (YYYY-MM-DD)',
    required=False
)

DATE_TO_PARAM = OpenApiParameter(
    name='date_to',
    type=OpenApiTypes.DATE,
    location=OpenApiParameter.QUERY,
    description='Filter to date (YYYY-MM-DD)',
    required=False
)