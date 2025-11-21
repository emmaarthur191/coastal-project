import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from users.models import User
from .models import Account, Transaction, CashAdvance, Refund, Complaint, Notification
from .serializers import CashAdvanceSerializer, RefundSerializer, ComplaintSerializer, NotificationSerializer
from banking_backend.utils.error_handling import ViewMixin

logger = logging.getLogger(__name__)


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