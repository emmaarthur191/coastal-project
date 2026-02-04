import os

from django.core.files.storage import default_storage
from django.http import FileResponse, Http404
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Report


class ReportDownloadView(APIView):
    """View to download generated reports."""

    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            # Handle report_123 format
            if report_id.startswith("report_"):
                try:
                    pk = int(report_id.split("_")[1])
                    report = Report.objects.get(pk=pk)
                except (ValueError, IndexError):
                    raise Http404("Invalid report ID format")
            else:
                # Try lookup by report_id string if applicable (legacy)
                # But mostly we expect ID lookup now
                raise Http404("Report not found")

            # SECURITY FIX: Enforce Ownership or Staff role to prevent IDOR
            from core.permissions import STAFF_ROLES

            if report.generated_by != request.user and not (request.user.role in STAFF_ROLES or request.user.is_staff):
                raise PermissionDenied("You do not have permission to download this report.")

            if not report.file_path:
                raise Http404("Report file not generated")

            if not default_storage.exists(report.file_path):
                raise Http404(f"File not found on storage: {report.file_path}")

            # Open file and return
            file_handle = default_storage.open(report.file_path, "rb")
            filename = os.path.basename(report.file_path)

            response = FileResponse(file_handle, as_attachment=True, filename=filename)
            return response

        except Report.DoesNotExist:
            raise Http404("Report object not found")
        except PermissionDenied:
            # Re-raise permission denied explicitly
            raise
        except Exception as e:
            # Log error
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Download error for report {report_id}: {e}")
            raise Http404("Error downloading report")
