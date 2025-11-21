import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from users.models import User


class ProductCategory(models.Model):
    """Product categories for organization."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Product Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    """Credit union products available for cross-selling."""
    PRODUCT_TYPES = [
        ('savings', 'Savings Account'),
        ('checking', 'Checking Account'),
        ('loan', 'Loan'),
        ('credit_card', 'Credit Card'),
        ('investment', 'Investment'),
        ('insurance', 'Insurance'),
        ('service', 'Service'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES)
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products')

    # Pricing and features
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    annual_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Eligibility criteria
    min_age = models.IntegerField(default=18)
    min_balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    membership_required = models.BooleanField(default=True)

    # Status and availability
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    available_online = models.BooleanField(default=True)
    available_in_branch = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_products')

    class Meta:
        ordering = ['-is_featured', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_product_type_display()})"


class Promotion(models.Model):
    """Promotions and discounts for products."""
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage Discount'),
        ('fixed_amount', 'Fixed Amount Discount'),
        ('fee_waiver', 'Fee Waiver'),
        ('bonus_rate', 'Bonus Interest Rate'),
    ]

    ELIGIBILITY_TYPES = [
        ('all_members', 'All Members'),
        ('new_members', 'New Members Only'),
        ('existing_members', 'Existing Members Only'),
        ('balance_threshold', 'Balance Threshold'),
        ('transaction_count', 'Transaction Count'),
        ('age_range', 'Age Range'),
        ('custom', 'Custom Criteria'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='promotions')

    # Discount details
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Eligibility
    eligibility_type = models.CharField(max_length=20, choices=ELIGIBILITY_TYPES, default='all_members')
    eligibility_criteria = models.JSONField(default=dict, blank=True)  # Store custom criteria

    # Duration
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    # Usage limits
    max_uses = models.IntegerField(null=True, blank=True)
    uses_count = models.IntegerField(default=0)
    per_customer_limit = models.IntegerField(default=1)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_promotions')

    class Meta:
        ordering = ['-start_date']

    def is_valid(self):
        """Check if promotion is currently valid."""
        now = timezone.now()
        return (
            self.is_active and
            self.start_date <= now <= self.end_date and
            (self.max_uses is None or self.uses_count < self.max_uses)
        )

    def calculate_discount(self, base_amount):
        """Calculate the discount amount for a given base amount."""
        if not self.is_valid():
            return 0

        if self.discount_type == 'percentage':
            discount = base_amount * (self.discount_value / 100)
        elif self.discount_type == 'fixed_amount':
            discount = self.discount_value
        elif self.discount_type == 'fee_waiver':
            discount = min(base_amount, self.discount_value)
        elif self.discount_type == 'bonus_rate':
            # For bonus rate, return the bonus amount (calculated elsewhere)
            discount = 0
        else:
            discount = 0

        if self.max_discount:
            discount = min(discount, self.max_discount)

        return discount

    def check_eligibility(self, customer):
        """Check if a customer is eligible for this promotion."""
        if not self.is_valid():
            return False

        if self.eligibility_type == 'all_members':
            return True
        elif self.eligibility_type == 'new_members':
            # Check if customer joined within last 30 days
            return (timezone.now() - customer.date_joined).days <= 30
        elif self.eligibility_type == 'existing_members':
            return (timezone.now() - customer.date_joined).days > 30
        elif self.eligibility_type == 'balance_threshold':
            threshold = self.eligibility_criteria.get('min_balance', 0)
            # This would need to be calculated based on customer's accounts
            return True  # Placeholder
        elif self.eligibility_type == 'transaction_count':
            min_transactions = self.eligibility_criteria.get('min_transactions', 0)
            # This would need to be calculated based on customer's transaction history
            return True  # Placeholder
        elif self.eligibility_type == 'age_range':
            min_age = self.eligibility_criteria.get('min_age', 0)
            max_age = self.eligibility_criteria.get('max_age', 150)
            # This would need customer age
            return True  # Placeholder
        elif self.eligibility_type == 'custom':
            # Custom logic based on criteria
            return True  # Placeholder

        return False

    def __str__(self):
        return f"{self.name} - {self.product.name}"


class ProductRecommendation(models.Model):
    """Recommendations for products based on customer profile and behavior."""
    RECOMMENDATION_TYPES = [
        ('cross_sell', 'Cross-Sell'),
        ('up_sell', 'Up-Sell'),
        ('retention', 'Retention'),
        ('engagement', 'Engagement'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_recommendations')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='recommendations')

    recommendation_type = models.CharField(max_length=20, choices=RECOMMENDATION_TYPES)
    priority_score = models.IntegerField(default=0)  # 1-10 scale
    reasoning = models.TextField(blank=True)

    # Context
    transaction_context = models.JSONField(default=dict, blank=True)  # Store transaction details that triggered recommendation
    customer_profile = models.JSONField(default=dict, blank=True)  # Store relevant customer data

    # Status
    is_viewed = models.BooleanField(default=False)
    is_interested = models.BooleanField(null=True, blank=True)
    is_applied = models.BooleanField(default=False)
    applied_at = models.DateTimeField(null=True, blank=True)

    # Analytics
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority_score', '-created_at']
        unique_together = ['customer', 'product']

    def __str__(self):
        return f"{self.customer.email} - {self.product.name} ({self.recommendation_type})"


class PromotionUsage(models.Model):
    """Track promotion usage for analytics."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name='usages')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='promotion_usages')

    # Usage details
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=50)

    # Context
    applied_at = models.DateTimeField(auto_now_add=True)
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='applied_promotions')

    class Meta:
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.customer.email} used {self.promotion.name}"