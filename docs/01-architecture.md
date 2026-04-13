# System Architecture

## High-Level Overview
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS.
  - *Role*: SPA for Customer and Staff interactions.
  - *Server*: Node 22 (Web Service) using `server.js` for secure API/WS proxying.
- **Backend**: Django 5.x, Django REST Framework (DRF).
  - *Role*: API provider, business logic, security enforcement.
  - *Server*: Gunicorn (WSGI) + Daphne (ASGI) with Uvicorn workers.
- **Database**:
  - *Development*: SQLite.
  - *Production*: PostgreSQL 18 (Managed on Render).
- **Authentication**: JWT (JSON Web Tokens) cross-platform via HttpOnly, Secure cookies.

## Deployment Topology (Render)

```mermaid
graph TD
    User[User Device] -->|HTTPS / mTLS| LB[Load Balancer]
    LB -->|/api| Backend[Django Service (Node 22 Container)]
    LB -->|/*| Frontend[Node Web Service - Vite SPA]
    
    Backend -->|Read/Write| DB[(PostgreSQL 18)]
    Backend -->|Async/Cache| Redis[(Redis Stack)]
    Backend -->|Outbound SMS| Sendexa[Sendexa API]
    Backend -->|Error Tracking| Sentry[Sentry]
    Backend -->|Metrics| Prometheus[Prometheus]
    Backend -->|Tasks| Celery[Celery Worker]
    Celery -->|Read/Write| DB
    Celery -->|Queue| Redis

    Secrets[/etc/secrets/] -->|Injected at startup| Backend

    subgraph "Internal Network"
        Backend
        DB
        Redis
        Celery
    end
```
