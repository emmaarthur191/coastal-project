# Coastal Banking System

A full-stack banking application with a Django REST Framework backend and React frontend, designed for comprehensive banking operations including account management, transactions, loans, KYC processing, and fraud detection.

## Features

### Backend (Django REST Framework)
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Multi-role system (Member, Cashier, Mobile Banker, Manager, Operations Manager)
- **Banking Operations**: Account management, transactions, loans, and KYC processing
- **Operations Management**: Workflow management, field collections, and client KYC reviews
- **Security**: Encrypted sensitive data, audit logging, rate limiting
- **Monitoring**: Health checks, Prometheus metrics, structured logging
- **API Documentation**: Interactive Swagger UI and ReDoc documentation

### Frontend (React)
- **User Interface**: Modern React application with responsive design
- **Authentication**: Secure login/logout with JWT token management
- **Dashboard**: Role-based dashboards for different user types
- **Banking Operations**: Account management, transaction processing, loan applications
- **Real-time Updates**: WebSocket integration for real-time notifications
- **Security**: Protected routes and secure API communication

### Additional Features
- **Fraud Detection**: Advanced fraud detection engine with Redis-based rules
- **Performance Monitoring**: Comprehensive monitoring and alerting system
- **Docker Support**: Containerized deployment with Docker Compose
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Security Audits**: Regular security scanning and penetration testing

## Technology Stack

### Backend
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis for session and data caching
- **Message Queue**: Redis for background tasks
- **Monitoring**: Prometheus, Grafana
- **Documentation**: drf-spectacular (OpenAPI 3.0)

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: React Context API
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Real-time**: WebSockets

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Process Management**: Supervisor
- **CI/CD**: GitHub Actions
- **Deployment**: Render (Docker-based)

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd coastal
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/schema/swagger-ui/

### Manual Setup (Alternative)

#### Backend Setup
```bash
cd banking_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Documentation

The backend provides comprehensive API documentation:

- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
- **Raw Schema**: `http://localhost:8000/api/schema/`

## User Roles & Permissions

### Member
- View own accounts and transactions
- Apply for loans
- Update profile and notification settings

### Cashier
- Process deposits and withdrawals
- Disburse approved loans
- Process loan repayments
- Transfer funds between accounts

### Mobile Banker
- Submit KYC applications
- Collect field data
- Create member accounts

### Manager
- All member permissions
- Create and manage accounts
- View all transactions and accounts

### Operations Manager
- All manager permissions
- Approve/reject loan applications
- Review KYC applications
- Manage workflows and fee structures

## Deployment

### Production Deployment with Render

1. **Connect Repository**: Link your GitHub repository to Render
2. **Configure Service**:
   - Service Type: Docker
   - Dockerfile Path: `banking_backend/Dockerfile.prod`
   - Environment Variables: Configure production settings
3. **Database**: Set up PostgreSQL database on Render or external provider
4. **Redis**: Configure Redis instance for caching and queues
5. **Deploy**: Trigger deployment from GitHub pushes

### Environment Variables

Key environment variables for production:

```env
DEBUG=False
SECRET_KEY=<your-secret-key>
DATABASE_URL=<postgresql-url>
REDIS_URL=<redis-url>
ALLOWED_HOSTS=<your-domain>
CORS_ALLOWED_ORIGINS=<frontend-domain>
```

## Testing

### Backend Tests
```bash
cd banking_backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
cd banking_backend
python run_comprehensive_test.py
```

## Security

- JWT authentication with refresh tokens
- Role-based permissions
- Rate limiting (configurable per endpoint)
- Data encryption for sensitive fields
- Audit logging for all transactions
- CSRF protection
- HTTPS enforcement in production
- Secure headers (HSTS, XSS protection, etc.)
- Regular security audits and penetration testing

## Monitoring & Health Checks

- Health check: `GET /health/`
- System health: `GET /health/system/`
- Banking metrics: `GET /health/banking/`
- Prometheus metrics: `GET /metrics/`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run tests: `python manage.py test` (backend) and `npm test` (frontend)
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

### Development Guidelines
- Follow existing code structure and naming conventions
- Add comprehensive tests for new features
- Update API documentation for new endpoints
- Ensure all endpoints are properly secured with permissions
- Follow audit logging patterns for sensitive operations
- Use TypeScript for frontend components
- Maintain consistent styling with Tailwind CSS

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation for technical details
- Review the comprehensive testing and security reports in the docs folder

## Project Structure

```
coastal/
├── banking_backend/          # Django REST API backend
│   ├── banking_backend/      # Main Django project
│   ├── fraud_detection/      # Fraud detection module
│   ├── operations/           # Operations management
│   ├── users/                # User management
│   └── Dockerfile.prod       # Production Docker config
├── frontend/                 # React frontend application
│   ├── src/
│   ├── public/
│   └── Dockerfile            # Frontend Docker config
├── nginx/                    # Nginx configuration
├── docker-compose.yml        # Development compose
├── docker-compose.prod.yml   # Production compose
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Documentation and reports