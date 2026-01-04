"""
Service-related views for Coastal Banking.

This module contains views for managing service charges, service requests,
refunds, and complaints.
"""

import logging
from decimal import Decimal

from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models import Complaint, Refund, ServiceCharge, ServiceRequest
from core.permissions import IsStaff
from core.serializers import (
    ComplaintSerializer,
    RefundSerializer,
    ServiceRequestSerializer,
)

logger = logging.getLogger(__name__)


class ServiceChargesView(APIView):
    """View for managing service charges."""

    permission_classes = [IsStaff]

    def get(self, request):
        """Get all service charges."""
        charges = ServiceCharge.objects.filter(is_active=True)
        data = [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "charge_type": c.charge_type,
                "rate": c.rate,
                "applicable_to": c.applicable_to,
                "is_active": c.is_active,
            }
            for c in charges
        ]
        return Response(data)

    def post(self, request):
        """Create or update a service charge configuration."""
        name = request.data.get("name")
        description = request.data.get("description", "")
        charge_type = request.data.get("charge_type", "fixed")
        rate = request.data.get("rate")
        applicable_to = request.data.get("applicable_to", [])

        try:
            charge = ServiceCharge.objects.create(
                name=name, description=description, charge_type=charge_type, rate=rate, applicable_to=applicable_to
            )
            return Response(
                {
                    "id": charge.id,
                    "name": charge.name,
                    "rate": charge.rate,
                    "message": "Service charge created successfully",
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.error(f"Failed to create service charge: {e}")
            return Response(
                {"status": "error", "message": str(e), "code": "CREATE_CHARGE_FAILED"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CalculateServiceChargeView(APIView):
    """View for calculating service charges based on DB configuration."""

    permission_classes = [IsStaff]

    def post(self, request):
        """Calculate the applicable service charge for a specific transaction type and amount."""
        account_type = request.data.get("account_type", "member_savings")
        transaction_amount = Decimal(str(request.data.get("transaction_amount", 0)))
        transaction_count = int(request.data.get("transaction_count", 1))

        all_charges = ServiceCharge.objects.filter(is_active=True)

        base_fee = Decimal("0.00")
        transaction_fee = Decimal("0.00")
        percentage_fee = Decimal("0.00")

        breakdown = {"account_maintenance": 0.0, "transaction_fees": 0.0, "amount_based_fee": 0.0}

        for charge in all_charges:
            if "all" in charge.applicable_to or account_type in charge.applicable_to:
                if "Maintenance" in charge.name:
                    base_fee += charge.rate
                    breakdown["account_maintenance"] += float(charge.rate)
                elif charge.charge_type == "fixed":
                    fee = charge.rate * transaction_count
                    transaction_fee += fee
                    breakdown["transaction_fees"] += float(fee)
                elif charge.charge_type == "percentage":
                    fee = transaction_amount * (charge.rate / 100)
                    percentage_fee += fee
                    breakdown["amount_based_fee"] += float(fee)

        # Fallback defaults if DB is empty
        if not all_charges.exists():
            base_fee = Decimal("5.00")
            transaction_fee = Decimal("0.50") * transaction_count
            percentage_fee = transaction_amount * Decimal("0.015")
            breakdown = {
                "account_maintenance": 5.0,
                "transaction_fees": float(transaction_fee),
                "amount_based_fee": float(percentage_fee),
            }

        total_charge = base_fee + transaction_fee + percentage_fee

        return Response(
            {
                "account_type": account_type,
                "base_fee": base_fee,
                "transaction_fee": transaction_fee,
                "percentage_fee": round(percentage_fee, 2),
                "total_charge": round(total_charge, 2),
                "breakdown": breakdown,
            }
        )


class ServiceRequestViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for handling service requests."""

    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["request_type", "status", "delivery_method"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        from ..permissions import IsStaffOrCustomer
        """Map service request actions to their required permission levels."""
        if self.action in ["process", "pending_checkbooks", "approve_checkbook"]:
            return [IsStaff()]
        return [IsStaffOrCustomer()]

    def perform_create(self, serializer):
        """Associate the current user with the service request being created."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def process(self, request, pk=None):
        """Staff action to process a service request."""
        service_request = self.get_object()
        new_status = request.data.get("status", "completed")
        admin_notes = request.data.get("admin_notes", "")

        if service_request.status == "completed":
            return Response(
                {"status": "error", "message": "Request already completed.", "code": "ALREADY_COMPLETED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service_request.status = new_status
        service_request.admin_notes = admin_notes
        service_request.processed_by = request.user
        service_request.processed_at = timezone.now()
        service_request.save()

        return Response(
            {
                "status": "success",
                "message": f"Request marked as {new_status}.",
                "data": ServiceRequestSerializer(service_request).data,
            }
        )

    @action(detail=False, methods=["get"], permission_classes=[IsStaff])
    def pending_checkbooks(self, request):
        """Get all pending checkbook requests for Operations Manager approval."""
        if request.user.role not in ["operations_manager", "manager"]:
            return Response(
                {"status": "error", "message": "Only Operations Manager can view pending checkbooks", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        pending = ServiceRequest.objects.filter(request_type="checkbook", status="pending").order_by("-created_at")

        return Response({"count": pending.count(), "requests": ServiceRequestSerializer(pending, many=True).data})

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def approve_checkbook(self, request, pk=None):
        """Approve or reject a checkbook request (Operations Manager only)."""
        if request.user.role not in ["operations_manager", "manager"]:
            return Response({"error": "Only Operations Manager can approve checkbooks"}, status=403)

        service_request = self.get_object()
        if service_request.request_type != "checkbook":
            return Response(
                {"status": "error", "message": "This action is only for checkbook requests", "code": "INVALID_REQUEST_TYPE"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action_type = request.data.get("action")
        notes = request.data.get("notes", "")

        if action_type == "approve":
            service_request.status = "processing"
            message = "Checkbook request approved, proceeding to processing"
        elif action_type == "reject":
            service_request.status = "rejected"
            message = "Checkbook request rejected"
        else:
            return Response(
                {"status": "error", "message": "Action must be approve or reject", "code": "INVALID_ACTION"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service_request.admin_notes = notes
        service_request.processed_by = request.user
        service_request.save()

        return Response({"success": True, "message": message, "data": ServiceRequestSerializer(service_request).data})


class ServiceStatsView(APIView):
    """Stub view for service request statistics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve aggregated statistics for service requests."""
        return Response(
            {
                "total_requests": 0,
                "pending": 0,
                "completed": 0,
                "in_progress": 0,
                "by_type": {},
                "average_resolution_time": "0 hours",
            }
        )


class RefundViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for handling refund requests."""

    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "reason"]
    ordering_fields = ["created_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        from ..permissions import IsStaffOrCustomer
        """Map refund actions to their required permission levels."""
        if self.action in ["approve", "reject", "update", "partial_update"]:
            return [IsStaff()]
        return [IsStaffOrCustomer()]

    def perform_create(self, serializer):
        """Associate the current user with the refund request being created."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a refund request."""
        refund = self.get_object()
        if refund.status != "pending":
            return Response(
                {"status": "error", "message": "Only pending refunds can be approved.", "code": "INVALID_STATUS"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund.status = "approved"
        refund.admin_notes = request.data.get("admin_notes", "")
        refund.processed_by = request.user
        refund.processed_at = timezone.now()
        refund.save()

        return Response({"status": "success", "data": RefundSerializer(refund).data})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject a refund request."""
        refund = self.get_object()
        if refund.status != "pending":
            return Response(
                {"status": "error", "message": "Only pending refunds can be rejected.", "code": "INVALID_STATUS"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund.status = "rejected"
        refund.admin_notes = request.data.get("admin_notes", "")
        refund.processed_by = request.user
        refund.processed_at = timezone.now()
        refund.save()

        return Response({"status": "success", "data": RefundSerializer(refund).data})


class ComplaintViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for handling customer complaints."""

    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "category", "priority"]
    ordering_fields = ["created_at", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        from ..permissions import IsStaffOrCustomer

        if self.action in ["resolve", "assign", "update", "partial_update"]:
            return [IsStaff()]
        return [IsStaffOrCustomer()]

    def perform_create(self, serializer):
        """Associate the current user with the complaint being created."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve a complaint."""
        complaint = self.get_object()
        if complaint.status in ["resolved", "closed"]:
            return Response({"error": "Complaint is already resolved or closed."}, status=status.HTTP_400_BAD_REQUEST)

        complaint.status = "resolved"
        complaint.resolution = request.data.get("resolution", "")
        complaint.resolved_by = request.user
        complaint.resolved_at = timezone.now()
        complaint.save()

        return Response({"status": "success", "data": ComplaintSerializer(complaint).data})

    @action(detail=False, methods=["get"], url_path="reports/summary")
    def reports_summary(self, request):
        """Get summary report of complaints."""
        from django.db.models import Count

        total = Complaint.objects.count()
        by_status = Complaint.objects.values("status").annotate(count=Count("id"))
        by_category = Complaint.objects.values("category").annotate(count=Count("id"))
        by_priority = Complaint.objects.values("priority").annotate(count=Count("id"))

        return Response(
            {
                "total": total,
                "by_status": list(by_status),
                "by_category": list(by_category),
                "by_priority": list(by_priority),
            }
        )
