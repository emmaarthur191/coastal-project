import os
from urllib.parse import urlparse
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Initialize environment variables
env = environ.Env(
    # set casting, default value
    DEBUG=(bool, False)
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# =============================================================================
# Sentry Error Monitoring (Production)
# =============================================================================
# Set SENTRY_DSN in environment to enable error tracking
SENTRY_DSN = env('SENTRY_DSN', default='')
if SENTRY_DSN and not env.bool('DEBUG', default=False):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
            ),
            LoggingIntegration(
                level=None,  # Capture all logs
                event_level='ERROR',  # Send ERROR and above as events
            ),
        ],
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
        traces_sample_rate=0.1,  # 10% for production
        # Send user information for errors
        send_default_pii=False,  # Disable for banking security
        # Environment tag
        environment='production' if not env.bool('DEBUG', default=False) else 'development',
        # Release version tracking
        release=env('APP_VERSION', default='1.0.0'),
    )

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# This will raise ImproperlyConfigured if SECRET_KEY is not set in environment
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
# Defaults to False for fail-safe production deployments
DEBUG = env.bool('DEBUG', default=False)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'corsheaders',  # CORS support for frontend
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'django_prometheus',
    'django_filters',
    'channels',
    # Local apps
    'core',
    'users.apps.UsersConfig',  # Use full config for signal loading
    'csp', # Content Security Policy
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # 'corsheaders.middleware.CorsMiddleware' removed from here
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Moved after SecurityMiddleware as requested
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'csp.middleware.CSPMiddleware', # Replace XFrameOptionsMiddleware with CSP
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware', # Removed in favor of CSP
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ASGI application
ASGI_APPLICATION = 'config.asgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise storage for static files
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'users.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'users.authentication.JWTCookieAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',
    
    # Custom Cookie Settings
    'AUTH_COOKIE': 'access',  # Name of the access token cookie
    'REFRESH_COOKIE': 'refresh', # Name of the refresh token cookie
    'AUTH_COOKIE_SECURE': not DEBUG, # True in production (HTTPS only)
    'AUTH_COOKIE_HTTP_ONLY': True, # Prevent JS access
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',  # 'Lax' for widespread support, 'Strict' for high security
}

# DRF Spectacular (OpenAPI)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Banking Backend API',
    'DESCRIPTION': 'API for banking backend system',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # OTHER SETTINGS
}

# Caching - use Redis in production, local memory for development
# Caches & Channels - Redis Configuration for Render
# Use 'coastal-redis' key-value store via REDIS_URL
if env('REDIS_URL', default=None):
    REDIS_URL = env('REDIS_URL')
    parsed = urlparse(REDIS_URL)
    
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
    
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [(parsed.hostname, parsed.port)],
            },
        }
    }
else:
    # Fallback for local development without Redis
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
    
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Celery Configuration (optional - only if Redis is available)
if env('REDIS_URL', default=None):
    CELERY_BROKER_URL = env('REDIS_URL')
    CELERY_RESULT_BACKEND = env('REDIS_URL')
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_TIMEZONE = TIME_ZONE
    CELERY_ENABLED = True
else:
    # Celery disabled - tasks will run synchronously if called
    CELERY_ENABLED = False

# Flower (Celery monitoring) Configuration
FLOWER_PORT = env.int('FLOWER_PORT', default=5555)
# SECURITY: In production, FLOWER_BASIC_AUTH must be set via environment variable
FLOWER_BASIC_AUTH = env('FLOWER_BASIC_AUTH', default='admin:changeme' if DEBUG else None)

# Sendexa SMS Configuration
# SECURITY: All Sendexa credentials MUST be set via environment variables
# No default values for API keys/secrets in production
SENDEXA_API_KEY = env('SENDEXA_API_KEY', default='')
SENDEXA_API_SECRET = env('SENDEXA_API_SECRET', default='')
SENDEXA_AUTH_TOKEN = env('SENDEXA_AUTH_TOKEN', default='')
SENDEXA_SENDER_ID = env('SENDEXA_SENDER_ID', default='Coastal')
SENDEXA_API_URL = env('SENDEXA_API_URL', default='https://api.sendexa.com/v1/sms/send')


# Database Partitioning
# Partitioning is configured at the model level using Meta.db_table and partitioning key

# Logging Configuration
# In production, logs are written to files. In development, console only.
LOG_DIR = os.path.join(BASE_DIR, 'logs')

# Base logging configuration (always present)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'core': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'users': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Add file handlers in production (DEBUG=False)
if not DEBUG:
    os.makedirs(LOG_DIR, exist_ok=True)
    LOGGING['handlers']['file'] = {
        'level': 'INFO',
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': os.path.join(LOG_DIR, 'banking.log'),
        'maxBytes': 1024 * 1024 * 5,  # 5 MB
        'backupCount': 5,
        'formatter': 'verbose',
    }
    LOGGING['handlers']['error_file'] = {
        'level': 'ERROR',
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': os.path.join(LOG_DIR, 'errors.log'),
        'maxBytes': 1024 * 1024 * 5,  # 5 MB
        'backupCount': 5,
        'formatter': 'verbose',
    }
    LOGGING['root']['handlers'] = ['console', 'file']
    LOGGING['loggers']['django']['handlers'] = ['console', 'file']
    LOGGING['loggers']['core']['handlers'] = ['console', 'file', 'error_file']
    LOGGING['loggers']['users']['handlers'] = ['console', 'file', 'error_file']



# =============================================================================
# CORS Configuration
# =============================================================================
# Allow requests from localhost (development) and production frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Production frontend on Render
    "https://coastal-web.onrender.com",
    "http://localhost:5173",  # For local Vite dev
]

# Add Env-Defined Origins for Production (override/extend)
if env.list('CORS_ALLOWED_ORIGINS', default=[]):
    CORS_ALLOWED_ORIGINS += env.list('CORS_ALLOWED_ORIGINS')

# Production Security Headers
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    
    # HSTS Settings
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Content Security Policy (via django-csp)
# Replaces X-Frame-Options
CSP_DEFAULT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'") # Needed for Admin/DRF styles sometimes
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'") # Often needed for legacy or complex frontends
CSP_IMG_SRC = ("'self'", "data:")
CSP_FONT_SRC = ("'self'", "data:")
# Frame Ancestors - Equivalent to SAMEORIGIN, but stronger
CSP_FRAME_ANCESTORS = ("'self'",)

# Allow external CSP sources if defined in env (e.g., for analytics, sentry)
if env.list('CSP_SCRIPT_SRC', default=[]):
    CSP_SCRIPT_SRC += tuple(env.list('CSP_SCRIPT_SRC'))

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
    "x-requested-with",
]

# CSRF trusted origins (for form submissions)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Production frontend on Render
    "https://coastal-web.onrender.com",
    "http://localhost:5173",
]

# Add production CSRF trusted origins from environment
# In Render, set CSRF_TRUSTED_ORIGINS to your frontend URL (e.g., https://coastal-web.onrender.com)
if env.list('CSRF_TRUSTED_ORIGINS', default=[]):
    CSRF_TRUSTED_ORIGINS += env.list('CSRF_TRUSTED_ORIGINS')

# Also add CORS origins as CSRF trusted origins (they should match for API)
if env.list('CORS_ALLOWED_ORIGINS', default=[]):
    for origin in env.list('CORS_ALLOWED_ORIGINS'):
        if origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)