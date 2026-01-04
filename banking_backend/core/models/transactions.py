"""Transaction model for Coastal Banking."""

from django.db import models


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("deposit", "Deposit"),
        ("withdrawal", "Withdrawal"),
        ("transfer", "Transfer"),
        ("payment", "Payment"),
        ("fee", "Fee"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    from_account = models.ForeignKey(
        "core.Account", on_delete=models.CASCADE, related_name="outgoing_transactions", null=True, blank=True
    )
    to_account = models.ForeignKey(
        "core.Account", on_delete=models.CASCADE, related_name="incoming_transactions", null=True, blank=True
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    timestamp = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} ({self.status})"
