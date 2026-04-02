"""Registration and member views for Coastal Banking.

This module contains views for client registration and member management.
"""

import logging
import uuid

from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

logger = logging.getLogger(__name__)


class ClientRegistrationViewSet(GenericViewSet):
    """ViewSet for handling client registration submissions."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = None  # No model backing this ViewSet
    throttle_scope = ""

    def get_throttles(self):
        """Standard DRF ScopedRateThrottle looks for view.throttle_scope."""
        if self.action == "send_otp":
            self.throttle_scope = "otp_request"
        elif self.action == "verify_otp":
            self.throttle_scope = "otp_verify"
        elif self.action == "submit_registration":
            self.throttle_scope = "registration"
        return super().get_throttles()

    @action(detail=False, methods=["post"], url_path="submit-registration", permission_classes=[AllowAny])
    def submit_registration(self, request):
        """Handle client registration form submission and transition to manager approval."""
        from core.models.accounts import AccountOpeningRequest
        from core.models.operational import ClientRegistration

        # Extract form data
        first_name = request.data.get("firstName") or request.data.get("first_name", "")
        last_name = request.data.get("lastName") or request.data.get("last_name", "")
        email = request.data.get("email", "")
        phone = request.data.get("phoneNumber") or request.data.get("phone", "")
        id_type = request.data.get("idType") or request.data.get("id_type", "ghana_card")
        id_number = request.data.get("idNumber") or request.data.get("id_number", "")
        account_type = request.data.get("accountType") or request.data.get("account_type", "daily_susu")
        digital_address = request.data.get("digitalAddress") or request.data.get("digital_address", "")
        location = request.data.get("location", "")
        notes = request.data.get("notes", "")
        date_of_birth = request.data.get("dateOfBirth") or request.data.get("date_of_birth")
        occupation = request.data.get("occupation", "")
        work_address = request.data.get("workAddress") or request.data.get("work_address", "")
        position = request.data.get("position", "")
        next_of_kin_data = request.data.get("next_of_kin_data")
        id_document = request.FILES.get("idDocument") or request.FILES.get("id_document")
        passport_picture = request.FILES.get("passportPicture") or request.FILES.get("passport_picture")

        # Basic validation
        if not any([first_name, last_name, phone]):
            return Response(
                {"error": "At least first name, last name, or phone is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Generate registration ID
        registration_id = f"REG-{str(uuid.uuid4())[:8].upper()}"

        # Handle JSON parsing if sent as a string
        if isinstance(next_of_kin_data, str):
            try:
                import json

                next_of_kin_data = json.loads(next_of_kin_data)
            except:
                pass

        # 1. Persist to Audit/Registration log
        registration = ClientRegistration.objects.create(
            registration_id=registration_id,
            submitted_by=request.user if request.user.is_authenticated else None,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            email=email,
            phone_number=phone,
            id_type=id_type,
            id_number=id_number,
            occupation=occupation,
            work_address=work_address,
            position=position,
            account_type=account_type,
            digital_address=digital_address,
            location=location,
            next_of_kin_data=next_of_kin_data,
            id_document=id_document,
            passport_picture=passport_picture,
            notes=notes,
            status="pending_manager_approval",  # Updated status
        )

        # 2. Create the AccountOpeningRequest for Manager dashboard visibility
        opening_request = AccountOpeningRequest.objects.create(
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth or timezone.now().date(),
            phone_number=phone,
            email=email,
            address=digital_address or location or "N/A",
            id_type=id_type,
            id_number=id_number,
            account_type=account_type,
            occupation=occupation,
            work_address=work_address,
            position=position,
            digital_address=digital_address,
            location=location,
            next_of_kin_data=next_of_kin_data,
            status="pending",
        )

        logger.info(
            f"Client registration {registration_id} transitioned to pending AccountOpeningRequest {opening_request.id}"
        )

        return Response(
            {
                "success": True,
                "id": registration.id,
                "registration_id": registration.registration_id,
                "message": "Registration submitted. Please visit the Manager's office for physical verification.",
                "status": "pending_approval",
            },
            status=status.HTTP_201_CREATED,
        )


class MemberViewSet(mixins.ListModelMixin, GenericViewSet):
    """Stub ViewSet for members list."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Return a listed summary of registered members for staff viewing."""
        from django.db.models import Q

        from core.utils.field_encryption import hash_field
        from users.models import User

        queryset = User.objects.filter(role="customer")

        # Apply search filter
        search = request.query_params.get("search", "")
        if search:
            # Generate stable hash for exact matching on sensitive fields
            search_hash = hash_field(search)

            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(id_number_hash=search_hash)
                | Q(phone_number_hash=search_hash)
                | Q(first_name_hash=search_hash)
                | Q(last_name_hash=search_hash)
            )

        # Pull objects to allow property-based PII decryption in loop
        members = queryset.only("id", "email", "first_name_encrypted", "last_name_encrypted", "id_number_encrypted")[
            :50
        ]
        return Response(
            {
                "results": [
                    {
                        "id": m.id,
                        "name": f"{m.first_name} {m.last_name}",
                        "email": m.email,
                        "id_number": m.id_number,
                    }
                    for m in members
                ]
            }
        )
