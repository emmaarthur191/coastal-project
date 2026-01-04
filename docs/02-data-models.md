# Data Architecture (ERD)

## Core Models
- **User**: Custom user model with role-based attributes (`customer`, `cashier`, `manager`, etc.).
- **Account**: Financial accounts (`daily_susu`, `savings`) linked to Users.
- **Transaction**: Records of funds movement (`deposit`, `withdrawal`, `transfer`).
- **AccountOpeningRequest**: Workflow model for new account approvals.

## Entity Relationship Diagram
```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ AccountOpeningRequest : "submits/reviews"
    User ||--o{ Transaction : "initiates/processes"
    Account ||--o{ Transaction : "source/destination"
    Account ||--o{ AccountClosureRequest : "has"

    User {
        int id
        string email
        string role "customer, cashier, manager..."
        datetime last_login
    }

    Account {
        int id
        string account_number
        string account_type
        decimal balance
        bool is_active
    }

    Transaction {
        int id
        string transaction_type "deposit, withdrawal..."
        decimal amount
        string status "pending, completed..."
        datetime timestamp
    }

    AccountOpeningRequest {
        int id
        string status "pending, approved..."
        string id_type
        string id_number
    }
```
