import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('customer', 'Customer/User'),
        ('cashier', 'Cashier'),
        ('mobile_banker', 'Mobile Banker'),
        ('manager', 'Manager'),
        ('operations_manager', 'Operations Manager'),
        ('administrator', 'Administrator'),
        ('superuser', 'Superuser'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Security features
    reset_token = models.CharField(max_length=128, blank=True, null=True)
    reset_token_created_at = models.DateTimeField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)
    last_failed_login = models.DateTimeField(blank=True, null=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    
    # Session and security tracking
    session_token = models.CharField(max_length=255, blank=True, null=True)
    device_fingerprint = models.CharField(max_length=255, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def set_reset_token(self, token):
        """Set hashed reset token with timestamp."""
        self.reset_token = make_password(token)
        self.reset_token_created_at = timezone.now()
        self.save()

    def check_reset_token(self, token):
        """Check if the provided token matches the hashed token and is not expired."""
        if not self.reset_token or not self.reset_token_created_at:
            return False

        # Check if token is expired (15 minutes)
        if timezone.now() >= self.reset_token_created_at + timedelta(minutes=15):
            return False

        # Constant-time comparison to prevent timing attacks
        import hmac
        try:
            token_valid = check_password(token, self.reset_token)
            return hmac.compare_digest(str(token_valid), "True")
        except Exception:
            return False

    def clear_reset_token(self):
        """Clear the reset token."""
        self.reset_token = None
        self.reset_token_created_at = None
        self.save()

    def is_account_locked(self):
        """Check if account is locked due to failed login attempts."""
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    def record_failed_login(self):
        """Record a failed login attempt and potentially lock the account."""
        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()
        
        # Lock account after 5 failed attempts for 30 minutes
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timedelta(minutes=30)
        
        self.save()

    def reset_failed_login_attempts(self):
        """Reset failed login attempts on successful login."""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.last_failed_login = None
        self.last_login = timezone.now()
        self.save()

    def is_password_strong(self, password):
        """
        Validate password strength according to banking standards.
        - At least 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        - At least one special character
        - Not commonly used passwords
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one digit"
        
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Password must contain at least one special character"
        
        # Check for common passwords (you'd want a more comprehensive list in production)
        common_passwords = ['password', '123456', 'qwerty', 'admin', 'letmein']
        if password.lower() in common_passwords:
            return False, "Password cannot be a commonly used password"
        
        return True, "Password meets complexity requirements"

    def has_role_permission(self, required_role):
        """Check if user has the required role or higher."""
        role_hierarchy = {
            'customer': 0,
            'cashier': 1,
            'mobile_banker': 2,
            'manager': 3,
            'operations_manager': 4,
            'administrator': 5,
            'superuser': 6
        }
        
        user_level = role_hierarchy.get(self.role, -1)
        required_level = role_hierarchy.get(required_role, -1)
        
        return user_level >= required_level

    def get_permissions_by_role(self):
        """Return list of permissions based on user role."""
        permissions = {
            'customer': [
                'view_own_account',
                'manage_own_profile',
                'transfer_funds',
                'pay_bills',
                'view_transaction_history'
            ],
            'cashier': [
                'process_transactions',
                'view_customer_accounts',
                'handle_customer_service',
                'process_payments',
                'basic_account_inquiries'
            ],
            'mobile_banker': [
                'remote_customer_service',
                'mobile_transactions',
                'client_communication',
                'secure_remote_access'
            ],
            'manager': [
                'team_supervision',
                'workflow_approval',
                'performance_tracking',
                'limited_administrative_functions',
                'view_team_analytics'
            ],
            'operations_manager': [
                'operational_oversight',
                'reporting',
                'process_management',
                'system_analytics',
                'manager_permissions'
            ],
            'administrator': [
                'full_system_access',
                'user_management',
                'configuration_settings',
                'security_monitoring',
                'all_permissions'
            ],
            'superuser': [
                'unlimited_system_access',
                'full_system_access',
                'bypass_all_restrictions',
                'system_administration',
                'security_override',
                'emergency_access',
                'full_audit_bypass',
                'configuration_override',
                'all_permissions'
            ]
        }
        
        return permissions.get(self.role, [])

    def __str__(self):
        return f"{self.email} ({self.role})"


class UserProfile(models.Model):
    """Extends the custom User model."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Contact Information
    phone = models.CharField(max_length=20, blank=True, null=True)

    # New Fields for Settings Tab (Notifications)
    notify_email = models.BooleanField(default=True)
    notify_sms = models.BooleanField(default=False)
    notify_push = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} Profile"


class OTPVerification(models.Model):
    """Store OTP codes for phone number verification."""
    VERIFICATION_TYPES = [
        ('user_creation', 'User Creation'),
        ('phone_verification', 'Phone Verification'),
        ('transaction', 'Transaction Verification'),
        ('password_reset', 'Password Reset'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6)
    verification_type = models.CharField(max_length=50, choices=VERIFICATION_TYPES)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number', '-created_at']),
            models.Index(fields=['otp_code']),
        ]
    
    def is_expired(self):
        """Check if OTP has expired."""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if OTP is still valid (not expired and not exceeded max attempts)."""
        return not self.is_expired() and self.attempts < self.max_attempts and not self.is_verified
    
    def verify(self, code):
        """Verify the OTP code."""
        self.attempts += 1
        self.save()
        
        if not self.is_valid():
            return False
        
        if self.otp_code == code:
            self.is_verified = True
            self.save()
            return True
        
        return False
    
    def __str__(self):
        return f"OTP for {self.phone_number} ({self.verification_type})"


# Audit and Security Models
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
