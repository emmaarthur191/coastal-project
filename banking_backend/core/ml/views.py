"""ML Fraud Detection API Views

Provides API endpoints for:
- Analyzing transactions for fraud
- Training/retraining the ML model
- Getting model status and metrics
"""

import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import FraudAlert, Transaction

logger = logging.getLogger(__name__)


class MLFraudAnalysisView(APIView):
    """POST: Analyze a specific transaction for fraud."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Analyze a transaction for potential fraud."""
        from core.ml.fraud_detector import analyze_transaction

        transaction_id = request.data.get("transaction_id")

        if not transaction_id:
            return Response({"error": "transaction_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transaction.objects.get(pk=transaction_id)

            # Check permission - user can only analyze their own transactions
            # unless they're staff
            if not request.user.is_staff:
                if transaction.from_account and transaction.from_account.user != request.user:
                    if transaction.to_account and transaction.to_account.user != request.user:
                        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            result = analyze_transaction(transaction)

            return Response(
                {
                    "transaction_id": transaction_id,
                    "analysis": result,
                    "timestamp": timezone.now().isoformat(),
                }
            )

        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error analyzing transaction: {e}")
            return Response(
                {"error": "Analysis failed", "detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MLModelStatusView(APIView):
    """GET: Get ML fraud detection model status and info."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get model status and metrics."""
        from datetime import timedelta

        from core.ml.fraud_detector import get_fraud_detector

        detector = get_fraud_detector()
        model_info = detector.get_model_info()

        # Add recent detection stats - filter ML alerts by message prefix
        ml_alerts = FraudAlert.objects.filter(
            message__startswith="[ML-", created_at__gte=timezone.now() - timedelta(days=7)
        )

        # Get all alerts for comparison
        all_alerts = FraudAlert.objects.filter(created_at__gte=timezone.now() - timedelta(days=7))

        stats = {
            "model_info": model_info,
            "ml_alerts": {
                "total": ml_alerts.count(),
                "by_severity": {
                    "critical": ml_alerts.filter(severity="critical").count(),
                    "high": ml_alerts.filter(severity="high").count(),
                    "medium": ml_alerts.filter(severity="medium").count(),
                    "low": ml_alerts.filter(severity="low").count(),
                },
                "resolved": ml_alerts.filter(is_resolved=True).count(),
            },
            "all_alerts": {
                "total": all_alerts.count(),
                "resolved": all_alerts.filter(is_resolved=True).count(),
            },
        }

        return Response(stats)


class MLModelTrainView(APIView):
    """POST: Trigger model retraining."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        """Trigger model retraining."""
        async_mode = request.data.get("async", True)

        if async_mode:
            # Trigger async task
            from core.tasks import retrain_fraud_detection_model

            task = retrain_fraud_detection_model.delay()

            return Response(
                {
                    "message": "Model retraining started",
                    "task_id": str(task.id),
                }
            )
        else:
            # Synchronous training (for testing)
            from core.ml.fraud_detector import get_fraud_detector

            detector = get_fraud_detector()
            result = detector.train()

            return Response(
                {
                    "message": "Model training completed",
                    "result": result,
                }
            )


class MLBatchAnalysisView(APIView):
    """POST: Trigger batch analysis of recent transactions."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        """Trigger batch fraud analysis."""
        hours = request.data.get("hours", 24)

        from core.tasks import batch_analyze_recent_transactions

        task = batch_analyze_recent_transactions.delay(hours=hours)

        return Response(
            {
                "message": f"Batch analysis started for last {hours} hours",
                "task_id": str(task.id),
            }
        )
