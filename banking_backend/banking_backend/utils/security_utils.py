"""
Security utilities for safe logging and monitoring
"""

import logging
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def safe_log_auth_event(event_type, user_id=None, success=False, ip_address=None, extra_data=None):
    """
    Log authentication events without exposing sensitive data
    
    Args:
        event_type: Type of auth event (login, logout, password_reset, etc.)
        user_id: User ID (not email or username)
        success: Whether the event was successful
        ip_address: Client IP address
        extra_data: Additional non-sensitive data to log
    """
    log_data = {
        'event_type': event_type,
        'success': success,
        'timestamp': timezone.now().isoformat(),
    }
    
    if user_id:
        log_data['user_id'] = user_id
    
    if ip_address:
        log_data['ip_address'] = ip_address
    
    if extra_data:
        log_data.update(extra_data)
    
    if success:
        logger.info(f"Authentication event: {event_type}", extra=log_data)
    else:
        logger.warning(f"Failed authentication event: {event_type}", extra=log_data)


def safe_log_security_event(event_type, severity='info', user_id=None, details=None):
    """
    Log security events with appropriate severity
    
    Args:
        event_type: Type of security event
        severity: Log severity (info, warning, error, critical)
        user_id: User ID if applicable
        details: Non-sensitive details about the event
    """
    log_data = {
        'event_type': event_type,
        'timestamp': timezone.now().isoformat(),
    }
    
    if user_id:
        log_data['user_id'] = user_id
    
    if details:
        log_data['details'] = details
    
    log_method = getattr(logger, severity, logger.info)
    log_method(f"Security event: {event_type}", extra=log_data)


def sanitize_log_data(data):
    """
    Remove sensitive fields from data before logging
    
    Args:
        data: Dictionary of data to sanitize
        
    Returns:
        Sanitized dictionary
    """
    sensitive_fields = [
        'password', 'password_confirm', 'token', 'access', 'refresh',
        'email', 'ssnit_number', 'phone', 'address', 'secret', 'key'
    ]
    
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    for key, value in data.items():
        if any(field in key.lower() for field in sensitive_fields):
            sanitized[key] = '[REDACTED]'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value
    
    return sanitized


class SecurityEventMonitor:
    """Monitor and alert on security events"""
    
    # Thresholds for alerting
    FAILED_LOGIN_THRESHOLD = 5  # Failed logins from same IP in 15 minutes
    PRIVILEGE_ESCALATION_THRESHOLD = 3  # Attempts in 1 hour
    
    @staticmethod
    def check_failed_login_threshold(ip_address, count):
        """Check if failed login threshold exceeded"""
        if count >= SecurityEventMonitor.FAILED_LOGIN_THRESHOLD:
            safe_log_security_event(
                'failed_login_threshold_exceeded',
                severity='warning',
                details={
                    'ip_address': ip_address,
                    'count': count,
                    'threshold': SecurityEventMonitor.FAILED_LOGIN_THRESHOLD
                }
            )
            return True
        return False
    
    @staticmethod
    def log_privilege_escalation_attempt(user_id, attempted_action, current_role):
        """Log privilege escalation attempt"""
        safe_log_security_event(
            'privilege_escalation_attempt',
            severity='error',
            user_id=user_id,
            details={
                'attempted_action': attempted_action,
                'current_role': current_role
            }
        )
    
    @staticmethod
    def log_suspicious_api_access(user_id, endpoint, reason):
        """Log suspicious API access pattern"""
        safe_log_security_event(
            'suspicious_api_access',
            severity='warning',
            user_id=user_id,
            details={
                'endpoint': endpoint,
                'reason': reason
            }
        )
