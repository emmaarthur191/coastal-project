# Banking Backend API

A comprehensive Django REST Framework-based banking system with JWT authentication, role-based permissions, and comprehensive API documentation.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Multi-role system (Member, Cashier, Mobile Banker, Manager, Operations Manager)
- **Banking Operations**: Account management, transactions, loans, and KYC processing
- **Operations Management**: Workflow management, field collections, and client KYC reviews
- **Security**: Encrypted sensitive data, audit logging, rate limiting
- **Monitoring**: Health checks, Prometheus metrics, structured logging
- **API Documentation**: Interactive Swagger UI and ReDoc documentation

## API Documentation

The API is fully documented using OpenAPI 3.0 specification with drf-spectacular.

### Accessing Documentation

- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
- **Raw Schema**: `http://localhost:8000/api/schema/`

### Authentication

All API endpoints (except authentication) require JWT Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/password/reset/` - Request password reset
- `POST /api/auth/password/reset/confirm/` - Confirm password reset

### Banking Operations
- `GET /api/banking/accounts/` - List accounts
- `POST /api/banking/accounts/` - Create account
- `GET /api/banking/accounts/{id}/` - Account details
- `GET /api/banking/accounts/{id}/balance/` - Account balance
- `POST /api/banking/transactions/process/` - Process transactions
- `GET /api/banking/transactions/` - Transaction history

### Loans
- `GET /api/banking/loans/` - List loans
- `POST /api/banking/loans/` - Apply for loan
- `POST /api/banking/loans/{id}/approve/` - Approve loan (Operations Manager)
- `POST /api/banking/loans/{id}/reject/` - Reject loan (Operations Manager)
- `POST /api/banking/loans/{id}/disburse/` - Disburse loan (Cashier)
- `POST /api/banking/loans/{id}/repay/` - Process repayment (Cashier)

### KYC Operations
- `POST /api/banking/kyc/apply/` - Submit KYC application (Mobile Banker)
- `GET /api/banking/kyc/` - List KYC applications
- `POST /api/banking/kyc/{id}/review/` - Review KYC application (Operations Manager)

### Operations Management
- `GET /api/operations/workflows/` - List workflows
- `POST /api/operations/workflows/` - Create workflow
- `GET /api/operations/workflows/{id}/steps/` - Workflow steps
- `GET /api/operations/kyc/` - Client KYC submissions
- `POST /api/operations/kyc/{id}/review/` - Review client KYC
- `GET /api/operations/field-collections/` - Field collections

### User Management
- `GET /api/users/profile/` - Get user profile
- `PATCH /api/users/profile/` - Update profile
- `PATCH /api/users/notifications/` - Update notification settings
- `POST /api/users/password/change/` - Change password

## User Roles & Permissions

### Member
- View own accounts and transactions
- Apply for loans
- Update profile and notification settings

### Cashier
- Process deposits and withdrawals
- Disburse approved loans
- Process loan repayments
- Transfer funds between accounts

### Mobile Banker
- Submit KYC applications
- Collect field data
- Create member accounts

### Manager
- All member permissions
- Create and manage accounts
- View all transactions and accounts

### Operations Manager
- All manager permissions
- Approve/reject loan applications
- Review KYC applications
- Manage workflows and fee structures

## Error Codes

### Authentication Errors
- `401`: Authentication credentials were not provided
- `403`: You do not have permission to perform this action
- `429`: Request was throttled

### Validation Errors
- `400`: Invalid input data
- `404`: Resource not found

### Business Logic Errors
- `400`: Insufficient funds
- `400`: Invalid transaction type
- `400`: Account not found
- `400`: Loan not eligible for disbursement

## Request/Response Examples

### Login
```json
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "member",
    "is_active": true,
    "is_staff": false
  }
}
```

### Process Transaction
```json
POST /api/banking/transactions/process/
Authorization: Bearer <jwt-token>
{
  "member_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": "100.00",
  "type": "Deposit"
}

Response:
{
  "message": "Transaction successful. New balance: $150.00",
  "receipt_id": "123e4567-e89b-12d3-a456-426614174001"
}
```

## Development Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run migrations:
   ```bash
   python manage.py migrate
   ```

3. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

4. Run development server:
   ```bash
   python manage.py runserver
   ```

5. Access API documentation at `http://localhost:8000/api/schema/swagger-ui/`

## Testing

Run tests with:
```bash
python manage.py test
```

## Health Checks & Monitoring

- Health check: `GET /health/`
- System health: `GET /health/system/`
- Banking metrics: `GET /health/banking/`
- Prometheus metrics: `GET /metrics/`

## Security Features

- JWT authentication with refresh tokens
- Role-based permissions
- Rate limiting (configurable per endpoint)
- Data encryption for sensitive fields
- Audit logging for all transactions
- CSRF protection
- HTTPS enforcement in production
- Secure headers (HSTS, XSS protection, etc.)

## Contributing

1. Follow the existing code structure and naming conventions
2. Add comprehensive tests for new features
3. Update API documentation for new endpoints
4. Ensure all endpoints are properly secured with permissions
5. Follow the audit logging patterns for sensitive operations