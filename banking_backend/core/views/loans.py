"""Loan-related views for Coastal Banking.

This module contains views for managing loan applications and approvals.
"""

import logging

from django.db import transaction
from rest_framework import mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models import Loan
from core.permissions import STAFF_ROLES, IsCustomer, IsStaff
from core.serializers import LoanSerializer
from core.services import LoanService

logger = logging.getLogger(__name__)


class LoanViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter loans so customers only see their own applications."""
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        """Map loan-related actions to their required permission classes."""
        if self.action in ["update", "partial_update", "approve", "pending"]:
            return [IsStaff()]
        if self.action == "create":
            from core.permissions import IsStaffOrCustomer

            return [IsStaffOrCustomer()]
        return [IsCustomer()]

    def perform_create(self, serializer):
        """Set the applicant (user) when creating a new loan.
        Staff can specify a user, customers apply for themselves.
        """
        user_id = self.request.data.get("user")
        if user_id and (self.request.user.role in STAFF_ROLES or self.request.user.is_staff):
            from django.contrib.auth import get_user_model

            User = get_user_model()
            try:
                applicant = User.objects.get(id=user_id)

                # SECURITY FIX (CVE-COASTAL-04): Verify staff has authority over this customer
                # Mobile bankers can only create loans for their assigned clients
                if self.request.user.role == "mobile_banker":
                    from core.models_legacy import ClientAssignment

                    is_assigned = ClientAssignment.objects.filter(
                        mobile_banker=self.request.user, client=applicant, is_active=True
                    ).exists()
                    if not is_assigned:
                        raise serializers.ValidationError({"user": "You are not assigned to this customer."})

                serializer.save(user=applicant)
            except User.DoesNotExist:
                raise serializers.ValidationError({"user": "Specified user does not exist."})
        else:
            serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def approve(self, request, pk=None):
        """Approve a loan application and initiate disbursement."""
        loan = self.get_object()
        user = request.user

        if loan.status != "pending":
            return Response({"error": "Loan is not pending approval."}, status=status.HTTP_400_BAD_REQUEST)

        # Maker-Checker Enforcement
        if loan.user == request.user:
            return Response(
                {"error": "Maker-Checker Violation: You cannot approve your own loan."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                LoanService.approve_loan(loan, approved_by=request.user)

            return Response(
                {"status": "success", "message": "Loan approved and disbursed.", "data": LoanSerializer(loan).data}
            )
        except (PermissionDenied, serializers.ValidationError) as e:
            # Handle DRF-style exceptions if they occur directly
            raise e
        except Exception as e:
            # Handle Django-style or other exceptions
            from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
            from django.core.exceptions import ValidationError as DjangoValidationError

            if isinstance(e, DjangoPermissionDenied):
                return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
            if isinstance(e, DjangoValidationError):
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            logger.error(f"Loan approval failed for loan {loan.id}: {e}")
            return Response(
                {
                    "status": "error",
                    "message": "Failed to approve loan",
                    "code": "LOAN_APPROVAL_FAILED",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get all pending loan applications filtered by role authority."""
        user = request.user
        queryset = self.get_queryset().filter(status="pending")

        # Filter based on role if staff
        if user.is_staff:
            if user.role == "operations_manager":
                # Operations Manager sees < 1000
                queryset = queryset.filter(amount__lt=1000)
            elif user.role == "manager":
                # Manager sees >= 1000
                queryset = queryset.filter(amount__gte=1000)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
