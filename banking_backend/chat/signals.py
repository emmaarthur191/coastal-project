from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import ChatSession, ChatMessage, SupportTicket
from users.models import User
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ChatSession)
def handle_session_creation(sender, instance, created, **kwargs):
    """Handle automatic assignment when a new chat session is created."""
    if created and instance.status == 'waiting':
        # Try to auto-assign to an available cashier
        assigned_cashier = auto_assign_cashier(instance)

        if assigned_cashier:
            try:
                instance.assign_cashier(assigned_cashier)
                logger.info(f"Auto-assigned session {instance.id} to cashier {assigned_cashier.email}")
            except Exception as e:
                logger.error(f"Failed to auto-assign session {instance.id}: {str(e)}")


@receiver(post_save, sender=ChatMessage)
def handle_message_creation(sender, instance, created, **kwargs):
    """Handle message-related updates."""
    if created:
        # Update session's last message timestamp
        instance.session.update_last_message()

        # If this is the first message from customer, try to assign if not already assigned
        if (instance.sender == instance.session.customer and
            instance.session.status == 'waiting'):
            assigned_cashier = auto_assign_cashier(instance.session)
            if assigned_cashier:
                try:
                    instance.session.assign_cashier(assigned_cashier)
                    logger.info(f"Auto-assigned session {instance.session.id} after first message")
                except Exception as e:
                    logger.error(f"Failed to auto-assign session {instance.session.id}: {str(e)}")


def auto_assign_cashier(session):
    """Automatically assign a cashier to a chat session."""
    # Get available cashiers (those with capacity for more sessions)
    available_cashiers = get_available_cashiers()

    if not available_cashiers:
        return None

    # Simple round-robin assignment based on current load
    # In production, this could be more sophisticated with ML-based routing
    cashier_loads = {}

    for cashier in available_cashiers:
        # Count active sessions for this cashier
        active_count = ChatSession.objects.filter(
            assigned_cashier=cashier,
            status__in=['active', 'waiting']
        ).count()
        cashier_loads[cashier] = active_count

    # Find cashier with lowest load
    assigned_cashier = min(cashier_loads, key=cashier_loads.get)

    return assigned_cashier


def get_available_cashiers(max_sessions_per_cashier=5):
    """Get cashiers who can take more sessions."""
    cashiers = User.objects.filter(role='cashier')
    available_cashiers = []

    for cashier in cashiers:
        active_sessions = ChatSession.objects.filter(
            assigned_cashier=cashier,
            status__in=['active', 'waiting']
        ).count()

        if active_sessions < max_sessions_per_cashier:
            available_cashiers.append(cashier)

    return available_cashiers


@receiver(post_save, sender=SupportTicket)
def handle_ticket_creation(sender, instance, created, **kwargs):
    """Handle support ticket creation."""
    if created:
        logger.info(f"Support ticket {instance.id} created for session {instance.chat_session.id}")

        # Could add logic here to notify relevant staff
        # For example, send email notifications, update dashboards, etc.