"""Mobile banker views for Coastal Banking.

This module contains views for mobile banker operations including
visit schedules, client assignments, and mobile operations.
"""

import datetime
import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models.operational import ClientAssignment, VisitSchedule
from core.models.transactions import Transaction
from core.permissions import IsStaff

logger = logging.getLogger(__name__)


class VisitScheduleViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet):
    """ViewSet for mobile banker visit schedules."""

    permission_classes = [IsStaff]

    def get_queryset(self):
        """Return the list of scheduled visits, optimized with select_related."""
        queryset = VisitSchedule.objects.all().select_related("mobile_banker").order_by("-scheduled_time")
        if self.request.user.role in ["manager", "operations_manager", "admin", "superuser"]:
            return queryset
        return queryset.filter(mobile_banker=self.request.user)

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

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark a visit as completed."""
        visit = self.get_object()
        visit.status = "completed"
        visit.save()
        return Response({"status": "success", "message": "Visit marked as completed"})

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        """Record GPS check-in for a visit."""
        visit = self.get_object()
        lat = request.data.get("latitude")
        lon = request.data.get("longitude")

        if lat is None or lon is None:
            return Response({"error": "Latitude and longitude are required for check-in"}, status=400)

        try:
            visit.check_in_latitude = Decimal(str(lat))
            visit.check_in_longitude = Decimal(str(lon))
            visit.check_in_at = timezone.now()
            visit.status = "completed"  # Auto-complete on check-in for this bank's policy
            visit.save()
        except Exception as e:
            return Response({"error": f"Invalid coordinates provided: {e!s}"}, status=400)

        return Response(
            {
                "status": "success",
                "message": "Check-in successful",
                "data": {
                    "at": visit.check_in_at.isoformat(),
                    "lat": float(visit.check_in_latitude),
                    "lon": float(visit.check_in_longitude),
                },
            }
        )


class MobileBankerMetricsView(APIView):
    """Metrics for mobile banker dashboard."""

    permission_classes = [IsStaff]

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
        # SECURITY FIX (CVE-COASTAL-010): Prevent API3 Excessive Data Exposure
        # Filter by the specific mobile banker's email to avoid leaking total bank mobile collections
        banker_email = request.user.email

        collections_today = Transaction.objects.filter(
            transaction_type="deposit",
            status="completed",
            timestamp__date=today,
            description__icontains=f"Mobile deposit by {banker_email}",
        ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

        collections_this_week = Transaction.objects.filter(
            transaction_type="deposit",
            status="completed",
            timestamp__date__gte=this_week_start,
            description__icontains=f"Mobile deposit by {banker_email}",
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

    permission_classes = [IsStaff]

    @action(detail=False, methods=["post"], url_path="process-deposit")
    def process_deposit(self, request):
        """Process a deposit from mobile banker (permission check handled by viewset)."""
        if request.user.role != "mobile_banker" and request.user.role not in ["manager", "operations_manager", "admin", "superuser"]:
            return Response({"error": "This operation is restricted to mobile bankers or authorized managers"}, status=403)

        # SECURITY: Enforce assignment for mobile bankers
        member_id = request.data.get("member_id")
        if request.user.role == "mobile_banker":
            from core.models.operational import ClientAssignment
            is_assigned = ClientAssignment.objects.filter(
                mobile_banker=request.user, client_id=member_id, is_active=True
            ).exists()
            if not is_assigned:
                return Response({"error": "Unauthorized: You are not assigned to this client."}, status=403)

        from core.models.accounts import Account
        from core.services.transactions import TransactionService

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

    @action(detail=False, methods=["post"], url_path="process-withdrawal")
    def process_withdrawal(self, request):
        """Process a withdrawal from mobile banker (permission check handled by viewset)."""
        if request.user.role != "mobile_banker" and request.user.role not in ["manager", "operations_manager", "admin", "superuser"]:
            return Response({"error": "This operation is restricted to mobile bankers or authorized managers"}, status=403)

        # SECURITY: Enforce assignment for mobile bankers
        member_id = request.data.get("member_id")
        if request.user.role == "mobile_banker":
            from core.models.operational import ClientAssignment
            is_assigned = ClientAssignment.objects.filter(
                mobile_banker=request.user, client_id=member_id, is_active=True
            ).exists()
            if not is_assigned:
                return Response({"error": "Unauthorized: You are not assigned to this client."}, status=403)

        from core.models.accounts import Account
        from core.services.transactions import TransactionService

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

    @action(detail=False, methods=["post"], url_path="schedule-visit")
    def schedule_visit(self, request):
        """Create a new visit schedule for a client (RPC-style action)."""
        from core.models.operational import VisitSchedule

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

    @action(detail=False, methods=["get"], url_path="member-lookup")
    def member_lookup(self, request):
        """Lookup member name and specific account balance for mobile banker verification."""
        from core.models.accounts import Account

        member_id = request.query_params.get("member_id")
        account_type = request.query_params.get("account_type", "daily_susu")

        if not member_id:
            return Response({"error": "member_id is required"}, status=400)

        # SECURITY: Enforce assignment for mobile bankers
        if request.user.role == "mobile_banker":
            from core.models.operational import ClientAssignment
            is_assigned = ClientAssignment.objects.filter(
                mobile_banker=request.user, client_id=member_id, is_active=True
            ).exists()
            if not is_assigned:
                return Response({"error": "Unauthorized: Access restricted to assigned clients only."}, status=403)

        # Optimization: select_related('user') helps get the name too
        account = Account.objects.filter(user_id=member_id, account_type=account_type).select_related("user").first()
        if not account:
            return Response({"error": "Account not found for this member ID"}, status=404)

        return Response({
            "name": account.user.get_full_name() or account.user.username,
            "balance": str(account.balance),
            "account_type": account.get_account_type_display(),
            "last_activity": account.last_activity.isoformat() if account.last_activity else None
        })


class ClientAssignmentViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for managing client assignments to mobile bankers.

    Mobile bankers can view their assigned clients.
    Managers can manage all assignments.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "is_active", "mobile_banker"]
    ordering_fields = ["created_at", "next_visit", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter assignments based on user role, optimized with select_related."""
        from core.models.operational import ClientAssignment

        queryset = ClientAssignment.objects.all().select_related("mobile_banker", "client")
        if self.request.user.role in ["manager", "operations_manager", "admin", "superuser"]:
            return queryset
        return queryset.filter(mobile_banker=self.request.user)

    def get_serializer_class(self):
        """Return the serializer class for client assignments."""
        from core.serializers.operational import ClientAssignmentSerializer

        return ClientAssignmentSerializer

    def perform_create(self, serializer):
        """Auto-set mobile banker to current user if not explicitly provided in the request."""
        if not serializer.validated_data.get("mobile_banker"):
            serializer.save(mobile_banker=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=["get"], url_path="my-clients")
    def my_clients(self, request):
        """Get all clients assigned to the current mobile banker, using the standard serializer."""
        from core.models.operational import ClientAssignment
        from core.serializers.operational import ClientAssignmentSerializer

        assignments = ClientAssignment.objects.filter(mobile_banker=request.user, is_active=True).select_related(
            "client", "mobile_banker"
        )
        
        serializer = ClientAssignmentSerializer(assignments, many=True, context={'request': request})
        return Response(serializer.data)

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

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        """Update the status of a specific client assignment."""
        assignment = self.get_object()
        new_status = request.data.get("status")
        if new_status:
            assignment.status = new_status
            assignment.save()
            return Response({"status": "success", "message": f"Status updated to {new_status}"})
        return Response({"error": "Status is required"}, status=400)


class ProcessRepaymentView(APIView):
    """Standalone view for mobile bankers to process loan repayments."""

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        member_id = request.data.get("member_id")
        amount = request.data.get("amount")

        if not member_id or not amount:
            return Response({"error": "member_id and amount are required"}, status=400)

        # SECURITY FIX (CVE-COASTAL-04): Mobile bankers only for assigned clients
        if request.user.role == "mobile_banker":
            from core.models.operational import ClientAssignment

            is_assigned = ClientAssignment.objects.filter(
                mobile_banker=request.user, client_id=member_id, is_active=True
            ).exists()
            if not is_assigned:
                return Response({"error": "You are not assigned to this client."}, status=status.HTTP_403_FORBIDDEN)

        from core.models.loans import Loan
        from core.services.loans import LoanService

        loan = Loan.objects.filter(user_id=member_id, status__in=["approved", "active", "disbursed"]).first()
        if not loan:
            return Response({"error": "No active loan found for this member"}, status=404)

        try:
            amount_decimal = Decimal(str(amount))
            repaid_loan = LoanService.repay_loan(loan, amount_decimal)

            # Audit Log
            from users.models import AuditLog

            AuditLog.objects.create(
                action="repayment",
                model_name="Loan",
                object_id=str(repaid_loan.id),
                object_repr=f"Mobile Loan Repayment for {repaid_loan.user.username}",
                user=request.user,
                changes={"amount": str(amount), "channel": "mobile"},
            )

            return Response(
                {
                    "status": "success",
                    "message": f"Repayment of GHS {amount} successful",
                    "data": {
                        "loan_id": repaid_loan.id,
                        "outstanding_balance": str(repaid_loan.outstanding_balance),
                        "loan_status": repaid_loan.status,
                    },
                }
            )
        except Exception as e:
            logger.error(f"Mobile repayment failed: {e}")
            return Response({"error": str(e)}, status=400)
