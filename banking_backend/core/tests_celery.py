from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import Account, FraudAlert, Transaction
from .tasks import (
    analyze_fraud_patterns,
    export_transaction_data,
    generate_daily_reports,
    send_email_notification,
    system_health_check,
)

User = get_user_model()


class CeleryTasksTestCase(TestCase):
    """Test cases for Celery tasks."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="testpass123")
        self.account = Account.objects.create(user=self.user, account_number="1234567890", balance=Decimal("1000.00"))

    @patch("core.tasks.send_mail")
    def test_generate_daily_reports_success(self, mock_send_mail):
        """Test successful daily report generation."""
        # Create test transactions
        _yesterday = timezone.now().date() - timedelta(days=1)
        Transaction.objects.create(
            from_account=self.account,
            amount=Decimal("100.00"),
            transaction_type="transfer",
            status="completed",
            timestamp=timezone.now() - timedelta(days=1),
        )

        result = generate_daily_reports()

        self.assertIn("Report sent", result)
        mock_send_mail.assert_called_once()
        args, kwargs = mock_send_mail.call_args
        self.assertIn("Daily Banking Report", args[0])

    @patch("core.tasks.logger")
    def test_generate_daily_reports_with_retry(self, mock_logger):
        """Test daily report generation with retry on failure."""
        with patch("core.tasks.send_mail", side_effect=Exception("Email failed")):
            _task = generate_daily_reports()
            # The task should retry and eventually log critical error
            mock_logger.error.assert_called()
            mock_logger.critical.assert_called_with("Max retries exceeded for daily report generation")

    def test_analyze_fraud_patterns_large_transaction(self):
        """Test fraud analysis detects large transactions."""
        # Create a large transaction
        Transaction.objects.create(
            from_account=self.account,
            amount=Decimal("15000.00"),  # Above threshold
            transaction_type="transfer",
            status="completed",
            timestamp=timezone.now(),
        )

        result = analyze_fraud_patterns()

        self.assertIn("Analyzed", result)
        # Check if fraud alert was created
        alert = FraudAlert.objects.filter(user=self.user).first()
        self.assertIsNotNone(alert)
        self.assertIn("Large transaction", alert.message)

    def test_analyze_fraud_patterns_high_frequency(self):
        """Test fraud analysis detects high frequency transactions."""
        # Create multiple transactions in short time
        base_time = timezone.now()
        for i in range(15):  # More than 10 transactions
            Transaction.objects.create(
                from_account=self.account,
                amount=Decimal("10.00"),
                transaction_type="transfer",
                status="completed",
                timestamp=base_time - timedelta(minutes=i),
            )

        result = analyze_fraud_patterns()

        self.assertIn("Analyzed", result)
        # Check if fraud alert was created
        alert = FraudAlert.objects.filter(user=self.user).first()
        self.assertIsNotNone(alert)
        self.assertIn("frequency", alert.message)

    @patch("core.tasks.send_mail")
    def test_send_email_notification_success(self, mock_send_mail):
        """Test successful email notification."""
        result = send_email_notification(self.user.id, "Test Subject", "Test message")

        self.assertIn("Email sent", result)
        mock_send_mail.assert_called_once_with(
            "Test Subject",
            "Test message",
            "webmaster@localhost",  # Default from email
            [self.user.email],
            html_message=None,
        )

    def test_send_email_notification_user_not_found(self):
        """Test email notification with non-existent user."""
        result = send_email_notification(99999, "Subject", "Message")

        self.assertEqual(result, "User 99999 not found")

    @patch("core.tasks.logger")
    def test_send_email_notification_with_retry(self, mock_logger):
        """Test email notification retry on failure."""
        with patch("core.tasks.send_mail", side_effect=Exception("SMTP failed")):
            _result = send_email_notification(self.user.id, "Subject", "Message")

            mock_logger.error.assert_called()
            mock_logger.critical.assert_called_with("Max retries exceeded for email notification")

    def test_export_transaction_data_csv(self):
        """Test transaction data export in CSV format."""
        # Create test transactions
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()

        Transaction.objects.create(
            from_account=self.account,
            amount=Decimal("50.00"),
            transaction_type="deposit",
            status="completed",
            timestamp=timezone.now() - timedelta(days=5),
        )

        result = export_transaction_data(self.user.id, start_date, end_date, "csv")

        self.assertIn("Exported 1 transactions", result)

    def test_export_transaction_data_user_not_found(self):
        """Test export with non-existent user."""
        result = export_transaction_data(99999, date.today(), date.today(), "csv")

        self.assertEqual(result, "User 99999 not found")

    def test_export_transaction_data_unsupported_format(self):
        """Test export with unsupported format."""
        result = export_transaction_data(self.user.id, date.today(), date.today(), "pdf")

        self.assertEqual(result, "Unsupported format pdf")

    @patch("core.tasks.send_mail")
    def test_system_health_check_normal(self, mock_send_mail):
        """Test system health check when everything is normal."""
        result = system_health_check()

        self.assertIn("Health check completed", result)
        self.assertIn("0 issues found", result)
        mock_send_mail.assert_called_once()

    @patch("core.tasks.send_mail")
    def test_system_health_check_with_issues(self, mock_send_mail):
        """Test system health check with detected issues."""
        # Create old pending transaction
        Transaction.objects.create(
            from_account=self.account,
            amount=Decimal("100.00"),
            transaction_type="transfer",
            status="pending",
            timestamp=timezone.now() - timedelta(hours=25),  # Older than 24 hours
        )

        # Create unresolved fraud alert
        FraudAlert.objects.create(
            user=self.user, message="Test alert", severity="high", created_at=timezone.now() - timedelta(days=10)
        )

        result = system_health_check()

        self.assertIn("Health check completed", result)
        self.assertIn("issues found", result)
        mock_send_mail.assert_called_once()
        args, kwargs = mock_send_mail.call_args
        email_body = args[1]
        self.assertIn("pending for more than 24 hours", email_body)
        self.assertIn("unresolved for more than 7 days", email_body)

    @patch("core.tasks.Account.objects.count")
    @patch("core.tasks.send_mail")
    def test_system_health_check_database_failure(self, mock_send_mail, mock_count):
        """Test system health check with database connectivity issue."""
        mock_count.side_effect = Exception("Database connection failed")

        result = system_health_check()

        self.assertIn("Health check completed", result)
        mock_send_mail.assert_called_once()
        args, kwargs = mock_send_mail.call_args
        email_body = args[1]
        self.assertIn("Database connectivity issue", email_body)
