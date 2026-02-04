"""Marketing models for Coastal Banking.

Includes product definitions and special promotions.
"""

from django.db import models
from django.utils import timezone


class Product(models.Model):
    """Bank products (savings accounts, loans, insurance, etc.)."""

    PRODUCT_TYPES = [
        ("savings", "Savings Account"),
        ("loan", "Loan"),
        ("insurance", "Insurance"),
        ("investment", "Investment"),
        ("susu", "Susu Account"),
    ]

    name = models.CharField(max_length=100)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES)
    description = models.TextField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    minimum_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    maximum_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    features = models.JSONField(default=list, blank=True)
    terms_and_conditions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_product"
        ordering = ["product_type", "name"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return f"{self.name} ({self.get_product_type_display()})"


class Promotion(models.Model):
    """Special promotions and offers for customers."""

    name = models.CharField(max_length=100)
    description = models.TextField()
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bonus_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    eligible_products = models.ManyToManyField(Product, blank=True, related_name="promotions")
    terms_and_conditions = models.TextField(blank=True)
    max_enrollments = models.PositiveIntegerField(null=True, blank=True)
    current_enrollments = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_promotion"
        ordering = ["-start_date"]
        verbose_name = "Promotion"
        verbose_name_plural = "Promotions"

    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"

    @property
    def is_currently_active(self):
        today = timezone.now().date()
        return self.is_active and self.start_date <= today <= self.end_date
