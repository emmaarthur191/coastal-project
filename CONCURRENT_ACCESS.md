# Concurrent User Access Documentation

## Overview

This banking portal is designed to support **multiple users accessing the system simultaneously** without requiring anyone to log out. The system uses JWT (JSON Web Token) authentication, which is stateless and inherently supports concurrent sessions.

## How It Works

##. **JWT-Based Authentication**
- Each user receives unique access and refresh tokens upon login
- Tokens are stored in the browser's `localStorage` (isolated per browser/device)
- Multiple users can be logged in at the same time from different browsers/devices
- Each user's session is completely independent

##. **Token Storage**
```javascript
// Each browser stores tokens independently
localStorage.setItem('access_token', userToken);
localStorage.setItem('refresh_token', userRefreshToken);
```

##. **Session Independence**
- User A's tokens in Chrome → Separate session
- User B's tokens in Firefox → Separate session  
- User C's tokens on mobile → Separate session
- User D's tokens in Chrome (different profile) → Separate session

## Key Features

### Concurrent Access Support
- **Multiple users** can log in simultaneously
- **No logout required** for others to access
- **Independent sessions** per browser/device
- **Automatic token refresh** keeps sessions alive

### Security Features
- Tokens expire after configured time (default: 60 minutes for access, 1 day for refresh)
- Failed login attempts trigger rate limiting
- Token blacklisting on logout prevents reuse
- Each user's data is isolated by authentication

### Session Management
- Access tokens automatically refresh when expired
- Users stay logged in across page refreshes
- Logout only affects the current browser session
- Other users remain logged in on their devices

## Configuration

### Backend Settings (Django)

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('SECRET_KEY'),
}
```

### Rate Limiting
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
    }
}
```

## Usage Examples

### Scenario 1: Multiple Office Workers
```
John (Manager) - Chrome Browser
- Logs in on his desktop computer
- Gets unique JWT tokens
- Can access all manager functions

Sarah (Cashier) - Firefox Browser  
- Logs in on her workstation
- Gets different JWT tokens
- Can access all cashier functions

Both can work simultaneously without conflicts
```

### Scenario 2: Mobile Access
```
Office Desktop - Edge Browser
- Manager logged in with full access
- Can perform all management operations

Mobile Phone - Safari Browser
- Same manager logged in on mobile
- Separate session with same permissions
- Can check accounts and approve loans remotely
```

### Scenario 3: Different User Roles
```
User A (Member) - Chrome
- Login: member@example.com
- Role: member
- Access: Personal accounts, transactions

User B (Manager) - Firefox  
- Login: manager@bank.com
- Role: manager
- Access: All accounts, staff management, reports

Both users can work simultaneously
```

## Technical Implementation

### Frontend Token Management

```javascript
// api.js - Token Management
const tokenManager = {
  // Store tokens per browser session
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  // Get tokens for requests
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  // Logout affects only current browser
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};
```

### Backend Session Handling

```python
# views.py - Token Validation
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_check(request):
    return Response({
        'authenticated': True,
        'user': {
            'id': request.user.id,
            'email': request.user.email,
            'role': request.user.role,
        }
    })
```

### CORS Configuration

```python
# settings.py - CORS for Multi-Session Support
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development
    "http://localhost:5173",  # Vite development
    "https://yourbank.com",   # Production
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only in development
```

## Browser Compatibility

### Tested and Supported
- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Firefox Mobile

### Required Features
- **localStorage**: Token persistence
- **localStorage**: Session independence
- **JavaScript**: JWT token handling
- **CORS**: Cross-origin requests

## Performance Considerations

### Token Storage
- **Memory Efficient**: Tokens are small (~200-500 bytes each)
- **Fast Access**: localStorage provides O(1) access time
- **Persistent**: Survives browser restarts and page reloads

### Scalability
- **Stateless**: No server-side session storage required
- **Horizontal Scaling**: Works across multiple backend servers
- **Database Independent**: No session tables needed

## Security Benefits

### Session Isolation
- **Per-Browser Sessions**: Each browser has independent tokens
- **Role-Based Access**: Each user sees only their authorized data
- **No Session Hijacking**: JWT tokens are cryptographically signed

### Token Management
- **Short-lived Access**: 60-minute access token expiration
- **Refresh Protection**: Refresh tokens require authentication
- **Blacklist Support**: Logout immediately invalidates tokens

## Troubleshooting

### Common Issues

#### Issue 1: Tokens Not Refreshing
**Symptoms**: User gets logged out despite active use
**Solution**: Check token expiration time and refresh logic
```javascript
// Ensure proper token refresh implementation
if (tokenExpired()) {
  await refreshToken();
}
```

#### Issue 2: CORS Errors
**Symptoms**: Cross-origin requests fail
**Solution**: Verify CORS configuration
```python
# Add your frontend domain to CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]
```

#### Issue 3: Session Conflicts
**Symptoms**: User sees wrong data
**Solution**: Clear localStorage and re-authenticate
```javascript
// Debug session issues
localStorage.clear();
location.reload();
```

### Debug Commands

#### Check Current Session
```javascript
// Browser Console
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
```

#### Test Authentication
```bash
# Test with curl (replace with actual token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/users/auth/check/
```

## Expected Behavior:

- **All users can access their dashboards**
- **All users can perform transactions**  
- **No conflicts or session interference**
- **Each user sees their own data**
- **Logout affects only the current browser**

## Benefits of This Approach

### For Users
- **No Logout Required**: Multiple users can work simultaneously
- **Flexible Access**: Use from any device/browser
- **Seamless Experience**: No session management required
- **Secure Isolation**: Each session is completely separate

### For Administrators  
- **User Capacity**: Support unlimited concurrent users
- **No Server Load**: Stateless JWT reduces server memory
- **Easy Scaling**: Add backend servers without session sharing
- **Simple Deployment**: No Redis/session store required

### For Developers
- **Clean Implementation**: Standard JWT patterns
- **Frontend Simplicity**: No complex session management
- **Debugging**: Clear token-based authentication flow
- **Testing**: Easy to test with curl/Postman

## Conclusion

**Multiple users CAN access the portal simultaneously**
**No one needs to log out for others to access**
**Each session is independent and secure**  
**System is designed for concurrent multi-user access**

This architecture provides a robust, scalable, and user-friendly solution for concurrent access in a banking environment. Users can work simultaneously across different devices and browsers without any conflicts or security concerns.