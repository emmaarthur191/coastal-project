# Infrastructure & Security Configuration (V2.1 - Auditor Sync)

This document details the Coastal Banking System's technical infrastructure, security posture, and regulatory compliance configuration.

---

## 1. Hosting & Geo-Residency
- **Provider**: **Render (Cloud)**.
- **Primary Region**: **Frankfurt, Germany (eu-central-1)**. [Confirmed]
- **Databases**: **PostgreSQL 18** (Primary), **Redis 7** (Caching/WS).
- **Compliance Status**: GDPR-compliant. 
- **Roadmap**: Transitioning to **local Ghanaian data residency** (Bank of Ghana Act 612) via Accra-based Tier-3 data centers (Phase 2: **Q4 2026**).

---

## 2. Encryption & Secrets (`SecretManager`)
The system employs a **Resource Injection** pattern for secrets to decouple sensitive keys from the process environment.
- **At-Rest**: **AES-128-CBC + HMAC-SHA256** (Fernet Authenticated Encryption).
    - *Auditor Note*: HMAC-SHA256 provides authentication/integrity checking before decryption, effectively mitigating CBC-mode specific vulnerabilities (e.g., padding oracles).
- **Searchable Hash**: **HMAC-SHA256 (Blind Indexing)**.
- **Secrets Management**: Managed via `core/utils/secret_service.py` which prioritizes **Secret Files** injected at `/etc/secrets/` (Render-Native Secret Groups).
- **Security Control**: Prevents secret leakage via `/proc/self/environ` or management logs.
- **HSM Path**: Abstraction ready for **AWS KMS / Google Cloud KMS** (Migration planned for Phase 2: **Q3 2026**).

---

## 3. Network & Transport Security
- **Protocol**: **TLS 1.2 / 1.3 (AES-256)** enforced for all API traffic.
- **mTLS [Foundation]**: `MTLSVerificationMiddleware` implemented to require **Client Certificates** for staff and internal operational endpoints.
    - **Guarded Paths**: `/api/banking/`, `/api/operations/`, `/api/reports/`, `/api/users/staff/`, `/api/users/management/`.
- **CORS / CSRF**: Strict allowlist for `onrender.com` subdomains and `localhost` (Dev).
- **HSTS / CSP**: Hardened security headers enforced to mitigate MitM and XSS.

---

## 4. Operational Integrity (4-Eyes Principle)
- **Maker-Checker Enforcement**: 
    - **Threshold**: $5,000.00 (Configurable via `TRANSACTION_APPROVAL_THRESHOLD`).
    - **Control**: Model-level validation ensures `processed_by != approved_by`.
- **Anomaly Detection (Bulk Access Prevention)**: 
    - **Burst Limit**: **100 records per 10 minutes** (Sliding Window).
    - **Action**: Immediate system-wide `SystemAlert` and logging of suspicious bulk data access.

---

## 5. API Throttling (Rate Limiting)
Standard `rest_framework.throttling` configurations:

| Scope | Rate | Purpose |
|-------|------|---------|
| `anon` | 100/hour | Bot protection |
| `user` | 1,000/hour | Standard activity |
| `login` | **5/5min** | Brute-force protection |
| `otp_verify` | **3/5min** | OTP guessing mitigation |

---

## 6. External Service Registry
- **Messaging**: `Sendexa` (Basic Auth via `SENDEXA_SERVER_KEY`, mounted from `/etc/secrets/`).
- **Redis & Daphne**: Backbone for real-time WebSockets (Chat/Alerts).
- **Celery**: Distributed task queue for asynchronous background processing (e.g., `daily_reports`, `fraud_analysis`, and `stale_transaction_detection` on a 24h cycle).
- **Monitoring**: 
    - **Sentry**: Error & performance tracking.
    - **Prometheus**: Metrics collection (`django_prometheus`).
    - **Audit Strategy**: **Immutable logs** (Write-Once enforcement) for `AuditLog` and `UserActivity`.

---

## 7. Continuity & Recovery (BCP/DRP)
- **Deployment Gate**: **`smart_migrate.py` (v8)**.
    - *Purpose*: Automatically detects and resolves schema drift between environments.
    - *Fail-safe*: Checks for custom `db_table` naming consistency and cleans redundant default Django tables (e.g., `users_user`) to prevent production `IntegrityErrors`.
- **Backup Policy**: 24-hour automated WAL-based backups for PostgreSQL.
- **RPO (Recovery Point Objective)**: < 5 minutes (via active WAL streaming).
- **RTO (Recovery Time Objective)**: < 4 hours (Service restoration from bucket storage).

---

## 8. Cloud Provider Security
- **Encryption at Rest**: AWS/Render standard managed encryption using EBS/RDS-integrated keys (FIPS 140-2 compliant).
- **Infrastructure as Code**: Terraform-managed configurations for reproducible environments.

---

## 9. Supply-Chain Security
- **Dependency Audit**: `pip-audit` version 2.10.0 integration for regular vulnerability scanning.
- **Vulnerability Remediation**: All critical patches (e.g., `aiohttp`) are applied within 24 hours of detection.
- **Automation**: GitHub Dependabot enabled for automated security PR generation.

---

## 10. Audit Logging
- **Immutable Log Entry**: All `AuditLog` records are protected by model-level `save` overrides that prevent modification/deletion.
- **Coverage**: 100% visibility on User Access, PII Decryption, and Loan Approvals.

** coastal.banking // infra-v2.1 // binary-hardened // zero-trust-architecture **
