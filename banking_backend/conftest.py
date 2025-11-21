import pytest
import django
from django.conf import settings
from django.test.utils import get_runner

# Configure Django settings
if not settings.configured:
    settings.configure(
        DEBUG=True,
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'rest_framework',
            'rest_framework_simplejwt',
            'users',
            'banking',
            'transactions',
            'operations',
        ],
        SECRET_KEY='test-secret-key',
        USE_TZ=True,
        AUTH_USER_MODEL='users.User',
        REST_FRAMEWORK={
            'DEFAULT_AUTHENTICATION_CLASSES': (
                'rest_framework_simplejwt.authentication.JWTAuthentication',
            ),
        },
    )
    django.setup()


@pytest.fixture(scope='session')
def django_db_setup():
    """Set up test database."""
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])


@pytest.fixture
def api_client():
    """Return a Django REST framework API client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def user_factory(db):
    """Factory for creating test users."""
    from users.models import User

    def create_user(**kwargs):
        defaults = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'member',
            'is_active': True,
        }
        defaults.update(kwargs)
        if 'password' not in defaults:
            defaults['password'] = 'testpass123'
        user = User.objects.create_user(**defaults)
        return user
    return create_user


@pytest.fixture
def authenticated_client(api_client, user_factory):
    """Return an authenticated API client."""
    user = user_factory()
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client, user


@pytest.fixture
def account_factory(db, user_factory):
    """Factory for creating test accounts."""
    from banking.models import Account

    def create_account(**kwargs):
        defaults = {
            'account_number': '1234567890123456',
            'type': 'Savings',
            'balance': 1000.00,
            'status': 'Active',
        }
        defaults.update(kwargs)
        if 'owner' not in defaults:
            defaults['owner'] = user_factory()
        return Account.objects.create(**defaults)
    return create_account


@pytest.fixture
def transaction_factory(db, account_factory):
    """Factory for creating test transactions."""
    from banking.models import Transaction

    def create_transaction(**kwargs):
        defaults = {
            'type': 'deposit',
            'amount': 100.00,
        }
        defaults.update(kwargs)
        if 'account' not in defaults:
            defaults['account'] = account_factory()
        return Transaction.objects.create(**defaults)
    return create_transaction


@pytest.fixture
def loan_application_factory(db, user_factory):
    """Factory for creating test loan applications."""
    from banking.models import LoanApplication

    def create_loan_application(**kwargs):
        defaults = {
            'amount_requested': 5000.00,
            'term_months': 12,
            'interest_rate': 10.00,
            'purpose': 'Test loan',
            'status': 'pending',
        }
        defaults.update(kwargs)
        if 'applicant' not in defaults:
            defaults['applicant'] = user_factory()
        return LoanApplication.objects.create(**defaults)
    return create_loan_application


@pytest.fixture
def workflow_factory(db, user_factory):
    """Factory for creating test workflows."""
    from operations.models import Workflow

    def create_workflow(**kwargs):
        defaults = {
            'name': 'Test Workflow',
            'description': 'Test workflow description',
            'is_active': True,
        }
        defaults.update(kwargs)
        if 'created_by' not in defaults:
            defaults['created_by'] = user_factory(role='operations_manager')
        return Workflow.objects.create(**defaults)
    return create_workflow