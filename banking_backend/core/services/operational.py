"""Operational-related services for Coastal Banking.

Handles service charges and processing of service requests.
"""

import logging
from decimal import Decimal

from django.utils import timezone

logger = logging.getLogger(__name__)


class ServiceChargeService:
    """Service class for service charge operations."""

    @staticmethod
    def calculate_charges(account_type: str, amount: Decimal) -> Decimal:
        """Calculate service charges for a given account type and amount."""
        # TODO: Implement complex charge logic based on account types
        return Decimal("0.00")


class ServiceRequestService:
    """Service class for processing service requests."""

    @staticmethod
    def process_request(request_obj, status: str, processed_by) -> object:
        """Update a service request status and record processing metadata."""
        request_obj.status = status
        request_obj.processed_by = processed_by
        request_obj.processed_at = timezone.now()
        request_obj.save()
        return request_obj
