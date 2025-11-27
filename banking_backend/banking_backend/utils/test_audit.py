import os
import pytest
from unittest.mock import Mock, patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from auditlog.models import LogEntry
from banking_backend.utils.audit import AuditService, audit_context, get_audit_trail
from banking_backend.utils.monitoring import log_security_event


class TestAuditService(TestCase):
    """Comprehensive tests for audit service functionality."""

    def setUp(self):
        """Set up test data."""
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123'),
            first_name='Test',
            last_name='User'
        )

    def test_log_financial_operation_create(self):
        """Test logging a financial operation create event."""
        model_name = 'Account'
        object_id = 123
        changes = {'balance': '1000.00'}

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            with patch('banking_backend.utils.audit.log_security_event') as mock_security_log:
                AuditService.log_financial_operation(
                    user=self.user,
                    operation_type='CREATE',
                    model_name=model_name,
                    object_id=object_id,
                    changes=changes
                )

        # Verify logging calls
        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        log_message = args[0]
        log_extra = kwargs['extra']

        assert 'Financial operation: CREATE on Account 123' in log_message
        assert log_extra['user_id'] == str(self.user.id)
        assert log_extra['operation_type'] == 'CREATE'
        assert log_extra['model_name'] == model_name
        assert log_extra['object_id'] == str(object_id)
        assert log_extra['changes'] == changes

        # Verify security event logging for sensitive operations
        mock_security_log.assert_called_once_with(
            event_type='financial_operation_create',
            user_id=self.user.id,
            details={
                'model': model_name,
                'object_id': str(object_id),
                'changes': changes,
                'metadata': None,
            }
        )

    def test_log_financial_operation_update(self):
        """Test logging a financial operation update event."""
        model_name = 'Transaction'
        object_id = 456
        changes = {'status': 'completed'}

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            with patch('banking_backend.utils.audit.log_security_event') as mock_security_log:
                AuditService.log_financial_operation(
                    user=self.user,
                    operation_type='UPDATE',
                    model_name=model_name,
                    object_id=object_id,
                    changes=changes,
                    metadata={'reason': 'user_request'}
                )

        mock_logger.info.assert_called_once()
        mock_security_log.assert_called_once()

        # Verify security event for transaction update
        args, kwargs = mock_security_log.call_args
        assert kwargs['event_type'] == 'financial_operation_update'
        assert kwargs['details']['model'] == model_name
        assert kwargs['details']['metadata'] == {'reason': 'user_request'}

    def test_log_financial_operation_non_sensitive(self):
        """Test logging operations that don't trigger security events."""
        model_name = 'UserProfile'
        object_id = 789
        changes = {'notify_email': True}

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            with patch('banking_backend.utils.audit.log_security_event') as mock_security_log:
                AuditService.log_financial_operation(
                    user=self.user,
                    operation_type='UPDATE',
                    model_name=model_name,
                    object_id=object_id,
                    changes=changes
                )

        mock_logger.info.assert_called_once()
        # Should not log security event for non-sensitive models
        mock_security_log.assert_not_called()

    def test_log_transaction(self):
        """Test logging transaction operations."""
        # Create mock transaction
        mock_transaction = Mock()
        mock_transaction.amount = 500.00
        mock_transaction.type = 'deposit'
        mock_transaction.account.id = 123
        mock_transaction.timestamp = timezone.now()
        mock_transaction.id = 456

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            with patch('banking_backend.utils.audit.log_security_event') as mock_security_log:
                AuditService.log_transaction(self.user, mock_transaction)

        mock_logger.info.assert_called_once()
        mock_security_log.assert_called_once()

        # Verify the logged data
        args, kwargs = mock_logger.info.call_args
        log_extra = kwargs['extra']
        expected_changes = {
            'amount': str(mock_transaction.amount),
            'type': mock_transaction.type,
            'account': str(mock_transaction.account.id),
            'timestamp': mock_transaction.timestamp.isoformat()
        }
        assert log_extra['changes'] == expected_changes
        assert log_extra['metadata'] == {'transaction_type': mock_transaction.type}

    def test_log_account_balance_change(self):
        """Test logging account balance changes."""
        mock_account = Mock()
        mock_account.id = 789
        old_balance = 1000.00
        new_balance = 1500.00
        reason = 'deposit'

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            with patch('banking_backend.utils.audit.log_security_event') as mock_security_log:
                AuditService.log_account_balance_change(
                    self.user, mock_account, old_balance, new_balance, reason
                )

        mock_logger.info.assert_called_once()
        mock_security_log.assert_called_once()

        # Verify logged changes
        args, kwargs = mock_logger.info.call_args
        log_extra = kwargs['extra']
        expected_changes = {
            'old_balance': str(old_balance),
            'new_balance': str(new_balance),
            'change_amount': str(new_balance - old_balance),
            'reason': reason
        }
        assert log_extra['changes'] == expected_changes
        assert log_extra['metadata'] == {'account_number': mock_account.account_number}

    def test_log_loan_operation(self):
        """Test logging loan operations."""
        mock_loan = Mock()
        mock_loan.id = 101
        mock_loan.principal_amount = 10000.00
        operation_type = 'CREATE'
        changes = {'status': 'approved'}

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            with patch('banking_backend.utils.audit.log_security_event') as mock_security_log:
                AuditService.log_loan_operation(self.user, mock_loan, operation_type, changes)

        mock_logger.info.assert_called_once()
        mock_security_log.assert_called_once()

        # Verify metadata includes loan amount
        args, kwargs = mock_security_log.call_args
        assert kwargs['details']['metadata'] == {'loan_amount': str(mock_loan.principal_amount)}

    def test_audit_context_manager(self):
        """Test audit context manager sets actor correctly."""
        with patch('banking_backend.utils.audit.set_actor') as mock_set_actor:
            with audit_context(self.user):
                pass

            mock_set_actor.assert_called_once_with(self.user)

    def test_get_audit_trail(self):
        """Test retrieving audit trail for a model instance."""
        # Create a mock model instance
        mock_instance = Mock()
        mock_instance._meta.model_name = 'testmodel'
        mock_instance.pk = 123

        # Mock LogEntry objects
        mock_log_entry1 = Mock()
        mock_log_entry2 = Mock()
        mock_log_entries = [mock_log_entry1, mock_log_entry2]

        with patch('auditlog.models.LogEntry.objects') as mock_objects:
            mock_queryset = Mock()
            mock_queryset.filter.return_value.order_by.return_value = mock_queryset
            mock_queryset.__getitem__ = Mock(return_value=mock_log_entries)
            mock_objects.filter.return_value = mock_queryset

            result = get_audit_trail(mock_instance, limit=10)

            # Verify query construction
            mock_objects.filter.assert_called_once_with(
                content_type__model='testmodel',
                object_id=str(mock_instance.pk)
            )
            mock_queryset.order_by.assert_called_once_with('-timestamp')
            mock_queryset.__getitem__.assert_called_once_with(slice(None, 10))

    def test_audit_service_error_handling(self):
        """Test audit service handles exceptions gracefully."""
        with patch('banking_backend.utils.audit.logger') as mock_logger:
            # Simulate database error
            with patch('auditlog.models.LogEntry.objects.create', side_effect=Exception('DB Error')):
                # Should not raise exception
                AuditService.log_financial_operation(
                    user=self.user,
                    operation_type='CREATE',
                    model_name='TestModel',
                    object_id=123
                )

            # Should log the error
            mock_logger.error.assert_called_once()
            args, kwargs = mock_logger.error.call_args
            assert 'Failed to log financial operation' in args[0]

    def test_audit_service_with_none_changes(self):
        """Test audit service handles None changes parameter."""
        with patch('banking_backend.utils.audit.logger') as mock_logger:
            AuditService.log_financial_operation(
                user=self.user,
                operation_type='DELETE',
                model_name='TestModel',
                object_id=123,
                changes=None
            )

        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        log_extra = kwargs['extra']
        assert log_extra['changes'] is None

    def test_audit_service_with_none_metadata(self):
        """Test audit service handles None metadata parameter."""
        with patch('banking_backend.utils.audit.logger') as mock_logger:
            AuditService.log_financial_operation(
                user=self.user,
                operation_type='UPDATE',
                model_name='TestModel',
                object_id=123,
                changes={'field': 'value'},
                metadata=None
            )

        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        log_extra = kwargs['extra']
        assert log_extra['metadata'] is None

    def test_audit_service_timestamp_logging(self):
        """Test that audit logs include proper timestamps."""
        before_log = timezone.now()

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            AuditService.log_financial_operation(
                user=self.user,
                operation_type='CREATE',
                model_name='TestModel',
                object_id=123
            )

        after_log = timezone.now()

        mock_logger.info.assert_called_once()
        args, kwargs = mock_logger.info.call_args
        log_extra = kwargs['extra']

        logged_timestamp = timezone.datetime.fromisoformat(log_extra['timestamp'])
        assert before_log <= logged_timestamp <= after_log

    def test_audit_service_user_isolation(self):
        """Test that audit logs are properly associated with users."""
        user2 = get_user_model().objects.create_user(
            email='test2@example.com',
            password=os.getenv('TEST_USER_PASSWORD', 'test123')
        )

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            AuditService.log_financial_operation(
                user=self.user,
                operation_type='CREATE',
                model_name='TestModel',
                object_id=123
            )

            AuditService.log_financial_operation(
                user=user2,
                operation_type='UPDATE',
                model_name='TestModel',
                object_id=456
            )

        # Should have logged twice
        assert mock_logger.info.call_count == 2

        # Check first call
        first_call = mock_logger.info.call_args_list[0]
        first_extra = first_call[1]['extra']
        assert first_extra['user_id'] == str(self.user.id)

        # Check second call
        second_call = mock_logger.info.call_args_list[1]
        second_extra = second_call[1]['extra']
        assert second_extra['user_id'] == str(user2.id)

    def test_audit_service_operation_types(self):
        """Test different operation types are logged correctly."""
        operation_types = ['CREATE', 'UPDATE', 'DELETE']

        with patch('banking_backend.utils.audit.logger') as mock_logger:
            for op_type in operation_types:
                AuditService.log_financial_operation(
                    user=self.user,
                    operation_type=op_type,
                    model_name='TestModel',
                    object_id=123
                )

        assert mock_logger.info.call_count == 3

        for i, op_type in enumerate(operation_types):
            call = mock_logger.info.call_args_list[i]
            message = call[0][0]
            assert f'Financial operation: {op_type} on TestModel 123' in message