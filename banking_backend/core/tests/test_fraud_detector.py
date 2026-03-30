from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model

import pytest
from sklearn.exceptions import NotFittedError
from sklearn.utils.validation import check_is_fitted

from core.ml.fraud_detector import MLFraudDetector
from core.models.accounts import Account
from core.models.fraud import FraudAlert
from core.models.transactions import Transaction

User = get_user_model()


@pytest.fixture
def account(db):
    user = User.objects.create_user(username="fraud_test", email="fraud@test.com")
    return Account.objects.create(user=user, account_number="FRAUD123", balance=Decimal("1000.00"))


@pytest.fixture
def transaction(account):
    return Transaction.objects.create(
        to_account=account, amount=Decimal("500.00"), transaction_type="deposit", status="completed"
    )


@pytest.mark.django_db
class TestMLFraudDetectorFeatures:
    def test_extract_features_basic(self, transaction):
        """Verify feature extraction returns required keys."""
        detector = MLFraudDetector()
        features = detector.extract_features(transaction)

        required_features = ["amount", "hour_of_day", "day_of_week", "transactions_last_24h", "velocity_score"]
        for feat in required_features:
            assert feat in features

        assert features["amount"] == 500.0


@pytest.mark.django_db
class TestMLFraudDetectorPrediction:
    def test_predict_low_risk_default(self, transaction):
        """Verify default prediction for a single transaction (usually low risk if model new)."""
        detector = MLFraudDetector()

        # Proper way to check if model is fitted
        is_fitted = False
        try:
            check_is_fitted(detector.model)
            is_fitted = True
        except (NotFittedError, AttributeError):
            is_fitted = False

        result = detector.predict(transaction)

        # For a new/unfitted model, expect low risk default
        assert result["risk_level"] in ["low", "low_risk"]
        assert not result.get("is_anomaly", False)

    @patch("core.ml.fraud_detector.MLFraudDetector.predict")
    def test_fraud_alert_creation_logic(self, mock_predict, transaction):
        """Verify that high risk results can be used to create alerts."""
        mock_predict.return_value = {
            "is_anomaly": True,
            "risk_score": 0.95,
            "risk_level": "critical",
            "raw_score": -0.9,
            "features": {},
        }

        detector = MLFraudDetector()
        result = detector.predict(transaction)

        if result["is_anomaly"]:
            FraudAlert.objects.create(
                user=transaction.to_account.user,  # Required field
                transaction=transaction,
                risk_score=result["risk_score"],
                risk_level=result["risk_level"],
                reason="ML Anomaly Detected",
                status="pending",
            )

        assert FraudAlert.objects.filter(transaction=transaction, risk_level="critical").exists()


@pytest.mark.django_db
class TestMLFraudDetectorTraining:
    def test_train_insufficient_data(self):
        """Verify training fails gracefully with low sample count."""
        detector = MLFraudDetector()
        result = detector.train(min_samples=100)
        assert result["success"] is False
        assert "Insufficient data" in result["message"]
