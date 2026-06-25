import pytest
from unittest.mock import MagicMock, patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models import AccountOpeningRequest, Account

@pytest.mark.django_db
class TestPaperFirstOnboarding:
    """Tests for validating the Paper-First Trust Anchor and Zero-SMS credentialing."""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def manager_user(self, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.create_user(
            email='manager@coastal.com',
            password='ManagerPassword123!',
            role='manager',
            is_approved=True
        )

    @pytest.fixture
    def pending_request(self, db):
        return AccountOpeningRequest.objects.create(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            phone_number='+233240001111',
            account_type='daily_susu',
            status='pending'
        )

    @patch('core.views.accounts.AccountOpeningViewSet._send_account_number_sms')
    @patch('users.services.SendexaService.send_sms')
    def test_approve_and_print_no_credentials_sms(self, mock_sms, mock_acc_sms, manager_user, pending_request, api_client):
        """Verify Stage 1 approval triggers Account Number SMS but NO credential SMS."""
        api_client.force_authenticate(user=manager_user)
        # AUDIT FIX: URL is namespaced in users
        url = reverse('core:account-opening-approve-and-print', args=[pending_request.id])

        response = api_client.post(url, {'kyc_verified': True})

        assert response.status_code == 200
        mock_acc_sms.assert_called_once()
        mock_sms.assert_not_called()

    def test_approve_without_kyc_attestation_fails(self, manager_user, pending_request, api_client):
        """Verify that approval fails if the mandatory physical KYC checkbox is missing."""
        api_client.force_authenticate(user=manager_user)
        url = reverse('core:account-opening-approve-and-print', args=[pending_request.id])
        response = api_client.post(url, {'kyc_verified': False})

        assert response.status_code == 400
        # AUDIT FIX: Correct error message check
        assert 'Physical KYC verification is mandatory' in str(response.data)
