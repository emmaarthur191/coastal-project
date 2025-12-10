"""
Security middleware for enhanced authentication and session management.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from rest_framework.throttling import AnonRateThrottle

class LoginThrottle(AnonRateThrottle):
    """
    Rate limiting for login attempts to prevent brute force attacks.
    """
    rate = '10/minute'  # 10 login attempts per minute
    scope = 'login'

def csrf_protect_view(view_func):
    """
    Apply CSRF protection to a view function.
    """
    return method_decorator(csrf_protect, name='dispatch')(view_func)

def csrf_exempt_view(view_func):
    """
    Exempt a view from CSRF protection (use sparingly).
    """
    return method_decorator(csrf_exempt, name='dispatch')(view_func)