from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date
from .models import ReportTemplate, Report, ReportSchedule, ReportAnalytics
from .serializers import (
    ReportTemplateSerializer, ReportSerializer, ReportScheduleSerializer,
    ReportAnalyticsSerializer, ReportGenerationSerializer,
    ReportScheduleCreateSerializer, ReportExportSerializer
)
from .services import ReportGenerator


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report templates."""
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter templates based on user permissions."""
        user = self.request.user
        if user.role in ['administrator', 'operations_manager']:
            return ReportTemplate.objects.all()
        return ReportTemplate.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reports."""
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter reports based on user permissions."""
        user = self.request.user
        if user.role in ['administrator', 'operations_manager']:
            return Report.objects.all()
        # Cashiers can only see their own generated reports
        return Report.objects.filter(generated_by=user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new report."""
        serializer = ReportGenerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        template_id = serializer.validated_data['template_id']
        report_date = serializer.validated_data.get('report_date', date.today())
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        filters = serializer.validated_data.get('filters', {})
        format_type = serializer.validated_data.get('format', 'json')

        # Get template
        try:
            template = ReportTemplate.objects.get(id=template_id)
        except ReportTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permissions
        if not self._can_generate_report(request.user, template):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create report
        report = Report.objects.create(
            template=template,
            title=f"{template.name} - {report_date.strftime('%B %Y')}",
            report_date=report_date,
            start_date=start_date,
            end_date=end_date,
            filters_applied=filters,
            format=format_type,
            generated_by=request.user
        )

        try:
            # Generate report data
            generator = ReportGenerator()

            if start_date and end_date:
                report_data = generator.generate_transaction_summary(start_date, end_date, filters)
            else:
                # Use template's date range logic
                from .management.commands.generate_reports import Command
                cmd = Command()
                report_data = cmd.generate_report_data(template, report_date)

            report.complete_generation(data=report_data)

            # Generate analytics
            from .management.commands.generate_reports import Command as Cmd
            cmd_instance = Cmd()
            cmd_instance.generate_report_analytics(report)

            serializer = self.get_serializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            report.fail_generation(str(e))
            return Response(
                {'error': f'Report generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def export(self, request, pk=None):
        """Export a report in specified format."""
        serializer = ReportExportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        report = self.get_object()
        format_type = serializer.validated_data['format']
        include_charts = serializer.validated_data['include_charts']

        # Check if report is completed
        if report.status != 'completed':
            return Response(
                {'error': 'Report is not ready for export'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Generate export file (placeholder - would implement actual export logic)
            file_path = self._generate_export_file(report, format_type, include_charts)

            report.file_path = file_path
            report.format = format_type
            report.save()

            return Response({
                'message': 'Export completed',
                'file_path': file_path,
                'format': format_type
            })

        except Exception as e:
            return Response(
                {'error': f'Export failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download exported report file."""
        report = self.get_object()

        if not report.file_path:
            return Response(
                {'error': 'No export file available'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Return file response (placeholder)
        return Response({'file_url': report.file_path})

    def _can_generate_report(self, user, template):
        """Check if user can generate reports for this template."""
        if user.role in ['administrator', 'operations_manager']:
            return True
        if user.role == 'cashier' and template.template_type in ['cashier_activity', 'transaction_summary']:
            return True
        return False

    def _generate_export_file(self, report, format_type, include_charts):
        """Generate export file (placeholder implementation)."""
        # This would implement actual PDF/Excel/CSV generation
        # For now, return a placeholder path
        import os

        filename = f"report_{report.id}.{format_type}"
        file_path = os.path.join('reports', 'exports', filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Placeholder: create empty file
        with open(file_path, 'w') as f:
            f.write(f"Report: {report.title}\n")
            f.write(f"Generated: {report.generated_at}\n")
            f.write("Data: " + str(report.data)[:1000] + "...\n")

        return file_path


class ReportScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing report schedules."""
    queryset = ReportSchedule.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReportScheduleCreateSerializer
        return ReportScheduleSerializer

    def get_queryset(self):
        """Filter schedules based on user permissions."""
        user = self.request.user
        if user.role in ['administrator', 'operations_manager']:
            return ReportSchedule.objects.all()
        return ReportSchedule.objects.filter(created_by=user)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a report schedule."""
        schedule = self.get_object()
        schedule.pause_schedule()
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused report schedule."""
        schedule = self.get_object()
        schedule.resume_schedule()
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        """Execute a schedule immediately."""
        schedule = self.get_object()

        try:
            from .services import ReportScheduler
            scheduler = ReportScheduler()
            scheduler.execute_schedule(schedule)
            return Response({'message': 'Schedule executed successfully'})
        except Exception as e:
            return Response(
                {'error': f'Schedule execution failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing report analytics."""
    queryset = ReportAnalytics.objects.all()
    serializer_class = ReportAnalyticsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter analytics based on user permissions."""
        user = self.request.user
        if user.role in ['administrator', 'operations_manager']:
            return ReportAnalytics.objects.all()
        # Users can see analytics for reports they generated
        return ReportAnalytics.objects.filter(report__generated_by=user)
