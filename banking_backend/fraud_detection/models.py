import uuid
from decimal import Decimal
from datetime import timedelta
from typing import Dict, Any, Tuple
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from users.models import User
from banking.models import Transaction, Account
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)


class FraudRule(models.Model):
    """Configurable rules for fraud detection."""

    RULE_TYPES = [
        ('amount_threshold', 'Amount Threshold'),
        ('velocity_check', 'Velocity Check'),
        ('unusual_pattern', 'Unusual Pattern'),
        ('location_anomaly', 'Location Anomaly'),
        ('time_based', 'Time-Based Rule'),
        ('account_behavior', 'Account Behavior'),
        ('custom', 'Custom Rule'),
    ]

    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    OPERATORS = [
        ('gt', 'Greater Than'),
        ('gte', 'Greater Than or Equal'),
        ('lt', 'Less Than'),
        ('lte', 'Less Than or Equal'),
        ('eq', 'Equal'),
        ('ne', 'Not Equal'),
        ('contains', 'Contains'),
        ('not_contains', 'Does Not Contain'),
        ('regex', 'Regex Match'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    rule_type = models.CharField(max_length=50, choices=RULE_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='medium')

    # Rule conditions
    field = models.CharField(max_length=100)  # e.g., 'amount', 'transaction_count', 'location'
    operator = models.CharField(max_length=20, choices=OPERATORS)
    value = models.CharField(max_length=255)  # Threshold value or pattern
    additional_conditions = models.JSONField(default=dict, blank=True)  # Complex conditions

    # Configuration
    is_active = models.BooleanField(default=True)
    auto_block = models.BooleanField(default=False)  # Automatically block transaction
    require_approval = models.BooleanField(default=True)  # Require manual approval
    escalation_threshold = models.PositiveIntegerField(default=1)  # Number of triggers before escalation

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_fraud_rules')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_triggered = models.DateTimeField(null=True, blank=True)

    # Statistics
    trigger_count = models.PositiveIntegerField(default=0)
    false_positive_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rule_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.severity})"

    def evaluate(self, transaction_data):
        """
        Evaluate the rule against transaction data.
        Returns (triggered, score, details)
        """
        try:
            field_value = self._get_field_value(transaction_data)
            if field_value is None:
                return False, 0, "Field not found in transaction data"

            triggered = self._check_condition(field_value)
            score = self._calculate_score(triggered)

            details = {
                'rule_name': self.name,
                'field': self.field,
                'operator': self.operator,
                'expected_value': self.value,
                'actual_value': str(field_value),
                'triggered': triggered
            }

            if triggered:
                self.trigger_count += 1
                self.last_triggered = timezone.now()
                self.save(update_fields=['trigger_count', 'last_triggered'])

            return triggered, score, details

        except Exception as e:
            return False, 0, f"Rule evaluation error: {str(e)}"

    def _get_field_value(self, transaction_data):
        """Extract field value from transaction data."""
        if isinstance(transaction_data, dict):
            return transaction_data.get(self.field)

        # If it's a Transaction object
        if hasattr(transaction_data, self.field):
            return getattr(transaction_data, self.field)

        return None

    def _check_condition(self, field_value):
        """Check if the condition is met."""
        try:
            if self.operator == 'gt':
                return Decimal(str(field_value)) > Decimal(str(self.value))
            elif self.operator == 'gte':
                return Decimal(str(field_value)) >= Decimal(str(self.value))
            elif self.operator == 'lt':
                return Decimal(str(field_value)) < Decimal(str(self.value))
            elif self.operator == 'lte':
                return Decimal(str(field_value)) <= Decimal(str(self.value))
            elif self.operator == 'eq':
                return str(field_value) == str(self.value)
            elif self.operator == 'ne':
                return str(field_value) != str(self.value)
            elif self.operator == 'contains':
                return str(self.value).lower() in str(field_value).lower()
            elif self.operator == 'not_contains':
                return str(self.value).lower() not in str(field_value).lower()
            elif self.operator == 'regex':
                import re
                return bool(re.search(str(self.value), str(field_value)))
        except (ValueError, TypeError):
            return False

        return False

    def _calculate_score(self, triggered):
        """Calculate fraud score based on severity and trigger status."""
        if not triggered:
            return 0

        severity_scores = {
            'low': 25,
            'medium': 50,
            'high': 75,
            'critical': 100
        }

        return severity_scores.get(self.severity, 50)


class FraudAlert(models.Model):
    """Alerts generated when fraud rules are triggered."""

    ALERT_TYPES = [
        ('transaction', 'Transaction Alert'),
        ('account', 'Account Alert'),
        ('user', 'User Alert'),
        ('system', 'System Alert'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
        ('escalated', 'Escalated'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')

    # Related entities
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='fraud_alerts')

    # Alert details
    title = models.CharField(max_length=255)
    description = models.TextField()
    fraud_score = models.PositiveIntegerField(default=0)  # 0-100
    risk_level = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')

    # Rule information
    triggered_rules = models.ManyToManyField(FraudRule, related_name='alerts')
    rule_details = models.JSONField(default=dict)  # Detailed rule evaluation results

    # Context data
    transaction_data = models.JSONField(default=dict)  # Snapshot of transaction data
    account_data = models.JSONField(default=dict)  # Snapshot of account data
    user_data = models.JSONField(default=dict)  # Snapshot of user data

    # Investigation
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_alerts')
    investigation_notes = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    resolution_action = models.CharField(max_length=100, blank=True)  # e.g., 'blocked', 'approved', 'monitored'

    # Escalation
    escalated_at = models.DateTimeField(null=True, blank=True)
    escalated_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_alerts')

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    source_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    location_data = models.JSONField(default=dict)  # Geolocation data

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['alert_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['fraud_score']),
        ]

    def __str__(self):
        return f"{self.title} ({self.priority} - {self.status})"

    def assign_to(self, user):
        """Assign alert to a user for investigation."""
        self.assigned_to = user
        self.status = 'investigating'
        self.save()




class FraudCase(models.Model):
    """Comprehensive case management for fraud investigations."""

    CASE_TYPES = [
        ('transaction_fraud', 'Transaction Fraud'),
        ('account_takeover', 'Account Takeover'),
        ('identity_theft', 'Identity Theft'),
        ('money_laundering', 'Money Laundering'),
        ('internal_fraud', 'Internal Fraud'),
        ('system_compromise', 'System Compromise'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('pending_review', 'Pending Review'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    RESOLUTION_TYPES = [
        ('confirmed_fraud', 'Confirmed Fraud'),
        ('false_positive', 'False Positive'),
        ('unable_to_determine', 'Unable to Determine'),
        ('prevented_loss', 'Loss Prevented'),
        ('recovered_funds', 'Funds Recovered'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_number = models.CharField(max_length=50, unique=True)
    case_type = models.CharField(max_length=50, choices=CASE_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    # Related entities
    primary_transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
    primary_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    primary_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='fraud_cases')

    # Case details
    title = models.CharField(max_length=255)
    description = models.TextField()
    summary = models.TextField(blank=True)

    # Investigation team
    assigned_investigator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_cases')
    supervisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_cases')

    # Related alerts and transactions
    related_alerts = models.ManyToManyField(FraudAlert, related_name='cases', blank=True)
    related_transactions = models.ManyToManyField(Transaction, related_name='fraud_cases', blank=True)

    # Financial impact
    estimated_loss = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    actual_loss = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    recovered_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Investigation details
    investigation_notes = models.TextField(blank=True)
    evidence = models.JSONField(default=list)  # List of evidence files/URLs
    timeline = models.JSONField(default=list)  # Chronological events

    # Resolution
    resolution_type = models.CharField(max_length=50, choices=RESOLUTION_TYPES, blank=True)
    resolution_details = models.TextField(blank=True)
    resolution_date = models.DateTimeField(null=True, blank=True)

    # Escalation
    escalated_at = models.DateTimeField(null=True, blank=True)
    escalated_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_cases')
    escalation_reason = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_cases')
    tags = models.JSONField(default=list)  # Case tags for categorization

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['case_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['case_number']),
        ]

    def __str__(self):
        return f"Case {self.case_number}: {self.title}"

    def save(self, *args, **kwargs):
        if not self.case_number:
            # Generate case number: FRAUD-YYYY-NNNN
            year = timezone.now().year
            # Get next case number for the year
            existing_cases = FraudCase.objects.filter(
                case_number__startswith=f'FRAUD-{year}-'
            ).count()
            self.case_number = "04d"
        super().save(*args, **kwargs)

    def assign_investigator(self, investigator):
        """Assign case to an investigator."""
        self.assigned_investigator = investigator
        self.status = 'investigating'
        self.save()

    def close_case(self, resolution_type, resolution_details):
        """Close the fraud case."""
        self.status = 'closed'
        self.resolution_type = resolution_type
        self.resolution_details = resolution_details
        self.closed_at = timezone.now()
        self.save()

    def escalate(self, escalated_to, reason):
        """Escalate the case."""
        self.status = 'escalated'
        self.escalated_at = timezone.now()
        self.escalated_to = escalated_to
        self.escalation_reason = reason
        self.save()

    def add_evidence(self, evidence_type, evidence_data, added_by):
        """Add evidence to the case."""
        evidence_entry = {
            'id': str(uuid.uuid4()),
            'type': evidence_type,
            'data': evidence_data,
            'added_by': str(added_by.id),
            'added_at': timezone.now().isoformat(),
        }
        self.evidence.append(evidence_entry)
        self.save()

    def add_timeline_event(self, event_type, description, user=None):
        """Add an event to the case timeline."""
        timeline_entry = {
            'id': str(uuid.uuid4()),
            'type': event_type,
            'description': description,
            'timestamp': timezone.now().isoformat(),
            'user': str(user.id) if user else None,
        }
        self.timeline.append(timeline_entry)
        self.save()


class FraudPattern(models.Model):
    """Learned patterns for fraud detection."""

    PATTERN_TYPES = [
        ('transaction_velocity', 'Transaction Velocity'),
        ('amount_pattern', 'Amount Pattern'),
        ('location_pattern', 'Location Pattern'),
        ('time_pattern', 'Time Pattern'),
        ('behavioral', 'Behavioral Pattern'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pattern_type = models.CharField(max_length=50, choices=PATTERN_TYPES)
    name = models.CharField(max_length=255)
    description = models.TextField()

    # Pattern definition
    conditions = models.JSONField()  # Pattern matching conditions
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))

    # Statistics
    total_occurrences = models.PositiveIntegerField(default=0)
    fraud_occurrences = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-confidence_score']
        unique_together = ['pattern_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.confidence_score:.2%})"

    def update_statistics(self, was_fraud=False):
        """Update pattern statistics."""
        self.total_occurrences += 1
        if was_fraud:
            self.fraud_occurrences += 1

        # Recalculate confidence score
        if self.total_occurrences > 0:
            self.confidence_score = Decimal(str(self.fraud_occurrences)) / Decimal(str(self.total_occurrences))

        self.save()
