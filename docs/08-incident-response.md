# Incident Response (IR) Protocol

This document outlines the systematic protocol for detecting, isolating, and remediating security incidents within the Coastal Banking System.

---

## 1. 🔍 Phase 1: Detection & Triage
The system uses **Automated Behavioral Analysis** to detect anomalies before they scale.

- **Trigger 1**: `BulkAccessDetected` alert (Sliding window exceeded).
- **Trigger 2**: `AuthFailureBurst` alert (Brute-force/Credential stuffing).
- **Trigger 3**: `MTLSViolation` (Unauthorized certificate attempt).
- **Action**: Security Team is notified via **SystemAlert** (Critical) and external monitoring (Sentry/Email).

---

## 2. 🛑 Phase 2: Containment & Isolation
Immediate technical response to halt the compromise.

- **Account Isolation**: If a staff account is compromised, the `is_active` flag is set to `False` (Fail-Closed).
- **Session Liquidation**: All active JWT tokens for the impacted `user_id` are blacklisted in Redis.
- **Resource Lock**: Administrative endpoints may be temporarily disabled via **Maintenance Mode** in the Load Balancer.

---

## 3. 🕵️ Phase 3: Investigation (Audit Trace)
Leveraging the **Immutable Audit Log** to reconstruct the timeline.

- **Trace Analysis**: Verify all `AuditLog` entries for the impacted user/resource.
- **Scope Verification**: Identify exactly which PII records were accessed (if any).
- **Blind Index Audit**: Check `HMAC-SHA256` query patterns for information leakage.

---

## 4. 📢 Phase 4: Regulatory Notification
Aligning with the **Ghana Data Protection Act (Act 843)** and international standards.

- **Notification Window**: Under Act 843, if personal data is compromised, the Data Protection Commission (DPC) must be notified **"As Soon As Reasonably Practicable" (ASARP)**.
- **Customer Transparency**: Directly impacted customers are notified via **Secure Bank Mail** with clear remediation steps.
- **Internal Target**: Maintain a **72-hour gold standard** for high-impact breaches to ensure proactive compliance.

---

## 5. 🛠️ Phase 5: Remediation & Post-Mortem
Closing the vulnerability and restoring normal operations.

- **Secret Rotation**: Initiate a full **Key Rotation** of the master secrets via the `rotate_keys` management command (`python manage.py rotate_keys`).
- **Logic Patching**: Identify and patch the root cause (e.g., IDOR vulnerability, excessive permissions).
- **Retrospective**: Document the "What, Why, and How" to prevent future occurrences.

---

** coastal.banking // ir-v1 // zero-trust-architecture // fail-closed **
