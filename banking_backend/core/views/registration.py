"""Registration and member views for Coastal Banking.

This module contains views for client registration and member management.
"""

import logging
import uuid

from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from core.permissions import IsStaff

logger = logging.getLogger(__name__)


class ClientRegistrationViewSet(GenericViewSet):
    """ViewSet for handling client registration submissions."""

    permission_classes = [IsStaff]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = None  # No model backing this ViewSet

    @action(detail=False, methods=["post"])
    def submit_registration(self, request):
        """Handle client registration form submission."""
        # Extract form data - handle both camelCase (from frontend) and snake_case
        first_name = request.data.get("firstName") or request.data.get("first_name", "")
        last_name = request.data.get("lastName") or request.data.get("last_name", "")
        email = request.data.get("email", "")
        phone = request.data.get("phoneNumber") or request.data.get("phone", "")
        id_type = request.data.get("idType") or request.data.get("id_type", "ghana_card")
        account_type = request.data.get("accountType") or request.data.get("account_type", "daily_susu")

        # Basic validation
        if not any([first_name, last_name, phone]):
            return Response(
                {"error": "At least first name, last name, or phone is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Generate registration ID
        registration_id = str(uuid.uuid4())[:8].upper()

        return Response(
            {
                "success": True,
                "id": f"REG-{registration_id}",
                "message": "Registration submitted successfully",
                "registration_id": f"REG-{registration_id}",
                "status": "pending_verification",
                "submitted_at": timezone.now(),
                "applicant": {
                    "name": f"{first_name} {last_name}",
                    "phone": phone,
                    "email": email,
                    "id_type": id_type,
                    "account_type": account_type,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MemberViewSet(mixins.ListModelMixin, GenericViewSet):
    """Stub ViewSet for members list."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Return a listed summary of registered members for staff viewing."""
        from users.models import User

        members = User.objects.filter(role="customer").values("id", "email", "first_name", "last_name")[:50]
        return Response(
            {
                "results": [
                    {"id": m["id"], "name": f"{m['first_name']} {m['last_name']}", "email": m["email"]} for m in members
                ]
            }
        )
