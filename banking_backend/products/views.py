from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from .models import (
    Product, ProductCategory, Promotion, ProductRecommendation,
    PromotionUsage
)
from .serializers import (
    ProductSerializer, ProductCategorySerializer, PromotionSerializer,
    ProductRecommendationSerializer, ProductEnrollmentSerializer,
    ProductComparisonSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.filter(is_active=True)
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products."""
        products = self.queryset.filter(is_featured=True)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get products by category."""
        category_id = request.query_params.get('category_id')
        if category_id:
            products = self.queryset.filter(category_id=category_id)
        else:
            products = self.queryset
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def promotions(self, request, pk=None):
        """Get active promotions for a specific product."""
        product = self.get_object()
        now = timezone.now()
        promotions = product.promotions.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        )
        serializer = PromotionSerializer(promotions, many=True, context={'request': request})
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.filter(is_active=True).select_related('product')
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active promotions."""
        now = timezone.now()
        promotions = self.queryset.filter(
            start_date__lte=now,
            end_date__gte=now
        )
        serializer = self.get_serializer(promotions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def eligible(self, request):
        """Get promotions eligible for the current user."""
        if not request.user or request.user.role != 'customer':
            return Response([])

        now = timezone.now()
        promotions = self.queryset.filter(
            start_date__lte=now,
            end_date__gte=now
        )

        eligible_promotions = []
        for promotion in promotions:
            if promotion.check_eligibility(request.user):
                eligible_promotions.append(promotion)

        serializer = self.get_serializer(eligible_promotions, many=True, context={'request': request})
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class ProductRecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = ProductRecommendationSerializer
    permission_classes = [IsAuthenticated]
    queryset = ProductRecommendation.objects.all()

    def get_queryset(self):
        if self.request.user.role == 'customer':
            return ProductRecommendation.objects.filter(customer=self.request.user)
        elif self.request.user.role in ['cashier', 'manager']:
            # Cashiers and managers can see recommendations for all customers
            return ProductRecommendation.objects.all().select_related('customer', 'product')
        return ProductRecommendation.objects.none()

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate recommendations for a customer based on their profile and transaction history."""
        customer_id = request.data.get('customer_id')
        if not customer_id:
            return Response({'error': 'customer_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import User
        try:
            customer = User.objects.get(id=customer_id, role='customer')
        except User.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

        # Generate recommendations based on customer profile and transaction history
        recommendations = self._generate_recommendations(customer)

        # Save recommendations to database
        for rec_data in recommendations:
            ProductRecommendation.objects.update_or_create(
                customer=customer,
                product_id=rec_data['product_id'],
                defaults={
                    'recommendation_type': rec_data['type'],
                    'priority_score': rec_data['score'],
                    'reasoning': rec_data['reasoning'],
                    'transaction_context': rec_data.get('context', {}),
                    'customer_profile': rec_data.get('profile', {})
                }
            )

        # Return the generated recommendations
        customer_recommendations = ProductRecommendation.objects.filter(
            customer=customer
        ).select_related('product')

        serializer = self.get_serializer(customer_recommendations, many=True)
        return Response(serializer.data)

    def _generate_recommendations(self, customer):
        """Internal method to generate product recommendations."""
        recommendations = []

        # Get customer's transaction history (placeholder - would need actual transaction model)
        # For now, we'll create some sample recommendations

        # Check if customer has savings account - recommend loans
        savings_products = Product.objects.filter(
            product_type='savings',
            is_active=True
        )

        loan_products = Product.objects.filter(
            product_type='loan',
            is_active=True
        )

        # Simple recommendation logic
        for loan in loan_products[:2]:  # Recommend top 2 loans
            recommendations.append({
                'product_id': loan.id,
                'type': 'cross_sell',
                'score': 8,
                'reasoning': f"Based on your savings activity, you may be interested in our {loan.name}",
                'context': {'has_savings': True},
                'profile': {'customer_age': 30}  # Placeholder
            })

        # Recommend credit cards for established customers
        credit_cards = Product.objects.filter(
            product_type='credit_card',
            is_active=True
        )

        for card in credit_cards[:1]:  # Recommend 1 credit card
            recommendations.append({
                'product_id': card.id,
                'type': 'up_sell',
                'score': 7,
                'reasoning': f"Upgrade your banking experience with our {card.name}",
                'context': {'transaction_count': 10},
                'profile': {'membership_duration': 6}  # months
            })

        return recommendations


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_product(request):
    """Handle product enrollment requests."""
    serializer = ProductEnrollmentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    product_id = serializer.validated_data['product_id']
    customer_id = serializer.validated_data['customer_id']
    enrollment_data = serializer.validated_data.get('enrollment_data', {})
    promotion_id = serializer.validated_data.get('applied_promotion_id')

    # Get objects
    product = get_object_or_404(Product, id=product_id)
    from users.models import User
    customer = get_object_or_404(User, id=customer_id, role='customer')

    # Check eligibility
    if customer.date_joined and (timezone.now() - customer.date_joined).days < product.min_age * 365:
        return Response({'error': 'Customer does not meet age requirement'}, status=status.HTTP_400_BAD_REQUEST)

    # Apply promotion if provided
    discount_amount = 0
    if promotion_id:
        try:
            promotion = Promotion.objects.get(id=promotion_id, is_active=True)
            if promotion.check_eligibility(customer):
                discount_amount = promotion.calculate_discount(product.base_price)
                # Record promotion usage
                PromotionUsage.objects.create(
                    promotion=promotion,
                    customer=customer,
                    discount_amount=discount_amount,
                    transaction_amount=product.base_price,
                    transaction_type='product_enrollment',
                    cashier=request.user
                )
        except Promotion.DoesNotExist:
            pass

    # Here you would typically create an enrollment record or application
    # For now, we'll just return success

    return Response({
        'message': f'Successfully enrolled {customer.email} in {product.name}',
        'product': ProductSerializer(product).data,
        'discount_applied': discount_amount,
        'final_price': product.base_price - discount_amount
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_products(request):
    """Compare multiple products."""
    serializer = ProductComparisonSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    product_ids = serializer.validated_data['product_ids']
    products = Product.objects.filter(id__in=product_ids, is_active=True).select_related('category')

    # Get active promotions for each product
    now = timezone.now()
    comparison_data = []
    for product in products:
        promotions = product.promotions.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        )

        product_data = ProductSerializer(product).data
        product_data['active_promotions'] = PromotionSerializer(promotions, many=True).data
        comparison_data.append(product_data)

    return Response({
        'products': comparison_data,
        'comparison_points': [
            'base_price', 'monthly_fee', 'annual_fee', 'interest_rate',
            'min_balance', 'product_type', 'active_promotions'
        ]
    })


class PromotionAnalyticsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get promotion usage analytics."""
        # Only managers and above can view analytics
        if not request.user.has_role_permission('manager'):
            return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Get promotion usage stats
        usage_stats = PromotionUsage.objects.filter(
            applied_at__gte=current_month
        ).aggregate(
            total_usage=Count('id'),
            total_discount=Sum('discount_amount'),
            unique_customers=Count('customer', distinct=True)
        )

        # Get top performing promotions
        top_promotions = Promotion.objects.annotate(
            usage_count=Count('usages', filter=Q(usages__applied_at__gte=current_month)),
            total_discount=Sum('usages__discount_amount', filter=Q(usages__applied_at__gte=current_month))
        ).filter(
            usage_count__gt=0
        ).order_by('-usage_count')[:5]

        top_promotions_data = []
        for promo in top_promotions:
            top_promotions_data.append({
                'promotion': PromotionSerializer(promo).data,
                'usage_count': promo.usage_count,
                'total_discount': promo.total_discount or 0
            })

        return Response({
            'current_month_stats': usage_stats,
            'top_performing_promotions': top_promotions_data,
            'period': f"{current_month.strftime('%B %Y')}"
        })