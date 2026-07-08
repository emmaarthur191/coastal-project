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
- **At-Rest**: **Fernet (AES-256-CBC + HMAC-SHA256)** (Standard Authenticated Encryption).
- **Versioning**: All PII-heavy models include a `key_version` field to support seamless encryption key rotation (Phase 2).
- **In-Memory**: PII fields are only decrypted at the last possible moment before serialization.
- **Searchable Index**: **Salted HMAC-SHA256 (Blind Indexing)**. PII is salted with `PII_HASH_KEY` and hashed for exact-match lookups, ensuring raw data is never exposed to the database engine's query optimizer or logs.

---

## 🛡️ 2. OWASP Top 10 Mitigations (2026 Edition)

| Vulnerability | Coastal Banking Implementation/Control |
|---------------|-----------------------------------------|
| **A01 Broken Access Control** | Django REST Framework (DRF) Role-Based Permissions + Account Scoping for Mobile Bankers. |
| **A02 Cryptographic Failures** | Fernet (AES-256-CBC + HMAC-SHA256) encryption using keys injected from `/etc/secrets/`. |
| **A03 Injection** | Django ORM parameterized queries + Blind Indexing for searchable PII (avoids `LIKE` on raw data). |
| **A07 Auth Failures** | JWT tokens stored in **HttpOnly, Secure, SameSite=Strict** cookies to prevent XSS/CSRF session theft. |
| **A09 Logging/Monitoring Failures** | **Immutable AuditLogs** + PII masking in system logs + **Prometheus/Sentry** real-time alerting. |

---

## 🌐 3. Network & Transport Layer

### mTLS (Staff Enforcement)
The `MTLSVerificationMiddleware` requires valid **Client Certificates** for access to high-privilege management and metrics endpoints:
- Staff Account Management (`/api/banking/staff-accounts/`)
- System Performance & Health (`/api/performance/system-health/`, `/api/performance/dashboard-data/`)
- Operational Metrics (`/api/operations/metrics/`)
- Audit Dashboard (`/api/audit/dashboard/`)

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

---

## 🚀 7. Phase 3: Cryptographic Hardening (Implemented & Active)

| Target Area | Action / Technology | Security Impact | Status |
|-------------|---------------------|-----------------|--------|
| **Field PII Encryption** | Version-prefixed **AES-256-GCM** (tagged `v2GCM:`). | Eliminates padding oracle side-channel vulnerabilities; introduces Authenticated Data binding. Backward compatible with standard Fernet (starting with `gAAAAA`). | **Active** |
| **Key Theft Resiliency** | **Envelope Encryption** routing via AWS KMS / GCP KMS. | Decrypts KEK/DEKs dynamically. Fail-closed startup checks block boot in production if KMS is unconfigured, unless gated by emergency bypass. | **Active** |
| **Database Connections** | Enforced **`sslmode=verify-full`** with automatic system CA bundle detection. | Eradicates Man-in-the-Middle (MitM) sniffing or certificate spoofing inside internal subnets. | **Active** |
| **Quantum Preemption** | **Post-Quantum Cryptography (PQC)** enabled at edge. | Protects payload data from "Harvest Now, Decrypt Later" quantum attacks. | **Cloudflare Configured** |

### Cloudflare Post-Quantum Cryptography (PQC) Enablement
To activate PQC protection at the edge:
1. Navigate to the Cloudflare Dashboard.
2. Select your domain and go to **SSL/TLS** > **Edge Certificates**.
3. Locate **Post-Quantum Cryptography** and toggle it to **Enabled**. This enables hybrid key exchange algorithms (e.g., `X25519Kyber768`) for modern browser sessions.

---

## 📅 8. Legacy Cryptography Retirement Plan

To ensure the "temporary compatibility shim" for legacy Fernet (`gAAAAA` prefix) does not become permanent technical debt or a weaker-crypto fallback vector, the following rollout and retirement schedule is enforced:

### Metric & Visibility Tracking
1. **Migration Verification Command**: Use the `python manage.py count_legacy_encrypted_fields` tool to scan all database models and count any remaining records using the old `gAAAAA` Fernet format.
2. **Alerting Threshold**: If the count of legacy Fernet rows exceeds `0`, this is logged in the daily operations report.

### Migration Rollout
*   **Lazy Migration**: All active database records undergo dynamic GCM re-encryption on write (any update to a model encrypts using the new `v2GCM:` format).
*   **Batch Key Rotation**: Run the `python manage.py rotate_keys --target-version=1` key rotation command to programmatically process and re-encrypt all remaining legacy rows in batches of `100`.

### Retiring Fernet & Key Deletion Criteria
The legacy Fernet decryption code path in `core/utils/field_encryption.py` and the old Fernet keys in settings/KMS must be retired and deleted once the following criteria are met:
1. **Zero Legacy Records**: The `count_legacy_encrypted_fields` scan reports `0` legacy records remaining in the database.
2. **Downtime/Grace Period**: A **30-day grace period** has elapsed since the scan first hit zero, ensuring any backups, logs, or async queues containing legacy ciphertexts are either expired or processed.
3. **Key Decommissioning**: After 30 days of zero legacy records, the Fernet decryption shim must be deleted from the codebase, and the old Fernet key must be permanently purged from settings and the KMS secret vault.

** coastal.banking // security-v3.0 // binary-hardened // audit-certified // quantum-safe **
