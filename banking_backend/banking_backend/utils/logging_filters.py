"""
Secure logging filters to prevent sensitive data exposure in logs.
"""

import logging
import re
from typing import Any, Dict


class SensitiveDataFilter(logging.Filter):
    """
    Logging filter that sanitizes sensitive information from log records.
    """

    # Patterns for sensitive data that should be redacted
    SENSITIVE_PATTERNS = [
        # Account numbers (various formats)
        (r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b', '[ACCOUNT_NUMBER_REDACTED]'),
        (r'\b\d{10,16}\b', '[ACCOUNT_NUMBER_REDACTED]'),  # General account numbers

        # Credit card numbers
        (r'\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b', '[CARD_NUMBER_REDACTED]'),

        # Email addresses
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]'),

        # Phone numbers
        (r'\b\+?[\d\s\-\(\)]{10,15}\b', '[PHONE_REDACTED]'),

        # JWT tokens
        (r'eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+', '[JWT_TOKEN_REDACTED]'),

        # API keys and secrets
        (r'\b[A-Za-z0-9]{32,}\b', '[API_KEY_REDACTED]'),  # Generic long alphanumeric strings

        # Passwords (case insensitive)
        (r'password["\s]*:[\s"]*[^"\s,]+', 'password: [REDACTED]', re.IGNORECASE),
        (r'"password"[\s]*:[\s"]*[^"]*"', '"password": "[REDACTED]"', re.IGNORECASE),

        # Tokens and secrets
        (r'token["\s]*:[\s"]*[^"\s,]+', 'token: [REDACTED]', re.IGNORECASE),
        (r'secret["\s]*:[\s"]*[^"\s,]+', 'secret: [REDACTED]', re.IGNORECASE),
        (r'key["\s]*:[\s"]*[^"\s,]+', 'key: [REDACTED]', re.IGNORECASE),

        # Database connection strings
        (r'postgresql://[^:]+:[^@]+@', 'postgresql://[USER]:[PASSWORD]@'),
        (r'mysql://[^:]+:[^@]+@', 'mysql://[USER]:[PASSWORD]@'),
        (r'sqlite:///.*', 'sqlite:///[REDACTED]'),

        # IP addresses (optional - may be needed for security logs)
        # (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP_REDACTED]'),
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter log record to sanitize sensitive data.
        """
        # Sanitize the log message
        if hasattr(record, 'getMessage'):
            original_msg = record.getMessage()
            sanitized_msg = self._sanitize_message(original_msg)
            record.msg = sanitized_msg
            record.args = ()  # Clear args since we modified msg

        # Sanitize any extra data in the record
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if isinstance(value, str):
                    record.__dict__[key] = self._sanitize_message(value)
                elif isinstance(value, dict):
                    record.__dict__[key] = self._sanitize_dict(value)

        return True

    def _sanitize_message(self, message: str) -> str:
        """
        Sanitize a log message by redacting sensitive patterns.
        """
        if not isinstance(message, str):
            return str(message)

        sanitized = message
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            flags = re.IGNORECASE if len(pattern) == 3 and isinstance(pattern[2], int) else 0
            if isinstance(pattern, tuple):
                pattern, replacement, flags = pattern
            sanitized = re.sub(pattern, replacement, sanitized, flags=flags)

        return sanitized

    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively sanitize dictionary values.
        """
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = self._sanitize_message(value)
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_message(item) if isinstance(item, str)
                    else self._sanitize_dict(item) if isinstance(item, dict)
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized


class SecureJSONFormatter(logging.Formatter):
    """
    JSON formatter that ensures sensitive data is sanitized.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.filter = SensitiveDataFilter()

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as sanitized JSON.
        """
        # Apply sensitive data filter
        self.filter.filter(record)

        # Create log entry
        log_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                             'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                             'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                             'thread', 'threadName', 'processName', 'process', 'message']:
                    log_entry[f'extra_{key}'] = value

        # Convert to JSON string
        import json
        return json.dumps(log_entry, default=str, ensure_ascii=False)


class SecurityEventFormatter(logging.Formatter):
    """
    Specialized formatter for security events with enhanced context.
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        Format security events with additional context.
        """
        # Apply sensitive data filter
        filter = SensitiveDataFilter()
        filter.filter(record)

        # Enhanced security event format
        security_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'event_type': 'security_event',
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'security_context': {
                'user_id': getattr(record, 'user_id', None),
                'ip_address': getattr(record, 'ip_address', None),
                'user_agent': getattr(record, 'user_agent', None),
                'endpoint': getattr(record, 'endpoint', None),
                'method': getattr(record, 'method', None),
                'session_id': getattr(record, 'session_id', None),
            }
        }

        # Add exception info if present
        if record.exc_info:
            security_entry['exception'] = self.formatException(record.exc_info)

        # Convert to JSON string
        import json
        return json.dumps(security_entry, default=str, ensure_ascii=False)