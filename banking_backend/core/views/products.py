"""Product and promotion views for Coastal Banking.

This module contains views for managing bank products and promotions.
"""

import logging

from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models.marketing import Product, Promotion
from core.permissions import IsStaff
from core.serializers.marketing import ProductSerializer, PromotionSerializer

logger = logging.getLogger(__name__)


class ProductViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for managing bank products."""

    queryset = Product.objects.all()

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["product_type", "is_active"]
    ordering_fields = ["name", "created_at"]
    ordering = ["product_type", "name"]

    def list(self, request, *args, **kwargs):
        """Return the list of products. Non-staff only see approved/active products."""
        queryset = self.filter_queryset(self.get_queryset())
        
        if not request.user.is_staff:
            queryset = queryset.filter(is_approved=True, is_active=True)
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Auto-assign creator and set as unapproved."""
        serializer.save(created_by=self.request.user, is_approved=False)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a product for public visibility. Only Managers can approve."""
        if request.user.role != "manager":
            return Response({"error": "Only Managers can approve products."}, status=403)
        
        product = self.get_object()
        if product.created_by == request.user:
            return Response({"error": "You cannot approve a product you created."}, status=400)
            
        product.is_approved = True
        product.approved_by = request.user
        product.save()
        
        logger.info(f"Product {product.name} approved by {request.user.email}")
        return Response({"status": "Product approved and activated."})

    def get_serializer_class(self):
        """Return the serializer class for products."""
        return ProductSerializer

    def get_permissions(self):
        """Map product management actions to staff permissions."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return super().get_permissions()


class PromotionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for managing promotions."""

    queryset = Promotion.objects.all()

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["is_active"]
    ordering_fields = ["start_date", "end_date"]
    ordering = ["-start_date"]

    def list(self, request, *args, **kwargs):
        """Return the list of promotions. Non-staff only see approved ones."""
        queryset = self.filter_queryset(self.get_queryset())
        
        if not request.user.is_staff:
            queryset = queryset.filter(is_approved=True, is_active=True)
            
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Auto-assign creator and set as unapproved."""
        serializer.save(created_by=self.request.user, is_approved=False)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a promotion. Only Managers can approve."""
        if request.user.role != "manager":
            return Response({"error": "Only Managers can approve promotions."}, status=403)
        
        promotion = self.get_object()
        if promotion.created_by == request.user:
            return Response({"error": "You cannot approve a promotion you created."}, status=400)
            
        promotion.is_approved = True
        promotion.approved_by = request.user
        promotion.save()
        
        logger.info(f"Promotion {promotion.name} approved by {request.user.email}")
        return Response({"status": "Promotion approved."})

    def get_serializer_class(self):
        """Return the serializer class for promotions."""
        return PromotionSerializer

    def get_permissions(self):
        """Ensure only staff can manage promotions while all can view active ones."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return super().get_permissions()

    @method_decorator(cache_page(60 * 10))
    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get currently active and approved promotions."""
        today = timezone.now().date()
        active_promos = Promotion.objects.filter(
            is_active=True, 
            is_approved=True,
            start_date__lte=today, 
            end_date__gte=today
        )
        serializer = self.get_serializer_class()(active_promos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def enroll(self, request, pk=None):
        """Enroll customer in a promotion."""
        try:
            promotion = Promotion.objects.get(pk=pk)
            if not promotion.is_currently_active:
                return Response({"error": "Promotion is not currently active"}, status=400)
            if promotion.max_enrollments and promotion.current_enrollments >= promotion.max_enrollments:
                return Response({"error": "Promotion enrollment limit reached"}, status=400)
            promotion.current_enrollments += 1
            promotion.save()
            return Response({"status": "success", "message": f"Successfully enrolled in {promotion.name}"})
        except Promotion.DoesNotExist:
            return Response({"error": "Promotion not found"}, status=404)
