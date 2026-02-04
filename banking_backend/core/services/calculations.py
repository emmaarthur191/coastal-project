"""Calculation utilities and formula-based services for Coastal Banking."""

from decimal import Decimal


class CalculationService:
    """Service class for banking-related calculations."""

    @staticmethod
    def calculate_commission(amount: Decimal) -> Decimal:
        """Calculate transaction commission based on amount brackets."""
        if amount < 1000:
            rate = Decimal("0.01")
        elif amount < 10000:
            rate = Decimal("0.015")
        else:
            rate = Decimal("0.02")
        return amount * rate
