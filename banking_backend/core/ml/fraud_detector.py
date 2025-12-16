"""
ML-Based Fraud Detection Service

This module provides machine learning-based fraud detection using:
1. Isolation Forest for outlier/anomaly detection
2. Feature engineering for transaction patterns
3. Real-time prediction during transaction processing

Usage:
    from core.ml.fraud_detector import MLFraudDetector
    
    detector = MLFraudDetector()
    result = detector.predict(transaction)
    if result['is_anomaly']:
        create_fraud_alert(transaction, result)
"""
import logging
import os
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional
import pickle

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

from django.conf import settings
from django.utils import timezone
from django.db.models import Avg, Sum, Count

logger = logging.getLogger(__name__)


class MLFraudDetector:
    """
    Machine Learning-based fraud detection using Isolation Forest.
    
    The model learns normal transaction patterns and flags anomalies
    that deviate significantly from learned patterns.
    """
    
    # Model persistence paths
    MODEL_DIR = os.path.join(settings.BASE_DIR, 'ml_models')
    MODEL_PATH = os.path.join(MODEL_DIR, 'fraud_detector.joblib')
    SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.joblib')
    
    # Feature configuration
    FEATURES = [
        'amount',
        'hour_of_day',
        'day_of_week',
        'days_since_last_transaction',
        'transactions_last_24h',
        'amount_vs_avg_ratio',
        'account_age_days',
        'is_weekend',
        'velocity_score',
    ]
    
    # Thresholds
    ANOMALY_THRESHOLD = -0.5  # Isolation Forest score threshold
    HIGH_RISK_THRESHOLD = -0.8
    
    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
        self._load_or_initialize_model()
    
    def _load_or_initialize_model(self):
        """Load existing model or initialize a new one."""
        os.makedirs(self.MODEL_DIR, exist_ok=True)
        
        if os.path.exists(self.MODEL_PATH) and os.path.exists(self.SCALER_PATH):
            try:
                self.model = joblib.load(self.MODEL_PATH)
                self.scaler = joblib.load(self.SCALER_PATH)
                logger.info("Loaded existing fraud detection model")
            except Exception as e:
                logger.warning(f"Failed to load model: {e}. Initializing new model.")
                self._initialize_new_model()
        else:
            self._initialize_new_model()
    
    def _initialize_new_model(self):
        """Initialize a new Isolation Forest model."""
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.01,  # Expected 1% fraud rate
            random_state=42,
            n_jobs=-1,
            warm_start=True,  # Allow incremental training
        )
        self.scaler = StandardScaler()
        logger.info("Initialized new fraud detection model")
    
    def extract_features(self, transaction) -> dict:
        """
        Extract features from a transaction for ML prediction.
        
        Args:
            transaction: Transaction model instance
            
        Returns:
            Dictionary of feature values
        """
        from core.models import Transaction
        
        now = timezone.now()
        account = transaction.from_account or transaction.to_account
        
        # Time-based features
        tx_time = transaction.timestamp if hasattr(transaction, 'timestamp') and transaction.timestamp else now
        hour_of_day = tx_time.hour
        day_of_week = tx_time.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Account age
        account_created = account.created_at if hasattr(account, 'created_at') else now
        account_age_days = max((now - account_created).days, 1)
        
        # Transaction history features
        recent_transactions = Transaction.objects.filter(
            from_account=account
        ).exclude(
            pk=transaction.pk if transaction.pk else None
        ).order_by('-timestamp')[:100]
        
        # Days since last transaction
        last_tx = recent_transactions.first()
        if last_tx and last_tx.timestamp:
            days_since_last = (now - last_tx.timestamp).total_seconds() / 86400
        else:
            days_since_last = account_age_days  # First transaction
        
        # Transactions in last 24 hours
        transactions_24h = Transaction.objects.filter(
            from_account=account,
            timestamp__gte=now - timedelta(hours=24)
        ).exclude(pk=transaction.pk if transaction.pk else None).count()
        
        # Amount statistics
        avg_amount = recent_transactions.aggregate(avg=Avg('amount'))['avg'] or Decimal('100')
        amount_vs_avg = float(transaction.amount) / float(avg_amount) if avg_amount else 1.0
        
        # Velocity score (transactions per day in last week)
        week_count = Transaction.objects.filter(
            from_account=account,
            timestamp__gte=now - timedelta(days=7)
        ).count()
        velocity_score = week_count / 7.0
        
        return {
            'amount': float(transaction.amount),
            'hour_of_day': hour_of_day,
            'day_of_week': day_of_week,
            'days_since_last_transaction': min(days_since_last, 365),  # Cap at 1 year
            'transactions_last_24h': transactions_24h,
            'amount_vs_avg_ratio': min(amount_vs_avg, 100),  # Cap extreme ratios
            'account_age_days': min(account_age_days, 3650),  # Cap at 10 years
            'is_weekend': is_weekend,
            'velocity_score': min(velocity_score, 50),  # Cap at 50 tx/day
        }
    
    def predict(self, transaction) -> dict:
        """
        Predict if a transaction is potentially fraudulent.
        
        Args:
            transaction: Transaction model instance
            
        Returns:
            Dictionary with prediction results:
            - is_anomaly: bool
            - risk_score: float (0-1, higher = more risky)
            - risk_level: str ('low', 'medium', 'high', 'critical')
            - features: dict of extracted features
            - raw_score: float (Isolation Forest score)
        """
        try:
            features = self.extract_features(transaction)
            feature_array = np.array([[features[f] for f in self.FEATURES]])
            
            # Scale features if scaler is fitted
            if hasattr(self.scaler, 'mean_') and self.scaler.mean_ is not None:
                feature_array = self.scaler.transform(feature_array)
            
            # Get anomaly score (-1 for anomalies, 1 for normal)
            # decision_function returns negative scores for anomalies
            raw_score = self.model.decision_function(feature_array)[0]
            
            # Convert to risk score (0-1, higher = riskier)
            risk_score = max(0, min(1, (self.ANOMALY_THRESHOLD - raw_score) / abs(self.ANOMALY_THRESHOLD)))
            
            # Determine risk level
            if raw_score < self.HIGH_RISK_THRESHOLD:
                risk_level = 'critical'
            elif raw_score < self.ANOMALY_THRESHOLD:
                risk_level = 'high'
            elif raw_score < 0:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            is_anomaly = raw_score < self.ANOMALY_THRESHOLD
            
            result = {
                'is_anomaly': is_anomaly,
                'risk_score': round(risk_score, 4),
                'risk_level': risk_level,
                'features': features,
                'raw_score': round(raw_score, 4),
            }
            
            logger.info(f"Fraud prediction for transaction: {result['risk_level']} (score: {raw_score:.4f})")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in fraud prediction: {e}")
            # Return safe default on error
            return {
                'is_anomaly': False,
                'risk_score': 0.0,
                'risk_level': 'unknown',
                'features': {},
                'raw_score': 0.0,
                'error': str(e),
            }
    
    def train(self, transactions_queryset=None, min_samples: int = 100) -> dict:
        """
        Train or retrain the fraud detection model.
        
        Args:
            transactions_queryset: Optional queryset of transactions to train on
            min_samples: Minimum number of samples required for training
            
        Returns:
            Dictionary with training results
        """
        from core.models import Transaction
        
        if transactions_queryset is None:
            # Default: use last 90 days of completed transactions
            transactions_queryset = Transaction.objects.filter(
                status='completed',
                timestamp__gte=timezone.now() - timedelta(days=90)
            ).order_by('-timestamp')
        
        # Extract features for all transactions
        features_list = []
        for tx in transactions_queryset[:10000]:  # Limit to 10k for performance
            try:
                features = self.extract_features(tx)
                features_list.append([features[f] for f in self.FEATURES])
            except Exception as e:
                logger.warning(f"Failed to extract features for transaction {tx.pk}: {e}")
        
        if len(features_list) < min_samples:
            return {
                'success': False,
                'message': f'Insufficient data: {len(features_list)} samples (need {min_samples})',
                'samples_available': len(features_list),
            }
        
        # Convert to numpy array
        X = np.array(features_list)
        
        # Fit scaler
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        
        # Train Isolation Forest
        self.model.fit(X_scaled)
        
        # Save models
        joblib.dump(self.model, self.MODEL_PATH)
        joblib.dump(self.scaler, self.SCALER_PATH)
        
        logger.info(f"Trained fraud detection model on {len(features_list)} samples")
        
        return {
            'success': True,
            'message': 'Model trained successfully',
            'samples_used': len(features_list),
            'model_path': self.MODEL_PATH,
        }
    
    def get_model_info(self) -> dict:
        """Get information about the current model."""
        model_exists = os.path.exists(self.MODEL_PATH)
        model_mtime = None
        if model_exists:
            model_mtime = datetime.fromtimestamp(os.path.getmtime(self.MODEL_PATH))
        
        return {
            'model_exists': model_exists,
            'model_path': self.MODEL_PATH,
            'last_trained': model_mtime.isoformat() if model_mtime else None,
            'features': self.FEATURES,
            'anomaly_threshold': self.ANOMALY_THRESHOLD,
            'is_fitted': hasattr(self.model, 'estimators_') and self.model.estimators_ is not None,
        }


# Singleton instance for performance
_detector_instance: Optional[MLFraudDetector] = None


def get_fraud_detector() -> MLFraudDetector:
    """Get or create the singleton fraud detector instance."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = MLFraudDetector()
    return _detector_instance


def analyze_transaction(transaction) -> dict:
    """
    Convenience function to analyze a transaction for fraud.
    
    Args:
        transaction: Transaction model instance
        
    Returns:
        Fraud analysis results
    """
    detector = get_fraud_detector()
    return detector.predict(transaction)
