from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import ServiceRequest, CheckbookRequest, StatementRequest, LoanInfoRequest
from .serializers import (
    ServiceRequestSerializer, CheckbookRequestSerializer, StatementRequestSerializer,
    LoanInfoRequestSerializer, ServiceRequestCreateSerializer, ServiceRequestUpdateSerializer
)


class ServiceRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing service requests.

    Provides CRUD operations for service requests with role-based access control.
    Cashiers can create and manage requests, managers can approve/reject, etc.
    """
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on user role and permissions."""
        user = self.request.user

        if user.role == 'customer':
            # Customers can only see their own requests
            return ServiceRequest.objects.filter(member=user)
        elif user.role in ['cashier', 'mobile_banker']:
            # Cashiers can see requests they created or for their branch
            return ServiceRequest.objects.filter(requested_by=user)
        elif user.role in ['manager', 'operations_manager', 'administrator']:
            # Managers can see all requests
            return ServiceRequest.objects.all()
        else:
            return ServiceRequest.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ServiceRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ServiceRequestUpdateSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        """Set the requested_by field to current user."""
        serializer.save(requested_by=self.request.user)

    @extend_schema(
        summary="Approve Service Request",
        description="Approve a pending service request. Requires manager or higher role.",
        responses={
            200: ServiceRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a service request."""
        if request.user.role not in ['manager', 'operations_manager', 'administrator']:
            return Response(
                {'error': 'Only managers and operations managers can approve requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        service_request = self.get_object()
        if service_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service_request.approve(request.user)
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)

    @extend_schema(
        summary="Reject Service Request",
        description="Reject a pending service request with optional reason. Requires manager or higher role.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'reason': {'type': 'string', 'description': 'Reason for rejection'}
                }
            }
        },
        responses={
            200: ServiceRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a service request."""
        if request.user.role not in ['manager', 'operations_manager', 'administrator']:
            return Response(
                {'error': 'Only managers and operations managers can reject requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        service_request = self.get_object()
        if service_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        service_request.reject(request.user, reason)
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)

    @extend_schema(
        summary="Start Fulfillment",
        description="Mark request as in progress. Requires cashier or higher role.",
        responses={
            200: ServiceRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def start_fulfillment(self, request, pk=None):
        """Start fulfilling a service request."""
        if request.user.role not in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']:
            return Response(
                {'error': 'Insufficient permissions to fulfill requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        service_request = self.get_object()
        if service_request.status != 'approved':
            return Response(
                {'error': 'Only approved requests can be fulfilled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service_request.start_fulfillment()
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)

    @extend_schema(
        summary="Complete Fulfillment",
        description="Mark request as fulfilled. Requires cashier or higher role.",
        responses={
            200: ServiceRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def complete_fulfillment(self, request, pk=None):
        """Complete fulfillment of a service request."""
        if request.user.role not in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']:
            return Response(
                {'error': 'Insufficient permissions to complete fulfillment'},
                status=status.HTTP_403_FORBIDDEN
            )

        service_request = self.get_object()
        if service_request.status != 'in_progress':
            return Response(
                {'error': 'Only in-progress requests can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service_request.complete_fulfillment(request.user)
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)

    @extend_schema(
        summary="Cancel Request",
        description="Cancel a service request. Can be done by request creator or manager+.",
        responses={
            200: ServiceRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a service request."""
        service_request = self.get_object()

        # Allow cancellation by creator or manager+
        can_cancel = (
            request.user == service_request.requested_by or
            request.user.role in ['manager', 'operations_manager', 'administrator']
        )

        if not can_cancel:
            return Response(
                {'error': 'Only the request creator or managers can cancel requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        if service_request.status in ['fulfilled', 'cancelled']:
            return Response(
                {'error': 'Cannot cancel completed or already cancelled requests'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service_request.cancel()
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)


class CheckbookRequestViewSet(ServiceRequestViewSet):
    """ViewSet for checkbook requests."""
    queryset = CheckbookRequest.objects.all()
    serializer_class = CheckbookRequestSerializer

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user

        if user.role == 'customer':
            return CheckbookRequest.objects.filter(member=user)
        elif user.role in ['cashier', 'mobile_banker']:
            return CheckbookRequest.objects.filter(requested_by=user)
        elif user.role in ['manager', 'operations_manager', 'administrator']:
            return CheckbookRequest.objects.all()
        else:
            return CheckbookRequest.objects.none()


class StatementRequestViewSet(ServiceRequestViewSet):
    """ViewSet for statement requests."""
    queryset = StatementRequest.objects.all()
    serializer_class = StatementRequestSerializer

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user

        if user.role == 'customer':
            return StatementRequest.objects.filter(member=user)
        elif user.role in ['cashier', 'mobile_banker']:
            return StatementRequest.objects.filter(requested_by=user)
        elif user.role in ['manager', 'operations_manager', 'administrator']:
            return StatementRequest.objects.all()
        else:
            return StatementRequest.objects.none()


class LoanInfoRequestViewSet(ServiceRequestViewSet):
    """ViewSet for loan information requests."""
    queryset = LoanInfoRequest.objects.all()
    serializer_class = LoanInfoRequestSerializer

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user

        if user.role == 'customer':
            return LoanInfoRequest.objects.filter(member=user)
        elif user.role in ['cashier', 'mobile_banker']:
            return LoanInfoRequest.objects.filter(requested_by=user)
        elif user.role in ['manager', 'operations_manager', 'administrator']:
            return LoanInfoRequest.objects.all()
        else:
            return LoanInfoRequest.objects.none()

    @extend_schema(
        summary="Verify Authorization",
        description="Verify member authorization for loan information access. Requires manager or higher.",
        responses={
            200: LoanInfoRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def verify_authorization(self, request, pk=None):
        """Verify member authorization for loan information."""
        if request.user.role not in ['manager', 'operations_manager', 'administrator']:
            return Response(
                {'error': 'Only managers can verify loan information authorization'},
                status=status.HTTP_403_FORBIDDEN
            )

        loan_request = self.get_object()
        if loan_request.authorization_verified:
            return Response(
                {'error': 'Authorization already verified'},
                status=status.HTTP_400_BAD_REQUEST
            )

        loan_request.verify_authorization(request.user)
        serializer = self.get_serializer(loan_request)
        return Response(serializer.data)

    @extend_schema(
        summary="Deliver Information",
        description="Mark loan information as delivered with optional notes.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'notes': {'type': 'string', 'description': 'Delivery notes'}
                }
            }
        },
        responses={
            200: LoanInfoRequestSerializer,
            403: {'description': 'Insufficient permissions'},
            404: {'description': 'Request not found'}
        }
    )
    @action(detail=True, methods=['post'])
    def deliver_info(self, request, pk=None):
        """Mark loan information as delivered."""
        if request.user.role not in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']:
            return Response(
                {'error': 'Insufficient permissions to deliver information'},
                status=status.HTTP_403_FORBIDDEN
            )

        loan_request = self.get_object()
        if not loan_request.authorization_verified:
            return Response(
                {'error': 'Authorization must be verified before delivering information'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if loan_request.info_delivered:
            return Response(
                {'error': 'Information already delivered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = request.data.get('notes', '')
        loan_request.deliver_info(notes)
        serializer = self.get_serializer(loan_request)
        return Response(serializer.data)


# Utility views for dashboard and statistics

class ServiceRequestStatsView(viewsets.ViewSet):
    """View for service request statistics."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Service Request Statistics",
        description="Get statistics about service requests.",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'total_requests': {'type': 'integer'},
                    'pending_requests': {'type': 'integer'},
                    'approved_requests': {'type': 'integer'},
                    'fulfilled_requests': {'type': 'integer'},
                    'rejected_requests': {'type': 'integer'},
                    'requests_by_type': {
                        'type': 'object',
                        'properties': {
                            'checkbook': {'type': 'integer'},
                            'statement': {'type': 'integer'},
                            'loan_info': {'type': 'integer'}
                        }
                    }
                }
            }
        }
    )
    def list(self, request):
        """Get service request statistics."""
        user = request.user

        # Base queryset based on user role
        if user.role in ['manager', 'operations_manager', 'administrator']:
            queryset = ServiceRequest.objects.all()
        elif user.role in ['cashier', 'mobile_banker']:
            queryset = ServiceRequest.objects.filter(requested_by=user)
        else:
            queryset = ServiceRequest.objects.filter(member=user)

        stats = {
            'total_requests': queryset.count(),
            'pending_requests': queryset.filter(status='pending').count(),
            'approved_requests': queryset.filter(status='approved').count(),
            'fulfilled_requests': queryset.filter(status='fulfilled').count(),
            'rejected_requests': queryset.filter(status='rejected').count(),
            'cancelled_requests': queryset.filter(status='cancelled').count(),
            'requests_by_type': {
                'checkbook': queryset.filter(request_type='checkbook').count(),
                'statement': queryset.filter(request_type='statement').count(),
                'loan_info': queryset.filter(request_type='loan_info').count(),
            }
        }

        return Response(stats)