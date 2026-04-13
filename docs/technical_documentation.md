# Coastal Banking System - Technical Architecture & Documentation

## 1. System Overview
The Coastal Banking System is a modern, full-stack web application designed for banking operations management. It features a secure Django backend coupled with a responsive, glassmorphism-styled React frontend. The system supports multiple user roles (Managers, Cashiers, Operations) and facilitates core banking activities like transaction processing, loan management, staff communication, and audit logging.

## 2. Technology Stack

### Backend
-   **Framework**: Django 6.0 & Django REST Framework (DRF)
-   **Language**: Python 3.12+
-   **Real-time**: Django Channels & Daphne (ASGI) for WebSockets (Chat/Notifications)
-   **Database**: PostgreSQL 16 (on Render) / SQLite (Dev)
-   **Caching**: Redis Stack (Session, Channels, Idempotency)
-   **Authentication**: JWT via `simplejwt` stored in **HttpOnly, Secure, SameSite=Strict** cookies.
-   **Encryption**: Fernet AES-128-CBC + HMAC-SHA256 (PII Protection)
-   **Documentation**: DRF Spectacular (OpenAPI 3.0)

### Frontend
-   **Framework**: React 18 (Vite)
-   **Language**: TypeScript 5.x
-   **Styling**: Vanilla CSS + Tailwind CSS (Glassmorphism Core)
-   **State Management**: React Context (`AuthContext`, `ThemeContext`, `SocketContext`).
-   **Routing**: React Router DOM v6.
-   **Icons**: Material Icons / FontAwesome.

## 3. Architecture & Logic

### 3.1. Authentication & Security
-   **JWT Flow**: Secure cookie-based session management.
    -   `access` and `refresh` tokens are stored in `HttpOnly` cookies.
    -   **4-Eyes Principle (Maker-Checker)**: Enforced via `clean()` validation at the model level for all high-value mutations (Transactions > GHS 5k, Account Openings, Closures).
    -   **Zero-Plaintext PII**: AES encryption for Names/IDs + Blind Indexing (HMAC-SHA256) for secure searching.
    -   **mTLS Enforcement**: Mandatory Client Certificates for administrative endpoints.
    -   **RBAC**: Role-Based Access Control enforced via DRF permissions.

### 3.2. Core Banking Logic
-   **Accounts**: Balances are dynamically calculated using **ACID-compliant ledger aggregation**. The `balance` field acts as a high-speed cache, verified against `calculated_balance` before closures.
-   **Transactions**: Atomic processing of `deposit`, `withdrawal`, `transfer`, and `reversed` statuses. Fixed-point decimal math (Decimal128) prevents floating-point inaccuracies.
-   **Loans**: Multi-stage workflow with automated interest calculation and Maker-Checker disbursal.
-   **Cash Management**: `CashDrawer` sessions with denomination-level tracking and discrepancy alerting.
-   **Idempotency**: `X-Idempotency-Key` requirement on all financial mutation endpoints to prevent double-spending.

### 3.3. Real-time Communication
-   **WebSockets**: Implemented using `Django Channels`.
-   **Messaging**: `MessageThread` and `Message` models support staff-to-staff and system-to-staff communication.
-   **Notifications**: The `AdminNotification` system pushes alerts (security, fraud, system info) to connected clients instantly via WebSockets.

## 4. Entity Relationship Diagram (ERD) Description

The database schema is organized around the **User** and **Account** central entities.

### Key Relationships:

1.  **User Management**
    -   `User` (Custom Model): The central identity.
        -   `1:N` -> `UserActivity` (Login logs)
        -   `1:N` -> `AuditLog` (Action logs)
        -   `1:N` -> `Device` (Authorized devices)

2.  **Financial Operations**
    -   `Account` belongs to `User`.
        -   `1:N` -> `Transaction` (as `sender` or `receiver`).
        -   `1:N` -> `CheckDeposit`.
    -   `Loan` belongs to `User`.
    -   `Refund` links to `User` and optional `Transaction`.
    -   `ServiceRequest` represents customer requests (statements, closures).

3.  **Cashier Operations**
    -   `CashDrawer` belongs to `Cashier` (User).
        -   `1:N` -> `CashDrawerDenomination` (Breakdown of bills/coins).
    -   `CashAdvance` links `User` (requestor) and `Manager` (approver).

4.  **Communication**
    -   `MessageThread` has `M:N` relationship with `User` (participants).
    -   `Message` belongs to `MessageThread` and `Sender`.
    -   `Complaint` belongs to `User` (customer) and `Staff` (resolver).

## 5. Directory Structure
```
/banking_backend
  /config         # Project settings, URL routing, ASGI/WSGI config
  /core           # Main banking business logic (Models, Views, Serializers)
  /users          # User management, Authentication, Permissions
  /manage.py      # Django entry point

/frontend
  /src
    /assets       # Static images/logos
    /components   # Reusable UI components (GlassCard, Button, Inputs)
      /layout     # DashboardLayout, Sidebar
      /manager    # Manager-specific sections
      /cashier    # Cashier-specific sections
      /mobile     # Field Banker components
    /context      # React Context (Auth, Theme)
    /pages        # Top-level route pages (Dashboard, Login)
    /services     # API integration (axios instances)
  /tailwind.config # Theme configuration
```
