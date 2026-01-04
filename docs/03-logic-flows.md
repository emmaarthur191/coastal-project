# Logic Flows

## Authentication Flow
Secure login process using JWTs in HTTP-Only cookies to prevent XSS credential theft.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Enter Credentials
    F->>B: POST /api/auth/login/
    B->>DB: Validate User & Password
    alt Valid
        DB-->>B: User Data
        B->>B: Generate Access & Refresh Tokens
        B-->>F: 200 OK (Set-Cookie: access, refresh)
        F->>U: Redirect to Dashboard
    else Invalid
        B-->>F: 401 Unauthorized
        F->>U: Show Error
    end
```

## Account Opening Workflow
Multi-step process requiring staff approval.

```mermaid
sequenceDiagram
    participant C as Customer/Cashier
    participant B as Backend
    participant M as Manager

    C->>B: POST /api/accounts/open/ (Photo + ID)
    B->>B: Validate Files & Data
    B->>B: Create AccountOpeningRequest (Status: Pending)
    B-->>C: 201 Created

    M->>B: GET /api/manager/approvals/
    B-->>M: List Pending Requests
    M->>B: POST /api/manager/approve/{id}/
    B->>B: Create Account Linked to User
    B->>B: Update Request Status -> Approved
    B-->>M: 200 OK
```
