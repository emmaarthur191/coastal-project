import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
from io import BytesIO
from django.utils import timezone
from decimal import Decimal

from users.models import User
from core.models.accounts import Account, AccountOpeningRequest, AccountClosureRequest

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        username='acc_manager', email='acc_manager@ex.com',
        password='Password123!', role='manager',
        is_approved=True, is_staff=True,
    )

@pytest.fixture
def cashier_user(db):
    return User.objects.create_user(
        username='acc_cashier', email='acc_cashier@ex.com',
        password='Password123!', role='cashier',
        is_approved=True, is_staff=True,
    )

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username='acc_cust', email='acc_cust@ex.com',
        password='Password123!', role='customer',
        is_approved=True,
    )

@pytest.fixture
def active_account(customer_user):
    return Account.objects.create(
        user=customer_user,
        account_number='ACC-12345',
        account_type='daily_susu',
        balance=Decimal(500.00),
        is_active=True
    )

@pytest.mark.django_db
class TestAccountViewSet:
    def test_freeze_account_as_staff(self, api_client, cashier_user, active_account):
        api_client.force_authenticate(user=cashier_user)
        url = reverse('core:account-freeze', args=[active_account.pk])
        response = api_client.post(url, {'reason': 'Test freeze'})
        assert response.status_code == status.HTTP_200_OK
        active_account.refresh_from_db()
        assert active_account.is_active is False

    def test_unfreeze_account_as_staff(self, api_client, cashier_user, active_account):
        active_account.is_active = False
        active_account.save()
        api_client.force_authenticate(user=cashier_user)
        url = reverse('core:account-unfreeze', args=[active_account.pk])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        active_account.refresh_from_db()
        assert active_account.is_active is True

@pytest.mark.django_db
class TestStaffAccountsViewSet:
    def test_list_accounts_with_search(self, api_client, cashier_user, active_account):
        api_client.force_authenticate(user=cashier_user)
        url = reverse('core:staff-account-list')
        response = api_client.get(url, {'search': 'ACC-12345'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        response = api_client.get(url, {'search': 'acc_cust@ex.com'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_accounts_summary(self, api_client, cashier_user, active_account):
        api_client.force_authenticate(user=cashier_user)
        url = reverse('core:staff-account-summary')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_accounts'] >= 1
        assert 'total_balance' in response.data

@pytest.mark.django_db
class TestAccountOpeningViewSet:
    def test_submit_request_public(self, api_client):
        url = reverse('core:account-opening-submit-request')
        payload = {
            'first_name': 'Applicant', 'last_name': 'One', 'email': 'applicant@test.com',
            'phone_number': '+233123456789', 'id_type': 'ghana_card',
            'id_number': 'GHA-123456789-0', 'account_type': 'daily_susu'
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert AccountOpeningRequest.objects.filter(email='applicant@test.com').exists()

    def test_approve_request_stage1_maker_checker(self, api_client, manager_user, cashier_user):
        req = AccountOpeningRequest.objects.create(
            first_name='Jane', last_name='Doe', email='jane@ex.com',
            phone_number='0244000000', id_type='ghana_card', id_number='123',
            submitted_by=cashier_user, status='pending'
        )
        url = reverse('core:account-opening-approve', args=[req.pk])
        api_client.force_authenticate(user=manager_user)
        with patch('users.services.SendexaService.send_sms') as mock_sms:
            response = api_client.post(url)
            assert response.status_code == status.HTTP_200_OK
        req.refresh_from_db()
        assert req.status == 'approved'
        assert req.created_account is not None

    def test_dispatch_credentials_stage2(self, api_client, manager_user, cashier_user):
        acc = Account.objects.create(user=User.objects.create(username='temp_u', email='t@e.com'), account_number='X')
        req = AccountOpeningRequest.objects.create(
            status='approved', submitted_by=cashier_user, created_account=acc,
            first_name='T', last_name='E', phone_number='1', email='t@e.com'
        )
        url = reverse('core:account-opening-dispatch-credentials', args=[req.pk])
        api_client.force_authenticate(user=manager_user)
        with patch('users.services.SendexaService.send_sms'):
            response = api_client.post(url)
            assert response.status_code == status.HTTP_200_OK
        req.refresh_from_db()
        assert req.status == 'completed'

    def test_approve_and_print_combined(self, api_client, manager_user, cashier_user):
        req = AccountOpeningRequest.objects.create(
            first_name='P', last_name='R', email='pr@ex.com',
            phone_number='0', id_type='ghana_card', id_number='0',
            submitted_by=cashier_user, status='pending'
        )
        url = reverse('core:account-opening-approve-and-print', args=[req.pk])
        api_client.force_authenticate(user=manager_user)
        with patch('core.pdf_services.generate_account_opening_letter_pdf') as mock_pdf:
            with patch('users.services.SendexaService.send_sms'):
                mock_pdf.return_value = BytesIO(b'pdf-content')
                response = api_client.post(url, {"kyc_verified": True}, format="json")
                assert response.status_code == status.HTTP_200_OK
                assert response['Content-Type'] == 'application/pdf'

    def test_reject_request(self, api_client, manager_user):
        req = AccountOpeningRequest.objects.create(status='pending')
        url = reverse('core:account-opening-reject', args=[req.pk])
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(url, {'reason': 'Invalid ID'})
        assert response.status_code == status.HTTP_200_OK
        req.refresh_from_db()
        assert req.status == 'rejected'

@pytest.mark.django_db
class TestAccountClosureViewSet:
    def test_approve_closure_request_maker_checker(self, api_client, manager_user, cashier_user, active_account):
        req = AccountClosureRequest.objects.create(
            account=active_account, closure_reason='other',
            submitted_by=cashier_user, status='pending'
        )
        url = reverse('core:account-closure-approve', args=[req.pk])
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        req.refresh_from_db()
        assert req.status == 'approved'
        active_account.refresh_from_db()
        assert active_account.is_active is False

    def test_reject_closure_request(self, api_client, manager_user, active_account):
        req = AccountClosureRequest.objects.create(account=active_account, status='pending')
        url = reverse('core:account-closure-reject', args=[req.pk])
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(url, {'reason': 'Not approved'})
        assert response.status_code == status.HTTP_200_OK
        req.refresh_from_db()
        assert req.status == 'rejected'

@pytest.mark.django_db
class TestAccountBalanceView:
    def test_get_my_balance_summary(self, api_client, customer_user, active_account):
        api_client.force_authenticate(user=customer_user)
        url = reverse('core:account-balance')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['data']['total_balance']) == 500.00
        assert response.data['data']['accounts_count'] == 1
