import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch
from decimal import Decimal
from django.utils import timezone
import datetime

from users.models import User, AdminNotification, UserActivity
from core.models.accounts import Account, AccountOpeningRequest
from core.models.transactions import Transaction, Refund
from core.models.operational import ServiceRequest, Complaint
from core.models.hr import Expense
from core.models.reporting import SystemHealth
from core.models.loans import Loan

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username='db_staff', email='db_staff@ex.com',
        password='Password123!', role='staff',
        is_approved=True, is_staff=True,
    )

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username='db_manager', email='db_manager@ex.com',
        password='Password123!', role='manager',
        is_approved=True, is_staff=True,
    )

@pytest.mark.django_db
class TestDashboardViews:

    def test_cash_flow_metrics(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)
        url = reverse('core:cash-flow')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['inflow']['total'] == 0
        acc = Account.objects.create(user=staff_user, account_number='FLOW-1', balance=500)
        Transaction.objects.create(to_account=acc, amount=100, transaction_type='deposit', status='completed')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['inflow']['deposits'] == 100

    def test_expenses_view(self, api_client, staff_user):
        api_client.force_authenticate(user=staff_user)
        url = reverse('core:expenses')
        Expense.objects.create(category='Office', amount=50, description='Supplies', date=timezone.now().date(), status='approved')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_workflow_efficiency(self, api_client, staff_user):
        now = timezone.now()
        yesterday = now - datetime.timedelta(days=1)
        ServiceRequest.objects.create(user=staff_user, request_type='statement', status='completed', created_at=yesterday, processed_at=now)
        ServiceRequest.objects.create(user=staff_user, request_type='checkbook', status='pending')
        api_client.force_authenticate(user=staff_user)
        url = reverse('core:workflow-status')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['pending_approval'] == 1
        assert response.data['efficiency_rate'] == 50.0

    def test_branch_activity(self, api_client, staff_user):
        acc = Account.objects.create(user=staff_user, account_number='BRANCH-1', balance=100)
        Transaction.objects.create(to_account=acc, amount=10, transaction_type='deposit', status='completed')
        api_client.force_authenticate(user=staff_user)
        url = reverse('core:branch-activity')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['deposits'] == 1

    def test_system_alerts(self, api_client, staff_user):
        AdminNotification.objects.create(message='System high load', priority='critical')
        UserActivity.objects.create(user=staff_user, action='failed_login', ip_address='127.0.0.1')
        api_client.force_authenticate(user=staff_user)
        url = reverse('core:system-alerts')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

    def test_operations_metrics_large(self, api_client, staff_user):
        Loan.objects.create(user=staff_user, amount=5000, status='pending', interest_rate=5.0, term_months=12)
        AccountOpeningRequest.objects.create(first_name='John', last_name='Doe', email='j@x.com', account_type='daily_susu', status='pending')
        Transaction.objects.create(amount=10000, transaction_type='transfer', status='pending_approval')
        SystemHealth.objects.create(status='healthy', response_time_ms=100)
        api_client.force_authenticate(user=staff_user)
        url = reverse('core:operations-metrics')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'pending_approvals' in response.data

    def test_performance_dashboard(self, api_client, staff_user):
        SystemHealth.objects.create(status='critical', response_time_ms=500, details={'cpu_usage': 95, 'memory_usage': 85})
        api_client.force_authenticate(user=staff_user)
        response = api_client.get(reverse('core:performance-dashboard'))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['system_health']['overall_status'] == 'critical'
        assert len(response.data['active_alerts']) > 0
        assert api_client.get(reverse('core:performance-metrics')).status_code == 200
        assert api_client.get(reverse('core:performance-volume')).status_code == 200
        assert api_client.get(reverse('core:performance-chart')).status_code == 200

    def test_manager_overview(self, api_client, manager_user):
        api_client.force_authenticate(user=manager_user)
        url = reverse('core:manager-overview')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
