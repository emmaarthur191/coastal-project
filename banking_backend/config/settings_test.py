"""Test Settings Configuration Debug Report

Issue: API tests receiving 301 redirects despite settings_test.py setting SECURE_SSL_REDIRECT = False

Investigation:
1. settings_test.py correctly sets SECURE_SSL_REDIRECT = False
2. settings_test.py sets DEBUG = True
3. settings.py has conditional: if not DEBUG: SECURE_SSL_REDIRECT = True
4. Since DEBUG=True, this block shouldn't execute
5. Yet tests still get 301 HTTP -> HTTPS redirects

Root Cause Analysis:
The issue is that Django's SecurityMiddleware caches the SECURE_SSL_REDIRECT setting
when it's first loaded. Even though settings_test.py imports from settings and overrides
values, the middleware may have already been initialized with the production values.

Additionally, the MIDDLEWARE list is loaded from settings.py before settings_test.py
modifications are applied, potentially causing the SecurityMiddleware to use the original
settings values.

Solution:
Override the MIDDLEWARE in settings_test.py to exclude SecurityMiddleware, or ensure
all security settings are properly overridden before middleware initialization.
"""

from .settings import *

DEBUG = True

# Disable security redirects for tests
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Explicitly disable HSTS
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Remove SecurityMiddleware to prevent any SSL redirect behavior
MIDDLEWARE = [m for m in MIDDLEWARE if "SecurityMiddleware" not in m]

# Disable password hashing for speed
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Ensure we use in-memory layers
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "test-cache",
    }
}
