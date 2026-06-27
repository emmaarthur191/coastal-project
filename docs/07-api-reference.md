# API Reference (V1 - Security Hardened)

This document describes the current REST API endpoints for the Coastal Banking System. 
**Base URL**: `/api/` (Core) / `/api/users/` (IAM)

---

## 🔒 Security Requirements
- **Authentication**: JWT (JSON Web Tokens) with HS256 signing.
- **CSRF Protection**: Required for all state-changing requests (POST, PUT, DELETE).
- **mTLS [Required for Staff/Admin Paths]**: Mutual TLS certificate verification is enforced on `/api/v1/management/` and `/api/v1/operational/` paths.
- **Maker-Checker Enforcement**: High-value transactions (>$5,000) are blocked from self-approval.

---

## 1. Authentication & IAM (`/api/users/`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `auth/login/` | POST | Authenticate & set JWT cookies | Public |
| `auth/check/` | GET | Verify current session status | Public |
| `auth/refresh/` | POST | Rotate short-lived access token | Public |
| `auth/password-reset/` | POST | Initiate secure reset (NIST 800-63B) | Public |
| `me/` | GET | Current user profile (Masked PII) | Auth |
| `send-otp/` | POST | Trigger multifactor authentication | Auth |
| `verify-otp/` | POST | Complete secondary verification | Auth |
| `sessions/` | GET/DEL | List/Terminate active sessions | Auth |

---

## 2. Core Banking (`/api/`)

### Accounts & PII (Zero-Plaintext)
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `accounts/` | GET/POST | Manage client accounts | Staff |
| `accounts/balance/` | GET | Current balance (Real-time) | Auth |
| `banking/account-openings/` | GET/POST | Process new account requests | Staff |
| `banking/account-closures/` | GET/POST | Manage closure workflows | Manager |
| `banking/staff-accounts/` | GET | Internal organizational logic | **[mTLS]** Manager |

### Transactions (Maker-Checker Enforced)
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `transactions/` | GET/POST | General ledger (Threshold check) | Auth |
| `check-deposits/` | POST | Process image-based deposits | Cashier |
| `banking/refunds/` | POST | Transaction reversal | Manager |
| `banking/cash-advances/` | POST | Issue micro-credit | Cashier |
| `mobile/repayment/` | POST | Field agent collection | Mobile Banker |

---

## 3. Operations & Analytics

### Metrics & Health
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `performance/system-health/` | GET | Host/DB status metrics | **[mTLS]** Admin |
| `performance/dashboard-data/` | GET | Manager-facing KPIs | **[mTLS]** Manager |
| `operations/metrics/` | GET | Detailed ops performance | **[mTLS]** Manager |
| `audit/dashboard/` | GET | **[Immutable]** Security audit trail | **[mTLS]** Admin |

---

## 4. Communications & Collaboration

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `chat/rooms/` | GET/POST | Multi-party chat threads | Auth |
| `chat/rooms/<id>/messages/` | GET/POST | Room-specific messaging | Auth |
| `banking/messages/` | GET/POST | Secure bank mail (PII-enabled) | Auth |

---

## 5. Security & Intelligence

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `ml/fraud/analyze/` | POST | Real-time txn risk scoring | System |
| `fraud/alerts/` | GET/POST | Active security alerts | Manager |
| `fraud/rules/` | GET/PUT | Dynamic fraud rule management | Admin |

** coastal.banking // api-v1 // zero-trust-certified **
