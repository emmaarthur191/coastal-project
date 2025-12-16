import logging
from datetime import datetime, timedelta
from decimal import Decimal
import csv
import io
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.db.models import Sum, Count, Q
from django.template.loader import render_to_string
from celery import shared_task
from celery.exceptions import MaxRetriesException
from .models import Account, Transaction, Loan, FraudAlert, BankingMessage

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_daily_reports(self):
    """Generate daily financial reports and send to administrators."""
    try:
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        # Transaction summary
        transactions = Transaction.objects.filter(
            timestamp__date=yesterday,
            status='completed'
        )

        total_volume = transactions.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        transaction_count = transactions.count()

        # Account summary
        accounts_created = Account.objects.filter(
            created_at__date=yesterday
        ).count()

        # Loan applications
        loans_approved = Loan.objects.filter(
            approved_at__date=yesterday
        ).count()

        # Fraud alerts
        fraud_alerts = FraudAlert.objects.filter(
            created_at__date=yesterday,
            is_resolved=False
        ).count()

        # Generate report data
        report_data = {
            'date': yesterday,
            'total_transaction_volume': total_volume,
            'transaction_count': transaction_count,
            'accounts_created': accounts_created,
            'loans_approved': loans_approved,
            'fraud_alerts': fraud_alerts,
        }

        # Send email report
        subject = f'Daily Banking Report - {yesterday}'
        message = render_to_string('reports/daily_report.html', report_data)
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [settings.ADMIN_EMAIL],
            html_message=message,
        )

        logger.info(f"Daily report generated for {yesterday}")
        return f"Report sent for {yesterday}"

    except Exception as exc:
        logger.error(f"Failed to generate daily report: {exc}")
        try:
            self.retry(countdown=60 * (2 ** self.request.retries))
        except MaxRetriesException:
            logger.critical("Max retries exceeded for daily report generation")
            raise


@shared_task(bind=True, max_retries=5, default_retry_delay=300)
def analyze_fraud_patterns(self):
    """Analyze transactions for potential fraud patterns."""
    try:
        # Check for unusual transaction patterns
        suspicious_transactions = []

        # Large transactions
        large_transactions = Transaction.objects.filter(
            amount__gt=Decimal('10000.00'),
            status='completed',
            timestamp__gte=datetime.now() - timedelta(hours=24)
        )

        for transaction in large_transactions:
            FraudAlert.objects.create(
                user=transaction.from_account.user if transaction.from_account else transaction.to_account.user,
                message=f"Large transaction detected: ${transaction.amount}",
                severity='high'
            )
            suspicious_transactions.append(transaction.id)

        # Rapid successive transactions
        recent_transactions = Transaction.objects.filter(
            timestamp__gte=datetime.now() - timedelta(hours=1),
            status='completed'
        ).select_related('from_account__user')

        user_transaction_counts = {}
        for transaction in recent_transactions:
            user_id = transaction.from_account.user.id if transaction.from_account else transaction.to_account.user.id
            user_transaction_counts[user_id] = user_transaction_counts.get(user_id, 0) + 1

        for user_id, count in user_transaction_counts.items():
            if count > 10:  # More than 10 transactions in an hour
                user = recent_transactions.filter(
                    from_account__user_id=user_id
                ).first().from_account.user
                FraudAlert.objects.create(
                    user=user,
                    message=f"Unusual transaction frequency: {count} transactions in 1 hour",
                    severity='medium'
                )

        logger.info(f"Fraud analysis completed. Found {len(suspicious_transactions)} suspicious transactions")
        return f"Analyzed {recent_transactions.count()} transactions, created {len(suspicious_transactions)} alerts"

    except Exception as exc:
        logger.error(f"Failed to analyze fraud patterns: {exc}")
        try:
            self.retry(countdown=300 * (2 ** self.request.retries))
        except MaxRetriesException:
            logger.critical("Max retries exceeded for fraud analysis")
            raise


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def send_email_notification(self, user_id, subject, message, html_message=None):
    """Send email notification to a user."""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
        )

        logger.info(f"Email sent to user {user_id}: {subject}")
        return f"Email sent to {user.email}"

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for email notification")
        return f"User {user_id} not found"
    except Exception as exc:
        logger.error(f"Failed to send email notification: {exc}")
        try:
            self.retry(countdown=120 * (2 ** self.request.retries))
        except MaxRetriesException:
            logger.critical("Max retries exceeded for email notification")
            raise


@shared_task(bind=True, max_retries=3, default_retry_delay=180)
def export_transaction_data(self, user_id, start_date, end_date, export_format='csv'):
    """Export transaction data for a user."""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        transactions = Transaction.objects.filter(
            Q(from_account__user=user) | Q(to_account__user=user),
            timestamp__date__range=[start_date, end_date],
            status='completed'
        ).select_related('from_account', 'to_account').order_by('-timestamp')

        if export_format == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Date', 'Type', 'Amount', 'Description', 'Status'])

            for transaction in transactions:
                writer.writerow([
                    transaction.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    transaction.transaction_type,
                    str(transaction.amount),
                    transaction.description,
                    transaction.status
                ])

            # In a real implementation, you'd save this to a file or send via email
            # For now, we'll just log the completion
            logger.info(f"Transaction data exported for user {user_id} in CSV format")
            return f"Exported {transactions.count()} transactions for user {user.username}"

        else:
            logger.warning(f"Unsupported export format: {export_format}")
            return f"Unsupported format {export_format}"

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for data export")
        return f"User {user_id} not found"
    except Exception as exc:
        logger.error(f"Failed to export transaction data: {exc}")
        try:
            self.retry(countdown=180 * (2 ** self.request.retries))
        except MaxRetriesException:
            logger.critical("Max retries exceeded for data export")
            raise


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def system_health_check(self):
    """Perform system health checks and send alerts if issues detected."""
    try:
        health_issues = []

        # Check database connectivity
        try:
            Account.objects.count()
        except Exception as e:
            health_issues.append(f"Database connectivity issue: {e}")

        # Check for pending transactions older than 24 hours
        old_pending_transactions = Transaction.objects.filter(
            status='pending',
            timestamp__lt=datetime.now() - timedelta(hours=24)
        ).count()

        if old_pending_transactions > 0:
            health_issues.append(f"{old_pending_transactions} transactions pending for more than 24 hours")

        # Check for unresolved fraud alerts
        unresolved_alerts = FraudAlert.objects.filter(
            is_resolved=False,
            created_at__lt=datetime.now() - timedelta(days=7)
        ).count()

        if unresolved_alerts > 0:
            health_issues.append(f"{unresolved_alerts} fraud alerts unresolved for more than 7 days")

        # Send health report
        subject = "System Health Check Report"
        if health_issues:
            message = "System health issues detected:\n\n" + "\n".join(f"- {issue}" for issue in health_issues)
            severity = "WARNING"
        else:
            message = "All systems operating normally."
            severity = "INFO"

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [settings.ADMIN_EMAIL],
        )

        logger.info(f"System health check completed. Issues found: {len(health_issues)}")
        return f"Health check completed. {len(health_issues)} issues found."
    
    except Exception as exc:
        logger.error(f"Failed to perform system health check: {exc}")
        try:
            self.retry(countdown=300)
        except MaxRetriesException:
            logger.critical("Max retries exceeded for system health check")
            raise


# ============================================================================
# ML FRAUD DETECTION TASKS
# ============================================================================

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def retrain_fraud_detection_model(self):
    """
    Periodically retrain the ML fraud detection model.
    Run weekly to incorporate new transaction patterns.
    """
    try:
        from core.ml.fraud_detector import get_fraud_detector
        
        detector = get_fraud_detector()
        result = detector.train()
        
        if result['success']:
            logger.info(f"Fraud detection model retrained: {result['samples_used']} samples")
        else:
            logger.warning(f"Fraud detection model training failed: {result['message']}")
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to retrain fraud detection model: {exc}")
        try:
            self.retry(countdown=3600)  # Retry in 1 hour
        except MaxRetriesException:
            logger.critical("Max retries exceeded for fraud model retraining")
            raise


@shared_task
def analyze_transaction_for_fraud(transaction_id: int):
    """
    Analyze a specific transaction for fraud asynchronously.
    Creates FraudAlert if anomaly detected.
    """
    try:
        from core.ml.fraud_detector import analyze_transaction
        
        transaction = Transaction.objects.get(pk=transaction_id)
        result = analyze_transaction(transaction)
        
        if result['is_anomaly']:
            # Get user from transaction account
            user = None
            if transaction.from_account:
                user = transaction.from_account.user
            elif transaction.to_account:
                user = transaction.to_account.user
            
            if user:
                # Create fraud alert using existing model fields
                FraudAlert.objects.create(
                    user=user,
                    severity=result['risk_level'],
                    message=f"[ML-ANOMALY] Risk score: {result['risk_score']:.2%}. "
                           f"Transaction ID: {transaction.pk}, Amount: {transaction.amount}. "
                           f"Type: {transaction.transaction_type}.",
                )
                logger.warning(f"Fraud alert created for transaction {transaction_id}: {result['risk_level']}")
        
        return result
        
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found for fraud analysis")
        return {'error': 'Transaction not found'}
    except Exception as exc:
        logger.error(f"Failed to analyze transaction {transaction_id}: {exc}")
        return {'error': str(exc)}


@shared_task(bind=True, max_retries=2)
def batch_analyze_recent_transactions(self, hours: int = 24):
    """
    Batch analyze recent transactions for fraud.
    Useful for catching fraud that might have been missed.
    """
    try:
        from core.ml.fraud_detector import get_fraud_detector
        from django.utils import timezone
        
        detector = get_fraud_detector()
        
        recent_transactions = Transaction.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=hours),
            status='completed'
        )
        
        anomalies_found = 0
        for transaction in recent_transactions[:1000]:  # Limit batch size
            result = detector.predict(transaction)
            
            if result['is_anomaly']:
                # Get user from transaction
                user = None
                if transaction.from_account:
                    user = transaction.from_account.user
                elif transaction.to_account:
                    user = transaction.to_account.user
                
                if user:
                    # Check if similar alert already exists (avoid duplicates)
                    existing = FraudAlert.objects.filter(
                        user=user,
                        message__contains=f"Transaction ID: {transaction.pk}",
                        created_at__gte=timezone.now() - timedelta(hours=24)
                    ).exists()
                    
                    if not existing:
                        FraudAlert.objects.create(
                            user=user,
                            severity=result['risk_level'],
                            message=f"[ML-BATCH] Risk score: {result['risk_score']:.2%}. "
                                   f"Transaction ID: {transaction.pk}, Amount: {transaction.amount}.",
                        )
                        anomalies_found += 1
        
        logger.info(f"Batch fraud analysis complete: {anomalies_found} anomalies found")
        return {'transactions_analyzed': recent_transactions.count(), 'anomalies_found': anomalies_found}
        
    except Exception as exc:
        logger.error(f"Failed batch fraud analysis: {exc}")
        try:
            self.retry(countdown=600)
        except MaxRetriesException:
            raise