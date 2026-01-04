"""Mobile banker views for Coastal Banking.

This module contains views for mobile banker operations including
visit schedules, client assignments, and mobile operations.
"""

import datetime
import logging
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import mixins, serializers
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models import ClientAssignment, Transaction, VisitSchedule

logger = logging.getLogger(__name__)


class VisitScheduleViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for mobile banker visit schedules."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the list of scheduled visits for the current mobile banker."""
        return VisitSchedule.objects.filter(mobile_banker=self.request.user).order_by("-scheduled_time")

    def get_serializer_class(self):
        """Define and return a serializer for visit schedules."""

        class VisitScheduleSerializer(serializers.ModelSerializer):
            class Meta:
                model = VisitSchedule
                fields = [
                    "id",
                    "mobile_banker",
                    "client_name",
                    "location",
                    "scheduled_time",
                    "status",
                    "notes",
                    "created_at",
                    "updated_at",
                ]
                read_only_fields = ["id", "mobile_banker", "created_at", "updated_at"]

        return VisitScheduleSerializer


class MobileBankerMetricsView(APIView):
    """Metrics for mobile banker dashboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        this_week_start = today - datetime.timedelta(days=today.weekday())

        # Get visits count
        total_visits = VisitSchedule.objects.filter(mobile_banker=request.user).count()

        visits_today = VisitSchedule.objects.filter(mobile_banker=request.user, scheduled_time__date=today).count()

        visits_this_week = VisitSchedule.objects.filter(
            mobile_banker=request.user, scheduled_time__date__gte=this_week_start
        ).count()

        completed_visits = VisitSchedule.objects.filter(mobile_banker=request.user, status="completed").count()

        # Client assignments
        total_clients = ClientAssignment.objects.filter(mobile_banker=request.user, is_active=True).count()

        # Transaction volume (approximation based on mobile collections)
        collections_today = Transaction.objects.filter(
            transaction_type="deposit", status="completed", timestamp__date=today, description__icontains="mobile"
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        collections_this_week = Transaction.objects.filter(
            transaction_type="deposit",
            status="completed",
            timestamp__date__gte=this_week_start,
            description__icontains="mobile",
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        return Response(
            {
                "visits": {
                    "total": total_visits,
                    "today": visits_today,
                    "this_week": visits_this_week,
                    "completed": completed_visits,
                },
                "clients": {"total": total_clients, "active": total_clients},
                "collections": {"today": str(collections_today), "this_week": str(collections_this_week)},
                "performance": {
                    "completion_rate": round((completed_visits / total_visits * 100), 1) if total_visits > 0 else 0
                },
            }
        )


class MobileOperationsViewSet(ViewSet):
    """ViewSet for Mobile Banker operations.
    Handles RPC-style actions: process_deposit, process_withdrawal, schedule_visit.
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def process_deposit(self, request):
        """Process a deposit from mobile banker (permission check handled by viewset)."""
        # SECURITY: Mobile banker operations should be restricted
        # Add IsMobileBanker permission check if user is not mobile_banker role
        if request.user.role != "mobile_banker" and not request.user.is_staff:
            return Response({"error": "This operation is restricted to mobile bankers"}, status=403)

        from core.models import Account
        from core.services import TransactionService

        member_id = request.data.get("member_id")
        amount = request.data.get("amount")
        account_type = request.data.get("account_type", "daily_susu")

        if not member_id or not amount:
            return Response({"error": "member_id and amount are required"}, status=400)

        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({"error": "Amount must be positive"}, status=400)
        except Exception:
            return Response({"error": "Invalid amount"}, status=400)

        # Find account
        account = Account.objects.filter(user_id=member_id, account_type=account_type).first()
        if not account:
            return Response({"error": "Account not found"}, status=404)

        # Process deposit
        try:
            with transaction.atomic():
                tx = TransactionService.create_transaction(
                    from_account=None,
                    to_account=account,
                    amount=amount,
                    transaction_type="deposit",
                    description=f"Mobile deposit by {request.user.email}",
                )

            account.refresh_from_db()
            return Response(
                {
                    "status": "success",
                    "message": f"Deposit of GHS {amount} successful",
                    "data": {
                        "transaction_id": tx.id,
                        "new_balance": str(account.balance),
                    },
                }
            )
        except Exception as e:
            logger.error(f"Mobile deposit failed for user {member_id}: {e}")
            return Response(
                {
                    "status": "error",
                    "message": "Failed to process deposit",
                    "code": "DEPOSIT_FAILED",
                    "error_detail": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def process_withdrawal(self, request):
        """Process a withdrawal from mobile banker (permission check handled by viewset)."""
        # SECURITY: Mobile banker operations should be restricted
        if request.user.role != "mobile_banker" and not request.user.is_staff:
            return Response({"error": "This operation is restricted to mobile bankers"}, status=403)

        from core.models import Account
        from core.services import TransactionService

        member_id = request.data.get("member_id")
        amount = request.data.get("amount")
        account_type = request.data.get("account_type", "daily_susu")

        if not member_id or not amount:
            return Response({"error": "member_id and amount are required"}, status=400)

        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({"error": "Amount must be positive"}, status=400)
        except Exception:
            return Response({"error": "Invalid amount"}, status=400)

        # Find account
        account = Account.objects.filter(user_id=member_id, account_type=account_type).first()
        if not account:
            return Response({"error": "Account not found"}, status=404)

        # Check balance
        if account.balance < amount:
            return Response({"error": "Insufficient funds"}, status=400)

        # Process withdrawal
        try:
            with transaction.atomic():
                tx = TransactionService.create_transaction(
                    from_account=account,
                    to_account=None,
                    amount=amount,
                    transaction_type="withdrawal",
                    description=f"Mobile withdrawal by {request.user.email}",
                )

            account.refresh_from_db()
            return Response(
                {
                    "status": "success",
                    "message": f"Withdrawal of GHS {amount} successful",
                    "data": {
                        "transaction_id": tx.id,
                        "new_balance": str(account.balance),
                    },
                }
            )
        except Exception as e:
            logger.error(f"Mobile withdrawal failed for user {member_id}: {e}")
            return Response(
                {
                    "status": "error",
                    "message": "Failed to process withdrawal",
                    "code": "WITHDRAWAL_FAILED",
                    "error_detail": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def schedule_visit(self, request):
        """Create a new visit schedule for a client (RPC-style action)."""
        from core.models import VisitSchedule

        client_name = request.data.get("client_name")
        location = request.data.get("location")
        scheduled_time = request.data.get("scheduled_time")
        notes = request.data.get("notes", "")

        if not client_name or not location or not scheduled_time:
            return Response({"error": "client_name, location, and scheduled_time are required"}, status=400)

        visit = VisitSchedule.objects.create(
            mobile_banker=request.user,
            client_name=client_name,
            location=location,
            scheduled_time=scheduled_time,
            notes=notes,
            status="scheduled",
        )

        return Response({"status": "success", "visit_id": visit.id, "message": "Visit scheduled successfully"})


class ClientAssignmentViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for managing client assignments to mobile bankers.

    Mobile bankers can view their assigned clients.
    Managers can manage all assignments.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "is_active"]
    ordering_fields = ["created_at", "next_visit"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter assignments based on user role."""
        from core.models import ClientAssignment

        if self.request.user.role in ["manager", "admin", "superuser"]:
            return ClientAssignment.objects.all()
        return ClientAssignment.objects.filter(mobile_banker=self.request.user)

    def get_serializer_class(self):
        """Return the serializer class for client assignments."""
        from core.serializers import ClientAssignmentSerializer

        return ClientAssignmentSerializer

    def perform_create(self, serializer):
        """Auto-set mobile banker to current user if not explicitly provided in the request."""
        if not serializer.validated_data.get("mobile_banker"):
            serializer.save(mobile_banker=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=["get"])
    def my_clients(self, request):
        """Get all clients assigned to the current mobile banker."""
        from core.models import ClientAssignment

        assignments = ClientAssignment.objects.filter(mobile_banker=request.user, is_active=True).select_related(
            "client"
        )

        clients = []
        for assignment in assignments:
            clients.append(
                {
                    "id": str(assignment.id),
                    "client_id": str(assignment.client.id) if assignment.client else None,
                    "client_name": assignment.client.get_full_name() if assignment.client else "Unknown",
                    "status": assignment.status,
                    "next_visit": self._format_next_visit(assignment.next_visit),
                    "notes": assignment.notes,
                }
            )

        return Response({"clients": clients})

    def _format_next_visit(self, dt):
        """Helper to format next visit datetime to ISO string or string representation."""
        if not dt:
            return None
        if hasattr(dt, "isoformat"):
            return dt.isoformat()
        return str(dt)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark a client assignment or visit as completed."""
        assignment = self.get_object()
        assignment.status = "completed"
        assignment.save()
        return Response({"status": "success", "message": "Assignment marked as completed"})

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        """Update the status of a specific client assignment."""
        assignment = self.get_object()
        new_status = request.data.get("status")
        if new_status:
            assignment.status = new_status
            assignment.save()
        return Response({"error": "Status is required"}, status=400)
