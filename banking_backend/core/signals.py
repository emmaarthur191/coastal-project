from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Transaction, Expense

@receiver(post_save, sender=Transaction)
def create_expense_from_payment(sender, instance, created, **kwargs):
    """Automatically create an Expense record when a Payment transaction is completed."""
    if instance.transaction_type == 'payment' and instance.status == 'completed':
        # Check if expense already exists to prevent duplicates
        if not Expense.objects.filter(transaction=instance).exists():
            Expense.objects.create(
                transaction=instance,
                category='Operational',  # Default category
                description=instance.description or 'Payment Expense',
                amount=instance.amount,
                date=instance.timestamp.date(),
                status='paid'
            )
