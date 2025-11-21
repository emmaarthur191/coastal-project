import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from users.models import User
from .models import Account, Transaction, CashAdvance, Refund, Complaint, Notification, Loan
from .serializers import CashAdvanceSerializer, RefundSerializer, ComplaintSerializer, NotificationSerializer, LoanSerializer
from transactions.serializers import AccountSerializer
from banking_backend.utils.error_handling import ViewMixin

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class AccountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles account management and viewing.
    Endpoint: /api/banking/accounts/
    """
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter accounts for the current user."""
        return Account.objects.filter(owner=self.request.user)


@method_decorator(csrf_exempt, name='dispatch')
class AccountSummaryViewSet(viewsets.ViewSet):
    """
    Provides account summary information.
    Endpoint: /api/banking/account-summary/
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get account summary for the current user."""
        user = request.user
        accounts = Account.objects.filter(owner=user)

        # Calculate totals
        total_balance = sum(a.balance for a in accounts)
        total_accounts = accounts.count()

        # Simple currency breakdown (assuming all accounts are in same currency for now)
        currency_breakdown = {
            "default": float(total_balance)  # Convert to float for JSON serialization
        }

        data = {
            "total_balance": float(total_balance),
            "total_accounts": total_accounts,
            "currency_breakdown": currency_breakdown
        }
        return Response(data)


class NotificationViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles system notifications for users.
    Endpoint: /api/banking/notifications/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        """Filter notifications for the current user."""
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return self.success_response(data=serializer.data, message='Notification marked as read')

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def archive(self, request, pk=None):
        """Archive a notification."""
        notification = self.get_object()
        notification.archive()
        serializer = self.get_serializer(notification)
        return self.success_response(data=serializer.data, message='Notification archived')

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(status='unread').count()
        return self.success_response(data={'unread_count': count})


class CashAdvanceViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles cash advance requests and processing with approval workflows.
    Endpoint: /api/banking/cash-advances/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CashAdvanceSerializer

    def get_queryset(self):
        """Filter cash advances based on user role."""
        user = self.request.user
        if user.role == 'cashier':
            # Cashiers can see advances they requested
            return CashAdvance.objects.filter(requested_by=user)
        elif user.role in ['manager', 'operations_manager']:
            # Managers can see all advances
            return CashAdvance.objects.all()
        return CashAdvance.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def request_advance(self, request):
        """Request a new cash advance."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Validate account ownership
            account = Account.objects.get(id=request.data['account'])
            if account.owner != request.user and request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='You can only request advances for your own accounts',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            # Create cash advance request
            advance = CashAdvance.objects.create(
                account=account,
                amount=request.data['amount'],
                purpose=request.data.get('purpose', ''),
                priority=request.data.get('priority', 'medium'),
                requested_by=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )

            response_serializer = self.get_serializer(advance)
            return self.success_response(
                data=response_serializer.data,
                message='Cash advance requested successfully',
                status_code=status.HTTP_201_CREATED
            )

        except Account.DoesNotExist:
            return self.error_response(
                message='Account not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a cash advance request."""
        try:
            advance = self.get_object()

            if advance.status != 'pending':
                return self.error_response(
                    message='Advance must be in pending status to approve',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            notes = request.data.get('notes', '')
            advance.approve(request.user, notes)

            serializer = self.get_serializer(advance)
            return self.success_response(
                data=serializer.data,
                message='Cash advance approved successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a cash advance request."""
        try:
            advance = self.get_object()

            if advance.status != 'pending':
                return self.error_response(
                    message='Advance must be in pending status to reject',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            notes = request.data.get('notes', '')
            advance.reject(request.user, notes)

            serializer = self.get_serializer(advance)
            return self.success_response(
                data=serializer.data,
                message='Cash advance rejected successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def disburse(self, request, pk=None):
        """Disburse an approved cash advance."""
        try:
            advance = self.get_object()

            if advance.status != 'approved':
                return self.error_response(
                    message='Advance must be approved before disbursement',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Create disbursement transaction
            with db_transaction.atomic():
                transaction = Transaction.objects.create(
                    account=advance.account,
                    type='cash_advance',
                    amount=advance.amount,
                    cashier=request.user,
                    description=f'Cash advance disbursement - {advance.purpose or "N/A"}',
                    status='completed'
                )

                advance.disburse(request.user, transaction)

            serializer = self.get_serializer(advance)
            return self.success_response(
                data=serializer.data,
                message='Cash advance disbursed successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def record_repayment(self, request, pk=None):
        """Record a repayment against a cash advance."""
        try:
            advance = self.get_object()
            amount = request.data.get('amount')

            if not amount or amount <= 0:
                return self.error_response(
                    message='Repayment amount must be positive',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Create repayment transaction
            with db_transaction.atomic():
                transaction = Transaction.objects.create(
                    account=advance.account,
                    type='cash_advance_repayment',
                    amount=-amount,
                    cashier=request.user,
                    description=f'Cash advance repayment - {advance.id}',
                    status='completed'
                )

                advance.record_repayment(amount, transaction)

            serializer = self.get_serializer(advance)
            return self.success_response(
                data=serializer.data,
                message='Repayment recorded successfully'
            )

        except Exception as e:
            return self.handle_error(e)


class RefundViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles refund requests and processing with validation and approval.
    Endpoint: /api/banking/refunds/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RefundSerializer

    def get_queryset(self):
        """Filter refunds based on user role."""
        user = self.request.user
        if user.role == 'cashier':
            # Cashiers can see refunds they requested
            return Refund.objects.filter(requested_by=user)
        elif user.role in ['manager', 'operations_manager']:
            # Managers can see all refunds
            return Refund.objects.all()
        return Refund.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def request_refund(self, request):
        """Request a new refund."""
        try:
            # Validate transaction exists and belongs to user's account
            transaction = Transaction.objects.get(id=request.data['transaction_id'])

            # Check if user can request refund for this transaction
            if transaction.account.owner != request.user and request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='You can only request refunds for transactions on your accounts',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            # Create refund request
            refund = Refund.objects.create(
                original_transaction=transaction,
                refund_type=request.data['refund_type'],
                requested_amount=request.data['requested_amount'],
                reason=request.data['reason'],
                refund_notes=request.data.get('refund_notes', ''),
                requested_by=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )

            response_serializer = self.get_serializer(refund)
            return self.success_response(
                data=response_serializer.data,
                message='Refund requested successfully',
                status_code=status.HTTP_201_CREATED
            )

        except Transaction.DoesNotExist:
            return self.error_response(
                message='Transaction not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return self.handle_error(e)


class CashAdvanceReportViewSet(viewsets.ViewSet, ViewMixin):
    """
    Reporting views for cash advances.
    Endpoint: /api/banking/cash-advances/reports/
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def summary(self, request):
        """Get cash advance summary statistics."""
        try:
            from django.db.models import Count, Sum, Avg
            from django.db.models.functions import TruncMonth

            # Date range filter
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            queryset = CashAdvance.objects.all()
            if start_date:
                queryset = queryset.filter(requested_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(requested_at__lte=end_date)

            # Summary statistics
            total_requests = queryset.count()
            approved_requests = queryset.filter(status='approved').count()
            rejected_requests = queryset.filter(status='rejected').count()
            disbursed_amount = queryset.filter(status='disbursed').aggregate(
                total=Sum('amount'))['total'] or Decimal('0.00')
            outstanding_balance = queryset.filter(status__in=['disbursed', 'overdue']).aggregate(
                total=Sum('outstanding_balance'))['total'] or Decimal('0.00')

            # Monthly trends
            monthly_data = queryset.annotate(
                month=TruncMonth('requested_at')
            ).values('month').annotate(
                requests=Count('id'),
                approved=Count('id', filter=Q(status='approved')),
                disbursed=Sum('amount', filter=Q(status='disbursed'))
            ).order_by('month')

            return self.success_response(data={
                'summary': {
                    'total_requests': total_requests,
                    'approved_requests': approved_requests,
                    'rejected_requests': rejected_requests,
                    'approval_rate': (approved_requests / total_requests * 100) if total_requests > 0 else 0,
                    'disbursed_amount': float(disbursed_amount),
                    'outstanding_balance': float(outstanding_balance)
                },
                'monthly_trends': list(monthly_data)
            })

        except Exception as e:
            return self.handle_error(e)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def status_distribution(self, request):
        """Get cash advance status distribution."""
        try:
            from django.db.models import Count

            status_counts = CashAdvance.objects.values('status').annotate(
                count=Count('id')
            ).order_by('-count')

            return self.success_response(data=list(status_counts))

        except Exception as e:
            return self.handle_error(e)


class RefundReportViewSet(viewsets.ViewSet, ViewMixin):
    """
    Reporting views for refunds.
    Endpoint: /api/banking/refunds/reports/
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def summary(self, request):
        """Get refund summary statistics."""
        try:
            from django.db.models import Count, Sum, Avg
            from django.db.models.functions import TruncMonth

            # Date range filter
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            queryset = Refund.objects.all()
            if start_date:
                queryset = queryset.filter(requested_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(requested_at__lte=end_date)

            # Summary statistics
            total_requests = queryset.count()
            approved_requests = queryset.filter(status='approved').count()
            rejected_requests = queryset.filter(status='rejected').count()
            processed_requests = queryset.filter(status='processed').count()
            total_requested = queryset.aggregate(total=Sum('requested_amount'))['total'] or Decimal('0.00')
            total_approved = queryset.filter(status__in=['approved', 'processed']).aggregate(
                total=Sum('approved_amount'))['total'] or Decimal('0.00')

            # Monthly trends
            monthly_data = queryset.annotate(
                month=TruncMonth('requested_at')
            ).values('month').annotate(
                requests=Count('id'),
                approved=Count('id', filter=Q(status='approved')),
                processed=Count('id', filter=Q(status='processed')),
                amount_requested=Sum('requested_amount'),
                amount_approved=Sum('approved_amount')
            ).order_by('month')

            return self.success_response(data={
                'summary': {
                    'total_requests': total_requests,
                    'approved_requests': approved_requests,
                    'rejected_requests': rejected_requests,
                    'processed_requests': processed_requests,
                    'approval_rate': (approved_requests / total_requests * 100) if total_requests > 0 else 0,
                    'total_requested': float(total_requested),
                    'total_approved': float(total_approved)
                },
                'monthly_trends': list(monthly_data)
            })

        except Exception as e:
            return self.handle_error(e)


@method_decorator(csrf_exempt, name='dispatch')
class LoanViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles loan management and approval workflows.
    Endpoint: /api/banking/loans/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LoanSerializer

    def get_queryset(self):
        """Filter loans based on user role."""
        user = self.request.user
        if user.role == 'member':
            # Members can see their own loans
            return Loan.objects.filter(account__owner=user)
        elif user.role in ['manager', 'operations_manager']:
            # Managers can see all loans
            return Loan.objects.all()
        return Loan.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def pending(self, request):
        """Get pending loans for approval."""
        try:
            if request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='Only managers can view pending loans',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            pending_loans = Loan.objects.filter(status='pending')
            serializer = self.get_serializer(pending_loans, many=True)
            return self.success_response(data=serializer.data)

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a loan application."""
        try:
            if request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='Only managers can approve loans',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            loan = self.get_object()
            if loan.status != 'pending':
                return self.error_response(
                    message='Loan must be in pending status to approve',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            notes = request.data.get('notes', '')
            loan.approve(request.user, notes)

            serializer = self.get_serializer(loan)
            return self.success_response(
                data=serializer.data,
                message='Loan approved successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a loan application."""
        try:
            if request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='Only managers can reject loans',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            loan = self.get_object()
            if loan.status != 'pending':
                return self.error_response(
                    message='Loan must be in pending status to reject',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            notes = request.data.get('notes', '')
            loan.reject(request.user, notes)

            serializer = self.get_serializer(loan)
            return self.success_response(
                data=serializer.data,
                message='Loan rejected successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def disburse(self, request, pk=None):
        """Disburse an approved loan."""
        try:
            if request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='Only managers can disburse loans',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            loan = self.get_object()
            if loan.status != 'approved':
                return self.error_response(
                    message='Loan must be approved before disbursement',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Create disbursement transaction
            with db_transaction.atomic():
                transaction = Transaction.objects.create(
                    account=loan.account,
                    type='loan_disbursement',
                    amount=loan.amount,
                    cashier=request.user,
                    description=f'Loan disbursement - {loan.purpose or "N/A"}',
                    status='completed'
                )

                loan.disburse(request.user, transaction)

            serializer = self.get_serializer(loan)
            return self.success_response(
                data=serializer.data,
                message='Loan disbursed successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def status_distribution(self, request):
        """Get refund status distribution."""
        try:
            from django.db.models import Count

            status_counts = Refund.objects.values('status').annotate(
                count=Count('id')
            ).order_by('-count')

            return self.success_response(data=list(status_counts))

        except Exception as e:
            return self.handle_error(e)


class ComplaintReportViewSet(viewsets.ViewSet, ViewMixin):
    """
    Reporting views for complaints.
    Endpoint: /api/banking/complaints/reports/
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def summary(self, request):
        """Get complaint summary statistics."""
        try:
            from django.db.models import Count, Avg
            from django.db.models.functions import TruncMonth

            # Date range filter
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            queryset = Complaint.objects.all()
            if start_date:
                queryset = queryset.filter(submitted_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(submitted_at__lte=end_date)

            # Summary statistics
            total_complaints = queryset.count()
            open_complaints = queryset.filter(status='open').count()
            investigating_complaints = queryset.filter(status='investigating').count()
            resolved_complaints = queryset.filter(status='resolved').count()
            closed_complaints = queryset.filter(status='closed').count()
            escalated_complaints = queryset.filter(status='escalated').count()

            # Average resolution time (in days)
            resolved_qs = queryset.filter(status__in=['resolved', 'closed'], resolved_at__isnull=False)
            avg_resolution_time = None
            if resolved_qs.exists():
                resolution_times = []
                for complaint in resolved_qs:
                    if complaint.resolved_at:
                        days = (complaint.resolved_at - complaint.submitted_at).days
                        resolution_times.append(days)
                if resolution_times:
                    avg_resolution_time = sum(resolution_times) / len(resolution_times)

            # Monthly trends
            monthly_data = queryset.annotate(
                month=TruncMonth('submitted_at')
            ).values('month').annotate(
                complaints=Count('id'),
                resolved=Count('id', filter=Q(status__in=['resolved', 'closed'])),
                escalated=Count('id', filter=Q(status='escalated'))
            ).order_by('month')

            # Complaint types distribution
            type_distribution = queryset.values('complaint_type').annotate(
                count=Count('id')
            ).order_by('-count')

            return self.success_response(data={
                'summary': {
                    'total_complaints': total_complaints,
                    'open_complaints': open_complaints,
                    'investigating_complaints': investigating_complaints,
                    'resolved_complaints': resolved_complaints,
                    'closed_complaints': closed_complaints,
                    'escalated_complaints': escalated_complaints,
                    'avg_resolution_time_days': avg_resolution_time
                },
                'monthly_trends': list(monthly_data),
                'type_distribution': list(type_distribution)
            })

        except Exception as e:
            return self.handle_error(e)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def status_distribution(self, request):
        """Get complaint status distribution."""
        try:
            from django.db.models import Count

            status_counts = Complaint.objects.values('status').annotate(
                count=Count('id')
            ).order_by('-count')

            return self.success_response(data=list(status_counts))

        except Exception as e:
            return self.handle_error(e)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def overdue_complaints(self, request):
        """Get list of overdue complaints."""
        try:
            overdue = Complaint.objects.filter(
                status__in=['open', 'investigating', 'pending_response']
            ).exclude(
                resolved_at__isnull=False
            )

            overdue_list = []
            for complaint in overdue:
                if complaint.is_overdue():
                    overdue_list.append({
                        'id': complaint.id,
                        'subject': complaint.subject,
                        'priority': complaint.priority,
                        'submitted_at': complaint.submitted_at,
                        'days_open': (timezone.now().date() - complaint.submitted_at.date()).days,
                        'assigned_to': f"{complaint.assigned_to.first_name} {complaint.assigned_to.last_name}" if complaint.assigned_to else None
                    })

            return self.success_response(data={
                'overdue_count': len(overdue_list),
                'overdue_complaints': overdue_list
            })

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a refund request."""
        try:
            refund = self.get_object()

            if refund.status != 'pending':
                return self.error_response(
                    message='Refund must be in pending status to approve',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            approved_amount = request.data.get('approved_amount')
            notes = request.data.get('notes', '')

            refund.approve(request.user, approved_amount, notes)

            serializer = self.get_serializer(refund)
            return self.success_response(
                data=serializer.data,
                message='Refund approved successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a refund request."""
        try:
            refund = self.get_object()

            if refund.status != 'pending':
                return self.error_response(
                    message='Refund must be in pending status to reject',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            notes = request.data.get('notes', '')
            refund.reject(request.user, notes)

            serializer = self.get_serializer(refund)
            return self.success_response(
                data=serializer.data,
                message='Refund rejected successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def process_refund(self, request, pk=None):
        """Process an approved refund."""
        try:
            refund = self.get_object()

            if refund.status != 'approved':
                return self.error_response(
                    message='Refund must be approved before processing',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Create refund transaction
            with db_transaction.atomic():
                transaction = Transaction.objects.create(
                    account=refund.original_transaction.account,
                    type='refund',
                    amount=refund.approved_amount,
                    cashier=request.user,
                    description=f'Refund for transaction {refund.original_transaction.reference_number}',
                    status='completed'
                )

                refund.process_refund(request.user, transaction)

            serializer = self.get_serializer(refund)
            return self.success_response(
                data=serializer.data,
                message='Refund processed successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel a refund request."""
        try:
            refund = self.get_object()
            notes = request.data.get('notes', '')

            refund.cancel(request.user, notes)

            serializer = self.get_serializer(refund)
            return self.success_response(
                data=serializer.data,
                message='Refund cancelled successfully'
            )

        except Exception as e:
            return self.handle_error(e)


class ComplaintViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles customer complaints logging and management with escalation procedures.
    Endpoint: /api/banking/complaints/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        """Filter complaints based on user role."""
        user = self.request.user
        if user.role == 'cashier':
            # Cashiers can see complaints they submitted
            return Complaint.objects.filter(submitted_by=user)
        elif user.role in ['manager', 'operations_manager']:
            # Managers can see all complaints
            return Complaint.objects.all()
        return Complaint.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def submit_complaint(self, request):
        """Submit a new customer complaint."""
        try:
            # Validate account ownership
            account = Account.objects.get(id=request.data['account'])
            if account.owner != request.user and request.user.role not in ['manager', 'operations_manager']:
                return self.error_response(
                    message='You can only submit complaints for your own accounts',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            # Validate related transaction if provided
            related_transaction = None
            if 'related_transaction_id' in request.data:
                related_transaction = Transaction.objects.get(id=request.data['related_transaction_id'])
                if related_transaction.account != account:
                    return self.error_response(
                        message='Related transaction must belong to the specified account',
                        status_code=status.HTTP_400_BAD_REQUEST
                    )

            # Create complaint
            complaint = Complaint.objects.create(
                account=account,
                related_transaction=related_transaction,
                complaint_type=request.data['complaint_type'],
                priority=request.data.get('priority', 'medium'),
                subject=request.data['subject'],
                description=request.data['description'],
                follow_up_required=request.data.get('follow_up_required', False),
                follow_up_date=request.data.get('follow_up_date'),
                submitted_by=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )

            response_serializer = self.get_serializer(complaint)
            return self.success_response(
                data=response_serializer.data,
                message='Complaint submitted successfully',
                status_code=status.HTTP_201_CREATED
            )

        except Account.DoesNotExist:
            return self.error_response(
                message='Account not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Transaction.DoesNotExist:
            return self.error_response(
                message='Related transaction not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign(self, request, pk=None):
        """Assign a complaint to a handler."""
        try:
            complaint = self.get_object()
            assignee_id = request.data.get('assignee_id')

            if not assignee_id:
                return self.error_response(
                    message='Assignee ID is required',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            assignee = User.objects.get(id=assignee_id)
            complaint.assign(assignee, request.user)

            serializer = self.get_serializer(complaint)
            return self.success_response(
                data=serializer.data,
                message='Complaint assigned successfully'
            )

        except User.DoesNotExist:
            return self.error_response(
                message='Assignee not found',
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def escalate(self, request, pk=None):
        """Escalate a complaint to a higher level."""
        try:
            complaint = self.get_object()
            new_level = request.data.get('escalation_level')
            reason = request.data.get('reason', '')

            if not new_level:
                return self.error_response(
                    message='New escalation level is required',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            complaint.escalate(request.user, new_level, reason)

            serializer = self.get_serializer(complaint)
            return self.success_response(
                data=serializer.data,
                message='Complaint escalated successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def resolve(self, request, pk=None):
        """Resolve a complaint."""
        try:
            complaint = self.get_object()
            resolution = request.data.get('resolution', '')
            satisfaction = request.data.get('satisfaction')

            if not resolution:
                return self.error_response(
                    message='Resolution description is required',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            complaint.resolve(request.user, resolution, satisfaction)

            serializer = self.get_serializer(complaint)
            return self.success_response(
                data=serializer.data,
                message='Complaint resolved successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def close(self, request, pk=None):
        """Close a complaint."""
        try:
            complaint = self.get_object()
            notes = request.data.get('notes', '')

            complaint.close(request.user, notes)

            serializer = self.get_serializer(complaint)
            return self.success_response(
                data=serializer.data,
                message='Complaint closed successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def contact_customer(self, request, pk=None):
        """Record customer contact attempt."""
        try:
            complaint = self.get_object()
            complaint.add_contact_attempt()

            serializer = self.get_serializer(complaint)
            return self.success_response(
                data=serializer.data,
                message='Contact attempt recorded successfully'
            )

        except Exception as e:
            return self.handle_error(e)