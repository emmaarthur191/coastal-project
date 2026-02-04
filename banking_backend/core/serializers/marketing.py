"""Marketing-related serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.marketing import Product, Promotion


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for bank products."""

    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "product_type",
            "product_type_display",
            "description",
            "interest_rate",
            "minimum_balance",
            "maximum_balance",
            "features",
            "terms_and_conditions",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PromotionSerializer(serializers.ModelSerializer):
    """Serializer for promotions."""

    is_currently_active = serializers.BooleanField(read_only=True)
    eligible_product_names = serializers.SerializerMethodField()

    class Meta:
        model = Promotion
        fields = [
            "id",
            "name",
            "description",
            "discount_percentage",
            "bonus_amount",
            "start_date",
            "end_date",
            "is_active",
            "is_currently_active",
            "eligible_products",
            "eligible_product_names",
            "terms_and_conditions",
            "max_enrollments",
            "current_enrollments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "current_enrollments", "created_at", "updated_at"]

    def get_eligible_product_names(self, obj):
        return [p.name for p in obj.eligible_products.all()]
