import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from users.models import AuditLog, User

from .models import Account, Loan

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Account)
@receiver(post_save, sender=Loan)
@receiver(post_save, sender=User)
def audit_log_save(sender, instance, created, **kwargs):
    """Automatically log creation and updates of critical models."""
    action = "create" if created else "update"
    model_name = sender.__name__

    # Avoid recursion if logging the logger (though AuditLog is in users.models)
    if model_name == "AuditLog":
        return

    # For updates, we could ideally diff the instance, but for now we'll log the repr
    AuditLog.objects.create(
        action=action,
        model_name=model_name,
        object_id=str(instance.id),
        object_repr=str(instance),
        changes={"automated": True},
    )


@receiver(post_delete, sender=Account)
@receiver(post_delete, sender=Loan)
def audit_log_delete(sender, instance, **kwargs):
    """Automatically log deletion of critical models."""
    AuditLog.objects.create(
        action="delete",
        model_name=sender.__name__,
        object_id=str(instance.id),
        object_repr=str(instance),
        changes={"automated": True},
    )
