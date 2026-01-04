# System Architecture

## High-Level Overview
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS.
  - *Role*: SPA for Customer and Staff interactions.
  - *Proxy*: Vite Proxies API requests in dev to localhost:8000.
- **Backend**: Django 5.x, Django REST Framework (DRF).
  - *Role*: API provider, business logic, security enforcement.
  - *Server*: Gunicorn (WSGI) + Daphne (ASGI) for WebSockets.
- **Database**:
  - *Development*: SQLite.
  - *Production*: PostgreSQL 16 (on Render).
- **Authentication**: JWT (JSON Web Tokens) stored in HTTP-Only cookies.

## Deployment Topology (Render)

```mermaid
graph TD
    User[User Device] -->|HTTPS| LB[Load Balancer]
    LB -->|/api| Backend[Django Service (Gunicorn/Daphne)]
    LB -->|/*| Frontend[React Static Site]

    Backend -->|Read/Write| DB[(PostgreSQL)]
    Backend -->|Async/Cache| Redis[(Redis Stack)]
    Backend -->|SMS| Sendexa[Sendexa API]

    subgraph "Internal Network"
    Backend
    DB
    Redis
    end
```
