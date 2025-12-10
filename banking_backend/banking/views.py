import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from users.models import User
from .models import Account, Transaction, CashAdvance, Refund, Complaint, Notification, Loan, MessageThread, Message, UserEncryptionKey, ClientRegistration
from .serializers import CashAdvanceSerializer, RefundSerializer, ComplaintSerializer, NotificationSerializer, LoanSerializer, AccountListSerializer, BankingMessageThreadSerializer, BankingMessageSerializer, MessageCreateSerializer, MessageThreadCreateSerializer, UserEncryptionKeySerializer, ClientRegistrationSerializer, ClientRegistrationCreateSerializer, OTPSendSerializer, OTPVerifySerializer
from banking_backend.utils.messaging_encryption import MessagingEncryption
from banking_backend.utils.audit import AuditService
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
    lookup_field = 'id'  # Explicitly set lookup field

    def get_queryset(self):
        """Filter accounts for the current user."""
        return Account.objects.filter(owner=self.request.user)


@method_decorator(csrf_exempt, name='dispatch')
class StaffAccountViewSet(viewsets.ReadOnlyModelViewSet, ViewMixin):
    """
    Handles account management for staff users.
    Provides access to all accounts for managers and operations managers.
    Endpoint: /api/banking/staff-accounts/
    """
    serializer_class = AccountListSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'  # Explicitly set lookup field

    def get_queryset(self):
        """Filter accounts based on user role."""
        user = self.request.user
        if user.role in ['manager', 'operations_manager', 'administrator', 'superuser']:
            # Staff can see all accounts
            return Account.objects.all().select_related('owner')
        return Account.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def summary(self, request):
        """Get account summary statistics for staff."""
        try:
            if request.user.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
                return self.error_response(
                    message='Access denied. Staff privileges required.',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            total_accounts = Account.objects.count()
            active_accounts = Account.objects.filter(status='Active').count()
            # Use DB aggregation instead of Python sum() for 10x performance
            from django.db.models import Sum
            total_balance = Account.objects.aggregate(total=Sum('balance'))['total'] or 0

            # Recent accounts (last 30 days)
            from django.utils import timezone
            thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
            recent_accounts = Account.objects.filter(
                opening_application__created_at__gte=thirty_days_ago
            ).count()

            return self.success_response(data={
                'total_accounts': total_accounts,
                'active_accounts': active_accounts,
                'total_balance': float(total_balance),
                'recent_accounts': recent_accounts
            })

        except Exception as e:
            return self.handle_error(e)


@method_decorator(csrf_exempt, name='dispatch')
class AccountSummaryViewSet(viewsets.ViewSet):
    """
    Provides account summary information.
    Endpoint: /api/banking/account-summary/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None  # Custom response, no serializer needed

    def list(self, request):
        """Get account summary for the current user."""
        user = request.user
        accounts = Account.objects.filter(owner=user)

        # Calculate totals using DB aggregation for efficiency
        from django.db.models import Sum
        total_balance = Account.objects.filter(owner=user).aggregate(total=Sum('balance'))['total'] or 0
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
    lookup_field = 'id'  # Explicitly set lookup field

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
    lookup_field = 'id'  # Explicitly set lookup field

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
            from django.db.models import Count, Sum
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
            from django.db.models import Count, Sum
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
    lookup_field = 'id'  # Explicitly set lookup field

    def get_queryset(self):
        """Filter loans based on user role."""
        user = self.request.user
        if user.role == 'customer':
            # Customers can see their own loans
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


class UserEncryptionKeyViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles user encryption keys for end-to-end messaging.
    Endpoint: /api/banking/encryption-keys/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserEncryptionKeySerializer
    lookup_field = 'id'  # Explicitly set lookup field

    def get_queryset(self):
        """Users can only see their own encryption keys."""
        return UserEncryptionKey.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Allow retrieving public keys of other users for encryption purposes."""
        user_id = kwargs.get('pk')
        try:
            # Try to get the encryption key for the specified user
            key_obj = UserEncryptionKey.objects.get(user_id=user_id)
            serializer = self.get_serializer(key_obj)
            return self.success_response(data=serializer.data)
        except UserEncryptionKey.DoesNotExist:
            return self.error_response(
                message='Encryption key not found',
                status_code=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        """Create or update encryption keys for the current user."""
        user = request.user
        public_key = request.data.get('public_key')
        if not public_key:
            return self.error_response(message='public_key is required', status_code=400)

        obj, created = UserEncryptionKey.objects.get_or_create(
            user=user,
            defaults={
                'public_key': public_key,
                'private_key_encrypted': '',
                'key_salt': '',
            }
        )
        if not created:
            obj.public_key = public_key
            obj.save()

        serializer = self.get_serializer(obj)
        return self.success_response(data=serializer.data, status_code=201 if created else 200)

    def perform_create(self, serializer):
        """Set the user to the current request user."""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def generate_keys(self, request):
        """Generate encryption keys for the current user."""
        try:
            user = request.user

            # Check if keys already exist
            if UserEncryptionKey.objects.filter(user=user).exists():
                return self.error_response(
                    message='Encryption keys already exist for this user',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Generate ECDH key pair
            private_key_pem, public_key_pem = MessagingEncryption.generate_ecdh_keypair()

            # Encrypt private key with user's password (simplified - in production use proper key management)
            password = request.data.get('password')
            if not password:
                return self.error_response(
                    message='Password required to encrypt private key',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            encrypted_private_key = MessagingEncryption.encrypt_private_key(private_key_pem, password)

            # Create encryption key record
            encryption_key = UserEncryptionKey.objects.create(
                user=user,
                public_key=public_key_pem,
                private_key_encrypted=encrypted_private_key['encrypted_key'],
                key_salt=encrypted_private_key['salt']
            )

            # Log key generation for audit
            AuditService.log_financial_operation(
                user=user,
                operation_type="CREATE",
                model_name="UserEncryptionKey",
                object_id=str(encryption_key.id),
                changes={
                    'has_public_key': bool(public_key_pem),
                    'has_private_key': bool(encrypted_private_key['encrypted_key']),
                    'has_salt': bool(encrypted_private_key['salt'])
                },
                metadata={
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT'),
                    'key_generation_method': 'ECDH_P256',
                    'encryption_method': 'AES_GCM'
                },
                audit_level='HIGH'  # High audit level for encryption key operations
            )

            serializer = self.get_serializer(encryption_key)
            return self.success_response(
                data=serializer.data,
                message='Encryption keys generated successfully'
            )

        except Exception as e:
            return self.handle_error(e)


class MessageThreadViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles message threads for staff communication.
    Endpoint: /api/banking/message-threads/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BankingMessageThreadSerializer
    lookup_field = 'id'  # Explicitly set lookup field

    def get_queryset(self):
        """Users can only see threads they participate in."""
        return MessageThread.objects.filter(participants=self.request.user)

    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        """Create a new message thread using MessageThreadCreateSerializer."""
        serializer = MessageThreadCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()

        # Log thread creation for audit
        AuditService.log_financial_operation(
            user=request.user,
            operation_type="CREATE",
            model_name="MessageThread",
            object_id=str(thread.id),
            changes={
                'subject': thread.subject,
                'participants_count': thread.participants.count(),
                'participants': [str(p.id) for p in thread.participants.all()],
                'has_initial_message': thread.messages.exists()
            },
            metadata={
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT'),
                'participants_emails': [p.email for p in thread.participants.all()]
            },
            audit_level='MEDIUM'
        )

        response_serializer = self.get_serializer(thread)
        return self.success_response(
            data=response_serializer.data,
            message='Message thread created successfully',
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_thread(self, request):
        """Create a new message thread."""
        try:
            serializer = MessageThreadCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)

            # Use the serializer's create method to properly handle the MessageThread creation
            thread = serializer.save()

            # Log thread creation for audit
            AuditService.log_financial_operation(
                user=request.user,
                operation_type="CREATE",
                model_name="MessageThread",
                object_id=str(thread.id),
                changes={
                    'subject': thread.subject,
                    'participants_count': thread.participants.count(),
                    'participants': [str(p.id) for p in thread.participants.all()],
                    'has_initial_message': thread.messages.exists()
                },
                metadata={
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT'),
                    'participants_emails': [p.email for p in thread.participants.all()]
                },
                audit_level='MEDIUM'
            )

            response_serializer = self.get_serializer(thread)
            return self.success_response(
                data=response_serializer.data,
                message='Message thread created successfully',
                status_code=status.HTTP_201_CREATED
            )

        except Exception as e:
            return self.handle_error(e)


class ClientRegistrationViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles client registration applications with OTP verification.
    Endpoint: /api/banking/client-registrations/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ClientRegistrationSerializer

    def get_queryset(self):
        """Filter client registrations based on user role."""
        user = self.request.user
        if user.role in ['manager', 'operations_manager', 'administrator']:
            # Staff can see all registrations
            return ClientRegistration.objects.all()
        return ClientRegistration.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ClientRegistrationCreateSerializer
        return ClientRegistrationSerializer

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def submit_registration(self, request):
        """Submit a new client registration application."""
        try:
            serializer = ClientRegistrationCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Create registration
            registration = serializer.save(
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )

            # Submit for OTP verification
            registration.submit_application()

            response_serializer = ClientRegistrationSerializer(registration)
            return self.success_response(
                data=response_serializer.data,
                message='Client registration submitted successfully. Please verify with OTP.',
                status_code=status.HTTP_201_CREATED
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_otp(self, request, pk=None):
        """Send OTP to the client's phone number."""
        try:
            registration = self.get_object()

            if registration.status != 'otp_pending':
                return self.error_response(
                    message='OTP verification not required at this stage',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Send OTP
            otp_code = registration.send_otp()

            return self.success_response(
                data={'otp_sent': True},
                message='OTP sent successfully to client phone number'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_otp(self, request, pk=None):
        """Verify OTP code for client registration."""
        try:
            registration = self.get_object()
            otp_code = request.data.get('otp_code')

            if not otp_code:
                return self.error_response(
                    message='OTP code is required',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            success, message = registration.verify_otp(otp_code)

            if success:
                serializer = self.get_serializer(registration)
                return self.success_response(
                    data=serializer.data,
                    message='OTP verified successfully. Registration is now under review.'
                )
            else:
                return self.error_response(
                    message=message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_registration(self, request, pk=None):
        """Approve a client registration."""
        try:
            if request.user.role not in ['manager', 'operations_manager', 'administrator']:
                return self.error_response(
                    message='Only managers can approve client registrations',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            registration = self.get_object()

            if registration.status != 'otp_verified':
                return self.error_response(
                    message='Registration must be OTP verified before approval',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            notes = request.data.get('notes', '')
            registration.approve_registration(request.user, notes)

            # Create user account and bank account
            user = registration.create_user_account()
            if user:
                account = registration.create_bank_account()

            serializer = self.get_serializer(registration)
            return self.success_response(
                data=serializer.data,
                message='Client registration approved successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject_registration(self, request, pk=None):
        """Reject a client registration."""
        try:
            if request.user.role not in ['manager', 'operations_manager', 'administrator']:
                return self.error_response(
                    message='Only managers can reject client registrations',
                    status_code=status.HTTP_403_FORBIDDEN
                )

            registration = self.get_object()
            notes = request.data.get('notes', '')

            registration.reject_registration(request.user, notes)

            serializer = self.get_serializer(registration)
            return self.success_response(
                data=serializer.data,
                message='Client registration rejected successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def send_otp_public(self, request):
        """Public endpoint to send OTP (used during registration form)."""
        try:
            serializer = OTPSendSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            phone_number = serializer.validated_data['phone_number']

            # Find registration by phone number
            try:
                registration = ClientRegistration.objects.get(
                    phone_number=phone_number,
                    status='otp_pending'
                )
            except ClientRegistration.DoesNotExist:
                return self.error_response(
                    message='No pending registration found for this phone number',
                    status_code=status.HTTP_404_NOT_FOUND
                )

            # Send OTP
            otp_code = registration.send_otp()

            return self.success_response(
                data={'otp_sent': True},
                message='OTP sent successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_otp_public(self, request):
        """Public endpoint to verify OTP (used during registration form)."""
        try:
            serializer = OTPVerifySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            phone_number = serializer.validated_data['phone_number']
            otp_code = serializer.validated_data['otp_code']

            # Find registration by phone number
            try:
                registration = ClientRegistration.objects.get(
                    phone_number=phone_number,
                    status='otp_pending'
                )
            except ClientRegistration.DoesNotExist:
                return self.error_response(
                    message='No pending registration found for this phone number',
                    status_code=status.HTTP_404_NOT_FOUND
                )

            success, message = registration.verify_otp(otp_code)

            if success:
                response_serializer = ClientRegistrationSerializer(registration)
                return self.success_response(
                    data=response_serializer.data,
                    message='OTP verified successfully. Registration submitted for review.'
                )
            else:
                return self.error_response(
                    message=message,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark all messages in thread as read for current user."""
        try:
            thread = self.get_object()

            # Mark unread messages as read
            unread_messages = thread.messages.filter(is_read=False).exclude(sender=request.user)
            for message in unread_messages:
                message.mark_as_read(request.user)

            return self.success_response(message='Thread marked as read')

        except Exception as e:
            return self.handle_error(e)


class MessageViewSet(viewsets.ModelViewSet, ViewMixin):
    """
    Handles messages within threads.
    Endpoint: /api/banking/messages/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BankingMessageSerializer

    def get_queryset(self):
        """Users can only see messages in threads they participate in."""
        return Message.objects.filter(thread__participants=self.request.user)

    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        """Set sender and update thread timestamp."""
        message = serializer.save(sender=self.request.user)
        message.thread.update_last_message()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def send_message(self, request):
        """Send a new message to a thread."""
        try:
            serializer = MessageCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)

            # Create message
            message = serializer.save(sender=request.user)

            # Update thread timestamp
            message.thread.update_last_message()

            # Mark message as read by sender
            message.mark_as_read(request.user)

            # Broadcast message to WebSocket groups of all participants except sender
            channel_layer = get_channel_layer()
            # Use content if encrypted_content is not available (for backward compatibility)
            content_to_send = message.encrypted_content or message.content
            message_data = {
                'type': 'new_message',
                'message': {
                    'id': str(message.id),
                    'thread_id': str(message.thread.id),
                    'sender_id': str(message.sender.id),
                    'sender_name': message.sender.get_full_name() or message.sender.email,
                    'encrypted_content': content_to_send,
                    'iv': message.iv,
                    'auth_tag': message.auth_tag,
                    'timestamp': message.timestamp.isoformat()
                }
            }

            # Send to thread group (all participants will receive it)
            async_to_sync(channel_layer.group_send)(
                f'messaging_{message.thread.id}',
                message_data
            )

            # Log message creation for audit
            AuditService.log_financial_operation(
                user=request.user,
                operation_type="CREATE",
                model_name="Message",
                object_id=str(message.id),
                changes={
                    'thread_id': str(message.thread.id),
                    'thread_subject': message.thread.subject,
                    'message_type': message.message_type,
                    'has_encryption': bool(message.encrypted_content),
                    'has_iv': bool(message.iv),
                    'has_auth_tag': bool(message.auth_tag)
                },
                metadata={
                    'ip_address': request.META.get('REMOTE_ADDR'),
                    'user_agent': request.META.get('HTTP_USER_AGENT'),
                    'participants_count': message.thread.participants.count(),
                    'encrypted_content_length': len(message.encrypted_content) if message.encrypted_content else 0
                },
                audit_level='MEDIUM'
            )

            response_serializer = self.get_serializer(message)
            return self.success_response(
                data=response_serializer.data,
                message='Message sent successfully',
                status_code=status.HTTP_201_CREATED
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_reaction(self, request, pk=None):
        """Add a reaction to a message."""
        try:
            message = self.get_object()
            emoji = request.data.get('emoji')

            if not emoji:
                return self.error_response(
                    message='Emoji is required',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Check if user already reacted with this emoji
            from .models import MessageReaction
            existing_reaction = MessageReaction.objects.filter(
                message=message,
                user=request.user,
                emoji=emoji
            ).first()

            if existing_reaction:
                return self.error_response(
                    message='You have already reacted with this emoji',
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            # Create reaction
            reaction = MessageReaction.objects.create(
                message=message,
                user=request.user,
                emoji=emoji
            )

            # Broadcast reaction to WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'messaging_{message.thread.id}',
                {
                    'type': 'reaction_added',
                    'reaction': {
                        'id': str(reaction.id),
                        'message_id': str(message.id),
                        'user_id': str(request.user.id),
                        'user_name': f"{request.user.first_name} {request.user.last_name}",
                        'emoji': reaction.emoji,
                        'created_at': reaction.created_at.isoformat()
                    }
                }
            )

            return self.success_response(
                data={
                    'id': str(reaction.id),
                    'emoji': reaction.emoji,
                    'created_at': reaction.created_at.isoformat()
                },
                message='Reaction added successfully'
            )

        except Exception as e:
            return self.handle_error(e)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark a specific message as read."""
        try:
            message = self.get_object()
            message.mark_as_read(request.user)

            serializer = self.get_serializer(message)
            return self.success_response(
                data=serializer.data,
                message='Message marked as read'
            )

        except Exception as e:
            return self.handle_error(e)


class AccountSummaryView(APIView):
    """API view for account summary with frontend-compatible data."""
    permission_classes = [IsAuthenticated]
    serializer_class = None  # Custom response, no serializer needed

    def get(self, request):
        accounts = Account.objects.filter(owner=request.user)
        serializer = AccountListSerializer(accounts, many=True)
        return Response({
            'accounts': serializer.data,
            'total_balance': float(sum(acc.balance for acc in accounts))
        })


class PendingLoansView(viewsets.ViewSet):
    """API view for pending loans for the current user."""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        loans = Loan.objects.filter(account__owner=request.user, status='pending')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data)

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
            from django.db.models import Count
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
                        'assigned_to': f"{complaint.assigned_to.first_name} {complaint.assigned_to.last_name}" if complaint.assigned_to else 'Unassigned'
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