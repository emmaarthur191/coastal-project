# Strategic Security Roadmap: Tier-1 Banking Certification

This document outlines the transition of the Coastal Banking System from a secure prototype to a regulated, enterprise-grade banking platform compliant with the **Bank of Ghana** standards.

## 1. Infrastructure Hardening (The "Data Fortress")

### [ ] Phase 1: Local Data Residency
- **Requirement**: Banking data must reside within Ghanaian borders (Bank of Ghana Act 612).
- **Strategy**: 
    - Migrate from **Render (Frankfurt)** to a local Ghanaian Tier-3 Data Center (e.g., OnCloud).
    - Alternatively, implement a **Hybrid Cloud** model using AWS Outposts in Accra.
- **Goal**: Full compliance with local sovereignty laws.

### [ ] Phase 2: WAF & DDoS Protection
- **Strategy**: Deploy **Cloudflare Enterprise WAF** or **AWS WAF**.
- **Rulesets**: Enable OWASP Core Rule Set (CRS) and custom rate-limiting for high-value API endpoints.
- **Goal**: Mitigate Layer 7 attacks and systematic scraping.

### [ ] Phase 3: mTLS Enforcement (Staff Devices)
- **Status**: Middleware foundation implemented.
- **Next Step**: Configure Nginx/ALB to require a client certificate for `/api/v1/management/` and `/api/v1/operational/`.
- **Goal**: Eliminate password-only authentication for staff.

---

## 2. Key Management & Secrets (The "Vault" Upgrade)

### [ ] Migration to HSM-Backed KMS
- **Status**: Application code abstracted via `SecretManager`.
- **Next Step**: Configure **AWS KMS** or **Azure Key Vault** to handle `FIELD_ENCRYPTION_KEY`.
- **Goal**: Keys are never visible in application memory or logs, even with high-level access.

### [ ] Certificate Pinning (Mobile)
- **Target**: Native Mobile Client.
- **Strategy**: Implement SSL Pinning to prevent traffic interception by sophisticated malware.

---

## 3. Operational Integrity (Maker-Checker 2.0)

### [x] 4-Eyes Principle Implementation
- **Status**: Code-level enforcement complete in `Transaction` model.
- **Next Step**: Expand to `LoanApproval` and `AccountOpening` workflows.

### [x] Dead Man's Switch (Anomaly Detection)
- **Status**: Implemented for bulk exports.
- **Next Step**: Integrate with an external alerting system (e.g., OpsGenie or PagerDuty).

---

## 4. Compliance & Audit

### [ ] Automated Vulnerability Scanning
- **Goal**: Weekly DAST/SAST scans using Snyk and OWASP ZAP.

### [ ] Formal Penetration Testing
- **Goal**: Annual third-party security audit by a certified CREST/OSCP provider.

### [ ] Incident Response Plan
- **Goal**: Finalize `INCIDENT_RESPONSE.md` for team-wide playbooks.
