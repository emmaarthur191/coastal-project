# Copilot Instructions for AI Agents

## Project Overview
- **Monorepo** with Django REST backend (`banking_backend/`) and React+Vite frontend (`frontend/`).
- Backend supports role-based banking operations: user management, accounts, transactions, loans, KYC, and operational workflows.
- Key backend apps: `users`, `banking`, `transactions`, `operations` (each with models, serializers, views, permissions, and tests).
- Security: JWT auth, encryption, rate limiting, audit logging, CORS, and role-based permissions.

## Developer Workflows
- **Backend setup:**
  - `python -m venv venv && venv\Scripts\activate` (Windows)
  - `pip install -r requirements.txt`
  - `cp .env.example .env` and edit as needed
  - `python manage.py migrate && python manage.py loaddata fixtures/initial_data.json`
  - `python manage.py runserver`
- **Testing:**
  - Run all tests: `python manage.py test`
  - Some tests use both `unittest` and `pytest` styles (see `operations/tests.py`)
- **Linting/Formatting:**
  - `black .` and `isort .` for code style
- **Frontend:**
  - `cd frontend && npm install`
  - `npm run dev` (dev server)

## Project Conventions & Patterns
- **Role-based access:**
  - Permissions are enforced via custom permission classes (see `permissions.py` in each app)
  - User roles: member, cashier, mobile banker, operations manager, manager
- **Workflows:**
  - KYC and field operations use `Workflow` and `WorkflowStep` models (see `operations/`)
  - Tests for workflow logic are in `operations/tests.py` (both class-based and pytest)
- **API Structure:**
  - REST endpoints grouped by app and role (see `urls.py` in each app)
  - JWT endpoints: `/api/auth/login/`, `/api/auth/refresh/`, `/api/auth/logout/`
- **Data fixtures:**
  - Initial data in `fixtures/initial_data.json`
- **Environment:**
  - Sensitive settings via `.env` (see `.env.example`)

## Integration & External Dependencies
- **Docker:**
  - Use `docker-compose up -d` for production-like setup
  - Run migrations and seed data inside container: `docker-compose exec web python manage.py migrate`
- **PostgreSQL** (production), **SQLite** (dev default)
- **Redis** for caching (if enabled in settings)

## Key Files & Directories
- `banking_backend/README.md`: Full setup, API, and workflow docs
- `config/settings.py`: Environment, security, and app config
- `users/models.py`, `operations/models.py`: Custom user and workflow logic
- `operations/tests.py`: Example of both unittest and pytest test styles
- `requirements.txt`: All backend dependencies

---
For new patterns or unclear conventions, check `README.md` or ask for clarification.
