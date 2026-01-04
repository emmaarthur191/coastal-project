# Coastal Banking System - Technical Architecture & Documentation

## 1. System Overview
The Coastal Banking System is a modern, full-stack web application designed for banking operations management. It features a secure Django backend coupled with a responsive, glassmorphism-styled React frontend. The system supports multiple user roles (Managers, Cashiers, Operations) and facilitates core banking activities like transaction processing, loan management, staff communication, and audit logging.

## 2. Technology Stack

### Backend
-   **Framework**: Django 5.1 & Django REST Framework (DRF)
-   **Language**: Python 3.12+
-   **Real-time**: Django Channels & Daphne (ASGI) for WebSockets (Chat/Notifications)
-   **Database**: SQLite (Development) / PostgreSQL (Production ready)
-   **Caching & Broker**: Redis (for Channels layer and caching)
-   **Authentication**: JWT (JSON Web Tokens) via `djangorestframework-simplejwt` stored in secure HttpOnly cookies.
-   **Documentation**: DRF Spectacular (OpenAPI/Swagger)

### Frontend
-   **Framework**: React 18 (Vite)
-   **Language**: TypeScript / JavaScript
-   **Styling**: Tailwind CSS with custom "Glassmorphism" theme (bg-blur, semi-transparent panels).
-   **State Management**: React Context (`AuthContext`, `ThemeContext`).
-   **Routing**: React Router DOM.
-   **Icons**: Material Icons / Emojis (lightweight approach).

## 3. Architecture & Logic

### 3.1. Authentication & Security
-   **JWT Flow**: The system uses a secure cookie-based JWT flow.
    -   `access` token (short-lived) and `refresh` token (long-lived) are stored in `HttpOnly` cookies to prevent XSS attacks.
    -   **Middleware**: Custom middleware validates tokens and handles checking/refreshing logic transparently.
    -   **MFA/OTP**: High-privilege actions or new device logins can trigger SMS OTP verification via the `Sendexa` integration.
    -   **RBAC**: The `User` model has a `role` field. API permissions (`IsAuthenticated`, custom role permissions) enforce access at the viewsets level.

### 3.2. Core Banking Logic
-   **Accounts**: The `Account` model tracks balances. Balances are calculated dynamically (`calculated_balance` property) by aggregating `completed` incoming vs. outgoing transactions to ensure data integrity and avoid race conditions.
-   **Transactions**: All money movements are recorded as `Transaction` records. Statuses (`pending`, `completed`, `failed`) control the lifecycle. Atomic transactions (database transactions) are used during processing to ensure ledger consistency.
-   **Loans**: Loan applications go through a workflow: Application -> Pending Review -> Approval (Manager) -> Disbursal -> Repayment.
-   **Cash Management**: Cashiers have `CashDrawer` sessions. They must "Open" a drawer, record denominations, process transactions, and "Close/Reconcile" the drawer at end of shift. Variances are tracked.

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
