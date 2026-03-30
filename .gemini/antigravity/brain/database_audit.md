# Database Schema Audit: Redundancy Analysis

Following the `/debug` workflow, I have traced the model definitions across the codebase. I have identified significant redundancies that violate DRY (Don't Repeat Yourself) principles and create data integrity risks.

## 🚨 Critical Redundancies

### 1. Registration Models (Split Personality)
There are two nearly identical models for capturing new customer data:

| Feature | [AccountOpeningRequest](file:///e:/coastal/banking_backend/core/models/accounts.py#L65) | [ClientRegistration](file:///e:/coastal/banking_backend/core/models/operational.py#L398) |
|---|---|---|
| **App** | `core.accounts` | `core.operational` |
| **Usage** | General account opening | Mobile Banker submissions |
| **PII Data** | Name, DOB, Phone, ID, Email, Address | Name, DOB, Phone, ID, Email, Address |
| **Employment** | Occupation, Work Address, Position | Occupation, Work Address, Position |
| **Location** | Digital Address, Location | Digital Address, Location |
| **Next of Kin** | JSON field (encrypted) | JSON field (encrypted) |
| **Media** | `photo_encrypted` (Base64) | `id_document`, `passport_picture` (Files) |

**Diagnosis**: These models serve the same conceptual purpose but exist in different apps and have slightly different field implementations (Base64 vs FileField).
**Recommendation**: Unify into a single `Application` or `OnboardingRequest` model.

---

### 2. Messaging Proliferation
The system has **five** distinct ways to store messages:

1.  **[BankingMessage](file:///e:/coastal/banking_backend/core/models/messaging.py#L12)**: System-to-User notifications.
2.  **[Message / Thread](file:///e:/coastal/banking_backend/core/models/messaging.py#L56)**: Multi-participant conversations.
3.  **[ChatRoom / ChatMessage](file:///e:/coastal/banking_backend/core/models/messaging.py#L244)**: Real-time chat system.
4.  **[OperationsMessage](file:///e:/coastal/banking_backend/core/models/messaging.py#L202)**: Internal staff-to-staff tasks/notes.
5.  **[AdminNotification](file:///e:/coastal/banking_backend/users/models.py#L241)**: System alerts for admins.

**Diagnosis**: While the UIs differ, the underlying data structure is redundant.
**Recommendation**: Implement a base `AbstractMessage` or a unified `Communication` model with `type` flags.

---

### 3. Hardcoded Data Duplication (Integrity Risk)
**Model**: **[ClientAssignment](file:///e:/coastal/banking_backend/core/models/operational.py#L319)**

```python
class ClientAssignment(models.Model):
    client = models.ForeignKey(User, ...)
    client_name_encrypted = models.TextField(...) # REDUNDANT
    location_encrypted = models.TextField(...)    # REDUNDANT
```

**Diagnosis**: This model stores the client's name and location as encrypted strings even though it has a direct `ForeignKey` to the `User` model which *already* contains this data.
**Redundancy**: Line 392-395 manually copies data from the `User` object into these fields during `save()`. If a user's name changes in the `User` table, the `ClientAssignment` table becomes stale.

---

### 4. Overlapping Log Tables
The system maintains both **[UserActivity](file:///e:/coastal/banking_backend/users/models.py#L182)** (Auth events) and **[AuditLog](file:///e:/coastal/banking_backend/users/models.py#L212)** (Model changes). While slightly different in scope, they overlap on `ip_address`, `user`, and `created_at`.

---

## Technical Debt Summary
*   **Maintenance**: Changes to PII logic (like my recent encryption fix) must now be applied to 3+ different models individually.
*   **Storage**: Duplicate PII storage increases database size and backup complexity.
*   **Integrity**: Stale data in `ClientAssignment` can lead to errors in the mobile banker app.
