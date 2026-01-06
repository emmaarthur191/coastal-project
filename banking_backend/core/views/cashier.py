"""Cashier-related views for Coastal Banking.

This module contains views for cashier operations including cash drawers,
cash advances, and check deposits.
"""

import logging
from decimal import Decimal

from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models import (
    Account,
    CashAdvance,
    CashDrawer,
    CashDrawerDenomination,
    CheckDeposit,
)
from core.permissions import IsStaff
from core.serializers import (
    CashAdvanceSerializer,
    CashDrawerSerializer,
    CheckDepositSerializer,
)

logger = logging.getLogger(__name__)


class CashAdvanceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing cash advance requests."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return cash advances for the current user."""
        return CashAdvance.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Return the serializer class for cash advances."""
        return CashAdvanceSerializer

    def perform_create(self, serializer):
        """Set the user and submitted_by when creating a cash advance."""
        serializer.save(user=self.request.user, submitted_by=self.request.user if self.request.user.is_staff else None)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def approve(self, request, pk=None):
        """Approve a cash advance request."""
        from django.core.exceptions import PermissionDenied

        from .models import CashAdvance

        try:
            advance = CashAdvance.objects.select_related("user", "submitted_by").get(pk=pk)

            # SECURITY: Maker-Checker Enforcement
            if advance.submitted_by and advance.submitted_by == request.user:
                raise PermissionDenied("You cannot approve a cash advance that you submitted.")

            # SECURITY: Authorization check
            if not request.user.is_superuser:
                if hasattr(request.user, "role") and request.user.role != "manager":
                    if hasattr(advance.user, "branch") and hasattr(request.user, "branch"):
                        if advance.user.branch != request.user.branch:
                            return Response({"error": "Not authorized to approve this request"}, status=403)

            if advance.status != "pending":
                return Response({"error": "Can only approve pending requests"}, status=400)
            advance.status = "approved"
            advance.approved_by = request.user
            advance.save()
            return Response({"status": "success", "message": "Cash advance approved"})
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=403)
        except CashAdvance.DoesNotExist:
            return Response({"error": "Cash advance not found"}, status=404)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def disburse(self, request, pk=None):
        """Disburse an approved cash advance."""
        try:
            advance = CashAdvance.objects.select_related("user").get(pk=pk)

            if not request.user.is_superuser:
                if hasattr(request.user, "role") and request.user.role != "manager":
                    if hasattr(advance.user, "branch") and hasattr(request.user, "branch"):
                        if advance.user.branch != request.user.branch:
                            return Response({"error": "Not authorized to disburse this advance"}, status=403)

            if advance.status != "approved":
                return Response({"error": "Can only disburse approved advances"}, status=400)
            advance.status = "disbursed"
            advance.save()
            return Response({"status": "success", "message": "Cash advance disbursed"})
        except CashAdvance.DoesNotExist:
            return Response({"error": "Cash advance not found"}, status=404)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def repay(self, request, pk=None):
        """Mark a cash advance as repaid."""
        try:
            advance = CashAdvance.objects.select_related("user").get(pk=pk)

            if not request.user.is_superuser:
                if hasattr(request.user, "role") and request.user.role != "manager":
                    if hasattr(advance.user, "branch") and hasattr(request.user, "branch"):
                        if advance.user.branch != request.user.branch:
                            return Response({"error": "Not authorized to process this repayment"}, status=403)

            if advance.status != "disbursed":
                return Response({"error": "Can only repay disbursed advances"}, status=400)
            advance.status = "repaid"
            advance.repaid_at = timezone.now()
            advance.save()
            return Response({"status": "success", "message": "Cash advance marked as repaid"})
        except CashAdvance.DoesNotExist:
            return Response({"error": "Cash advance not found"}, status=404)


class CashDrawerViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing cash drawers."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["opened_at"]
    ordering = ["-opened_at"]

    def get_queryset(self):
        """Return cash drawers assigned to the current cashier."""
        return CashDrawer.objects.filter(cashier=self.request.user)

    def get_serializer_class(self):
        """Return the serializer class for cash drawers."""
        return CashDrawerSerializer

    def perform_create(self, serializer):
        """Assign the current user as the cashier when opening a drawer."""
        serializer.save(cashier=self.request.user)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        """Close a cash drawer."""
        try:
            drawer = CashDrawer.objects.get(pk=pk, cashier=request.user)
            if drawer.status != "open":
                return Response({"error": "Drawer is not open"}, status=400)

            closing_balance = request.data.get("closing_balance")
            if closing_balance:
                drawer.closing_balance = Decimal(str(closing_balance))
                drawer.variance = drawer.closing_balance - drawer.current_balance

            # Add closing denominations if provided
            closing_denoms = request.data.get("closing_denominations", [])
            for denom in closing_denoms:
                CashDrawerDenomination.objects.create(
                    cash_drawer=drawer,
                    denomination=Decimal(str(denom.get("denomination"))),
                    count=denom.get("count", 0),
                    is_opening=False,
                )

            drawer.status = "closed"
            drawer.closed_at = timezone.now()
            drawer.save()

            return Response({"status": "success", "message": "Drawer closed", "variance": str(drawer.variance)})
        except CashDrawer.DoesNotExist:
            return Response({"error": "Cash drawer not found"}, status=404)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def reconcile(self, request, pk=None):
        """Reconcile a closed cash drawer."""
        try:
            drawer = CashDrawer.objects.get(pk=pk)

            # SECURITY: Only the drawer owner or managers can reconcile
            if drawer.cashier != request.user and request.user.role not in ["manager", "admin", "superuser"]:
                return Response(
                    {"error": "Not authorized to reconcile this drawer"},
                    status=403,
                )

            if drawer.status != "closed":
                return Response({"error": "Drawer must be closed before reconciliation"}, status=400)
            drawer.status = "reconciled"
            drawer.notes = request.data.get("notes", drawer.notes)
            drawer.save()
            return Response({"status": "success", "message": "Drawer reconciled"})
        except CashDrawer.DoesNotExist:
            return Response({"error": "Cash drawer not found"}, status=404)


class CheckDepositViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing check deposits."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return check deposits based on user role (staff see all, customers see own)."""
        if self.request.user.role in ["staff", "cashier", "manager", "admin", "superuser"]:
            return CheckDeposit.objects.all()
        return CheckDeposit.objects.filter(account__user=self.request.user)

    def get_serializer_class(self):
        """Return the serializer class for check deposits."""
        return CheckDepositSerializer

    @action(detail=False, methods=["post"])
    def process_check_deposit(self, request):
        """Process a check deposit from the cashier dashboard."""
        import uuid

        try:
            member_id = request.data.get("member_id")
            amount = request.data.get("amount")
            account_type = request.data.get("account_type", "daily_susu")

            if not member_id or not amount:
                return Response({"error": "member_id and amount are required"}, status=400)

            account = Account.objects.filter(user_id=member_id, account_type=account_type).first()
            if not account:
                return Response({"error": "Account not found"}, status=404)

            check_deposit = CheckDeposit.objects.create(
                account=account,
                amount=Decimal(str(amount)),
                check_number=f"CHK-{uuid.uuid4().hex[:8].upper()}",
                bank_name=request.data.get("bank_name", "Unknown"),
                status="pending",
                submitted_by=request.user if request.user.is_staff else None,
            )

            if "front_image" in request.FILES:
                check_deposit.front_image = request.FILES["front_image"]
            if "back_image" in request.FILES:
                check_deposit.back_image = request.FILES["back_image"]
            check_deposit.save()

            return Response(
                {
                    "status": "pending",
                    "transaction_id": check_deposit.check_number,
                    "id": check_deposit.id,
                    "message": "Check deposit submitted for processing",
                }
            )
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def approve(self, request, pk=None):
        """Approve a check deposit and credit the account."""
        try:
            check = CheckDeposit.objects.select_related("submitted_by").get(pk=pk)

            # SECURITY: Maker-Checker Enforcement
            if check.submitted_by and check.submitted_by == request.user:
                raise PermissionDenied("You cannot approve a check deposit that you submitted.")

            if check.status != "pending":
                return Response({"error": "Check is not pending"}, status=400)
            check.status = "approved"
            check.processed_by = request.user
            check.processed_at = timezone.now()
            check.account.balance += check.amount
            check.account.save()
            check.save()
            return Response({"status": "success", "message": "Check approved and amount credited"})
        except PermissionDenied as e:
            return Response({"error": str(e)}, status=403)
        except CheckDeposit.DoesNotExist:
            return Response({"error": "Check deposit not found"}, status=404)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def reject(self, request, pk=None):
        """Reject a check deposit."""
        try:
            check = CheckDeposit.objects.get(pk=pk)
            if check.status != "pending":
                return Response({"error": "Check is not pending"}, status=400)
            check.status = "rejected"
            check.rejection_reason = request.data.get("reason", "No reason provided")
            check.processed_by = request.user
            check.processed_at = timezone.now()
            check.save()
            return Response({"status": "success", "message": "Check deposit rejected"})
        except CheckDeposit.DoesNotExist:
            return Response({"error": "Check deposit not found"}, status=404)
