# Banking Application - Login Credentials

## Test User Accounts

All test users have been created with the same password for easy testing.

### Common Password
```
Test123!@#
```

---

## User Accounts by Role

##. System Administrator / Manager
- **Email:** `admin@bankingapp.com`
- **Password:** `Test123!@#`
- **Role:** Manager
- **Permissions:** Full system access, can manage all accounts, view all transactions, create users

##. Cashier
- **Email:** `cashier@bankingapp.com`
- **Password:** `Test123!@#`
- **Role:** Cashier
- **Permissions:** Process deposits/withdrawals, disburse loans, process loan repayments, transfer funds

##. Mobile Banker
- **Email:** `mobile@bankingapp.com`
- **Password:** `Test123!@#`
- **Role:** Mobile Banker
- **Permissions:** Submit KYC applications, collect field data, create member accounts

##. Operations Manager
- **Email:** `ops@bankingapp.com`
- **Password:** `Test123!@#`
- **Role:** Operations Manager
- **Permissions:** Approve/reject loans, review KYC applications, manage workflows and fee structures

##. Member (Regular User)
- **Email:** `member@bankingapp.com`
- **Password:** `Test123!@#`
- **Role:** Member
- **Permissions:** View own accounts, apply for loans, update profile

---

## API Login

### Endpoint
```
POST http://localhost:8000/api/auth/login/
```

### Request Body
```json
{
  "email": "admin@bankingapp.com",
  "password": "Test123!@#"
}
```

### Example Response
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@bankingapp.com",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "manager",
    "is_active": true,
    "is_staff": true
  }
}
```

### Using the Access Token
Include the access token in the Authorization header for all subsequent API requests:
```
Authorization: Bearer <access-token>
```

---

## Frontend Login

If using the React frontend (running on `http://localhost:3000` or `http://localhost:5173`):

1. Navigate to the login page
2. Enter one of the email addresses above
3. Enter password: `Test123!@#`
4. Click "Login"

---

## Quick Test Commands

### Test Login via cURL
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bankingapp.com", "password": "Test123!@#"}'
```

### Test with Different Roles
```bash
# Manager
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bankingapp.com", "password": "Test123!@#"}'

# Cashier
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "cashier@bankingapp.com", "password": "Test123!@#"}'

# Member
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "member@bankingapp.com", "password": "Test123!@#"}'
```

---

## Recreating Test Users

If you need to recreate or reset the test users, run:

```bash
cd banking_backend
python manage.py create_test_users
```

This will update existing users or create new ones with the password `Test123!@#`.

---

## Security Notes

 **IMPORTANT:** These credentials are for **TESTING PURPOSES ONLY**. 

- Do NOT use these credentials in production
- Change all passwords before deploying to production
- Use strong, unique passwords for production accounts
- Enable additional security measures (2FA, IP restrictions, etc.) in production

---

## API Documentation

For complete API documentation, visit:
- **Swagger UI:** http://localhost:8000/api/schema/swagger-ui/
- **ReDoc:** http://localhost:8000/api/schema/redoc/

---

## Troubleshooting

### Cannot Login
1. Ensure the backend server is running: `python manage.py runserver`
2. Check that the database has been migrated: `python manage.py migrate`
3. Verify users exist: `python manage.py create_test_users`

### Invalid Credentials Error
- Double-check the email address (case-sensitive)
- Ensure password is exactly: `Test123!@#`
- Try recreating users with the management command

### Token Expired
- Request a new token by logging in again
- Use the refresh token to get a new access token

---

Last Updated: 2025-10-16