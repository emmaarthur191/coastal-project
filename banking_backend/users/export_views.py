"""
Export views for superuser dashboard
"""
import csv
import json
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from auditlog.models import LogEntry
from users.models import User


@login_required
def export_users_csv(request):
    """Export all users to CSV format."""
    if request.user.role != 'superuser':
        return HttpResponse('Access denied', status=403)
    
    # Create the HttpResponse object with CSV header
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="users_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    # Write header
    writer.writerow(['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Is Active', 'Date Joined', 'Last Login'])
    
    # Write data
    users = User.objects.all().order_by('-date_joined')
    for user in users:
        writer.writerow([
            str(user.id),
            user.email,
            user.first_name,
            user.last_name,
            user.role,
            'Yes' if user.is_active else 'No',
            user.date_joined.strftime('%Y-%m-%d %H:%M:%S') if user.date_joined else '',
            user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never'
        ])
    
    return response


@login_required
def export_audit_json(request):
    """Export audit logs to JSON format."""
    if request.user.role != 'superuser':
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Get recent audit logs (last 1000 entries)
    logs = LogEntry.objects.all().order_by('-timestamp')[:1000]
    
    # Convert to JSON-serializable format
    audit_data = []
    for log in logs:
        audit_data.append({
            'id': str(log.id),
            'timestamp': log.timestamp.isoformat() if log.timestamp else None,
            'actor': str(log.actor) if log.actor else 'System',
            'action': log.action,
            'object_repr': log.object_repr,
            'changes': log.changes if hasattr(log, 'changes') else {},
            'remote_addr': log.remote_addr if hasattr(log, 'remote_addr') else None,
        })
    
    # Create response
    response = HttpResponse(
        json.dumps(audit_data, indent=2),
        content_type='application/json'
    )
    response['Content-Disposition'] = f'attachment; filename="audit_logs_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
    
    return response


@login_required
def export_security_pdf(request):
    """Export security report (simplified - returns JSON for now, PDF requires reportlab)."""
    if request.user.role != 'superuser':
        return JsonResponse({'error': 'Access denied'}, status=403)
    
    # Get security metrics
    from django.contrib.auth import get_user_model
    from auditlog.models import LogEntry
    
    User = get_user_model()
    
    # Calculate security metrics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    failed_logins = LogEntry.objects.filter(
        action__icontains='login',
        timestamp__gte=timezone.now() - timezone.timedelta(days=7)
    ).count()
    
    security_report = {
        'report_date': timezone.now().isoformat(),
        'summary': {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'failed_logins_7days': failed_logins,
        },
        'recommendations': [
            'Review inactive user accounts',
            'Monitor failed login attempts',
            'Ensure all users have strong passwords',
            'Enable 2FA for all administrative accounts',
        ]
    }
    
    # Return as JSON (PDF generation would require reportlab library)
    response = HttpResponse(
        json.dumps(security_report, indent=2),
        content_type='application/json'
    )
    response['Content-Disposition'] = f'attachment; filename="security_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
    
    return response
