"""Calculation views for Coastal Banking.

This module contains views for commission and interest calculations.
"""

import logging
from decimal import Decimal

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsStaff

logger = logging.getLogger(__name__)


class CalculateCommissionView(APIView):
    """View for calculating staff commissions."""

    permission_classes = [IsStaff]

    def post(self, request):
        """Calculate the commission for a given agent based on transaction amount."""
        agent_id = request.data.get("agent_id")
        transaction_amount = Decimal(str(request.data.get("amount", "0")))

        # Simple tier-based calculation logic
        if transaction_amount < 1000:
            rate = Decimal("0.01")  # 1%
        elif transaction_amount < 10000:
            rate = Decimal("0.015")  # 1.5%
        else:
            rate = Decimal("0.02")  # 2%

        commission = transaction_amount * rate

        return Response(
            {
                "agent_id": agent_id,
                "transaction_amount": transaction_amount,
                "commission_rate": f"{rate*100}%",
                "commission_amount": commission,
                "calculated_at": timezone.now(),
            }
        )


class CalculateInterestView(APIView):
    """View for calculating loan or savings interest."""

    permission_classes = [IsStaff]

    def post(self, request):
        """Calculate simple interest for a principal amount over a given duration."""
        principal = Decimal(str(request.data.get("principal", "0")))
        rate = Decimal(str(request.data.get("rate", "0")))  # Annual rate in percent
        time_months = int(request.data.get("months", 0))

        # Simple interest formula: P * R * T / 100
        # Time needs to be in years for annual rate
        interest = (principal * rate * time_months) / (100 * 12)
        total_amount = principal + interest

        return Response(
            {
                "principal": principal,
                "rate_percentage": rate,
                "duration_months": time_months,
                "interest_amount": round(interest, 2),
                "total_amount": round(total_amount, 2),
                "monthly_repayment": round(total_amount / time_months, 2) if time_months > 0 else 0,
            }
        )
