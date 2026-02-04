import os
import threading
from urllib.parse import urlparse

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Initialize environment variables
env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

# =============================================================================
# Sentry Error Monitoring (Production)
# =============================================================================
# Set SENTRY_DSN in environment to enable error tracking
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN and not env.bool("DEBUG", default=False):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style="url",
                middleware_spans=True,
            ),
            LoggingIntegration(
                level=None,  # Capture all logs
                event_level="ERROR",  # Send ERROR and above as events
            ),
        ],
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
        traces_sample_rate=0.1,  # 10% for production
        # Send user information for errors
        send_default_pii=False,  # Disable for banking security
        # Environment tag
        environment="production" if not env.bool("DEBUG", default=False) else "development",
        # Release version tracking
        release=env("APP_VERSION", default="1.0.0"),
        # Before send hook to add correlation ID
        before_send=lambda event, hint: (
            event.get("tags", {}).update(
                {"correlation_id": getattr(getattr(threading, "local", lambda: None)(), "correlation_id", "NO_ID")}
            )
            or event
        ),
    )

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: don't run with debug turned on in production!
# Defaults to False for fail-safe production deployments
DEBUG = env.bool("DEBUG", default=False)

# SECURITY FIX: Enforce SECRET_KEY in production - no default allowed
# In development (DEBUG=True), allow insecure default for convenience
if DEBUG:
    SECRET_KEY = env("SECRET_KEY", default="django-insecure-test-key-for-dev-and-ci-use-only")
else:
    # In production, this will raise ImproperlyConfigured if SECRET_KEY is not set
    SECRET_KEY = env("SECRET_KEY")

# SECURITY: Field-level encryption key for PII (GDPR/PCI-DSS compliance)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
if DEBUG:
    FIELD_ENCRYPTION_KEY = env("FIELD_ENCRYPTION_KEY", default="dev-only-insecure-key-32bytes!")
else:
    # In production, this will raise ImproperlyConfigured if not set
    FIELD_ENCRYPTION_KEY = env("FIELD_ENCRYPTION_KEY")

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Application definition

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "corsheaders",  # CORS support for frontend
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "django_prometheus",
    "django_filters",
    "channels",
    # Local apps
    "core",
    "users.apps.UsersConfig",  # Use full config for signal loading
    "csp",  # Content Security Policy
]

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "core.middleware.LogCorrelationMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # Moved after SecurityMiddleware as requested
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "csp.middleware.CSPMiddleware",  # Replace XFrameOptionsMiddleware with CSP
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware', # Removed in favor of CSP
    "django_prometheus.middleware.PrometheusAfterMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ASGI application
ASGI_APPLICATION = "config.asgi.application"

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {"default": env.db("DATABASE_URL", default="sqlite:///db.sqlite3")}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(env("REDIS_HOST", default="localhost"), 6379)],
        },
    },
}

# Enforce SSL for Database in Production
# Make SSL mode configurable via environment variable
if not DEBUG:
    db_config = DATABASES["default"]
    if db_config.get("ENGINE") != "django.db.backends.sqlite3":
        db_sslmode = env("DB_SSLMODE", default="prefer")
        db_config.setdefault("OPTIONS", {})["sslmode"] = db_sslmode

# Connection Pooling for Production Performance
# Reuse database connections to reduce overhead
if not DEBUG:
    conn_max_age = env.int("CONN_MAX_AGE", default=600)  # 10 minutes
    DATABASES["default"]["CONN_MAX_AGE"] = conn_max_age

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# WhiteNoise storage for static files
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# WhiteNoise Cache Configuration
# Hashed static files get 1 year max-age (safe due to content hashing)
WHITENOISE_MAX_AGE = 31536000  # 1 year in seconds

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# =============================================================================
# File Upload Security Settings
# =============================================================================
# Prevent disk exhaustion attacks and enforce upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB for form data
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB for file uploads
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000  # Prevent form field DoS

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model
AUTH_USER_MODEL = "users.User"

# Django REST Framework
# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.authentication.JWTCookieAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    # =========================================================================
    # Throttling Configuration - Production Security Best Practice
    # =========================================================================
    # Prevents brute-force attacks, API abuse, and DDoS
    # Uses Redis cache backend (already configured)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # General rate limits
        "anon": "100/hour",  # Anonymous users: 100 requests per hour
        "user": "1000/hour",  # Authenticated users: 1000 requests per hour
        # Authentication endpoint limits (critical security)
        "login": "5/m",  # Login: 5 attempts per minute (brute-force protection)
        "otp_verify": "36/h",  # OTP verification: 36 attempts per hour (approx 3 per 5 mins)
        "otp_request": "3/hour",  # OTP request: 3 per hour (SMS spam prevention)
        "password_reset": "3/hour",  # Password reset: 3 per hour (enumeration prevention)
        "registration": "3/hour",  # Registration: 3 per hour (spam account prevention)
        "token_refresh": "10/min",  # Token refresh: 10 per minute
    },
}


# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    # SECURITY HARDENING (2026 Standards: NIST 800-63B, OAuth 2.1)
    # Short-lived access tokens minimize the window for stolen token abuse
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    # Rotation ensures a new refresh token is issued on each refresh,
    # invalidating the old one. This detects token theft immediately.
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    # Custom Cookie Settings
    "AUTH_COOKIE": "access",  # Name of the access token cookie
    "REFRESH_COOKIE": "refresh",  # Name of the refresh token cookie
    "AUTH_COOKIE_SECURE": not DEBUG,  # True in production (HTTPS only), False in DEBUG (localhost)
    "AUTH_COOKIE_HTTP_ONLY": True,  # Prevent JS access
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "Lax" if DEBUG else "None",  # 'None' required for cross-site (Frontend <-> Backend) in prod
}

# DRF Spectacular (OpenAPI)
SPECTACULAR_SETTINGS = {
    "TITLE": "Banking Backend API",
    "DESCRIPTION": "API for banking backend system",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # OTHER SETTINGS
}

# Caching - use Redis in production, local memory for development
# Caches & Channels - Redis Configuration for Render
# Use 'coastal-redis' key-value store via REDIS_URL
if env("REDIS_URL", default=None):
    REDIS_URL = env("REDIS_URL")
    parsed = urlparse(REDIS_URL)

    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }

    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [(parsed.hostname, parsed.port)],
            },
        }
    }
else:
    # Fallback for local development without Redis
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-snowflake",
        }
    }

    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }

# Celery Configuration (optional - only if Redis is available)
if env("REDIS_URL", default=None):
    CELERY_BROKER_URL = env("REDIS_URL")
    CELERY_RESULT_BACKEND = env("REDIS_URL")
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_TIMEZONE = TIME_ZONE
    CELERY_ENABLED = True
else:
    # Celery disabled - tasks will run synchronously if called
    CELERY_ENABLED = False

# Flower (Celery monitoring) Configuration
FLOWER_PORT = env.int("FLOWER_PORT", default=5555)
# SECURITY: FLOWER_BASIC_AUTH must ALWAYS be set via environment variable
# Never use default passwords for monitoring tools
FLOWER_BASIC_AUTH = env("FLOWER_BASIC_AUTH", default=None)

# Sendexa SMS Configuration
# SECURITY: All Sendexa credentials MUST be set via environment variables
# No default values for API keys/secrets in production
SENDEXA_API_KEY = env("SENDEXA_API_KEY", default="")
SENDEXA_API_SECRET = env("SENDEXA_API_SECRET", default="")
SENDEXA_AUTH_TOKEN = env("SENDEXA_AUTH_TOKEN", default="")
SENDEXA_SENDER_ID = env("SENDEXA_SENDER_ID", default="CACCU")
SENDEXA_API_URL = env("SENDEXA_API_URL", default="https://api.sendexa.co/v1/sms/send")


# Database Partitioning
# Partitioning is configured at the model level using Meta.db_table and partitioning key

# Logging Configuration
LOG_DIR = env("LOG_DIR", default=os.path.join(BASE_DIR, "logs"))
LOG_LEVEL = env("LOG_LEVEL", default="INFO" if not DEBUG else "DEBUG")

# Ensure log directory exists
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} [{correlation_id}] {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} [{correlation_id}] {message}",
            "style": "{",
        },
    },
    "filters": {
        "correlation": {
            "()": "core.log_filters.CorrelationIdFilter",
        },
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "simple",
            "filters": ["correlation"],
        },
        "file": {
            "level": LOG_LEVEL,
            "class": "logging.handlers.RotatingFileHandler",
            "filename": os.path.join(LOG_DIR, "coastal.log"),
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
            "filters": ["correlation"],
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "core": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "users": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}

# =============================================================================
# CORS Configuration
# =============================================================================
# Production origins only - localhost added conditionally for development
CORS_ALLOWED_ORIGINS = [
    # Production frontend on Render
    "https://coastal-web.onrender.com",
    "https://coastal-project.onrender.com",
]

# SECURITY: Only allow localhost origins in DEBUG mode
if DEBUG:
    CORS_ALLOWED_ORIGINS += [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # For local Vite dev
    ]

# Add Env-Defined Origins for Production (override/extend)
if env.list("CORS_ALLOWED_ORIGINS", default=[]):
    CORS_ALLOWED_ORIGINS += env.list("CORS_ALLOWED_ORIGINS")

# =============================================================================
# CSRF Trusted Origins (Required for Django 4.0+)
# =============================================================================
# Must explicitly list origins allowed to make unsafe requests (POST, PUT, DELETE)
# Use Render's RENDER_EXTERNAL_HOSTNAME for dynamic hostname support
import os

RENDER_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME")

CSRF_TRUSTED_ORIGINS = [
    "https://coastal-web.onrender.com",
    "https://coastal-project.onrender.com",
    "https://*.onrender.com",  # Allow Render subdomains for PR previews
]

# Add Render's dynamic hostname if available
if RENDER_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_HOSTNAME}")
    CORS_ALLOWED_ORIGINS.append(f"https://{RENDER_HOSTNAME}")

# Add Env-Defined Trusted Origins for Production
# Handle comma-separated list from string env var to match user request
if os.getenv("CSRF_TRUSTED_ORIGINS"):
    origins = os.getenv("CSRF_TRUSTED_ORIGINS").split(",")
    CSRF_TRUSTED_ORIGINS.extend([o.strip() for o in origins if o.strip()])
elif env.list("CSRF_TRUSTED_ORIGINS", default=[]):
    # Fallback to django-environ list parsing
    CSRF_TRUSTED_ORIGINS += env.list("CSRF_TRUSTED_ORIGINS")

# SECURITY: Only allow localhost in DEBUG mode
if DEBUG:
    CSRF_TRUSTED_ORIGINS += [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ]

# Production Security Headers
# Always set SECURE_PROXY_SSL_HEADER on Render to prevent CSRF "Origin checking failed"
# (Scheme mismatch: Django sees http, Origin is https)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_COOKIE_SAMESITE = (
    "Lax"  # 'Lax' allows cross-origin with top-level navigation; 'Strict' blocks cookies on cross-origin POST
)
SESSION_COOKIE_SAMESITE = "Lax"  # 'Strict' can break OAuth redirection flows if any used

if not DEBUG:
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
    SECURE_REDIRECT_EXEMPT = [r"^$", r"^api/health/simple/$", r"^api/performance/system-health/$"]
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = False
    SECURE_CONTENT_TYPE_NOSNIFF = True

    # HSTS Settings
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Security Headers - Content Security Policy (django-csp 4.0+ format)
CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": ("'self'",),
        "script-src": ("'self'",),
        "style-src": ("'self'", "fonts.googleapis.com"),
        "font-src": ("'self'", "fonts.gstatic.com"),
        "img-src": ("'self'", "data:", "https:"),
        "connect-src": ("'self'", "wss:", "https:"),  # Allow WebSocket and API calls
        "frame-ancestors": ["'self'"],
        "worker-src": ["'self'", "blob:"],  # For service workers
    }
}

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allowed HTTP methods
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Allowed headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-idempotency-key",  # For idempotent POST/PUT/PATCH requests
    "x-requested-with",
]

# Note: CSRF_TRUSTED_ORIGINS is configured above (lines 472-499)
# CORS_ALLOWED_ORIGINS should sync with CSRF origins for API compatibility
# This is handled via environment variables in production

# =============================================================================
# Security Headers (OWASP/PCI-DSS Compliance)
# =============================================================================

# HSTS - Force HTTPS for 1 year (only in production)
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# SSL/HTTPS settings (production only)
SECURE_SSL_REDIRECT = not DEBUG
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Secure cookies
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# Prevent content type sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# XSS Protection (legacy browsers)
SECURE_BROWSER_XSS_FILTER = True

# =============================================================================
# Content Security Policy (CSP) - XSS Protection
# =============================================================================
# Using django-csp 4.0+ middleware (new format)

CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        # Allow resources only from same origin by default
        "default-src": ("'self'",),
        # Scripts: self + any CDNs you use
        "script-src": ("'self'",),
        # Styles: self + inline for DRF browsable API
        "style-src": ("'self'", "'unsafe-inline'"),
        # Images: self + data URIs for inline images
        "img-src": ("'self'", "data:", "https:"),
        # Fonts: self + Google Fonts if used
        "font-src": ("'self'", "https://fonts.gstatic.com"),
        # Connect: self + your API domains
        "connect-src": ("'self'",),
        # Frame ancestors: prevent clickjacking
        "frame-ancestors": ("'none'",),
        # Form actions: only submit to self
        "form-action": ("'self'",),
    }
}
# SECURITY: Broaden coverage for 2026 standards
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
