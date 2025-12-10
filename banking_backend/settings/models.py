import uuid
from django.db import models
from django.utils import timezone
from users.models import User


class SystemSetting(models.Model):
    """System-wide configuration settings."""
    
    VALUE_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('float', 'Float'),
    ]
    
    CATEGORIES = [
        ('system', 'System'),
        ('security', 'Security'),
        ('transactions', 'Transactions'),
        ('notifications', 'Notifications'),
        ('performance', 'Performance'),
        ('maintenance', 'Maintenance'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True, help_text="Unique setting key")
    value = models.TextField(help_text="Setting value (stored as text)")
    value_type = models.CharField(max_length=20, choices=VALUE_TYPES, default='string')
    description = models.TextField(help_text="Description of what this setting controls")
    category = models.CharField(max_length=50, choices=CATEGORIES, default='system')
    is_active = models.BooleanField(default=True, help_text="Whether this setting is active")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='modified_settings')
    
    class Meta:
        ordering = ['category', 'key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
    
    def __str__(self):
        return f"{self.key} ({self.category})"
    
    def get_typed_value(self):
        """Return the value converted to its proper type."""
        if self.value_type == 'integer':
            return int(self.value)
        elif self.value_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.value_type == 'float':
            return float(self.value)
        elif self.value_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value
    
    def set_typed_value(self, value):
        """Set the value with automatic type conversion."""
        if self.value_type == 'json':
            import json
            self.value = json.dumps(value)
        else:
            self.value = str(value)
    
    @classmethod
    def get_setting(cls, key, default=None):
        """Get a setting value by key, return default if not found."""
        try:
            setting = cls.objects.get(key=key, is_active=True)
            return setting.get_typed_value()
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, user=None, **kwargs):
        """Set or update a setting value."""
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={'value': str(value), 'modified_by': user, **kwargs}
        )
        if not created:
            setting.set_typed_value(value)
            setting.modified_by = user
            setting.save()
        return setting