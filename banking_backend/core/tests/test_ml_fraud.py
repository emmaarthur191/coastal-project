import os
import joblib
import numpy as np
import pytest
from unittest.mock import MagicMock, patch
from decimal import Decimal
from django.utils import timezone
from core.ml.fraud_detector import MLFraudDetector, get_fraud_detector, analyze_transaction
from core.models import Transaction, Account
from users.models import User

@pytest.fixture
def real_transaction(db):
    user = User.objects.create_user(
        username="testuser_ml",
        email="test_ml@example.com",
        password="Password123!",
        phone_number="+1234567890"
    )
    account = Account.objects.create(
        user=user,
        account_number="ML123456",
        balance=Decimal("1000.00"),
        account_type="daily_susu"
    )
    tx = Transaction.objects.create(
        from_account=account,
        amount=Decimal("500.00"),
        transaction_type="withdrawal",
        status="completed"
    )
    return tx

@pytest.mark.django_db
class TestMLFraudDetector:

    @patch("core.ml.fraud_detector.joblib.load")
    @patch("core.ml.fraud_detector.os.path.exists")
    @patch("core.ml.fraud_detector.os.makedirs")
    def test_initialization_existing_model(self, mock_makedirs, mock_exists, mock_load):
        mock_exists.return_value = True
        mock_load.side_effect = ["mock_model", "mock_scaler"]
        detector = MLFraudDetector()
        assert detector.model == "mock_model"
        assert detector.scaler == "mock_scaler"
        assert mock_makedirs.called

    @patch("core.ml.fraud_detector.os.path.exists")
    def test_initialization_new_model(self, mock_exists):
        mock_exists.return_value = False
        detector = MLFraudDetector()
        from sklearn.ensemble import IsolationForest
        from sklearn.preprocessing import StandardScaler
        assert isinstance(detector.model, IsolationForest)
        assert isinstance(detector.scaler, StandardScaler)

    def test_extract_features(self, real_transaction):
        detector = MLFraudDetector()
        features = detector.extract_features(real_transaction)
        assert "amount" in features
        assert features["amount"] == 500.0
        assert "hour_of_day" in features
        assert "day_of_week" in features

    def test_predict_not_fitted(self, real_transaction):
        detector = MLFraudDetector()
        with patch("sklearn.utils.validation.check_is_fitted", side_effect=ValueError("Not fitted")):
            result = detector.predict(real_transaction)
            assert result["is_anomaly"] == False
            assert result["risk_level"] == "low"

    def test_predict_fitted_anomaly_risk_levels(self, real_transaction):
        detector = MLFraudDetector()
        detector.model = MagicMock()
        detector.scaler = MagicMock()
        detector.scaler.mean_ = np.array([0]*len(detector.FEATURES))
        detector.scaler.transform.return_value = np.array([[0]*len(detector.FEATURES)])
        
        with patch("sklearn.utils.validation.check_is_fitted"):
            # Critical risk
            detector.model.decision_function.return_value = np.array([-0.9])
            result = detector.predict(real_transaction)
            assert result["risk_level"] == "critical"
            
            # High risk (-0.6: < -0.5 and > -0.8)
            detector.model.decision_function.return_value = np.array([-0.6])
            result = detector.predict(real_transaction)
            assert result["risk_level"] == "high"
            
            # Medium risk (-0.1: < 0 and > -0.5)
            detector.model.decision_function.return_value = np.array([-0.1])
            result = detector.predict(real_transaction)
            assert result["risk_level"] == "medium"
            
            # Low risk
            detector.model.decision_function.return_value = np.array([0.5])
            result = detector.predict(real_transaction)
            assert result["risk_level"] == "low"

    def test_predict_exception(self, real_transaction):
        detector = MLFraudDetector()
        with patch.object(detector, 'extract_features', side_effect=Exception("Data error")):
            result = detector.predict(real_transaction)
            assert result["is_anomaly"] == False
            assert result["risk_level"] == "unknown"

    @patch("core.ml.fraud_detector.joblib.dump")
    def test_train_insufficient_data(self, mock_dump):
        detector = MLFraudDetector()
        Transaction.objects.all().delete()
        result = detector.train(min_samples=10)
        assert result["success"] is False

    @patch("core.ml.fraud_detector.joblib.dump")
    def test_train_success_and_error_handling(self, mock_dump, real_transaction):
        detector = MLFraudDetector()
        account = real_transaction.from_account
        transactions = [
            Transaction(
                from_account=account, amount=Decimal("10.00"), 
                transaction_type="deposit", status="completed"
            ) for _ in range(15)
        ]
        Transaction.objects.bulk_create(transactions)
        
        # Test success
        result = detector.train(min_samples=10)
        assert result["success"] is True
        
        # Test error handling inside loop (line 259-260)
        with patch.object(detector, 'extract_features', side_effect=Exception("Fail within loop")):
            result = detector.train(min_samples=1)
            # If all fail, it returns False with "Insufficient data"
            assert result["success"] is False

    @patch("core.ml.fraud_detector.os.path.exists")
    @patch("core.ml.fraud_detector.os.path.getmtime")
    def test_get_model_info_and_is_fitted_error(self, mock_mtime, mock_exists):
        detector = MLFraudDetector()
        mock_exists.return_value = True
        mock_mtime.return_value = 1640995200.0
        
        # Call get_model_info (hits 294-297)
        info = detector.get_model_info()
        assert info["model_exists"] is True
        
        # Hit _is_fitted exception (line 315-316)
        detector.model = None
        assert detector._is_fitted() is False
        
        # Hit _is_fitted success
        detector.model = MagicMock()
        with patch("sklearn.utils.validation.check_is_fitted"):
            assert detector._is_fitted() is True

    def test_singleton_and_wrapper(self, real_transaction):
        with patch("core.ml.fraud_detector.MLFraudDetector.predict") as mock_predict:
            mock_predict.return_value = {"is_anomaly": False}
            result = analyze_transaction(real_transaction)
            assert get_fraud_detector() is get_fraud_detector()
