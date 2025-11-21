import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from users.models import User


class ChatSession(models.Model):
    """Chat session between customer and cashier/support staff."""

    STATUS_CHOICES = [
        ('waiting', 'Waiting for Agent'),
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated'),
        ('transferred', 'Transferred'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions_as_customer')
    assigned_cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_chat_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')

    # Session metadata
    started_at = models.DateTimeField(default=timezone.now)
    assigned_at = models.DateTimeField(null=True, blank=True)
    last_message_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Customer information
    customer_name = models.CharField(max_length=255, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)

    # Session details
    subject = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=100, default='general')
    tags = models.JSONField(default=list, blank=True)  # List of tags for categorization

    # Queue management
    queue_position = models.PositiveIntegerField(null=True, blank=True)
    estimated_wait_time = models.DurationField(null=True, blank=True)

    # Analytics
    message_count = models.PositiveIntegerField(default=0)
    customer_satisfaction = models.PositiveIntegerField(null=True, blank=True)  # 1-5 rating

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['assigned_cashier']),
            models.Index(fields=['customer']),
            models.Index(fields=['started_at']),
            models.Index(fields=['last_message_at']),
        ]

    def __str__(self):
        return f"Chat {self.id} - {self.customer_name or self.customer.email} ({self.status})"

    def assign_cashier(self, cashier):
        """Assign a cashier to this chat session."""
        if self.status != 'waiting':
            raise ValidationError("Can only assign cashier to waiting sessions")

        self.assigned_cashier = cashier
        self.status = 'active'
        self.assigned_at = timezone.now()
        self.save()

        # Create assignment audit log
        ChatSessionAudit.objects.create(
            session=self,
            action='assigned',
            performed_by=cashier,
            details={'assigned_to': str(cashier.email)}
        )

    def close_session(self, closed_by, reason=''):
        """Close the chat session."""
        self.status = 'closed'
        self.closed_at = timezone.now()
        self.save()

        # Create closure audit log
        ChatSessionAudit.objects.create(
            session=self,
            action='closed',
            performed_by=closed_by,
            details={'reason': reason}
        )

    def escalate_session(self, escalated_by, reason=''):
        """Escalate the chat session."""
        self.status = 'escalated'
        self.priority = 'high'
        self.save()

        # Create escalation audit log
        ChatSessionAudit.objects.create(
            session=self,
            action='escalated',
            performed_by=escalated_by,
            details={'reason': reason}
        )

    def transfer_session(self, transferred_by, new_cashier, reason=''):
        """Transfer session to another cashier."""
        old_cashier = self.assigned_cashier
        self.assigned_cashier = new_cashier
        self.status = 'transferred'
        self.save()

        # Create transfer audit log
        ChatSessionAudit.objects.create(
            session=self,
            action='transferred',
            performed_by=transferred_by,
            details={
                'from_cashier': str(old_cashier.email) if old_cashier else None,
                'to_cashier': str(new_cashier.email),
                'reason': reason
            }
        )

    def update_last_message(self):
        """Update the last message timestamp."""
        self.last_message_at = timezone.now()
        self.message_count += 1
        self.save(update_fields=['last_message_at', 'message_count'])


class ChatMessage(models.Model):
    """Individual messages within a chat session."""

    MESSAGE_TYPES = [
        ('text', 'Text Message'),
        ('file', 'File Attachment'),
        ('system', 'System Message'),
        ('typing', 'Typing Indicator'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')

    # Message content
    content = models.TextField(blank=True)  # For text messages
    file_url = models.URLField(blank=True)  # For file attachments
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)  # Size in bytes

    # Message metadata
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    # Additional data
    metadata = models.JSONField(default=dict, blank=True)  # For typing indicators, reactions, etc.

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['session', 'timestamp']),
            models.Index(fields=['sender']),
            models.Index(fields=['is_read']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"Message from {self.sender.email} in {self.session.id} at {self.timestamp}"

    def mark_as_read(self, read_by):
        """Mark message as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

            # Update session's last message time
            self.session.update_last_message()

    def edit_message(self, new_content):
        """Edit the message content."""
        self.content = new_content
        self.edited = True
        self.edited_at = timezone.now()
        self.save()


class SupportTicket(models.Model):
    """Support tickets created from chat conversations."""

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('waiting_customer', 'Waiting for Customer'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    CATEGORY_CHOICES = [
        ('account', 'Account Issues'),
        ('transaction', 'Transaction Problems'),
        ('technical', 'Technical Support'),
        ('billing', 'Billing Questions'),
        ('general', 'General Inquiry'),
        ('complaint', 'Complaint'),
        ('feature_request', 'Feature Request'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_session = models.OneToOneField(ChatSession, on_delete=models.CASCADE, related_name='support_ticket')

    # Ticket details
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')

    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tickets')

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Resolution
    resolution = models.TextField(blank=True)
    resolution_time = models.DurationField(null=True, blank=True)  # Time to resolve

    # Customer feedback
    customer_satisfaction = models.PositiveIntegerField(null=True, blank=True)  # 1-5 rating
    customer_feedback = models.TextField(blank=True)

    # Additional metadata
    tags = models.JSONField(default=list, blank=True)
    internal_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['category']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['created_by']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Ticket {self.id} - {self.title} ({self.status})"

    def assign_ticket(self, assigned_by, assignee):
        """Assign ticket to a user."""
        self.assigned_to = assignee
        self.save()

        # Create assignment audit log
        SupportTicketAudit.objects.create(
            ticket=self,
            action='assigned',
            performed_by=assigned_by,
            details={'assigned_to': str(assignee.email)}
        )

    def update_status(self, updated_by, new_status, notes=''):
        """Update ticket status."""
        old_status = self.status
        self.status = new_status

        if new_status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
            if self.created_at:
                self.resolution_time = self.resolved_at - self.created_at

        if new_status == 'closed' and not self.closed_at:
            self.closed_at = timezone.now()

        self.save()

        # Create status update audit log
        SupportTicketAudit.objects.create(
            ticket=self,
            action='status_changed',
            performed_by=updated_by,
            details={
                'old_status': old_status,
                'new_status': new_status,
                'notes': notes
            }
        )

    def add_resolution(self, resolved_by, resolution_text):
        """Add resolution to the ticket."""
        self.resolution = resolution_text
        self.update_status(resolved_by, 'resolved', 'Resolution added')

    def add_customer_feedback(self, rating, feedback=''):
        """Add customer feedback."""
        self.customer_satisfaction = rating
        self.customer_feedback = feedback
        self.save()


class ChatSessionAudit(models.Model):
    """Audit trail for chat session actions."""

    ACTION_CHOICES = [
        ('created', 'Session Created'),
        ('assigned', 'Cashier Assigned'),
        ('transferred', 'Session Transferred'),
        ('escalated', 'Session Escalated'),
        ('closed', 'Session Closed'),
        ('reopened', 'Session Reopened'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='audit_trail')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    performed_at = models.DateTimeField(default=timezone.now)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['action']),
            models.Index(fields=['performed_by']),
            models.Index(fields=['performed_at']),
        ]

    def __str__(self):
        return f"Audit: {self.session.id} - {self.action}"


class SupportTicketAudit(models.Model):
    """Audit trail for support ticket actions."""

    ACTION_CHOICES = [
        ('created', 'Ticket Created'),
        ('assigned', 'Ticket Assigned'),
        ('status_changed', 'Status Changed'),
        ('updated', 'Ticket Updated'),
        ('closed', 'Ticket Closed'),
        ('reopened', 'Ticket Reopened'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='audit_trail')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    performed_at = models.DateTimeField(default=timezone.now)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['ticket']),
            models.Index(fields=['action']),
            models.Index(fields=['performed_by']),
            models.Index(fields=['performed_at']),
        ]

    def __str__(self):
        return f"Audit: {self.ticket.id} - {self.action}"


class ChatAnalytics(models.Model):
    """Analytics data for chat performance metrics."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(default=timezone.now)

    # Session metrics
    total_sessions = models.PositiveIntegerField(default=0)
    active_sessions = models.PositiveIntegerField(default=0)
    closed_sessions = models.PositiveIntegerField(default=0)
    average_session_duration = models.DurationField(null=True, blank=True)

    # Response time metrics
    average_response_time = models.DurationField(null=True, blank=True)
    average_first_response_time = models.DurationField(null=True, blank=True)

    # Queue metrics
    average_queue_time = models.DurationField(null=True, blank=True)
    max_queue_time = models.DurationField(null=True, blank=True)
    abandoned_sessions = models.PositiveIntegerField(default=0)

    # Message metrics
    total_messages = models.PositiveIntegerField(default=0)
    average_messages_per_session = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Satisfaction metrics
    average_satisfaction = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    satisfaction_responses = models.PositiveIntegerField(default=0)

    # Agent performance
    total_agents_online = models.PositiveIntegerField(default=0)
    average_sessions_per_agent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        unique_together = ['date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"Chat Analytics - {self.date}"


class ChatFile(models.Model):
    """File attachments for chat messages."""

    FILE_TYPES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_url = models.URLField()
    file_size = models.PositiveIntegerField()  # Size in bytes
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, default='other')
    mime_type = models.CharField(max_length=100)

    # Security and processing
    checksum = models.CharField(max_length=128, blank=True)  # SHA-256 hash
    virus_scanned = models.BooleanField(default=False)
    scan_result = models.CharField(max_length=50, blank=True)  # clean, infected, error

    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['uploaded_at']
        indexes = [
            models.Index(fields=['message']),
            models.Index(fields=['file_type']),
            models.Index(fields=['virus_scanned']),
        ]

    def __str__(self):
        return f"File: {self.file_name} ({self.file_type})"