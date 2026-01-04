"""Product and promotion views for Coastal Banking.

This module contains views for managing bank products and promotions.
"""

import logging

from django.utils import timezone
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsStaff

logger = logging.getLogger(__name__)


class ProductViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    """ViewSet for managing bank products."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["product_type", "is_active"]
    ordering_fields = ["name", "created_at"]
    ordering = ["product_type", "name"]

    def get_queryset(self):
        """Return the list of currently active bank products."""
        from core.models import Product

        return Product.objects.filter(is_active=True)

    def get_serializer_class(self):
        """Return the serializer class for product management."""
        from core.serializers import ProductSerializer

        return ProductSerializer

    def get_permissions(self):
        """Map product management actions to staff permissions."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return super().get_permissions()


class PromotionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, GenericViewSet):
    """ViewSet for managing promotions."""

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["is_active"]
    ordering_fields = ["start_date", "end_date"]
    ordering = ["-start_date"]

    def get_queryset(self):
        """Return the list of all promotional offers."""
        from core.models import Promotion

        return Promotion.objects.all()

    def get_serializer_class(self):
        """Return the serializer class for promotions."""
        from core.serializers import PromotionSerializer

        return PromotionSerializer

    def get_permissions(self):
        """Ensure only staff can manage promotions while all can view active ones."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get currently active promotions."""
        from .models import Promotion

        today = timezone.now().date()
        active_promos = Promotion.objects.filter(is_active=True, start_date__lte=today, end_date__gte=today)
        serializer = self.get_serializer_class()(active_promos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def enroll(self, request, pk=None):
        """Enroll customer in a promotion."""
        from .models import Promotion

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
