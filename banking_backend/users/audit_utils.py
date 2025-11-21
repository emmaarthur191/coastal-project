import logging
import uuid
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from django.core.exceptions import SuspiciousOperation
from django.db import connection
from django.utils.html import strip_tags
import re
import json
from urllib.parse import urlparse, parse_qs

from .models import AuditLog, SecurityEvent, LoginAttempt

User = get_user_model()

# Configure logging
logger = logging.getLogger('banking_security')

# Common SQL injection patterns to detect
SQL_INJECTION_PATTERNS = [
    r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)',
    r'(\b(UNION|AND|OR)\b\s*\d+\s*=\s*\d+)',
    r"(\b(OR|AND)\b\s*['\"]?\s*\w+\s*['\"]?\s*=\s*['\"]?\w+['\"]?)",
    r"('\s*OR\s*'\s*=\s*')",
    r"('\s*UNION\s*SELECT)",
]

# Common XSS patterns
XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript:',
    r'on\w+\s*=',
    r'<iframe[^>]*>',
    r'<object[^>]*>',
    r'<embed[^>]*>',
]


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def detect_sql_injection(request_data):
    """Detect potential SQL injection attempts."""
    suspicious_patterns = []
    
    if isinstance(request_data, dict):
        data_str = json.dumps(request_data)
    else:
        data_str = str(request_data)
    
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, data_str, re.IGNORECASE):
            suspicious_patterns.append(pattern)
    
    return suspicious_patterns


def detect_xss(request_data):
    """Detect potential XSS attempts."""
    suspicious_patterns = []
    
    if isinstance(request_data, dict):
        data_str = json.dumps(request_data)
    else:
        data_str = str(request_data)
    
    for pattern in XSS_PATTERNS:
        if re.search(pattern, data_str, re.IGNORECASE):
            suspicious_patterns.append(pattern)
    
    return suspicious_patterns


def log_audit_event(user, action, request=None, description="", priority="medium", metadata=None, **kwargs):
    """
    Log an audit event for user activities.
    
    Args:
        user: User object or None
        action: Action type from ACTION_CHOICES
        request: Django request object (optional)
        description: Human-readable description
        priority: Priority level ('low', 'medium', 'high', 'critical')
        metadata: Additional metadata as dict
        **kwargs: Additional fields for the audit log
    """
    try:
        audit_log = AuditLog(
            user=user,
            action=action,
            priority=priority,
            description=description,
            metadata=metadata or {},
            **kwargs
        )
        
        if request:
            audit_log.ip_address = get_client_ip(request)
            audit_log.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Truncate to fit field
            audit_log.method = request.method
            audit_log.endpoint = request.path
            if request.GET:
                audit_log.query_params = json.dumps(dict(request.GET))
        
        audit_log.save()
        
        # If high priority or suspicious,  # also log as security event
        if priority in['high', 'critical'] or audit_log.is_suspicious:
            log_security_event(
                event_type='unauthorized_access',
                severity=priority,
                user=user,
                request=request,
                description=f"High priority audit event: {description}"
            )
        
        return audit_log
    except Exception as e:
        logger.error(f"Failed to log audit event: {e}")


def log_security_event(event_type, severity, user=None, request=None, description="", **kwargs):
    """
    Log a security event that requires immediate attention.
    
    Args:
        event_type: Type of security event
        severity: Severity level ('low', 'medium', 'high', 'critical')
        user: User object or None
        request: Django request object (optional)
        description: Description of the event
        **kwargs: Additional fields
    """
    try:
        security_event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            description=description,
            user=user,
            request_data=kwargs.get('request_data', {}),
            **kwargs
        )
        
        if request:
            security_event.ip_address = get_client_ip(request)
            security_event.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            if hasattr(request, 'stack_trace'):
                security_event.stack_trace = request.stack_trace
        
        security_event.save()
        
        # Send alert for critical events (in production, you'd integrate with alerting system)
        if severity == 'critical':
            logger.critical(f"CRITICAL SECURITY EVENT: {event_type} - {description}")
        
        return security_event
    except Exception as e:
        logger.error(f"Failed to log security event: {e}")


def log_login_attempt(email, ip_address, status, user=None, request=None, risk_factors=None):
    """
    Log a login attempt for security tracking.
    
    Args:
        email: Email used in login attempt
        ip_address: IP address of the attempt
        status: Status from STATUS_CHOICES
        user: User object if successful
        request: Django request object
        risk_factors: List of risk factors
    """
    try:
        login_attempt = LoginAttempt(
            email=email,
            ip_address=ip_address,
            status=status,
            user=user,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500] if request else None,
            risk_factors=risk_factors or []
        )
        
        # Risk scoring
        risk_score = 0
        if status in ['failure', 'blocked']:
            risk_score += 20
        if status == 'locked':
            risk_score += 50
        
        # Check for multiple failed attempts from same IP
        recent_failures = LoginAttempt.objects.filter(
            ip_address=ip_address,
            status='failure',
            timestamp__gte=timezone.now() - timezone.timedelta(minutes=30)
        ).count()
        
        if recent_failures > 5:
            risk_score += 30
            login_attempt.is_suspicious = True
        
        login_attempt.risk_score = risk_score
        login_attempt.save()
        
        return login_attempt
    except Exception as e:
        logger.error(f"Failed to log login attempt: {e}")


def sanitize_input(user_input):
    """Sanitize user input to prevent XSS and injection attacks."""
    if not user_input:
        return user_input
    
    # Remove HTML tags to prevent XSS
    cleaned = strip_tags(str(user_input))
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '&', '$']
    for char in dangerous_chars:
        cleaned = cleaned.replace(char, '')
    
    return cleaned


def validate_password_strength(password):
    """
    Validate password strength according to banking standards.
    Returns (is_valid, message, score)
    """
    score = 0
    issues = []
    
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    else:
        score += 20
    
    if not re.search(r'[a-z]', password):
        issues.append("Password must contain at least one lowercase letter")
    else:
        score += 15
    
    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain at least one uppercase letter")
    else:
        score += 15
    
    if not re.search(r'\d', password):
        issues.append("Password must contain at least one digit")
    else:
        score += 15
    
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not re.search(f'[{re.escape(special_chars)}]', password):
        issues.append("Password must contain at least one special character")
    else:
        score += 15
    
    # Check for common passwords
    common_passwords = [
        'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
        'password123', '123456789', 'abc123', 'password1'
    ]
    
    if password.lower() in common_passwords:
        issues.append("Password cannot be a commonly used password")
        score = 0
    elif password.lower().startswith('password'):
        issues.append("Password should not start with 'password'")
        score = max(0, score - 20)
    
    # Check for repeated characters
    if re.search(r'(.)\1{3,}', password):
        issues.append("Password should not contain 4 or more repeated characters")
        score = max(0, score - 10)
    
    # Check for sequential characters
    if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)', password.lower()):
        issues.append("Password should not contain sequential characters")
        score = max(0, score - 10)
    
    is_valid = len(issues) == 0
    message = "; ".join(issues) if issues else "Password meets all requirements"
    
    return is_valid, message, min(100, score)


def rate_limit_check(user, action, limit=5, window=300):
    """
    Check if user is within rate limits for a specific action.
    
    Args:
        user: User object
        action: Action being performed
        limit: Maximum number of actions allowed
        window: Time window in seconds
    
    Returns:
        tuple: (is_allowed, remaining_attempts, reset_time)
    """
    cache_key = f"rate_limit:{user.id}:{action}"
    
    # Get current count from cache
    current_count = cache.get(cache_key, 0)
    
    if current_count >= limit:
        # Calculate when the rate limit resets
        reset_time = cache.get(f"{cache_key}:reset", 0)
        return False, 0, reset_time
    
    # Increment count
    cache.set(cache_key, current_count + 1, window)
    cache.set(f"{cache_key}:reset", timezone.now().timestamp() + window, window)
    
    remaining = limit - (current_count + 1)
    return True, remaining, timezone.now().timestamp() + window


def check_suspicious_activity(user, ip_address, user_agent):
    """Analyze activity to detect suspicious patterns."""
    risk_factors = []
    risk_score = 0
    
    # Check for rapid successive actions
    recent_actions = AuditLog.objects.filter(
        user=user,
        timestamp__gte=timezone.now() - timezone.timedelta(minutes=5)
    ).count()
    
    if recent_actions > 20:
        risk_factors.append("High frequency of actions in short time")
        risk_score += 30
    
    # Check for unusual IP address
    user_ips = AuditLog.objects.filter(
        user=user,
        timestamp__gte=timezone.now() - timezone.timedelta(days=30)
    ).values_list('ip_address', flat=True).distinct()
    
    if ip_address not in user_ips and len(user_ips) > 0:
        risk_factors.append("Login from new IP address")
        risk_score += 20
    
    # Check for new user agent
    user_agents = AuditLog.objects.filter(
        user=user,
        timestamp__gte=timezone.now() - timezone.timedelta(days=30)
    ).values_list('user_agent', flat=True).distinct()
    
    if user_agent not in user_agents and user_agent and len(user_agents) > 0:
        risk_factors.append("Login from new device/browser")
        risk_score += 15
    
    # Check for impossible travel (if you have geo-location tracking)
    # This is a simplified example - in production you'd use proper geo-location services
    last_login = AuditLog.objects.filter(
        user=user,
        action='login'
    ).order_by('-timestamp').first()
    
    if last_login and last_login.ip_address != ip_address:
        # In a real system, you'd compare geo-locations and times
        risk_factors.append("Potential impossible travel")
        risk_score += 25
    
    return risk_factors, min(100, risk_score)


def clear_user_sessions(user):
    """Clear all active sessions for a user (useful for security incidents)."""
    # This would typically integrate with your session backend
    # For now, we'll just log the event
    log_audit_event(
        user=user,
        action='session_expired',
        description=f"All sessions cleared for user {user.email}",
        priority='high'
    )


def get_user_security_summary(user):
    """Get a summary of user's security status."""
    recent_failed_logins = LoginAttempt.objects.filter(
        user=user,
        status='failure',
        timestamp__gte=timezone.now() - timezone.timedelta(days=7)
    ).count()
    
    recent_login_attempts = LoginAttempt.objects.filter(
        user=user,
        timestamp__gte=timezone.now() - timezone.timedelta(days=7)
    ).count()
    
    suspicious_events = SecurityEvent.objects.filter(
        user=user,
        resolved=False,
        timestamp__gte=timezone.now() - timezone.timedelta(days=30)
    ).count()
    
    return {
        'failed_logins_7_days': recent_failed_logins,
        'total_login_attempts_7_days': recent_login_attempts,
        'unresolved_security_events': suspicious_events,
        'account_locked': user.is_account_locked() if hasattr(user, 'is_account_locked') else False,
        'last_login': user.last_login if hasattr(user, 'last_login') else None,
        'password_age_days': (timezone.now() - user.password_changed_at).days if hasattr(user, 'password_changed_at') else None
    }