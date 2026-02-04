"""Loan-related models for Coastal Banking."""

from decimal import Decimal

from django.conf import settings
from django.db import models


class Loan(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("active", "Active"),
        ("paid_off", "Paid Off"),
        ("defaulted", "Defaulted"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loans")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Annual interest rate
    term_months = models.PositiveIntegerField()  # Loan term in months
    purpose = models.TextField(blank=True, null=True, help_text="Purpose of the loan")

    # DETAILED FIELDS
    date_of_birth = models.DateField(null=True, blank=True)
    id_type = models.CharField(max_length=50, default="ghana_card")
    id_number = models.CharField(max_length=50, blank=True)
    digital_address = models.CharField(max_length=100, blank=True)
    town = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)

    # Next of Kin 1
    next_of_kin_1_name = models.CharField(max_length=255, blank=True)
    next_of_kin_1_relationship = models.CharField(max_length=100, blank=True)
    next_of_kin_1_phone = models.CharField(max_length=20, blank=True)
    next_of_kin_1_address = models.TextField(blank=True)

    # Next of Kin 2
    next_of_kin_2_name = models.CharField(max_length=255, blank=True)
    next_of_kin_2_relationship = models.CharField(max_length=100, blank=True)
    next_of_kin_2_phone = models.CharField(max_length=20, blank=True)
    next_of_kin_2_address = models.TextField(blank=True)

    # Guarantor 1
    guarantor_1_name = models.CharField(max_length=255, blank=True)
    guarantor_1_id_type = models.CharField(max_length=50, default="ghana_card")
    guarantor_1_id_number = models.CharField(max_length=50, blank=True)
    guarantor_1_phone = models.CharField(max_length=20, blank=True)
    guarantor_1_address = models.TextField(blank=True)

    # Guarantor 2
    guarantor_2_name = models.CharField(max_length=255, blank=True)
    guarantor_2_id_type = models.CharField(max_length=50, default="ghana_card")
    guarantor_2_id_number = models.CharField(max_length=50, blank=True)
    guarantor_2_phone = models.CharField(max_length=20, blank=True)
    guarantor_2_address = models.TextField(blank=True)

    # Financial Info
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    employment_status = models.CharField(max_length=50, default="employed")
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_loan"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="loan_user_idx"),
            models.Index(fields=["status", "-created_at"], name="loan_status_idx"),
        ]

    def __str__(self):
        return f"Loan {self.id} - {self.user.username} - {self.amount} ({self.status})"
