import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AuditLog(models.Model):
    """Comprehensive audit logging for all user activities."""
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('failed_login', 'Failed Login'),
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        ('user_created', 'User Created'),
        ('user_updated', 'User Updated'),
        ('user_deleted', 'User Deleted'),
        ('user_activated', 'User Activated'),
        ('user_deactivated', 'User Deactivated'),
        ('role_changed', 'Role Changed'),
        ('permission_denied', 'Permission Denied'),
        ('transaction_created', 'Transaction Created'),
        ('transaction_processed', 'Transaction Processed'),
        ('account_accessed', 'Account Accessed'),
        ('security_violation', 'Security Violation'),
        ('system_configuration_changed', 'System Configuration Changed'),
        ('data_export', 'Data Export'),
        ('data_import', 'Data Import'),
        ('backup_created', 'Backup Created'),
        ('backup_restored', 'Backup Restored'),
        ('session_expired', 'Session Expired'),
        ('account_locked', 'Account Locked'),
        ('account_unlocked', 'Account Unlocked'),
        ('mfa_enabled', 'Multi-Factor Authentication Enabled'),
        ('mfa_disabled', 'Multi-Factor Authentication Disabled'),
        ('mfa_verification_failed', 'MFA Verification Failed'),
        ('suspicious_activity', 'Suspicious Activity Detected'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Context Information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    device_fingerprint = models.CharField(max_length=255, blank=True, null=True)
    
    # Request/Response Details
    method = models.CharField(max_length=10, blank=True, null=True)  # GET, POST, etc.
    endpoint = models.CharField(max_length=500, blank=True, null=True)
    query_params = models.TextField(blank=True, null=True)
    
    # Additional Data
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    
    # Security Details
    risk_score = models.IntegerField(default=0, help_text="Risk score from 0-100")
    geolocation = models.CharField(max_length=100, blank=True, null=True)
    is_suspicious = models.BooleanField(default=False)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['is_suspicious']),
            models.Index(fields=['priority', '-timestamp']),
        ]
    
    def __str__(self):
        user_info = self.user.email if self.user else "Anonymous"
        return f"{self.timestamp} - {user_info} - {self.action}"
    
    def save(self, *args, **kwargs):
        # Auto-set priority based on action
        if not self.priority or self.priority == 'medium':
            critical_actions = ['security_violation', 'suspicious_activity', 'failed_login', 'account_locked']
            high_actions = ['user_deleted', 'data_export', 'system_configuration_changed']
            
            if self.action in critical_actions:
                self.priority = 'critical'
            elif self.action in high_actions:
                self.priority = 'high'
            elif self.action in ['login', 'logout', 'password_change']:
                self.priority = 'low'
        
        # Auto-detect suspicious activity
        self._detect_suspicious_activity()
        
        super().save(*args, **kwargs)
    
    def _detect_suspicious_activity(self):
        """Auto-detect suspicious activity patterns."""
        if self.action == 'failed_login' and self.user:
            # Check for multiple failed attempts
            recent_failures = AuditLog.objects.filter(
                user=self.user,
                action='failed_login',
                timestamp__gte=timezone.now() - timezone.timedelta(hours=1)
            ).count()
            
            if recent_failures >= 3:
                self.is_suspicious = True
                self.risk_score = min(90, recent_failures * 20)
        
        elif self.action in ['login', 'account_accessed']:
            # Check for multiple IP addresses
            if self.user and self.ip_address:
                recent_ips = AuditLog.objects.filter(
                    user=self.user,
                    action__in=['login', 'account_accessed'],
                    timestamp__gte=timezone.now() - timezone.timedelta(days=1)
                ).values_list('ip_address', flat=True).distinct()
                
                if len(recent_ips) > 3:  # Multiple IP addresses in 24 hours
                    self.is_suspicious = True
                    self.risk_score = 70
        
        # High risk score for certain actions
        if self.action in ['security_violation', 'suspicious_activity']:
            self.risk_score = 100


class SecurityEvent(models.Model):
    """High-priority security events that require immediate attention."""
    
    EVENT_TYPE_CHOICES = [
        ('brute_force', 'Brute Force Attack'),
        ('sql_injection_attempt', 'SQL Injection Attempt'),
        ('xss_attempt', 'Cross-Site Scripting Attempt'),
        ('unauthorized_access', 'Unauthorized Access Attempt'),
        ('privilege_escalation', 'Privilege Escalation Attempt'),
        ('data_breach_attempt', 'Data Breach Attempt'),
        ('session_hijacking', 'Session Hijacking Attempt'),
        ('malware_detection', 'Malware Detection'),
        ('unusual_login_pattern', 'Unusual Login Pattern'),
        ('geographic_anomaly', 'Geographic Login Anomaly'),
        ('multiple_failed_attempts', 'Multiple Failed Login Attempts'),
        ('account_compromise', 'Account Compromise Detected'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    
    # Event Details
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    
    # Technical Details
    request_data = models.JSONField(default=dict, blank=True)
    stack_trace = models.TextField(blank=True, null=True)
    
    # Response Actions
    action_taken = models.TextField(blank=True, null=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_security_events')
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    # Monitoring
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
            models.Index(fields=['resolved', '-timestamp']),
        ]
    
    def __str__(self):
        user_info = self.user.email if self.user else "Anonymous"
        return f"{self.timestamp} - {self.event_type} - {user_info} - {self.severity}"


class LoginAttempt(models.Model):
    """Detailed tracking of login attempts for security analysis."""
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failure', 'Failure'),
        ('blocked', 'Blocked'),
        ('locked', 'Account Locked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    email = models.EmailField()  # Even for failed attempts where user might not exist
    
    # Login Details
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    
    # Security Analysis
    is_suspicious = models.BooleanField(default=False)
    geo_location = models.CharField(max_length=100, blank=True, null=True)
    device_fingerprint = models.CharField(max_length=255, blank=True, null=True)
    
    # Risk Assessment
    risk_factors = models.JSONField(default=list, blank=True)
    risk_score = models.IntegerField(default=0)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['email', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['status', '-timestamp']),
            models.Index(fields=['is_suspicious']),
        ]
    
    def __str__(self):
        return f"{self.timestamp} - {self.email} - {self.status}"