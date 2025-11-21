from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import timedelta
from .models import (
    ChatSession, ChatMessage, SupportTicket,
    ChatSessionAudit, SupportTicketAudit, ChatAnalytics
)
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer,
    ChatSessionCreateSerializer, ChatMessageCreateSerializer,
    SupportTicketSerializer, SupportTicketCreateSerializer,
    ChatSessionAuditSerializer, SupportTicketAuditSerializer,
    ChatAnalyticsSerializer, ChatAssignmentSerializer,
    ChatStatusUpdateSerializer, ReadReceiptSerializer
)


class ChatSessionPagination(PageNumberPagination):
    """Pagination for chat sessions."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ChatSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chat sessions."""

    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ChatSessionPagination

    def get_queryset(self):
        """Get queryset based on user role."""
        user = self.request.user

        if user.role == 'customer':
            # Customers can only see their own sessions
            return ChatSession.objects.filter(customer=user)
        elif user.role in ['cashier', 'manager', 'administrator']:
            # Staff can see sessions they're assigned to or all sessions
            return ChatSession.objects.filter(
                Q(assigned_cashier=user) | Q(assigned_cashier__isnull=True)
            ).distinct()
        else:
            return ChatSession.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ChatSessionCreateSerializer
        return ChatSessionSerializer

    def perform_create(self, serializer):
        """Create a new chat session."""
        serializer.save()

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign a cashier to a chat session."""
        session = self.get_object()
        serializer = ChatAssignmentSerializer(data=request.data)

        if serializer.is_valid():
            cashier_id = serializer.validated_data['cashier_id']
            notes = serializer.validated_data.get('notes', '')

            try:
                from users.models import User
                cashier = User.objects.get(id=cashier_id, role='cashier')

                session.assign_cashier(cashier)

                return Response({
                    'status': 'assigned',
                    'assigned_cashier': cashier.email,
                    'assigned_at': session.assigned_at
                })
            except User.DoesNotExist:
                return Response(
                    {'error': 'Cashier not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a chat session."""
        session = self.get_object()
        serializer = ChatStatusUpdateSerializer(data=request.data)

        if serializer.is_valid():
            notes = serializer.validated_data.get('notes', '')
            session.close_session(request.user, notes)

            return Response({
                'status': 'closed',
                'closed_at': session.closed_at
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """Escalate a chat session."""
        session = self.get_object()
        serializer = ChatStatusUpdateSerializer(data=request.data)

        if serializer.is_valid():
            notes = serializer.validated_data.get('notes', '')
            session.escalate_session(request.user, notes)

            return Response({
                'status': 'escalated',
                'priority': session.priority
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def queue(self, request):
        """Get chat queue for cashiers."""
        if request.user.role not in ['cashier', 'manager', 'administrator']:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get waiting sessions ordered by priority and creation time
        waiting_sessions = ChatSession.objects.filter(
            status='waiting'
        ).order_by('-priority', 'started_at')

        # Update queue positions
        for i, session in enumerate(waiting_sessions):
            session.queue_position = i + 1
            session.save(update_fields=['queue_position'])

        serializer = self.get_serializer(waiting_sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active chat sessions for the current user."""
        if request.user.role == 'customer':
            sessions = ChatSession.objects.filter(
                customer=request.user,
                status='active'
            )
        else:
            sessions = ChatSession.objects.filter(
                assigned_cashier=request.user,
                status='active'
            )

        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class ChatMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing chat messages."""

    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get messages for a specific session."""
        session_id = self.kwargs.get('session_pk')
        if session_id:
            # Check if user can access this session
            session = get_object_or_404(ChatSession, id=session_id)
            if self._can_access_session(self.request.user, session):
                return ChatMessage.objects.filter(session=session)
        return ChatMessage.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer."""
        if self.action == 'create':
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def perform_create(self, serializer):
        """Create a new message."""
        session_id = self.kwargs.get('session_pk')
        serializer.save(
            session_id=session_id,
            sender=self.request.user
        )

    def _can_access_session(self, user, session):
        """Check if user can access the session."""
        if user == session.customer:
            return True
        if user == session.assigned_cashier:
            return True
        if user.has_role_permission('manager'):
            return True
        return False


class SupportTicketViewSet(viewsets.ModelViewSet):
    """ViewSet for managing support tickets."""

    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ChatSessionPagination

    def get_queryset(self):
        """Get queryset based on user role."""
        user = self.request.user

        if user.role == 'customer':
            # Customers can see tickets from their chat sessions
            return SupportTicket.objects.filter(
                chat_session__customer=user
            )
        elif user.role in ['cashier', 'manager', 'administrator']:
            # Staff can see tickets they're assigned to or created
            return SupportTicket.objects.filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()
        else:
            return SupportTicket.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer."""
        if self.action == 'create':
            return SupportTicketCreateSerializer
        return SupportTicketSerializer

    def perform_create(self, serializer):
        """Create a new support ticket."""
        session_id = self.kwargs.get('session_pk')
        serializer.save(
            chat_session_id=session_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to a user."""
        ticket = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from users.models import User
            assignee = User.objects.get(id=user_id)
            ticket.assign_ticket(request.user, assignee)

            return Response({
                'status': 'assigned',
                'assigned_to': assignee.email
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a support ticket."""
        ticket = self.get_object()
        resolution = request.data.get('resolution', '')

        if not resolution.strip():
            return Response(
                {'error': 'Resolution is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket.add_resolution(request.user, resolution)

        return Response({
            'status': 'resolved',
            'resolved_at': ticket.resolved_at
        })

    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Add customer feedback to a ticket."""
        ticket = self.get_object()
        rating = request.data.get('rating')
        feedback = request.data.get('feedback', '')

        if not rating or not (1 <= int(rating) <= 5):
            return Response(
                {'error': 'Rating must be between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket.add_customer_feedback(int(rating), feedback)

        return Response({
            'status': 'feedback_added',
            'rating': ticket.customer_satisfaction
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, session_id):
    """Mark messages as read."""
    serializer = ReadReceiptSerializer(data=request.data)

    if serializer.is_valid():
        message_ids = serializer.validated_data['message_ids']

        # Get session and verify access
        session = get_object_or_404(ChatSession, id=session_id)
        if not _can_access_session(request.user, session):
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Mark messages as read
        updated = ChatMessage.objects.filter(
            id__in=message_ids,
            session=session
        ).exclude(sender=request.user).update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({
            'status': 'marked_read',
            'updated_count': updated
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for chat analytics."""

    serializer_class = ChatAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    queryset = ChatAnalytics.objects.all()

    def get_queryset(self):
        """Filter analytics based on user permissions."""
        user = self.request.user
        if user.has_role_permission('manager'):
            return ChatAnalytics.objects.all()
        return ChatAnalytics.objects.none()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get current chat analytics summary."""
        today = timezone.now().date()

        # Get today's analytics or create if doesn't exist
        analytics, created = ChatAnalytics.objects.get_or_create(date=today)

        # Update with current data
        analytics.total_sessions = ChatSession.objects.filter(
            started_at__date=today
        ).count()

        analytics.active_sessions = ChatSession.objects.filter(
            status='active'
        ).count()

        analytics.total_messages = ChatMessage.objects.filter(
            timestamp__date=today
        ).count()

        analytics.save()

        serializer = self.get_serializer(analytics)
        return Response(serializer.data)


def _can_access_session(user, session):
    """Helper function to check session access."""
    if user == session.customer:
        return True
    if user == session.assigned_cashier:
        return True
    if user.has_role_permission('manager'):
        return True
    return False