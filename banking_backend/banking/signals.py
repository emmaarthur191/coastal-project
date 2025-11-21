import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CashAdvance, Refund, Complaint, Notification

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CashAdvance)
def cash_advance_status_notification(sender, instance, created, **kwargs):
    """Send notifications when cash advance status changes."""
    if not created and instance.status in ['approved', 'rejected', 'disbursed', 'repaid', 'overdue']:
        # Notify the requester
        Notification.create_notification(
            notification_type='cash_advance_status',
            recipient=instance.requested_by,
            title=f'Cash Advance {instance.status.title()}',
            message=f'Your cash advance request for ${instance.amount:.2f} has been {instance.status}.',
            priority='high' if instance.status in ['approved', 'rejected'] else 'medium',
            related_object=instance,
            action_url=f'/cash-advances/{instance.id}'
        )

        # Notify approvers/managers for certain statuses
        if instance.status == 'pending' and instance.priority == 'high':
            # Notify managers about high-priority pending requests
            from users.models import User
            managers = User.objects.filter(role__in=['manager', 'operations_manager'])
            for manager in managers:
                Notification.create_notification(
                    notification_type='approval_required',
                    recipient=manager,
                    title='High Priority Cash Advance Approval Required',
                    message=f'A high-priority cash advance request for ${instance.amount:.2f} requires your approval.',
                    priority='high',
                    related_object=instance,
                    action_url=f'/cash-advances/{instance.id}/approve'
                )


@receiver(post_save, sender=Refund)
def refund_status_notification(sender, instance, created, **kwargs):
    """Send notifications when refund status changes."""
    if not created and instance.status in ['approved', 'rejected', 'processed']:
        # Notify the requester
        status_messages = {
            'approved': f'Your refund request for ${instance.requested_amount:.2f} has been approved.',
            'rejected': f'Your refund request for ${instance.requested_amount:.2f} has been rejected.',
            'processed': f'Your refund request for ${instance.requested_amount:.2f} has been processed.'
        }

        Notification.create_notification(
            notification_type='refund_status',
            recipient=instance.requested_by,
            title=f'Refund {instance.status.title()}',
            message=status_messages.get(instance.status, f'Your refund request status has been updated to {instance.status}.'),
            priority='high' if instance.status in ['approved', 'rejected'] else 'medium',
            related_object=instance,
            action_url=f'/refunds/{instance.id}'
        )

        # Notify processors for approval required
        if instance.status == 'pending' and instance.requires_supervisor_approval:
            from users.models import User
            supervisors = User.objects.filter(role__in=['supervisor', 'manager', 'operations_manager'])
            for supervisor in supervisors:
                Notification.create_notification(
                    notification_type='approval_required',
                    recipient=supervisor,
                    title='Refund Approval Required',
                    message=f'A refund request for ${instance.requested_amount:.2f} requires your approval.',
                    priority='medium',
                    related_object=instance,
                    action_url=f'/refunds/{instance.id}/approve'
                )


@receiver(post_save, sender=Complaint)
def complaint_status_notification(sender, instance, created, **kwargs):
    """Send notifications when complaint status changes."""
    if not created and instance.status in ['investigating', 'resolved', 'closed', 'escalated']:
        # Notify the complainant
        status_messages = {
            'investigating': f'Your complaint "{instance.subject}" is now being investigated.',
            'resolved': f'Your complaint "{instance.subject}" has been resolved.',
            'closed': f'Your complaint "{instance.subject}" has been closed.',
            'escalated': f'Your complaint "{instance.subject}" has been escalated for further review.'
        }

        priority_map = {
            'investigating': 'medium',
            'resolved': 'low',
            'closed': 'low',
            'escalated': 'high'
        }

        Notification.create_notification(
            notification_type='complaint_status',
            recipient=instance.submitted_by,
            title=f'Complaint {instance.status.title()}',
            message=status_messages.get(instance.status, f'Your complaint status has been updated to {instance.status}.'),
            priority=priority_map.get(instance.status, 'medium'),
            related_object=instance,
            action_url=f'/complaints/{instance.id}'
        )

        # Notify assigned staff
        if instance.assigned_to and instance.status in ['investigating', 'escalated']:
            Notification.create_notification(
                notification_type='complaint_status',
                recipient=instance.assigned_to,
                title=f'Complaint Assigned: {instance.subject}',
                message=f'You have been assigned to handle complaint "{instance.subject}" (Priority: {instance.priority}).',
                priority='high' if instance.priority in ['high', 'critical'] else 'medium',
                related_object=instance,
                action_url=f'/complaints/{instance.id}'
            )

        # Notify managers for escalated complaints
        if instance.status == 'escalated':
            from users.models import User
            managers = User.objects.filter(role__in=['manager', 'operations_manager'])
            for manager in managers:
                Notification.create_notification(
                    notification_type='system_alert',
                    recipient=manager,
                    title='Complaint Escalated',
                    message=f'Complaint "{instance.subject}" has been escalated to {instance.escalation_level} level.',
                    priority='high',
                    related_object=instance,
                    action_url=f'/complaints/{instance.id}'
                )


@receiver(post_save, sender=Complaint)
def complaint_overdue_notification(sender, instance, created, **kwargs):
    """Send notifications for overdue complaints."""
    if not created and instance.is_overdue() and instance.status not in ['resolved', 'closed']:
        # Notify assigned staff about overdue complaint
        if instance.assigned_to:
            Notification.create_notification(
                notification_type='system_alert',
                recipient=instance.assigned_to,
                title='Overdue Complaint Alert',
                message=f'Complaint "{instance.subject}" is overdue for response (Priority: {instance.priority}).',
                priority='critical' if instance.priority == 'critical' else 'high',
                related_object=instance,
                action_url=f'/complaints/{instance.id}'
            )

        # Notify managers about overdue high-priority complaints
        if instance.priority in ['high', 'critical']:
            from users.models import User
            managers = User.objects.filter(role__in=['manager', 'operations_manager'])
            for manager in managers:
                Notification.create_notification(
                    notification_type='system_alert',
                    recipient=manager,
                    title='Overdue High-Priority Complaint',
                    message=f'High-priority complaint "{instance.subject}" is overdue for response.',
                    priority='critical',
                    related_object=instance,
                    action_url=f'/complaints/{instance.id}'
                )


@receiver(post_save, sender=CashAdvance)
def cash_advance_overdue_notification(sender, instance, created, **kwargs):
    """Send notifications for overdue cash advances."""
    if not created and instance.is_overdue() and instance.status not in ['repaid', 'written_off']:
        # Notify the account owner
        Notification.create_notification(
            notification_type='system_alert',
            recipient=instance.account.owner,
            title='Cash Advance Overdue',
            message=f'Your cash advance of ${instance.amount:.2f} is overdue. Please contact us to arrange repayment.',
            priority='high',
            related_object=instance,
            action_url=f'/cash-advances/{instance.id}'
        )

        # Notify managers about overdue advances
        from users.models import User
        managers = User.objects.filter(role__in=['manager', 'operations_manager'])
        for manager in managers:
            Notification.create_notification(
                notification_type='system_alert',
                recipient=manager,
                title='Overdue Cash Advance Alert',
                message=f'Cash advance for account {instance.account.get_decrypted_account_number()[-4:]} is overdue.',
                priority='medium',
                related_object=instance,
                action_url=f'/cash-advances/{instance.id}'
            )