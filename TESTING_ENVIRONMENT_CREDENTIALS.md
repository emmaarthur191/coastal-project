# Banking Application - Complete Testing Environment Credentials

##  SECURITY NOTICE - TESTING ENVIRONMENT ONLY 
This document contains credentials for **TESTING AND DEVELOPMENT PURPOSES ONLY**. These credentials should NEVER be used in production environments.

**Generated on:** 2025-11-19T18:11:11.083Z
**Environment:** Testing/Development
**Last Updated:** 2025-12-05
**Status:** ✅ ACTIVE - Credentials restored and functional

---

##  AUTHENTICATION SYSTEM - RESTRICTED ACCESS

###  IMPORTANT: Restricted Authentication System
The banking application has been configured with a **SECURITY-RESTRICTED AUTHENTICATION SYSTEM** that limits login access to only the designated test user for enhanced security testing and controlled access.

### Primary Test Account (ONLY WORKING CREDENTIALS)
- **Username:** `test@example.com`
- **Email:** `test@example.com`
- **Password:** `SecureTest123!@#`
- **Role:** Operations Manager
- **User ID:** UUID format
- **Permissions:**
  - Full system access equivalent to Operations Manager
  - Can approve/reject loan applications
  - Can review and process KYC applications
  - Can manage workflows and approval processes
  - Can configure fee structures
  - Can access all operational reports
  - Can monitor system performance
  - Can manage all banking operations
  - Has access to all API endpoints
  - Can create and manage other users (with proper backend modifications)

### Authentication Restrictions
- **ONLY** the `test@example.com` user can authenticate through the API
- All other user accounts in the database are inactive for security purposes
- The authentication system requires proper email format validation
- Both API and web interface are restricted to authorized users only

### Account Status
- **Total users in database:** 8 active test users (7 role-based + 1 operations manager)
- **Active authentication:** All test users login functional ✅
- **Security level:** High - designed to prevent unauthorized access during testing
- **Last credential restoration:** 2025-12-05

---

##  COMPREHENSIVE ROLE-BASED TEST CREDENTIALS

### Overview
The testing environment now includes comprehensive test users for all banking system roles. Each user has secure, randomly generated passwords and proper email format validation.

### Test User Credentials by Role

#### 👤 Customer User
- **Email:** `customer@test.com`
- **Password:** `p6DwYgeGgYgqSKb8`
- **Role:** Customer
- **Name:** John Customer
- **Permissions:** Basic customer operations (view accounts, transfer funds, pay bills)

#### 💰 Cashier User
- **Email:** `cashier@test.com`
- **Password:** `MaERQBieIHZ!htt^`
- **Role:** Cashier
- **Name:** Sarah Cashier
- **Permissions:** Transaction processing, customer service, basic account inquiries

#### 📱 Mobile Banker User
- **Email:** `mobile@test.com`
- **Password:** `ytc@t9p33#iXLQp8`
- **Role:** Mobile Banker
- **Name:** Mike Mobile
- **Permissions:** Remote customer service, mobile transactions, secure remote access

#### 👔 Manager User
- **Email:** `manager@test.com`
- **Password:** `X*PhuE%$zOifN7HG`
- **Role:** Manager
- **Name:** David Manager
- **Permissions:** Team supervision, workflow approval, performance tracking

#### ⚙️ Operations Manager User (Primary Test Account)
- **Email:** `test@example.com`
- **Password:** `SecureTest123!@#`
- **Role:** Operations Manager
- **Name:** Test User
- **Permissions:** Full operational oversight, reporting, system analytics

#### 🔧 Operations Manager User (Secondary)
- **Email:** `ops@test.com`
- **Password:** `pSSyiKopj&5C9TVf`
- **Role:** Operations Manager
- **Name:** Lisa Operations
- **Permissions:** Full operational oversight, reporting, system analytics

#### 👑 Administrator User
- **Email:** `admin@test.com`
- **Password:** `$NcExxO2GcUjrNg9`
- **Role:** Administrator
- **Name:** Robert Admin
- **Permissions:** Full system access, user management, configuration settings

#### 🚀 Superuser
- **Email:** `super@test.com`
- **Password:** `4%jxP!peJp!*$dNU`
- **Role:** Superuser
- **Name:** Alice Super
- **Permissions:** Unlimited system access, bypass restrictions, emergency access

---

##  ROLE-BASED ACCESS CONTROL TESTING

### Permission Hierarchy
The system implements a hierarchical permission structure:

```
Superuser (6) > Administrator (5) > Operations Manager (4) > Manager (3) >
Mobile Banker (2) > Cashier (1) > Customer (0)
```

### Testing Scenarios

#### Successful Login Testing
```bash
# Test all roles can login successfully
curl -X POST http://127.0.0.1:8001/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com", "password": "p6DwYgeGgYgqSKb8"}'
# Expected: HTTP 200 with JWT tokens

curl -X POST http://127.0.0.1:8001/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "super@test.com", "password": "4%jxP!peJp!*$dNU"}'
# Expected: HTTP 200 with JWT tokens
```

#### Failed Login Testing
```bash
# Test invalid credentials are rejected
curl -X POST http://127.0.0.1:8001/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid@test.com", "password": "wrongpassword"}'
# Expected: HTTP 500 with authentication error
```

#### Role-Based Endpoint Access Testing
```bash
# Get access token for customer user first
TOKEN=$(curl -s -X POST http://127.0.0.1:8001/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com", "password": "p6DwYgeGgYgqSKb8"}' | jq -r '.access')

# Test customer can access basic endpoints
curl -X GET http://127.0.0.1:8001/api/users/member-dashboard/ \
  -H "Authorization: Bearer $TOKEN"
# Expected: HTTP 200 (customer has access)

# Test customer cannot access admin endpoints
curl -X GET http://127.0.0.1:8001/api/users/staff/ \
  -H "Authorization: Bearer $TOKEN"
# Expected: HTTP 403 (insufficient permissions)
```

---

##  TESTING WORKFLOW EXAMPLES

### Complete Role-Based Testing Flow

1. **Authentication Testing**
   - Login with each role's credentials
   - Verify JWT token generation
   - Test token refresh functionality

2. **Permission Testing**
   - Test role-specific endpoint access
   - Verify permission hierarchies work correctly
   - Test access denied scenarios

3. **Security Testing**
   - Test invalid login attempts
   - Verify account lockout mechanisms
   - Test session management

4. **Integration Testing**
   - Test complete workflows for each role
   - Verify data consistency across roles
   - Test cross-role interactions

---

##  SECURITY FEATURES VERIFICATION

### Password Security
- All passwords are 16 characters long
- Include uppercase, lowercase, digits, and special characters
- Meet banking security standards

### Account Security
- Failed login attempt tracking
- Account lockout after multiple failures
- Session management and fingerprinting

### Access Control
- Role-based permissions
- Hierarchical access structure
- API endpoint protection

---

##  MAINTENANCE NOTES

### Password Updates
To regenerate passwords for all test users:
```bash
cd banking_backend
python manage.py create_role_users --force
```

### User Management
- All test users have active status by default
- Users can be deactivated/reactivated through admin interface
- Passwords can be changed through standard Django auth

### Database Cleanup
To remove all test users (except primary operations manager):
```bash
# Use Django shell to selectively delete users
python manage.py shell -c "
from users.models import User
# Delete role-based test users but keep primary
User.objects.filter(email__in=[
    'customer@test.com', 'cashier@test.com', 'mobile@test.com',
    'manager@test.com', 'ops@test.com', 'admin@test.com', 'super@test.com'
]).delete()
"
```

---

##  COMPREHENSIVE TESTING CHECKLIST

### Authentication Testing ✅
- [x] All 8 test users can login successfully
- [x] Invalid credentials are properly rejected
- [x] JWT tokens are generated correctly
- [x] Token refresh works for all roles

### Role-Based Access Control ✅
- [x] Customer role has limited access
- [x] Cashier role can process transactions
- [x] Manager role has supervisory access
- [x] Operations Manager has full operational access
- [x] Administrator has system configuration access
- [x] Superuser has unlimited access

### Security Testing ✅
- [x] Password complexity requirements met
- [x] Email format validation enforced
- [x] Failed login attempts tracked
- [x] Account security features active

### Integration Testing ✅
- [x] All roles can perform their designated functions
- [x] Cross-role interactions work correctly
- [x] Data consistency maintained across roles

---

**⚠️ SECURITY WARNING:** These credentials are for TESTING PURPOSES ONLY. Never use these accounts or passwords in production environments. All passwords are randomly generated and should be regenerated before each major testing cycle.

**Last Updated:** 2025-12-05
**Total Test Users:** 8
**All Credentials:** Active and Functional ✅

---

##  API CONFIGURATION

##  API CONFIGURATION

### Base URLs
- **Backend API:** `http://localhost:8000/api/`
- **Frontend Development:** `http://localhost:3000` or `http://localhost:5173`
- **Admin Interface:** `http://localhost:8000/admin/`

### API Authentication Endpoints

###. User Login (RESTRICTED TO AUTHORIZED USERS ONLY)
```
POST http://localhost:8000/api/users/auth/login/
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "SecureTest123!@#"
}
```

**Successful Response:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "role": "operations_manager",
    "is_active": true,
    "is_staff": true
  }
}
```

**Failed Response (Invalid credentials):**
```json
{
  "detail": "No active account found with the given credentials."
}
```

###. Token Refresh
```
POST http://localhost:8000/api/users/auth/token/refresh/
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

###. Auth Check
```
GET http://localhost:8000/api/users/auth/check/
Authorization: Bearer <access-token>
```

###. Logout
```
POST http://localhost:8000/api/users/auth/logout/
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

##  SECURITY KEYS & TOKENS

### JWT Configuration
- **Algorithm:** HS256
- **Access Token Lifetime:** 60 minutes (default)
- **Refresh Token Lifetime:** 1 day (default)
- **Signing Key:** Uses Django SECRET_KEY

### Development Security Keys (DO NOT USE IN PRODUCTION)
```
SECRET_KEY=django-insecure-development-key-must-be-changed-in-production
ENCRYPTION_KEY=<auto-generated-32-byte-base64-key>
ENCRYPTION_SALT=<auto-generated-16-byte-base64-key>
JWT_SIGNING_KEY=<auto-generated-32-byte-base64-key>
API_AUTH_KEY=<auto-generated-32-byte-base64-key>
SESSION_KEY=<auto-generated-64-byte-base64-key>
```

### Environment Variables for Testing
```bash
# Django Settings
DEBUG=True
ENVIRONMENT=development
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
DATABASE_URL=sqlite:///path/to/banking_backend/db.sqlite3

# CORS (Allow frontend development server)
CORS_ALLOW_ALL_ORIGINS=True
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
CORS_ALLOW_CREDENTIALS=True

# CSRF
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001

# Rate Limiting (Relaxed for testing)
ANON_RATE_LIMIT=100/hour
USER_RATE_LIMIT=1000/hour

# Email (Console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

---

##  FRONTEND CONFIGURATION

### Environment Variables for Frontend
```bash
# API Configuration
VITE_API_URL=http://localhost:8000/api/
VITE_DEV_API_URL=http://localhost:8000/api/
VITE_API_TIMEOUT=30000

# Development Settings
NODE_ENV=development
VITE_DEBUG_API=true

# Feature Flags
VITE_ENABLE_PRODUCTION_FEATURES=false
```

### Token Storage
- **Method:** Secure cookies (HttpOnly, SameSite=Strict)
- **Fallback:** localStorage (development only)
- **Refresh:** Automatic token refresh on expiration

---

##  TESTING COMMANDS

##. Test Login via cURL (AUTHORIZED USER ONLY)

#### Successful Test User Login
```bash
curl -X POST http://127.0.0.1:8001/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecureTest123!@#"}'
```

#### Failed Login Attempts (for testing restrictions)
```bash
# This will fail - invalid credentials
curl -X POST http://127.0.0.1:8001/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid@example.com", "password": "wrongpassword"}'

# Response: {"detail": "No active account found with the given credentials."}
```

##. Test Authenticated Request
```bash
# Replace <access-token> with the token from login response
curl -X GET http://localhost:8000/api/users/member-dashboard/ \
  -H "Authorization: Bearer <access-token>"
```

##. Test Token Refresh
```bash
# Replace <refresh-token> with the refresh token from login response
curl -X POST http://localhost:8000/api/users/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh-token>"}'
```

##. Create Test Users
```bash
cd banking_backend
python manage.py shell < scripts/create_test_users.py
```

##. Generate Production Keys
```bash
cd banking_backend
python generate_production_keys.py
```

---

##  API ENDPOINTS BY ROLE

### Public Endpoints (No Authentication Required)
```
POST /api/users/auth/login/
POST /api/users/auth/register/
POST /api/users/auth/token/refresh/
GET  /api/health/
GET  /api/schema/
```

### Manager/Admin Endpoints
```
GET    /api/users/staff/
POST   /api/users/create/
POST   /api/users/deactivate-staff/
POST   /api/users/reactivate-staff/
GET    /api/operations/metrics/
GET    /api/transactions/
GET    /api/banking/loans/pending/
GET    /api/operations/cash-flow/
POST   /api/operations/calculate-interest/
GET    /api/operations/commissions/summary/
GET    /api/operations/expenses/
POST   /api/operations/generate-payslip/
POST   /api/operations/generate-report/
POST   /api/banking/generate-statement/
```

### Staff Endpoints (Cashier, Mobile Banker, Operations Manager)
```
GET    /api/users/member-dashboard/
GET    /api/banking/accounts/
GET    /api/transactions/
POST   /api/transactions/
GET    /api/banking/loans/
POST   /api/banking/loans/
POST   /api/operations/service-charges/
GET    /api/operations/branch-activity/
GET    /api/operations/workflow-status/
```

### Member Endpoints
```
GET    /api/users/member-dashboard/
GET    /api/banking/account-summary/
GET    /api/banking/accounts/
GET    /api/transactions/
POST   /api/banking/loans/
```

---

##  ACCESS LEVELS & PERMISSIONS MATRIX

### Current Active User (test@example.com)
| Feature | Test User (Operations Manager Role) |
|---------|-------------------------------------|
| **User Management** |  Full (with backend modifications) |
| **Loan Processing** |  Full - Approve/Reject |
| **Transactions** |  Full - View All, Process |
| **KYC Processing** |  Full - Review and Process |
| **Reports** |  Full - All operational reports |
| **Settings** |  Full - System configuration |
| **System Admin** |  Full - Complete system access |

### Testing Approach for Restricted System

Since the authentication is restricted to authorized users only, testing should focus on:

1. **API Endpoint Testing** - Use test credentials to test all endpoints
2. **Role-Based Access Control** - Verify that operations manager permissions work correctly
3. **Security Testing** - Confirm that invalid login attempts are properly blocked
4. **End-to-End Testing** - Use test user to test complete workflows
5. **Data Testing** - Verify that all database operations work with proper authentication

### Authentication Status Verification
```bash
# Test successful authentication ✅ WORKING
curl -X POST "http://127.0.0.1:8001/api/users/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecureTest123!@#"}'

# Expected response: JWT tokens + user data ✅ CONFIRMED

# Test failed authentication (security verification)
curl -X POST "http://127.0.0.1:8001/api/users/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid@example.com", "password": "wrongpassword"}'

# Expected response: {"detail": "No active account found with the given credentials."}
```

---

##  TESTING DATA

### Sample Account Numbers (Encrypted in Database)
- Savings Account: `encrypted:test_1234567890123456`
- Checking Account: `encrypted:test_0987654321098765`
- Loan Account: `encrypted:test_1111111111111111`

### Sample Transaction Data
- Initial Deposit: $500.00
- ATM Withdrawal: -$100.00
- Loan Payment: $450.00 (Principal: $400.00, Interest: $50.00)

### Test Loan Applications
- Amount: $5,000.00
- Term: 12 months
- Interest Rate: 10.00%
- Purpose: Home improvement

---

##  DEVELOPMENT SETUP

##. Backend Setup
```bash
cd banking_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py create_test_users
python manage.py runserver 8000
```

##. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

##. Database Access
- **Development DB:** SQLite (`banking_backend/db.sqlite3`)
- **Admin Interface:** `http://localhost:8000/admin/`
- **API Documentation:** 
  - Swagger UI: `http://localhost:8000/api/schema/swagger-ui/`
  - ReDoc: `http://localhost:8000/api/schema/redoc/`

---

##  TROUBLESHOOTING

### Common Issues

###. Cannot Login
**Symptoms:** 401 Unauthorized or invalid credentials error
**Solutions:**
- Ensure backend server is running: `python manage.py runserver`
- Check database migration: `python manage.py migrate`
- Recreate test users: `python scripts/create_test_users.py`
- Verify email format (case-sensitive)

###. Token Expiration
**Symptoms:** 401 errors on authenticated requests
**Solutions:**
- Tokens automatically refresh, but if issues persist:
- Clear browser cookies/localStorage
- Log out and log back in
- Check token refresh endpoint: `/api/users/auth/token/refresh/`

###. CORS Errors
**Symptoms:** Cross-origin request blocked
**Solutions:**
- Ensure CORS_ALLOWED_ORIGINS includes your frontend URL
- Check CSRF_TRUSTED_ORIGINS configuration
- Verify frontend is running on expected port

###. Database Connection Issues
**Symptoms:** Database errors or migration issues
**Solutions:**
- Run migrations: `python manage.py migrate`
- Check database file permissions
- Verify DATABASE_URL in environment variables

###. Permission Denied Errors
**Symptoms:** 403 Forbidden on role-specific endpoints
**Solutions:**
- Verify user role in database
- Check authentication token is valid
- Ensure user has required permissions for endpoint

### Debug Commands

#### Check User Roles
```bash
python manage.py shell -c "
from users.models import User;
for user in User.objects.all():
    print(f'{user.email}: {user.role}')
"
```

#### Test Database Connection
```bash
python manage.py dbshell
```

#### View Application Logs
```bash
tail -f banking_backend/logs/app.log
tail -f banking_backend/logs/security.log
```

---

##  MONITORING & LOGGING

### Log Files Location
- **Application Logs:** `banking_backend/logs/app.log`
- **Security Logs:** `banking_backend/logs/security.log`
- **Transaction Logs:** `banking_backend/logs/transactions.log`

### Log Levels
- **INFO:** Normal operations
- **WARNING:** Potential issues
- **ERROR:** Failed operations
- **SECURITY:** Authentication and authorization events

### Performance Monitoring
- **Prometheus Metrics:** Available at `/metrics/`
- **Health Checks:** Available at `/health/`
- **API Response Times:** Logged in application logs

---

##  PRODUCTION MIGRATION CHECKLIST

Before moving to production, ensure:

- [ ] Replace all test passwords with secure production passwords
- [ ] Generate new production security keys using `generate_production_keys.py`
- [ ] Update SECRET_KEY to a secure random value
- [ ] Set DEBUG=False
- [ ] Configure proper ALLOWED_HOSTS
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Configure email backend (SMTP)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure proper CORS origins (HTTPS only)
- [ ] Set up monitoring (Sentry, Prometheus, etc.)
- [ ] Review and update rate limiting settings
- [ ] Configure Content Security Policy
- [ ] Set up proper file storage (AWS S3, etc.)
- [ ] Configure backup strategies
- [ ] Review audit logging settings
- [ ] Test production deployment in staging environment

---

##  SUPPORT INFORMATION

### Getting Help
1. **Application Issues:** Check logs in `banking_backend/logs/`
2. **Authentication Issues:** Verify test credentials and user creation
3. **API Issues:** Test endpoints using provided cURL commands
4. **Database Issues:** Check migration status and database connectivity
5. **Permission Issues:** Verify user roles in admin interface

### Documentation References
- **API Documentation:** `/api/schema/swagger-ui/`
- **Admin Interface:** `/admin/`
- **Project README:** `banking_backend/README.md`
- **Production Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`

---

** REMEMBER: This documentation is for TESTING PURPOSES ONLY. Never use these credentials in production environments.**

**End of Testing Environment Credentials Documentation**