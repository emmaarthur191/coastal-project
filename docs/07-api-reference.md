# API Reference

A comprehensive guide to the Coastal Banking REST API Endpoints.
Base URL: `/api/`

## 1. Authentication & Users (`/api/users/`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `auth/login/` | POST | Authenticate user & set JWT cookies | Public |
| `auth/logout/` | POST | Blacklist token & clear cookies | Auth |
| `auth/refresh/` | POST | Refresh access token | Public |
| `auth/check/` | GET | Verify current session status | Public |
| `auth/register/` | POST | Register new customer | Public |
| `create/` | POST | Create staff account | Manager+ |
| `send-otp/` | POST | Trigger OTP via SMS/Email | Auth |
| `verify-otp/` | POST | Verify OTP code | Auth |
| `me/` | GET | Get current user profile | Auth |
| `members/` | GET | List all customer accounts | Staff |

## 2. Core Banking (`/api/`)

### Accounts
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `accounts/` | GET/POST | List/Create accounts | Staff |
| `banking/account-openings/` | GET/POST | Manage opening requests | Staff |
| `banking/account-closures/` | GET/POST | Manage closure requests | Manager |
| `banking/staff-accounts/` | GET | View internal staff logic | Manager |

### Transactions
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `transactions/` | GET/POST | Ledger of all transfers | Auth |
| `banking/refunds/` | POST | Process transaction refund | Manager |
| `banking/cash-advances/` | POST | Issue cash advance | Cashier |
| `check-deposits/` | POST | Upload & process checks | Cashier |

### Loans & Credit
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `loans/` | GET/POST | Loan application management | Auth |

## 3. Operations & Management

### Analytics
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `performance/system-health/` | GET | CPU/Memory/DB status | Admin |
| `performance/dashboard-data/` | GET | Aggregated KPI metrics | Manager |
| `audit/dashboard/` | GET | Security audit logs | Admin |
| `operations/mobile-banker-metrics/` | GET | Field agent performance | Manager |

### Calculators
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `operations/calculate-interest/` | POST | Forecast interest returns | Staff |
| `operations/calculate-commission/` | POST | Compute agent fees | Staff |

## 4. Communication

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `chat/rooms/` | GET/POST | Real-time chat threads | Auth |
| `banking/messages/` | GET/POST | Secure inbox messages | Auth |
| `messaging/preferences/` | GET/PUT | Notification settings | Auth |

## 5. Machine Learning (Fraud)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `ml/fraud/analyze/` | POST | Real-time txn risk score | System |
| `ml/fraud/batch-analyze/` | POST | Bulk historical scan | Admin |
