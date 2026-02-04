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

    @action(detail=False, methods=["post"], url_path="submit-registration")
    def submit_registration(self, request):
        """Handle client registration form submission and persist to database."""
        from core.models.operational import ClientRegistration

        # Extract form data - handle both camelCase (from frontend) and snake_case
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

        # Basic validation
        if not any([first_name, last_name, phone]):
            return Response(
                {"error": "At least first name, last name, or phone is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Generate registration ID
        registration_id = f"REG-{str(uuid.uuid4())[:8].upper()}"

        date_of_birth = request.data.get("dateOfBirth") or request.data.get("date_of_birth")
        occupation = request.data.get("occupation", "")
        work_address = request.data.get("workAddress") or request.data.get("work_address", "")
        position = request.data.get("position", "")
        next_of_kin_data = request.data.get("next_of_kin_data")
        id_document = request.FILES.get("idDocument") or request.FILES.get("id_document")
        passport_picture = request.FILES.get("passportPicture") or request.FILES.get("passport_picture")

        # Handle JSON parsing if sent as a string
        if isinstance(next_of_kin_data, str):
            try:
                import json

                next_of_kin_data = json.loads(next_of_kin_data)
            except:
                pass

        # Persist to database
        registration = ClientRegistration.objects.create(
            registration_id=registration_id,
            submitted_by=request.user,
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
            status="pending_verification",
        )

        logger.info(f"Client registration {registration_id} created by {request.user.email}")

        return Response(
            {
                "success": True,
                "id": registration.id,
                "message": "Registration submitted successfully",
                "registration_id": registration.registration_id,
                "status": registration.status,
                "submitted_at": registration.created_at,
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

    @action(detail=False, methods=["post"], url_path="send-otp")
    def send_otp(self, request):
        """Generate and send OTP for registration verification."""
        from core.models.operational import ClientRegistration
        from users.services import SendexaService

        registration_id = request.data.get("email")  # Frontend sends registration ID as 'email'

        try:
            registration = ClientRegistration.objects.get(registration_id=registration_id)
        except ClientRegistration.DoesNotExist:
            # Fallback if it's the database ID
            try:
                registration = ClientRegistration.objects.get(id=registration_id)
            except:
                return Response({"error": "Registration not found"}, status=status.HTTP_404_NOT_FOUND)

        # Generate OTP
        import secrets

        otp_code = str(secrets.SystemRandom().randint(100000, 999999))

        # Store in session (using registration ID as key for safety)
        request.session[f"reg_otp_{registration.registration_id}"] = otp_code
        request.session[f"reg_otp_expiry_{registration.registration_id}"] = timezone.now().timestamp() + 600

        # Send via SMS
        message = f"Your Coastal registration OTP is: {otp_code}. Registration ID: {registration.registration_id}"
        success, _resp = SendexaService.send_sms(registration.phone_number, message)

        if not success:
            logger.error(f"Failed to send OTP for registration {registration.registration_id}")

        return Response({"success": True, "message": "OTP sent successfully"})

    @action(detail=False, methods=["post"], url_path="verify-otp")
    def verify_otp(self, request):
        """Verify OTP and transition to AccountOpeningRequest."""
        from core.models.accounts import AccountOpeningRequest
        from core.models.operational import ClientRegistration

        registration_id = request.data.get("email")
        otp_code = request.data.get("otp")

        try:
            registration = ClientRegistration.objects.get(registration_id=registration_id)
        except ClientRegistration.DoesNotExist:
            try:
                registration = ClientRegistration.objects.get(id=registration_id)
            except:
                return Response({"error": "Registration not found"}, status=status.HTTP_404_NOT_FOUND)

        # Verify OTP
        stored_otp = request.session.get(f"reg_otp_{registration.registration_id}")
        expiry = request.session.get(f"reg_otp_expiry_{registration.registration_id}")

        if not stored_otp or timezone.now().timestamp() > expiry:
            return Response({"error": "OTP expired or not found"}, status=status.HTTP_400_BAD_REQUEST)

        if str(stored_otp) != str(otp_code):
            return Response({"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST)

        # Success - Clear OTP
        if f"reg_otp_{registration.registration_id}" in request.session:
            del request.session[f"reg_otp_{registration.registration_id}"]
        if f"reg_otp_expiry_{registration.registration_id}" in request.session:
            del request.session[f"reg_otp_expiry_{registration.registration_id}"]

        # Update Registration status
        registration.status = "under_review"
        registration.save()

        # Create AccountOpeningRequest for manager review
        # This is the "bridge" to ensure it shows up in AccountOpeningsSection.tsx
        opening_request = AccountOpeningRequest.objects.create(
            first_name=registration.first_name,
            last_name=registration.last_name,
            date_of_birth=registration.date_of_birth or timezone.now().date(),
            phone_number=registration.phone_number,
            email=registration.email,
            address=registration.digital_address,  # Use digital address as fallback
            id_type=registration.id_type,
            id_number=registration.id_number,
            account_type=registration.account_type,
            occupation=registration.occupation,
            work_address=registration.work_address,
            position=registration.position,
            digital_address=registration.digital_address,
            location=registration.location,
            next_of_kin_data=registration.next_of_kin_data,
            id_document=registration.id_document,
            passport_picture=registration.passport_picture,
            status="pending",
        )

        logger.info(
            f"Account opening request {opening_request.id} created from registration {registration.registration_id}"
        )

        return Response(
            {"success": True, "message": "OTP verified! Registration is now under review.", "account_number": "PENDING"}
        )


class MemberViewSet(mixins.ListModelMixin, GenericViewSet):
    """Stub ViewSet for members list."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Return a listed summary of registered members for staff viewing."""
        from django.db.models import Q

        from users.models import User

        queryset = User.objects.filter(role="customer")

        # Apply search filter
        search = request.query_params.get("search", "")
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(id_number__icontains=search)
            )

        members = queryset.values("id", "email", "first_name", "last_name", "id_number")[:50]
        return Response(
            {
                "results": [
                    {
                        "id": m["id"],
                        "name": f"{m['first_name']} {m['last_name']}",
                        "email": m["email"],
                        "id_number": m["id_number"],
                    }
                    for m in members
                ]
            }
        )
