# Infrastructure Security & Compliance Mapping (Phase 6)

This document formalizes the mapping of security controls implemented during the audit to international standards (NIST 800-53, PCI-DSS v4.0).

## 1. Governance & Configuration
| Control ID | Standard Reference | Implementation Detail | Status |
| :--- | :--- | :--- | :--- |
| **AC-3** | NIST (Access Control) | Enforced Least Privilege via Django Permissions & IDOR fixes. | **COMPLETE** |
| **SC-8** | NIST (Transmission) | HSTS and SSL Redirects enforced in `settings.py`. | **COMPLETE** |
| **IA-2** | NIST (Identification) | Shortened JWT Access Token lifetimes (5 min) to mitigate replay. | **COMPLETE** |

## 2. PII Protection (Privacy Audit)
| Requirement | Standard | Implementation |
| :--- | :--- | :--- |
| **Data at Rest** | PCI-DSS 3.4 | Automated Fernet encryption in `User.save()` and `AccountOpeningRequest.save()`. |
| **Data in Logs** | NIST 800-122 | Account number masking (`...4321`) in `TransactionService` audit logs. |

## 3. Infrastructure & Resilience (White Team Findings)
| Finding | Risk | Remediation Plan | Status |
| :--- | :--- | :--- | :--- |
| **Root Execution** | High | Update `Dockerfile` to use non-root user `django`. | **PLANNED** |
| **Build Bloat** | Medium | Implement multi-stage builds to remove compiler tools (`gcc`) from production. | **PLANNED** |
| **Task Failure** | Medium | Add standardized retries with exponential backoff for fraud detection tasks. | **PLANNED** |
| **Log Rotation** | Low | Verify `LOGGING` config in `settings.py` for file rotation. | **REVIEWING** |

## 4. Operational SRE Logic
- **Self-Healing**: `entrypoint.sh` includes `wait_for_db` logic to prevent container crashes during DB cold starts.
- **Monitoring**: Sentry integration ensures real-time alerting for 500-series errors and task failures.
