# Security Architecture (v2.0 - Audit Final)

This document details the multi-layered security controls enforced by the Coastal Banking System to ensure 2026-standard data protection and regulatory compliance.

---

## 🔒 1. Core Security Invariants

### 4-Eyes Principle (Maker-Checker)
All high-value or sensitive operations require dual authorization.
- **Control**: `clean()` method validation at the model level (`AccountOpeningRequest`, `AccountClosureRequest`, `Transaction`) ensures `submitted_by != approved_by`.
- **Closure Enforcement**: Managers are explicitly blocked from approving their own account closure requests (Self-Approval Restriction).
- **Threshold**: Transactions exceeding **GHS 5,000.00** are automatically flagged for manager intervention.

### Zero-Plaintext PII Policy
No Personal Identifiable Information (Name, DOB, ID Number, Phone) is stored in plaintext.
- **At-Rest**: **Fernet AES-128-CBC + HMAC-SHA256** (Authenticated Encryption).
- **Versioning**: All PII-heavy models include a `key_version` field to support seamless encryption key rotation (Phase 2).
- **In-Memory**: PII fields are only decrypted at the last possible moment before serialization.
- **Searchable Index**: **Salted HMAC-SHA256 (Blind Indexing)**. PII is salted with `PII_HASH_KEY` and hashed for exact-match lookups, ensuring raw data is never exposed to the database engine's query optimizer or logs.

---

## 🛡️ 2. OWASP Top 10 Mitigations (2026 Edition)

| Vulnerability | Coastal Banking Implementation/Control |
|---------------|-----------------------------------------|
| **A01 Broken Access Control** | Django REST Framework (DRF) Role-Based Permissions + Account Scoping for Mobile Bankers. |
| **A02 Cryptographic Failures** | Fernet AES-128-CBC + HMAC-SHA256 encryption using keys injected from `/etc/secrets/`. |
| **A03 Injection** | Django ORM parameterized queries + Blind Indexing for searchable PII (avoids `LIKE` on raw data). |
| **A07 Auth Failures** | JWT tokens stored in **HttpOnly, Secure, SameSite=Strict** cookies to prevent XSS/CSRF session theft. |
| **A09 Logging/Monitoring Failures** | **Immutable AuditLogs** + PII masking in system logs + **Prometheus/Sentry** real-time alerting. |

---

## 🌐 3. Network & Transport Layer

### mTLS (Staff Enforcement)
The `MTLSVerificationMiddleware` requires valid **Client Certificates** for access to:
- Operational APIs (`/api/banking/`, `/api/operations/`)
- Management Dashboards (`/api/users/management/`)

### Cookie Security Defaults
All session-related cookies are hardened:
- **`HttpOnly`**: Prevents JavaScript theft via XSS.
- **`Secure`**: Enforces HTTPS-only transmission.
- **`SameSite=Strict`**: Mitigates all CSRF "session-riding" vectors by restricting cookies to top-level navigation within the banking domain.

---

## 🚨 4. Operational Controls

### Dead Man's Switch (Anomaly Detection)
The `BulkAccessDetectionMiddleware` monitors for data exfiltration patterns.
- **Limit**: **100 records fetched per 10 minutes** (Sliding Window).
- **Trigger**: Exceeding this limit triggers an immediate system-wide alert and blocks the originating IP/User for manager review.

### Idempotency Protection
Prevents "double-spend" attacks caused by client retries or network jitter.
- **Mechanism**: `X-Idempotency-Key` (UUID) required on all financial mutation endpoints (`POST`, `PUT`, `PATCH`).
- **TTL**: Cached responses are valid for **24 hours**.

---

## 📄 5. The Paper-First Protocol (Onboarding v3)

To mitigate "Remote Hijack" and "Synthetic Identity" fraud, all new account onboarding follows a strictly physical, offline-first trust anchor.

### Physical KYC Verification
- **Attestation Gate**: Onboarding approval is locked behind a mandatory **Physical KYC Verification** attestation. 
- **Staff Mandate**: Staff must confirm they have physically verified original government IDs and that the applicant was present during the registration.

### Credential Delivery (Zero-SMS)
- **Hardening**: Digital credential dispatch via SMS is **decommissioned** for new accounts.
- **Delivery**: Initial credentials (temporary password + account number) are delivered exclusively via a physical **Welcome Letter (PDF)**. 
- **Trust Anchor**: Digital identity is anchored in physical document verification, satisfying institutional audit requirements.

---

## 📋 6. Compliance Framework
- **Ghana Data Protection Act**: Satisfied by local data residency roadmap + Fernet encryption.
- **PCI-DSS Compliance**: No raw card numbers stored; masked data only.
- **Paper-First Mandate**: Complies with the 2026 Central Bank circular on physical presence verification.
- **Audit Logging**: 100% visibility on all PII access and money movements via the immutable `AuditLog` model.

** coastal.banking // security-v2.0 // binary-hardened // audit-certified **
