# Coastal Banking System

A secure, modern banking application for Coastal Credit Union, built with Django (DRF) and React.

## 📚 Documentation
> **[Full Project Documentation](docs/index.md)**
- [System Architecture](docs/01-architecture.md)
- [Data Models & ERD](docs/02-data-models.md)
- [Infrastrucure & Config](docs/06-infrastructure.md)

## Project Structure

- **`banking_backend/`**: Django REST Framework backend.
- **`frontend/`**: React + TypeScript frontend (Vite).
- **`scripts/`**: Utility scripts.

## Setup Instructions

### Prerequisites
- Python 3.9+ (Anaconda recommended)
- Node.js 16+

### Backend Setup
1. Navigate to backend: `cd banking_backend`
2. Create environment: `conda create -n coastal_cu_env python=3.9`
3. Activate: `conda activate coastal_cu_env`
4. Install dependencies: `pip install -r requirements.txt` (Create if missing)
5. Configure `.env`: Copy `.env.example` (monitor for keys).
6. Migrate: `python manage.py migrate`
7. Run: `python manage.py runserver`

### Frontend Setup
1. Navigate to frontend: `cd frontend`
2. Install: `npm install`
3. Build: `npm run build`
4. Run Dev: `npm run dev`

## Security Notes
- **SECRET_KEY**: Must be set in production `.env`.
- **Debug**: Set `DEBUG=False` in production.
- **HTTPS**: Required for secure cookie handling.

## Testing
- Backend: `pytest` or `python manage.py test`
- Frontend: `npm run test`
