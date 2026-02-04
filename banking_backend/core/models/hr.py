"""Human Resources and Expense models for Coastal Banking.

Includes payslips, staff earnings, and operational expenses.
"""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class Payslip(models.Model):
    """Staff payslips with automated earning/deduction calculation."""

    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payslips",
        limit_choices_to={"role__in": ["manager", "operations_manager", "cashier", "mobile_banker"]},
    )
    month = models.IntegerField()
    year = models.IntegerField()
    pay_period_start = models.DateField()
    pay_period_end = models.DateField()

    # Earnings
    base_pay = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    bonuses = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)

    # Deductions
    ssnit_contribution = models.DecimalField(max_digits=12, decimal_places=2)  # 5.5% employee
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)

    # Net
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)

    # PDF storage
    pdf_file = models.FileField(upload_to="payslips/", null=True, blank=True)

    # Metadata
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="generated_payslips"
    )
    notes = models.TextField(blank=True)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_payslip"
        unique_together = ["staff", "month", "year"]
        ordering = ["-year", "-month"]
        verbose_name = "Payslip"
        verbose_name_plural = "Payslips"

    def __str__(self):
        return f"Payslip for {self.staff.get_full_name()} - {self.month}/{self.year}"

    def save(self, *args, **kwargs):
        # Calculate gross pay
        self.gross_pay = self.base_pay + self.allowances + self.overtime_pay + self.bonuses
        # Calculate SSNIT (5.5% contribution)
        self.ssnit_contribution = self.base_pay * Decimal("0.055")
        # Calculate total deductions
        self.total_deductions = self.ssnit_contribution + self.tax_deduction + self.other_deductions
        # Calculate net salary
        self.net_salary = self.gross_pay - self.total_deductions
        super().save(*args, **kwargs)


class Expense(models.Model):
    """Model for tracking operational expenses."""

    CATEGORY_CHOICES = [
        ("Operational", "Operational"),
        ("Utilities", "Utilities"),
        ("Payroll", "Payroll"),
        ("Maintenance", "Maintenance"),
        ("Marketing", "Marketing"),
        ("Other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("cancelled", "Cancelled"),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="Operational")
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    transaction = models.OneToOneField(
        "core.Transaction", on_delete=models.SET_NULL, null=True, blank=True, related_name="expense"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_expense"

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"
