from django.http import HttpResponse, Http404, FileResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Report
from django.core.files.storage import default_storage
import os

class ReportDownloadView(APIView):
    """View to download generated reports."""
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            # Handle report_123 format
            if report_id.startswith('report_'):
                try:
                    pk = int(report_id.split('_')[1])
                    report = Report.objects.get(pk=pk)
                except (ValueError, IndexError):
                    raise Http404("Invalid report ID format")
            else:
                # Try lookup by report_id string if applicable (legacy)
                # But mostly we expect ID lookup now
                raise Http404("Report not found")
                
            if not report.file_path:
                 raise Http404("Report file not generated")
                 
            if not default_storage.exists(report.file_path):
                 raise Http404(f"File not found on storage: {report.file_path}")
            
            # Open file and return
            file_handle = default_storage.open(report.file_path, 'rb')
            filename = os.path.basename(report.file_path)
            
            response = FileResponse(file_handle, as_attachment=True, filename=filename)
            return response
            
        except Report.DoesNotExist:
            raise Http404("Report object not found")
        except Exception as e:
            # Log error
            print(f"Download error: {e}")
            raise Http404(f"Error downloading report: {str(e)}")
