"""ML Package for Coastal Banking

Contains machine learning models for fraud detection and analytics.
"""

from .fraud_detector import (
    MLFraudDetector,
    analyze_transaction,
    get_fraud_detector,
)

__all__ = [
    "MLFraudDetector",
    "analyze_transaction",
    "get_fraud_detector",
]
