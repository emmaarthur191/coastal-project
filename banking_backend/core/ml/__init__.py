"""
ML Package for Coastal Banking

Contains machine learning models for fraud detection and analytics.
"""
from .fraud_detector import (
    MLFraudDetector,
    get_fraud_detector,
    analyze_transaction,
)

__all__ = [
    'MLFraudDetector',
    'get_fraud_detector',
    'analyze_transaction',
]
