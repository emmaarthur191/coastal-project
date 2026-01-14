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

from core.models import Product, Promotion
from core.permissions import IsStaff
from core.serializers import ProductSerializer, PromotionSerializer

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

    @method_decorator(cache_page(60 * 10))
    def list(self, request, *args, **kwargs):
        """Return the list of all products."""
        return super().list(request, *args, **kwargs)

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

    @method_decorator(cache_page(60 * 10))
    def list(self, request, *args, **kwargs):
        """Return the list of all promotional offers."""
        return super().list(request, *args, **kwargs)

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
        """Get currently active promotions."""
        today = timezone.now().date()
        active_promos = Promotion.objects.filter(is_active=True, start_date__lte=today, end_date__gte=today)
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
