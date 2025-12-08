from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class MessageThread(models.Model):
    THREAD_TYPES = [
        ('direct', 'Direct Message'),
        ('group', 'Group Chat'),
        ('channel', 'Announcement Channel'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    thread_type = models.CharField(max_length=20, choices=THREAD_TYPES, default='group')
    participants = models.ManyToManyField(User, related_name='messaging_threads', through='ThreadParticipant', through_fields=('thread', 'user'))
    admins = models.ManyToManyField(User, related_name='admin_threads', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_messaging_threads')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.subject} - {self.participants.count()} participants"

    def is_group(self):
        return self.thread_type in ['group', 'channel']

    def can_user_manage(self, user):
        """Check if user can manage this thread (creator or admin)"""
        return user == self.created_by or self.admins.filter(id=user.id).exists()

    def add_participant(self, user, added_by=None):
        """Add a participant to the thread"""
        if self.participants.count() >= 256:
            raise ValueError("Cannot add more participants. Group limit of 256 reached.")

        ThreadParticipant.objects.get_or_create(
            thread=self,
            user=user,
            defaults={'added_by': added_by or self.created_by}
        )

    def remove_participant(self, user, removed_by):
        """Remove a participant from the thread"""
        if user == self.created_by:
            raise ValueError("Cannot remove the group creator.")

        ThreadParticipant.objects.filter(thread=self, user=user).delete()

        # If removing an admin, also remove from admins
        self.admins.remove(user)


class ThreadParticipant(models.Model):
    """Through model for MessageThread participants with additional metadata"""
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    added_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='added_participants')
    added_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['thread', 'user']

    def __str__(self):
        return f"{self.user} in {self.thread.subject}"

class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('file', 'File'),
        ('image', 'Image'),
        ('call', 'Call'),
        ('voice', 'Voice Note'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('location', 'Location'),
        ('contact', 'Contact'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    content = models.TextField(blank=True, null=True)
    encrypted_content = models.TextField(blank=True, null=True)
    iv = models.CharField(max_length=255, blank=True, null=True)
    auth_tag = models.CharField(max_length=255, blank=True, null=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    is_starred = models.BooleanField(default=False)
    expires_at = models.DateTimeField(blank=True, null=True)  # For disappearing messages
    forwarded_from = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='forwarded_messages')

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender} in {self.thread.subject}"

    def get_reactions_summary(self):
        """Get a summary of reactions for this message"""
        reactions = self.reactions.all()
        summary = {}
        for reaction in reactions:
            if reaction.emoji not in summary:
                summary[reaction.emoji] = {'count': 0, 'users': []}
            summary[reaction.emoji]['count'] += 1
            summary[reaction.emoji]['users'].append({
                'id': reaction.user.id,
                'name': f"{reaction.user.first_name} {reaction.user.last_name}"
            })
        return summary

    def mark_as_read(self, user, device):
        """Mark message as read by user on specific device"""
        from django.utils import timezone
        MessageReadStatus.objects.get_or_create(
            message=self,
            user=user,
            device=device,
            defaults={'read_at': timezone.now()}
        )
        # Update the message's is_read field if it's the user's own message
        if self.sender == user:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class MessageReaction(models.Model):
    """Model for message reactions (like WhatsApp reactions)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    emoji = models.CharField(max_length=10)  # Unicode emoji
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['message', 'user']  # One reaction per user per message
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user} reacted {self.emoji} to message {self.message.id}"

class EncryptionKey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='encryption_key')
    public_key = models.TextField()
    private_key = models.TextField(blank=True, null=True)  # Only store for backup, normally client-side
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Encryption key for {self.user}"

class Device(models.Model):
    """Model for user devices to enable multi-device synchronization"""
    DEVICE_TYPES = [
        ('web', 'Web Browser'),
        ('mobile', 'Mobile App'),
        ('desktop', 'Desktop App'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_id = models.CharField(max_length=255)  # Unique device identifier
    device_name = models.CharField(max_length=255)  # User-friendly name
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default='web')
    user_agent = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    last_seen = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['user', 'device_id']
        ordering = ['-last_seen']

    def __str__(self):
        return f"{self.user.email} - {self.device_name} ({self.device_type})"

    def update_last_seen(self):
        """Update the last seen timestamp"""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])


class MessageReadStatus(models.Model):
    """Model to track message read status across devices"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_read_statuses')
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='read_messages')
    read_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['message', 'user', 'device']
        ordering = ['read_at']

    def __str__(self):
        return f"{self.user.email} read {self.message.id} on {self.device.device_name}"


class SyncCheckpoint(models.Model):
    """Model to track synchronization checkpoints for each device"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='sync_checkpoints')
    last_message_id = models.UUIDField(blank=True, null=True)
    last_sync_timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['device']
        ordering = ['-last_sync_timestamp']

    def __str__(self):
        return f"Sync checkpoint for {self.device.device_name}"


class MessageBackup(models.Model):
    """Model for encrypted message backups"""
    BACKUP_TYPES = [
        ('full', 'Full Backup'),
        ('incremental', 'Incremental Backup'),
        ('media', 'Media Only Backup'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_backups')
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES, default='full')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_size = models.BigIntegerField(blank=True, null=True)
    message_count = models.IntegerField(default=0)
    media_count = models.IntegerField(default=0)
    encryption_key = models.TextField(blank=True, null=True)  # Encrypted backup key
    checksum = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.backup_type} backup for {self.user.email} - {self.status}"

    def mark_completed(self, file_path, file_size, message_count, media_count, checksum):
        """Mark backup as completed"""
        self.status = 'completed'
        self.file_path = file_path
        self.file_size = file_size
        self.message_count = message_count
        self.media_count = media_count
        self.checksum = checksum
        self.completed_at = timezone.now()
        self.save()

    def mark_failed(self):
        """Mark backup as failed"""
        self.status = 'failed'
        self.save()


class CallLog(models.Model):
    CALL_TYPES = [
        ('voice', 'Voice Call'),
        ('video', 'Video Call'),
    ]

    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('connected', 'Connected'),
        ('ended', 'Ended'),
        ('missed', 'Missed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='calls')
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_calls')
    participants = models.ManyToManyField(User, related_name='call_participants')
    call_type = models.CharField(max_length=20, choices=CALL_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    started_at = models.DateTimeField(blank=True, null=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.call_type} call by {self.initiator} - {self.status}"
