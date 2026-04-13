"""Loan-related views for Coastal Banking.

This module contains views for managing loan applications and approvals.
"""

import logging
from decimal import Decimal

from django.db import models, transaction
from rest_framework import mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models.loans import Loan
from core.permissions import STAFF_ROLES, IsCustomer, IsManagerOrAdmin, IsStaff
from core.serializers.loans import LoanSerializer
from core.services.loans import LoanService

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

    def get_object(self):
        """Enforce amount-based role restrictions on detail view access."""
        obj = super().get_object()
        user = self.request.user

        if user.is_staff and not user.is_superuser:
            if user.role == "operations_manager" and obj.amount >= 1000:
                raise PermissionDenied(
                    detail="Operations Managers cannot access loans >= 1000 GHS. Escalate to Manager."
                )
            if user.role == "manager" and obj.amount < 1000:
                # Optional: Strict separation - Managers only see large loans?
                # Usually managers see everything, but following the "pending" list logic:
                pass

        return obj

    def get_queryset(self):
        """Filter loans so customers only see their own applications. Optimized with select_related."""
        user = self.request.user
        queryset = self.queryset.select_related("user")
        if user.role == "customer":
            return queryset.filter(user=user)
        return queryset

    def get_permissions(self):
        """Map loan-related actions to their required permission classes."""
        if self.action in ["update", "partial_update", "pending"]:
            return [IsStaff()]
        if self.action == "approve":
            return [IsManagerOrAdmin()]
        if self.action == "create":
            from core.permissions import IsStaffOrCustomer

            return [IsStaffOrCustomer()]
        # Default to both staff and customers for list/retrieve
        from core.permissions import IsStaffOrCustomer

        return [IsStaffOrCustomer()]

    def perform_create(self, serializer):
        """Set the applicant (user) and initiator (requested_by) when creating a new loan.
        Staff can specify a user, customers apply for themselves.
        """
        user_id = self.request.data.get("user")
        is_staff_initiator = self.request.user.role in STAFF_ROLES or self.request.user.is_staff
        
        if user_id and is_staff_initiator:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                applicant = User.objects.get(id=user_id)

                # SECURITY: Enforcement of authority limits for staff initiators
                if self.request.user.role not in ["manager", "operations_manager", "admin"]:
                    from core.models.operational import ClientAssignment
                    if self.request.user.role == "mobile_banker":
                        is_assigned = ClientAssignment.objects.filter(
                            mobile_banker=self.request.user, client=applicant, is_active=True
                        ).exists()
                        if not is_assigned:
                            raise PermissionDenied("not authorized to initiate requests for this client")
                    elif self.request.user.role == "cashier":
                        # Cashiers can initiate, but strictly requires Maker-Checker (which is enforced in approve)
                        pass
                    else:
                        raise PermissionDenied(
                            "Your role does not have permission to initiate loan applications for customers."
                        )

                serializer.save(
                    user=applicant, 
                    requested_by=self.request.user,
                    verification_notes=self.request.data.get("verification_notes", "")
                )
            except User.DoesNotExist:
                raise serializers.ValidationError({"user": "Specified user does not exist."})
        else:
            # Customer applying for themselves
            serializer.save(user=self.request.user, requested_by=None)

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

            logger.exception(f"Loan approval failed for loan {loan.id}")
            return Response(
                {
                    "status": "error",
                    "message": "An unexpected error occurred during approval.",
                    "code": "LOAN_APPROVAL_FAILED",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def reject(self, request, pk=None):
        """Reject a loan application."""
        loan = self.get_object()
        notes = request.data.get("notes", "Rejected by Staff")

        if loan.status != "pending":
            return Response({"error": "Loan is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        # Maker-Checker Enforcement
        if loan.user == request.user:
            return Response(
                {"error": "Maker-Checker Violation: You cannot reject your own loan application."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                LoanService.reject_loan(loan, notes=notes)

            return Response(
                {"status": "success", "message": "Loan application rejected.", "data": LoanSerializer(loan).data}
            )
        except Exception as e:
            logger.exception(f"Loan rejection failed for loan {loan.id}")
            return Response(
                {"status": "error", "message": "An unexpected error occurred during rejection.", "code": "LOAN_REJECTION_FAILED"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get all pending loan applications filtered by role authority."""
        user = request.user
        queryset = self.get_queryset().filter(status="pending")

        # Filter based on role if staff
        if user.is_staff and not user.is_superuser:
            if user.role == "operations_manager":
                # Operations Manager sees < 1000
                queryset = queryset.filter(amount__lt=1000)
            elif user.role == "manager":
                # Manager sees >= 1000
                queryset = queryset.filter(amount__gte=1000)
            elif user.role == "admin":
                # Admin role sees all if not superuser
                pass

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsCustomer])
    def repay(self, request, pk=None):
        """Allow customers or staff to initiate a loan repayment."""
        loan = self.get_object()
        user = request.user

        # Security: Customer can only repay their own loan (handled by get_object/get_queryset)
        # Staff can initiate repayments for customer loans

        amount = request.data.get("amount")
        if not amount:
            return Response({"error": "Repayment amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount))
            with transaction.atomic():
                updated_loan = LoanService.repay_loan(loan, amount)

            return Response(
                {
                    "status": "success",
                    "message": f"Repayment of GHS {amount} processed.",
                    "data": LoanSerializer(updated_loan).data,
                }
            )
        except Exception as e:
            from core.exceptions import InsufficientFundsError

            if isinstance(e, (InsufficientFundsError, serializers.ValidationError)):
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            logger.exception(f"Repayment failed for loan {loan.id}")
            return Response(
                {"status": "error", "message": "An unexpected error occurred during repayment processing.", "code": "REPAYMENT_FAILED"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], permission_classes=[IsStaff])
    def search(self, request):
        """Search loans by member name, email or ID using HMAC hashes."""
        queryset = self.get_queryset()

        # Filter by member (user name, email, or ID)
        member = request.query_params.get("member")
        if member:
            from core.utils.field_encryption import hash_field

            search_hash = hash_field(member)

            queryset = queryset.filter(
                models.Q(user__email__icontains=member)
                | models.Q(user__id__icontains=member)
                | models.Q(user__first_name_hash=search_hash)
                | models.Q(user__last_name_hash=search_hash)
            )

        # Filter by status
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        # Order by created_at desc
        queryset = queryset.select_related("user").order_by("-created_at")

        # Paginate results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Fallback if no pagination (not expected)
        serializer = self.get_serializer(queryset[:100], many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})
