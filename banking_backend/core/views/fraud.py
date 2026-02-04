"""Fraud alert views for Coastal Banking.

This module contains views for managing fraud alerts and detection.
"""

import logging

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from django_filters.rest_framework import DjangoFilterBackend

from core.models.fraud import FraudAlert, FraudRule
from core.permissions import IsStaff
from core.serializers.fraud import FraudAlertSerializer, FraudRuleSerializer

logger = logging.getLogger(__name__)


class FraudAlertViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, GenericViewSet
):
    queryset = FraudAlert.objects.all()
    serializer_class = FraudAlertSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["severity", "is_resolved"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter fraud alerts so customers only see alerts related to their own accounts."""
        user = self.request.user
        if user.role == "customer":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_permissions(self):
        """Map fraud-related actions to their required permission levels (Staff or Owner)."""
        from core.permissions import IsStaffOrCustomer

        if self.action in ["create", "update", "partial_update"]:
            return [IsStaff()]
        return [IsStaffOrCustomer()]

    @action(detail=False, methods=["get"], url_path="dashboard-stats")
    def dashboard_stats(self, request):
        """Get fraud alert statistics for dashboard."""
        from django.db.models import Count

        total = FraudAlert.objects.count()
        unresolved = FraudAlert.objects.filter(is_resolved=False).count()
        by_severity = FraudAlert.objects.values("severity").annotate(count=Count("id"))
        recent = FraudAlert.objects.filter(is_resolved=False).order_by("-created_at")[:5]

        return Response(
            {
                "total": total,
                "unresolved": unresolved,
                "by_severity": list(by_severity),
                "recent_alerts": FraudAlertSerializer(recent, many=True).data,
            }
        )


class FraudRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing fraud detection rules."""

    queryset = FraudRule.objects.all()
    serializer_class = FraudRuleSerializer
    permission_classes = [IsStaff]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["rule_type", "severity", "is_active"]
    ordering_fields = ["created_at", "trigger_count", "name"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a fraud rule."""
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        return Response({"status": "success", "is_active": rule.is_active})

    @action(detail=False, methods=["get"])
    def active_rules(self, request):
        """Get all active fraud rules."""
        active_rules = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_rules, many=True)
        return Response(serializer.data)
