"""
Transaction approval workflow system for high-risk operations.
Manages approval processes for transactions requiring additional authorization.
"""

import logging
from django.utils import timezone
from datetime import timedelta
from typing import Dict, List, Any, Optional
from django.contrib.auth import get_user_model
from banking_backend.utils.audit import AuditService
from banking_backend.utils.monitoring import log_security_event

logger = logging.getLogger(__name__)
User = get_user_model()


class ApprovalWorkflowService:
    """Service for managing transaction approval workflows."""

    # Approval thresholds and rules
    HIGH_VALUE_THRESHOLD = 10000.00  # GHS 10,000
    CRITICAL_VALUE_THRESHOLD = 50000.00  # GHS 50,000
    APPROVAL_TIMEOUT_HOURS = 24  # Hours before auto-rejection

    def __init__(self):
        self.pending_approvals = {}  # In production, use database

    def check_requires_approval(self, transaction_data: Dict[str, Any],
                               user_role: str) -> Dict[str, Any]:
        """
        Check if a transaction requires approval.

        Args:
            transaction_data: Transaction details
            user_role: Role of the user initiating the transaction

        Returns:
            Dict with approval requirements
        """
        amount = float(transaction_data.get('amount', 0))
        transaction_type = transaction_data.get('type', '')

        requires_approval = False
        approval_level = 'NONE'
        reasons = []

        # Amount-based approval requirements
        if amount >= self.CRITICAL_VALUE_THRESHOLD:
            requires_approval = True
            approval_level = 'SENIOR_MANAGER'
            reasons.append(f'Amount exceeds critical threshold (GHS {self.CRITICAL_VALUE_THRESHOLD})')
        elif amount >= self.HIGH_VALUE_THRESHOLD:
            requires_approval = True
            approval_level = 'MANAGER'
            reasons.append(f'Amount exceeds high-value threshold (GHS {self.HIGH_VALUE_THRESHOLD})')

        # Role-based requirements
        if user_role == 'cashier' and amount >= 5000.00:
            requires_approval = True
            approval_level = 'MANAGER'
            reasons.append('Cashier transactions over GHS 5,000 require manager approval')

        # Transaction type specific rules
        if transaction_type in ['international_transfer', 'large_withdrawal']:
            requires_approval = True
            approval_level = 'OPERATIONS_MANAGER'
            reasons.append(f'{transaction_type.replace("_", " ").title()} requires special approval')

        # Risk-based approval (if risk score is high)
        risk_score = transaction_data.get('risk_score', 0)
        if risk_score >= 7:
            requires_approval = True
            approval_level = 'SENIOR_MANAGER'
            reasons.append(f'High risk score ({risk_score}) requires senior approval')

        return {
            'requires_approval': requires_approval,
            'approval_level': approval_level,
            'reasons': reasons,
            'estimated_approval_time': '2-4 hours' if requires_approval else None
        }

    def create_approval_request(self, transaction_data: Dict[str, Any],
                               requester: User, approval_level: str) -> Dict[str, Any]:
        """
        Create an approval request for a transaction.

        Args:
            transaction_data: Transaction details
            requester: User requesting approval
            approval_level: Required approval level

        Returns:
            Approval request data
        """
        request_id = f"APR_{timezone.now().strftime('%Y%m%d%H%M%S')}_{requester.id}"

        approval_request = {
            'id': request_id,
            'transaction_data': transaction_data,
            'requester': {
                'id': requester.id,
                'name': requester.get_full_name(),
                'role': getattr(requester, 'role', 'unknown')
            },
            'approval_level': approval_level,
            'status': 'PENDING',
            'created_at': timezone.now().isoformat(),
            'expires_at': (timezone.now() + timedelta(hours=self.APPROVAL_TIMEOUT_HOURS)).isoformat(),
            'approvers': self._get_approvers_for_level(approval_level),
            'approval_reasons': transaction_data.get('approval_reasons', [])
        }

        # Store in pending approvals (in production, save to database)
        self.pending_approvals[request_id] = approval_request

        # Log approval request creation
        AuditService.log_financial_operation(
            user=requester,
            operation_type="APPROVAL_REQUEST_CREATED",
            model_name="Transaction",
            object_id=request_id,
            changes={
                'approval_level': approval_level,
                'transaction_amount': transaction_data.get('amount'),
                'transaction_type': transaction_data.get('type')
            },
            metadata={'approval_request': approval_request}
        )

        # Create security alert for high-level approvals
        if approval_level in ['SENIOR_MANAGER', 'OPERATIONS_MANAGER']:
            log_security_event(
                event_type='high_value_transaction_approval_required',
                severity='medium',
                user_id=str(requester.id),
                description=f"High-value transaction requires {approval_level} approval",
                details={
                    'request_id': request_id,
                    'amount': transaction_data.get('amount'),
                    'approval_level': approval_level
                }
            )

        return approval_request

    def approve_transaction(self, request_id: str, approver: User,
                          approval_notes: str = None) -> Dict[str, Any]:
        """
        Approve a pending transaction.

        Args:
            request_id: Approval request ID
            approver: User approving the transaction
            approval_notes: Optional approval notes

        Returns:
            Approval result
        """
        if request_id not in self.pending_approvals:
            return {'success': False, 'error': 'Approval request not found'}

        request = self.pending_approvals[request_id]

        # Check if approver has required permissions
        if not self._can_approve_level(approver, request['approval_level']):
            return {'success': False, 'error': 'Insufficient approval permissions'}

        # Check if request has expired
        if timezone.now() > timezone.datetime.fromisoformat(request['expires_at']):
            request['status'] = 'EXPIRED'
            return {'success': False, 'error': 'Approval request has expired'}

        # Update request status
        request['status'] = 'APPROVED'
        request['approved_at'] = timezone.now().isoformat()
        request['approved_by'] = {
            'id': approver.id,
            'name': approver.get_full_name(),
            'role': getattr(approver, 'role', 'unknown')
        }
        request['approval_notes'] = approval_notes

        # Log approval
        AuditService.log_financial_operation(
            user=approver,
            operation_type="APPROVAL_GRANTED",
            model_name="Transaction",
            object_id=request_id,
            changes={
                'approval_level': request['approval_level'],
                'transaction_amount': request['transaction_data'].get('amount'),
                'approved_at': request['approved_at']
            },
            metadata={'approval_request': request}
        )

        return {
            'success': True,
            'message': 'Transaction approved successfully',
            'request_id': request_id,
            'approved_transaction_data': request['transaction_data']
        }

    def reject_transaction(self, request_id: str, approver: User,
                         rejection_reason: str) -> Dict[str, Any]:
        """
        Reject a pending transaction.

        Args:
            request_id: Approval request ID
            approver: User rejecting the transaction
            rejection_reason: Reason for rejection

        Returns:
            Rejection result
        """
        if request_id not in self.pending_approvals:
            return {'success': False, 'error': 'Approval request not found'}

        request = self.pending_approvals[request_id]

        # Check if approver has required permissions
        if not self._can_approve_level(approver, request['approval_level']):
            return {'success': False, 'error': 'Insufficient approval permissions'}

        # Update request status
        request['status'] = 'REJECTED'
        request['rejected_at'] = timezone.now().isoformat()
        request['rejected_by'] = {
            'id': approver.id,
            'name': approver.get_full_name(),
            'role': getattr(approver, 'role', 'unknown')
        }
        request['rejection_reason'] = rejection_reason

        # Log rejection
        AuditService.log_financial_operation(
            user=approver,
            operation_type="APPROVAL_REJECTED",
            model_name="Transaction",
            object_id=request_id,
            changes={
                'approval_level': request['approval_level'],
                'transaction_amount': request['transaction_data'].get('amount'),
                'rejection_reason': rejection_reason
            },
            metadata={'approval_request': request}
        )

        # Create security alert for rejected high-value transactions
        amount = request['transaction_data'].get('amount', 0)
        if amount >= self.HIGH_VALUE_THRESHOLD:
            log_security_event(
                event_type='high_value_transaction_rejected',
                severity='medium',
                user_id=str(approver.id),
                description=f"High-value transaction rejected: {rejection_reason}",
                details={
                    'request_id': request_id,
                    'amount': amount,
                    'rejection_reason': rejection_reason
                }
            )

        return {
            'success': True,
            'message': 'Transaction rejected',
            'request_id': request_id
        }

    def get_pending_approvals(self, user: User = None) -> List[Dict[str, Any]]:
        """
        Get pending approval requests.

        Args:
            user: Filter by user permissions (optional)

        Returns:
            List of pending approval requests
        """
        pending_requests = [
            req for req in self.pending_approvals.values()
            if req['status'] == 'PENDING'
        ]

        if user:
            # Filter based on user's approval permissions
            user_role = getattr(user, 'role', 'unknown')
            pending_requests = [
                req for req in pending_requests
                if self._can_approve_level(user, req['approval_level'])
            ]

        # Sort by creation time (most recent first)
        pending_requests.sort(key=lambda x: x['created_at'], reverse=True)

        return pending_requests

    def cleanup_expired_requests(self):
        """Clean up expired approval requests."""
        current_time = timezone.now()
        expired_ids = []

        for request_id, request in self.pending_approvals.items():
            if (request['status'] == 'PENDING' and
                current_time > timezone.datetime.fromisoformat(request['expires_at'])):
                request['status'] = 'EXPIRED'
                expired_ids.append(request_id)

                # Log expiration
                AuditService.log_financial_operation(
                    user=None,  # System operation
                    operation_type="APPROVAL_EXPIRED",
                    model_name="ApprovalRequest",
                    object_id=request_id,
                    changes={'expired_at': current_time.isoformat()},
                    metadata={'expired_request': request}
                )

        return len(expired_ids)

    def _get_approvers_for_level(self, approval_level: str) -> List[Dict[str, Any]]:
        """Get list of users who can approve at the given level."""
        # In production, this would query the database for users with appropriate roles
        role_mapping = {
            'MANAGER': ['manager', 'operations_manager', 'senior_manager'],
            'OPERATIONS_MANAGER': ['operations_manager', 'senior_manager'],
            'SENIOR_MANAGER': ['senior_manager']
        }

        required_roles = role_mapping.get(approval_level, [])

        # Mock approvers - in production, query actual users
        approvers = []
        for role in required_roles:
            approvers.extend([
                {'role': role, 'count': 2}  # Mock count
            ])

        return approvers

    def _can_approve_level(self, user: User, approval_level: str) -> bool:
        """Check if a user can approve at the given level."""
        user_role = getattr(user, 'role', 'unknown')

        approval_hierarchy = {
            'MANAGER': ['manager', 'operations_manager', 'senior_manager'],
            'OPERATIONS_MANAGER': ['operations_manager', 'senior_manager'],
            'SENIOR_MANAGER': ['senior_manager']
        }

        required_roles = approval_hierarchy.get(approval_level, [])
        return user_role in required_roles


# Global approval workflow service instance
approval_workflow_service = ApprovalWorkflowService()