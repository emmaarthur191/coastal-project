# Coastal Banking System - Complete Blueprint

**Version**: 1.0  
**Last Updated**: December 2024  
**Purpose**: Complete reproduction guide for the Coastal Banking application

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Security Features](#7-security-features)
8. [Environment Configuration](#8-environment-configuration)
9. [Local Development Setup](#9-local-development-setup)
10. [Deployment](#10-deployment)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Monitoring & Observability](#12-monitoring--observability)

---

## 1. Project Overview

### 1.1 Description
Coastal Banking is a full-stack enterprise banking application designed for credit unions and community banks. It provides account management, transaction processing, loan management, fraud detection, and administrative dashboards.

### 1.2 Key Features
- **Account Management**: Daily Susu, Shares, Monthly Contribution accounts
- **Transaction Processing**: Deposits, withdrawals, transfers, payments
- **Loan Management**: Application, approval workflow, repayment tracking
- **Fraud Detection**: Rule-based alerts, real-time monitoring
- **Cash Drawer Management**: Cashier operations, denominations tracking
- **Real-time Messaging**: WebSocket-based chat system
- **Security**: Account lockout, audit logging, activity tracking
- **Reporting**: PDF/CSV generation, dashboards

### 1.3 User Roles
| Role | Access Level |
|------|--------------|
| Customer | View accounts, transactions, request services |
| Cashier | Process transactions, manage cash drawer |
| Mobile Banker | Field operations, customer onboarding |
| Manager | Full dashboard, user management, approvals |
| Operations Manager | System configuration, reports |
| Administrator | Full system access, user administration |

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│   Nginx Proxy   │────▶│  Django Backend │
│  (Vite + TS)    │     │   (SSL Term)    │     │  (Daphne/ASGI)  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
               │                 │              │                 │              │                 │
               │   PostgreSQL    │              │      Redis      │              │     Celery      │
               │   (Database)    │              │  (Cache/Pub)    │              │   (Task Queue)  │
               │                 │              │                 │              │                 │
               └─────────────────┘              └─────────────────┘              └─────────────────┘
```

### 2.2 Component Communication
- **Frontend → Backend**: REST API via Axios with JWT authentication
- **Real-time**: WebSocket via Django Channels + Redis
- **Background Tasks**: Celery with Redis broker
- **Caching**: Redis for session and API response caching

---

## 3. Technology Stack

### 3.1 Backend (Python 3.12)

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Django | 5.1 |
| REST API | Django REST Framework | Latest |
| WebSocket | Django Channels | Latest |
| ASGI Server | Daphne | Latest |
| Task Queue | Celery | Latest |
| Database | PostgreSQL | 16 |
| Cache/Broker | Redis | 7 |
| Authentication | JWT (SimpleJWT) | Latest |
| API Docs | drf-spectacular | Latest |
| Security | django-csp, cryptography | Latest |
| Monitoring | Sentry, django-prometheus | Latest |

### 3.2 Frontend (Node 20+)

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18.2 |
| Build Tool | Vite | 7.2 |
| Language | TypeScript | 5.9 |
| State Management | TanStack Query | 5.90 |
| HTTP Client | Axios | 1.13 |
| Styling | TailwindCSS | 3.4 |
| Charts | Recharts | 3.4 |
| Error Tracking | Sentry | 10.26 |

### 3.3 Infrastructure

| Category | Technology |
|----------|------------|
| Container | Docker |
| Orchestration | Kubernetes / Docker Compose |
| CI/CD | GitHub Actions |
| PaaS | Render.com |
| CDN/Proxy | Nginx |
| SSL | Let's Encrypt (cert-manager) |

---

## 4. Project Structure

```
coastal/
├── banking_backend/           # Django Backend
│   ├── config/               # Django settings, ASGI, URLs
│   │   ├── settings.py       # Main configuration
│   │   ├── asgi.py          # ASGI application
│   │   ├── routing.py       # WebSocket routing
│   │   ├── celery.py        # Celery configuration
│   │   └── urls.py          # URL routing
│   ├── core/                 # Main banking app
│   │   ├── models.py        # Account, Transaction, Loan, etc.
│   │   ├── views.py         # API ViewSets
│   │   ├── serializers.py   # DRF Serializers
│   │   ├── services.py      # Business logic
│   │   ├── consumers.py     # WebSocket consumers
│   │   └── urls.py          # Core API routes
│   ├── users/                # User management app
│   │   ├── models.py        # User, UserActivity, AuditLog
│   │   ├── views.py         # Auth, profile views
│   │   ├── serializers.py   # User serializers
│   │   └── urls.py          # User routes
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile           # Container definition
│   ├── entrypoint.sh        # Startup script
│   └── build.sh             # Render build script
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── manager/     # Manager dashboard sections
│   │   │   ├── cashier/     # Cashier components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   ├── package.json         # NPM dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── Dockerfile           # Development container
│   ├── Dockerfile.prod      # Production (nginx)
│   └── nginx.conf           # Nginx configuration
├── k8s/                      # Kubernetes manifests
│   ├── backend.yaml         # Backend deployment
│   ├── frontend.yaml        # Frontend deployment
│   ├── postgres.yaml        # Database StatefulSet
│   ├── redis.yaml           # Redis deployment
│   ├── ingress.yaml         # Ingress rules
│   ├── secret.yaml          # Secrets template
│   ├── configmap.yaml       # ConfigMap
│   ├── pdb.yaml             # PodDisruptionBudget
│   └── networkpolicy.yaml   # Network policies
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml       # Deployment pipeline
│   │   ├── main.yml         # CI pipeline
│   │   └── dependabot-auto-merge.yml
│   └── dependabot.yml       # Auto-update config
├── docs/                     # Documentation
├── docker-compose.yml        # Local orchestration
├── render.yaml              # Render.com blueprint
└── README.md
```

---

## 5. Database Schema

### 5.1 Core Models

#### User (Custom AbstractUser)
```python
- id: PK
- email: EmailField (unique, login identifier)
- role: CharField (customer, cashier, mobile_banker, manager, operations_manager, admin)
- phone_number: CharField
- staff_id: CharField
- failed_login_attempts: PositiveInteger
- locked_until: DateTime
- daily_transaction_limit: Decimal
- daily_transaction_total: Decimal
```

#### Account
```python
- id: PK
- user: FK → User
- account_number: CharField (unique)
- account_type: CharField (daily_susu, shares, monthly_contribution)
- balance: Decimal
- is_active: Boolean
- created_at: DateTime
```

#### Transaction
```python
- id: PK
- from_account: FK → Account
- to_account: FK → Account (nullable)
- transaction_type: CharField (deposit, withdrawal, transfer, payment, fee)
- amount: Decimal
- status: CharField (pending, completed, failed, cancelled)
- reference: CharField
- description: TextField
- timestamp: DateTime
- processed_at: DateTime
```

#### Loan
```python
- id: PK
- user: FK → User
- amount: Decimal
- interest_rate: Decimal
- term_months: Integer
- status: CharField (pending, approved, active, paid_off, defaulted, rejected)
- approved_by: FK → User
- approved_at: DateTime
```

#### FraudAlert
```python
- id: PK
- alert_type: CharField
- severity: CharField (low, medium, high, critical)
- description: TextField
- transaction: FK → Transaction
- is_resolved: Boolean
- resolved_at: DateTime
```

### 5.2 Supporting Models
- `UserActivity`: Login/logout tracking
- `AuditLog`: Model change tracking
- `ServiceCharge`: Configurable fees
- `ServiceRequest`: Customer requests
- `CashDrawer`: Cashier operations
- `CheckDeposit`: Check processing
- `Complaint`: Customer complaints
- `MessageThread` / `Message`: Chat system

---

## 6. API Endpoints

### 6.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/auth/login/` | User login (returns JWT) |
| POST | `/api/users/auth/logout/` | User logout |
| POST | `/api/users/auth/token/refresh/` | Refresh JWT token |
| GET | `/api/users/auth/check/` | Check auth status |
| POST | `/api/users/auth/password/change/` | Change password |

### 6.2 Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/` | List user accounts |
| POST | `/api/accounts/` | Create account |
| GET | `/api/accounts/{id}/` | Get account details |
| GET | `/api/accounts/{id}/statement/` | Generate statement |
| GET | `/api/accounts/{id}/transactions/` | Account transactions |

### 6.3 Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/` | List transactions |
| POST | `/api/transactions/` | Create transaction |
| POST | `/api/transactions/deposit/` | Deposit |
| POST | `/api/transactions/withdrawal/` | Withdrawal |
| POST | `/api/transactions/transfer/` | Transfer |

### 6.4 Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans/` | List loans |
| POST | `/api/loans/` | Apply for loan |
| POST | `/api/loans/{id}/approve/` | Approve loan |
| POST | `/api/loans/{id}/reject/` | Reject loan |
| POST | `/api/loans/{id}/make_payment/` | Make payment |

### 6.5 Security/Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/dashboard/` | Audit dashboard |
| GET | `/api/users/auth/login-attempts/` | Login attempts |
| GET | `/api/fraud/alerts/` | Fraud alerts |
| GET | `/api/users/sessions/` | Active sessions |

---

## 7. Security Features

### 7.1 Authentication
- **JWT Tokens**: Access (15min) + Refresh (7 days) in httpOnly cookies
- **CSRF Protection**: Double-submit cookie pattern
- **Account Lockout**: 5 failed attempts → 30-minute lock

### 7.2 Authorization
- **Role-Based Access**: Permissions per user role
- **Object-Level**: Users can only access their own resources
- **Transaction Limits**: Daily limits per user

### 7.3 Data Protection
- **Password Hashing**: Argon2 (Django default)
- **Encryption**: Sensitive data encrypted at rest
- **Input Validation**: Serializer-level validation
- **XSS Prevention**: DOMPurify, CSP headers
- **SQL Injection**: ORM parameterized queries

### 7.4 Monitoring
- **Audit Logging**: All model changes tracked
- **Activity Tracking**: Login/logout, key actions
- **Fraud Detection**: Rule-based alerts
- **Sentry**: Error tracking and performance

---

## 8. Environment Configuration

### 8.1 Backend Environment Variables

```bash
# Django
SECRET_KEY=<generate-secure-key>
DEBUG=false
ALLOWED_HOSTS=.onrender.com,localhost

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379/1

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com

# Sentry (Optional)
SENTRY_DSN=https://key@sentry.io/project

# Admin User (First Run)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password

# SMS/OTP (Sendexa)
SENDEXA_API_URL=https://api.sendexa.com
SENDEXA_API_KEY=your-key
SENDEXA_AUTH_TOKEN=your-token
SENDEXA_SENDER_ID=COASTAL
```

### 8.2 Frontend Environment Variables

```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_SENTRY_DSN=https://key@sentry.io/project
VITE_SENTRY_ENABLED=true
```

---

## 9. Local Development Setup

### 9.1 Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Git

### 9.2 Backend Setup

```bash
# Clone repository
git clone https://github.com/your-org/coastal.git
cd coastal/banking_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or: conda activate coastal_cu_env

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your local settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver 0.0.0.0:8000
```

### 9.3 Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 9.4 Docker Compose (Full Stack)

```bash
cd coastal

# Start all services
docker compose up --build

# Access:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/api/docs
```

---

## 10. Deployment

### 10.1 Render.com Deployment

1. Push code to GitHub
2. Create new Blueprint in Render Dashboard
3. Select repository and `render.yaml`
4. Render auto-provisions: Backend, Frontend, Redis, PostgreSQL
5. Set secret environment variables in Dashboard

### 10.2 Kubernetes Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (populate first!)
kubectl apply -f k8s/secret.yaml

# Deploy all services
kubectl apply -f k8s/

# Check status
kubectl get pods -n banking-app
kubectl get ingress -n banking-app
```

---

## 11. CI/CD Pipeline

### 11.1 Workflow: `main.yml` (CI)
- Trigger: Push/PR to `main`, `develop`
- Steps: Lint, Test (with PostgreSQL + Redis), Type check

### 11.2 Workflow: `deploy.yml` (CD)
- Trigger: Push to `main` or manual dispatch
- Steps:
  1. Run tests
  2. Build Docker images
  3. Push to GitHub Container Registry
  4. Deploy to staging (auto) or production (manual)
  5. Blue-green deployment for production
  6. Health check verification

### 11.3 Dependabot
- Weekly checks for: pip, npm, GitHub Actions, Docker
- Auto-merge: Patch updates
- Auto-approve: Minor updates

---

## 12. Monitoring & Observability

### 12.1 Health Checks
- Backend: `GET /api/health/`
- Frontend: `GET /health`

### 12.2 Metrics (django-prometheus)
- Endpoint: `/metrics`
- Collects: Request latency, DB queries, Cache hits

### 12.3 Error Tracking (Sentry)
- Automatic error capture
- Performance monitoring
- Session replay

### 12.4 Logging
- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Audit logs stored in database

---

## 📎 Appendix

### A. Quick Commands

```bash
# Run tests
cd banking_backend && pytest

# Generate API schema
python manage.py spectacular --file schema.yml

# Create migration
python manage.py makemigrations

# Celery worker
celery -A config worker -l info

# Load test
locust -f locustfile.py --host=http://localhost:8000
```

### B. Key Files Reference
- Settings: `banking_backend/config/settings.py`
- URLs: `banking_backend/config/urls.py`
- Core Models: `banking_backend/core/models.py`
- User Models: `banking_backend/users/models.py`
- API Views: `banking_backend/core/views.py`
- Frontend Entry: `frontend/src/App.tsx`
- Auth Context: `frontend/src/context/AuthContext.jsx`

### C. Related Documentation
- [Database ERD](./database_erd.md)
- [Technical Documentation](./technical_documentation.md)
- [User Manual](./user_manual.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

---

*Document generated for Coastal Banking System v1.0*
