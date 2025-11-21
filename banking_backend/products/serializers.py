from rest_framework import serializers
from .models import Product, ProductCategory, Promotion, ProductRecommendation, PromotionUsage


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    active_promotions = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_active_promotions(self, obj):
        from django.utils import timezone
        now = timezone.now()
        promotions = obj.promotions.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        )
        return PromotionSerializer(promotions, many=True, context=self.context).data


class PromotionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    discount_display = serializers.SerializerMethodField()
    is_eligible = serializers.SerializerMethodField()

    class Meta:
        model = Promotion
        fields = '__all__'
        read_only_fields = ['id', 'uses_count', 'created_at', 'updated_at']

    def get_discount_display(self, obj):
        if obj.discount_type == 'percentage':
            return f"{obj.discount_value}% off"
        elif obj.discount_type == 'fixed_amount':
            return f"GHS {obj.discount_value} off"
        elif obj.discount_type == 'fee_waiver':
            return f"Fee waiver up to GHS {obj.discount_value}"
        elif obj.discount_type == 'bonus_rate':
            return f"Bonus {obj.discount_value}% interest"
        return f"Discount: {obj.discount_value}"

    def get_is_eligible(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.check_eligibility(request.user)
        return None


class ProductRecommendationSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)

    class Meta:
        model = ProductRecommendation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PromotionUsageSerializer(serializers.ModelSerializer):
    promotion_name = serializers.CharField(source='promotion.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    cashier_email = serializers.CharField(source='cashier.email', read_only=True)

    class Meta:
        model = PromotionUsage
        fields = '__all__'
        read_only_fields = ['id', 'applied_at']


class ProductEnrollmentSerializer(serializers.Serializer):
    """Serializer for product enrollment requests."""
    product_id = serializers.UUIDField()
    customer_id = serializers.UUIDField()
    enrollment_data = serializers.JSONField(default=dict)
    applied_promotion_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available.")

    def validate_customer_id(self, value):
        from users.models import User
        try:
            customer = User.objects.get(id=value, role='customer')
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Customer not found.")

    def validate(self, data):
        # Additional validation logic can be added here
        return data


class ProductComparisonSerializer(serializers.Serializer):
    """Serializer for comparing multiple products."""
    product_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=2,
        max_length=4
    )

    def validate_product_ids(self, value):
        products = Product.objects.filter(id__in=value, is_active=True)
        if len(products) != len(value):
            raise serializers.ValidationError("One or more products not found or not available.")
        return value