# Banking Backend - Transaction API Documentation

## Overview

This document provides comprehensive documentation for the Transaction API endpoints, including request/response schemas, authentication requirements, error handling, and usage examples.

**Base URL:** `https://api.coastalbank.com/api/v1/transactions/`

**Authentication:** JWT Token required for all endpoints
**Authorization:** Role-based access control implemented

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Transaction Endpoints](#transaction-endpoints)
5. [Transfer Endpoints](#transfer-endpoints)
6. [Request/Response Examples](#requestresponse-examples)

---

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles and Permissions

| Role | Transaction Access | Transfer Access | Account Summary |
|------|-------------------|-----------------|-----------------|
| `cashier` | Full access to all transactions | Full access | All users |
| `manager` | Full access | Full access | All users |
| `operations_manager` | Full access | Full access | All users |
| `member` | Own transactions only | Own accounts only | Own accounts only |

---

## Error Handling

All endpoints return consistent error responses:

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
    "error": "Descriptive error message",
    "details": {
        "field_name": ["Specific validation error"]
    },
    "timestamp": "2025-11-20T02:27:16.054Z",
    "trace_id": "unique-trace-id"
}
```

---

## Rate Limiting

### Per-User Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /transactions/process/` | 100 requests | 1 hour |
| `POST /transactions/transfer/` | 50 requests | 1 hour |
| `POST /transfers/fast-transfer/` | 30 requests | 1 hour |
| `GET /transactions/` | 1000 requests | 1 hour |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Transaction Endpoints

### 1. List Transactions

**Endpoint:** `GET /transactions/`

**Description:** Retrieve paginated list of transactions with filtering options.

**Permissions:** 
- Members: See own transactions only
- Staff: See all transactions

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `page_size` | integer | No | Items per page (max: 100, default: 50) |
| `type` | string | No | Filter by transaction type |
| `date_from` | string | No | Start date (YYYY-MM-DD format) |
| `date_to` | string | No | End date (YYYY-MM-DD format) |
| `account_id` | string | No | Filter by account ID |
| `min_amount` | decimal | No | Minimum transaction amount |
| `max_amount` | decimal | No | Maximum transaction amount |

**Response:**

```json
{
    "transactions": [
        {
            "id": "transaction-uuid",
            "date": "2025-11-20",
            "description": "Deposit transaction",
            "amount": 150.50
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_count": 250,
        "page_size": 50,
        "has_next": true,
        "has_previous": false
    }
}
```

---

### 2. Process Transaction

**Endpoint:** `POST /transactions/process/`

**Description:** Process a deposit or withdrawal transaction (Cashiers only).

**Permissions:** `cashier`, `manager`, `operations_manager`

**Request Body:**

```json
{
    "member_id": "uuid-string",
    "amount": "100.50",
    "type": "deposit",
    "description": "Optional description"
}
```

**Field Validation:**

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `member_id` | UUID | Yes | Must be valid user UUID |
| `amount` | decimal | Yes | 0.01 ≤ amount ≤ 1,000,000.00 |
| `type` | string | Yes | Must be "deposit" or "withdrawal" |
| `description` | string | No | Max 500 characters |

**Success Response:**

```json
{
    "message": "Deposit successful",
    "new_balance": 1150.50,
    "previous_balance": 1050.00,
    "transaction_amount": 100.50,
    "receipt_id": "unique-receipt-id",
    "timestamp": "2025-11-20T02:27:16.054Z"
}
```

**Error Response Examples:**

```json
{
    "error": "Insufficient funds. Available: $950.00"
}
```

```json
{
    "error": "Member not found"
}
```

```json
{
    "error": "Missing required field: member_id"
}
```

---

### 3. Transfer Between Accounts

**Endpoint:** `POST /transactions/transfer/`

**Description:** Transfer funds between two accounts (Cashiers only).

**Permissions:** `cashier`, `manager`, `operations_manager`

**Request Body:**

```json
{
    "from_account": "uuid-string",
    "to_account": "uuid-string", 
    "amount": "50.00"
}
```

**Field Validation:**

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `from_account` | UUID | Yes | Must be valid account UUID |
| `to_account` | UUID | Yes | Must be valid account UUID, different from from_account |
| `amount` | decimal | Yes | Must be positive and available in source account |

**Success Response:**

```json
{
    "message": "Transfer completed successfully"
}
```

---

### 4. Account Summary

**Endpoint:** `GET /transactions/account-summary/`

**Description:** Get comprehensive account summary for user or all users.

**Permissions:** All authenticated users (scope varies by role)

**Response:**

```json
{
    "total_savings": 50000.00,
    "total_loans": 15000.00,
    "available_balance": 35000.00,
    "monthly_contributions": 2500.00,
    "account_count": 3,
    "loan_count": 2
}
```

---

## Transfer Endpoints

### 5. Fast Transfer

**Endpoint:** `POST /transfers/fast-transfer/`

**Description:** Perform fast transfer between accounts with enhanced security.

**Permissions:** `member`, `cashier`, `manager`, `operations_manager`

**Request Body:**

```json
{
    "from_account": "uuid-string",
    "to_account": "uuid-string",
    "amount": "25.00",
    "description": "Fast transfer description"
}
```

**Field Validation:**

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `from_account` | UUID | Yes | Must be valid account UUID |
| `to_account` | UUID | Yes | Must be valid account UUID, different from from_account |
| `amount` | decimal | Yes | Must be positive and available in source account |
| `description` | string | No | Max 255 characters |

**Success Response:**

```json
{
    "message": "Transfer successful.",
    "from_balance": 975.00,
    "to_balance": 1025.00,
    "transfer_id": "unique-transfer-id"
}
```

---

## Request/Response Examples

### Example 1: Process Deposit Transaction

**Request:**
```bash
curl -X POST https://api.coastalbank.com/api/v1/transactions/process/ \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "amount": "150.50",
    "type": "deposit",
    "description": "Customer cash deposit"
  }'
```

**Response:**
```json
{
    "message": "Deposit successful",
    "new_balance": 1150.50,
    "previous_balance": 1000.00,
    "transaction_amount": 150.50,
    "receipt_id": "rcpt_20251120022716",
    "timestamp": "2025-11-20T02:27:16.054Z"
}
```

### Example 2: Filter Transactions by Date Range

**Request:**
```bash
curl -X GET "https://api.coastalbank.com/api/v1/transactions/?date_from=2025-11-01&date_to=2025-11-20&page=1&page_size=20" \
  -H "Authorization: Bearer <jwt-token>"
```

**Response:**
```json
{
    "transactions": [
        {
            "id": "txn_001",
            "date": "2025-11-20",
            "description": "Deposit transaction",
            "amount": 150.50
        },
        {
            "id": "txn_002", 
            "date": "2025-11-19",
            "description": "Withdrawal transaction",
            "amount": -50.00
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 3,
        "total_count": 45,
        "page_size": 20,
        "has_next": true,
        "has_previous": false
    }
}
```

### Example 3: Fast Transfer

**Request:**
```bash
curl -X POST https://api.coastalbank.com/api/v1/transfers/fast-transfer/ \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_account": "acc_12345",
    "to_account": "acc_67890", 
    "amount": "100.00",
    "description": "Transfer to savings"
  }'
```

**Response:**
```json
{
    "message": "Transfer successful.",
    "from_balance": 400.00,
    "to_balance": 600.00,
    "transfer_id": "trf_20251120022716"
}
```

### Example 4: Get Account Summary

**Request:**
```bash
curl -X GET https://api.coastalbank.com/api/v1/transactions/account-summary/ \
  -H "Authorization: Bearer <jwt-token>"
```

**Response:**
```json
{
    "total_savings": 25000.00,
    "total_loans": 5000.00,
    "available_balance": 20000.00,
    "monthly_contributions": 1200.00,
    "account_count": 2,
    "loan_count": 1
}
```

---

## Security Features

### Input Validation
- Comprehensive sanitization of all input fields
- SQL injection prevention through ORM usage
- XSS prevention through proper encoding
- File upload restrictions where applicable

### Transaction Security
- Atomic transactions to prevent data inconsistency
- Daily withdrawal limits enforced
- Balance verification before each transaction
- Comprehensive audit logging

### Rate Limiting
- Per-user rate limiting on all endpoints
- Automatic throttling of suspicious activity
- Rate limit headers in all responses

### Audit Logging
- All transactions logged with user, timestamp, and changes
- Balance change tracking
- Failed transaction attempts logged
- Security event monitoring

---

## Testing

### Test Environment
**Base URL:** `https://test-api.coastalbank.com/api/v1/`

### Test Credentials
Contact the development team for test user credentials and JWT tokens.

### Sample Test Data
The test environment includes pre-populated sample users, accounts, and transactions for comprehensive testing.

---

## Changelog

### Version 2.0 (2025-11-20)
- Enhanced security with comprehensive input validation
- Added transaction filtering and pagination
- Improved error handling and response consistency
- Added daily withdrawal limits
- Enhanced audit logging capabilities
- Added rate limiting headers
- Improved transfer security with balance verification

### Version 1.0 (Previous)
- Basic transaction processing
- Simple transfer functionality
- Basic authentication

---

## Support

For API support and questions:
- **Email:** api-support@coastalbank.com
- **Documentation:** https://docs.coastalbank.com
- **Status Page:** https://status.coastalbank.com

---

*This documentation is subject to change. Always refer to the latest version for current API specifications.*