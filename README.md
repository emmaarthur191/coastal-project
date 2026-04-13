# Coastal Banking System
 
![CI Pipeline](https://github.com/emmaarthur191/coastal-project/actions/workflows/main.yml/badge.svg)
![Production Deployment](https://github.com/emmaarthur191/coastal-project/actions/workflows/deploy.yml/badge.svg)
 
A secure, modern banking application for Coastal Credit Union, built with Django (DRF) and React.
 
## 📚 Documentation
> **[Full Project Documentation](docs/index.md)**
- [System Architecture](docs/01-architecture.md)
- [Data Models & ERD](docs/02-data-models.md)
- [Infrastructure & Config](docs/06-infrastructure.md)
 
## Project Structure
 
- **`banking_backend/`**: Django REST Framework backend.
- **`frontend/`**: React + TypeScript frontend (Vite).
- **`scripts/`**: Utility scripts for migration and provisioning.
 
## Setup Instructions
 
### Prerequisites
- Python 3.12+ (Render standard)
- Node.js 22+ (LTS)
- PostgreSQL & Redis
 
### Backend Setup
1. Navigate to backend: `cd banking_backend`
2. Configure Environment: `conda activate coastal_cu_env` (or create with Python 3.12).
3. Install: `pip install -r requirements.txt`
4. Database Setup: `python manage.py migrate` followed by `python smart_migrate.py`.
5. Run: `python manage.py runserver`
 
### Frontend Setup
1. Navigate to frontend: `cd frontend`
2. Install: `npm install --legacy-peer-deps`
3. Run: `npm run dev`
 
## Deployment (Render)
 
1. Connect this repository to Render.
2. Render will automatically detect `render.yaml`.
3. Ensure the following secrets are set in the Render Dashboard:
   - `SECRET_KEY`, `FIELD_ENCRYPTION_KEY`, `PII_HASH_KEY`
   - `DATABASE_URL`, `REDIS_URL`
   - `RENDER_DEPLOY_HOOK_URL` (for GitHub Actions integration)
 
## Security
 
This project follows strict **Zero-Plaintext** protocols. All PII data is encrypted at rest using `cryptography` and is searchable only via salted SHA-256 hashes.
 
See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.
 
## Testing
 
- **Backend CI**: `pytest` (Standard) or `python manage.py test` (Smoke)
- **Frontend CI**: `npm run test`
- **Security Audit**: `bandit -r banking_backend/`
