from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone


class Account(models.Model):
    ACCOUNT_TYPES = [
        ('daily_susu', 'Daily Savings'),
        ('member_savings', 'Member Savings'),
        ('youth_savings', 'Youth Savings'),
        ('shares', 'Shares'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    account_number = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=25, choices=ACCOUNT_TYPES, default='daily_susu')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.account_number} ({self.account_type})"
    
    @property
    def calculated_balance(self):
        """Calculate balance dynamically from completed transactions."""
        from django.db.models import Sum
        
        # Deposits (money coming in)
        deposits = self.incoming_transactions.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Withdrawals (money going out)
        withdrawals = self.outgoing_transactions.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        return deposits - withdrawals
    
    def update_balance_from_transactions(self):
        """Update the stored balance field from transactions."""
        self.balance = self.calculated_balance
        self.save(update_fields=['balance', 'updated_at'])


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
        ('payment', 'Payment'),
        ('fee', 'Fee'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    from_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='outgoing_transactions', null=True, blank=True)
    to_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='incoming_transactions', null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    timestamp = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} ({self.status})"


class Loan(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('paid_off', 'Paid Off'),
        ('defaulted', 'Defaulted'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loans')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Annual interest rate
    term_months = models.PositiveIntegerField()  # Loan term in months
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Loan {self.id} - {self.user.username} - {self.amount} ({self.status})"


class FraudAlert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fraud_alerts')
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Fraud Alert - {self.user.username} ({self.severity})"


class BankingMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='banking_messages')
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    thread_id = models.CharField(max_length=100, blank=True, null=True)  # For grouping messages in threads
    parent_message = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message to {self.user.username}: {self.subject}"

    def save(self, *args, **kwargs):
        # Auto-generate thread_id if not provided
        if not self.thread_id:
            if self.parent_message:
                self.thread_id = self.parent_message.thread_id
            else:
                # Generate a unique thread ID
                import uuid
                self.thread_id = str(uuid.uuid4())[:8]
        super().save(*args, **kwargs)


class ServiceCharge(models.Model):
    """Model for configurable service charges."""
    CHARGE_TYPES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    charge_type = models.CharField(max_length=20, choices=CHARGE_TYPES, default='fixed')
    rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount or Percentage")
    applicable_to = models.JSONField(default=list, help_text="List of account types/services this applies to")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.charge_type}: {self.rate})"

class ServiceRequest(models.Model):
    """Service requests from customers (statements, checkbooks, cards, etc.)."""
    REQUEST_TYPES = [
        ('statement', 'Account Statement'),
        ('checkbook', 'Cheque Book'),
        ('card_replacement', 'Card Replacement'),
        ('account_closure', 'Account Closure'),
        ('address_change', 'Address Change'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    DELIVERY_METHODS = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('pickup', 'Branch Pickup'),
        ('mail', 'Postal Mail'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_requests')
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPES)
    description = models.TextField(blank=True)
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS, default='email')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='processed_requests'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Service Request'
        verbose_name_plural = 'Service Requests'

    def __str__(self):
        return f"{self.user.email} - {self.request_type} ({self.status})"


class Refund(models.Model):
    """Refund requests from customers."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
    ]

    REASON_CHOICES = [
        ('duplicate_charge', 'Duplicate Charge'),
        ('unauthorized', 'Unauthorized Transaction'),
        ('service_issue', 'Service Issue'),
        ('product_return', 'Product Return'),
        ('billing_error', 'Billing Error'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='refunds')
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='refunds')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Refund'
        verbose_name_plural = 'Refunds'

    def __str__(self):
        return f"Refund #{self.id} - {self.user.email} ({self.status})"


class Complaint(models.Model):
    """Customer complaints."""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    CATEGORY_CHOICES = [
        ('account', 'Account Issues'),
        ('transaction', 'Transaction Issues'),
        ('service', 'Service Quality'),
        ('staff', 'Staff Behavior'),
        ('technical', 'Technical Issues'),
        ('fees', 'Fees and Charges'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    resolution = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints'
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_complaints'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'

    def __str__(self):
        return f"Complaint #{self.id} - {self.subject} ({self.status})"


class AccountOpeningRequest(models.Model):
    """Model for storing account opening requests with customer information and photo."""
    
    ACCOUNT_TYPES = [
        ('daily_susu', 'Daily Susu'),
        ('shares', 'Shares'),
        ('monthly_contribution', 'Monthly Contribution'),
    ]
    
    CARD_TYPES = [
        ('standard', 'Standard Card'),
        ('gold', 'Gold Card'),
        ('platinum', 'Platinum Card'),
        ('none', 'No Card Required'),
    ]
    
    ID_TYPES = [
        ('ghana_card', 'Ghana Card'),
        ('voter_id', 'Voter ID'),
        ('passport', 'Passport'),
        ('drivers_license', "Driver's License"),
        ('nhis_card', 'NHIS Card'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    # Account Details
    account_type = models.CharField(max_length=25, choices=ACCOUNT_TYPES, default='daily_susu')
    card_type = models.CharField(max_length=20, choices=CARD_TYPES, default='standard')
    
    # ID Information
    id_type = models.CharField(max_length=20, choices=ID_TYPES, default='ghana_card')
    id_number = models.CharField(max_length=50, blank=True)
    
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    
    # Photo (stored as base64 or file path)
    photo = models.TextField(blank=True, null=True, help_text="Base64 encoded photo or file path")
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='processed_account_openings'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='submitted_account_openings'
    )
    
    # Related Account (created after approval)
    created_account = models.ForeignKey(
        Account, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='opening_request'
    )
    
    # Notes
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Account Opening Request'
        verbose_name_plural = 'Account Opening Requests'
    
    def __str__(self):
        return f"Account Opening #{self.id} - {self.first_name} {self.last_name} ({self.status})"


class AccountClosureRequest(models.Model):
    """Model for storing account closure requests with OTP verification."""
    
    CLOSURE_REASONS = [
        ('customer_request', 'Customer Request'),
        ('account_inactive', 'Account Inactive'),
        ('fraud_suspected', 'Fraud Suspected'),
        ('compliance', 'Compliance Issue'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    # Account being closed
    account = models.ForeignKey(
        Account, 
        on_delete=models.CASCADE, 
        related_name='closure_requests'
    )
    
    # Closure Details
    closure_reason = models.CharField(max_length=30, choices=CLOSURE_REASONS)
    other_reason = models.TextField(blank=True)
    
    # Customer verification
    phone_number = models.CharField(max_length=20)
    otp_verified = models.BooleanField(default=False)
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='processed_account_closures'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='submitted_account_closures'
    )
    
    # Notes
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Account balance at closure
    final_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Account Closure Request'
        verbose_name_plural = 'Account Closure Requests'
    
    def __str__(self):
        return f"Account Closure #{self.id} - Account {self.account.account_number} ({self.status})"


class MessageThread(models.Model):
    """Model for message threads/conversations."""
    
    THREAD_TYPES = [
        ('staff_to_staff', 'Staff to Staff'),
        ('staff_to_customer', 'Staff to Customer'),
        ('broadcast', 'Broadcast'),
        ('system', 'System Notification'),
    ]
    
    subject = models.CharField(max_length=255)
    thread_type = models.CharField(max_length=20, choices=THREAD_TYPES, default='staff_to_staff')
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='message_threads'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_threads'
    )
    is_archived = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-last_message_at', '-created_at']
        verbose_name = 'Message Thread'
        verbose_name_plural = 'Message Threads'
    
    def __str__(self):
        return f"Thread: {self.subject[:50]}"
    
    @property
    def message_count(self):
        return self.messages.count()
    
    @property
    def last_message(self):
        return self.messages.order_by('-created_at').first()


class Message(models.Model):
    """Model for individual messages within a thread."""
    
    thread = models.ForeignKey(
        MessageThread, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True, null=True)
    encrypted_content = models.TextField(blank=True, null=True)
    iv = models.CharField(max_length=255, blank=True, null=True)
    auth_tag = models.CharField(max_length=255, blank=True, null=True)
    message_type = models.CharField(max_length=50, default='text')
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='read_messages',
        blank=True
    )
    is_system_message = models.BooleanField(default=False)
    attachment_url = models.URLField(blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    reactions = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
    
    def __str__(self):
        sender_name = self.sender.get_full_name() if self.sender else 'System'
        return f"Message from {sender_name}: {self.content[:50]}..."
    
    def mark_as_read(self, user):
        """Mark message as read by user."""
        if user not in self.read_by.all():
            self.read_by.add(user)
    
    @property
    def is_read(self):
        """Check if message has been read by at least one person."""
        return self.read_by.exists()


class Device(models.Model):
    """Model for registered devices for push notifications."""
    
    DEVICE_TYPES = [
        ('web', 'Web Browser'),
        ('android', 'Android'),
        ('ios', 'iOS'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='devices'
    )
    device_token = models.CharField(max_length=500)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default='web')
    device_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-last_used_at']
        verbose_name = 'Device'
        verbose_name_plural = 'Devices'
        unique_together = ['user', 'device_token']
    
    def __str__(self):
        return f"{self.user.email} - {self.device_type} ({self.device_name or 'Unknown'})"


# ============================================
# CASHIER DASHBOARD MODELS
# ============================================

class CashAdvance(models.Model):
    """Cash advance requests from staff members."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
        ('repaid', 'Repaid'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='cash_advances'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_cash_advances'
    )
    repayment_date = models.DateField(null=True, blank=True)
    repaid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cash Advance'
        verbose_name_plural = 'Cash Advances'
    
    def __str__(self):
        return f"Cash Advance: {self.user.email} - {self.amount} ({self.status})"


class CashDrawer(models.Model):
    """Physical cash drawer management for cashiers."""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('reconciled', 'Reconciled'),
    ]
    
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='cash_drawers'
    )
    drawer_number = models.CharField(max_length=20)
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2)
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expected_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-opened_at']
        verbose_name = 'Cash Drawer'
        verbose_name_plural = 'Cash Drawers'
    
    def __str__(self):
        return f"Drawer {self.drawer_number} - {self.cashier.email} ({self.status})"


class CashDrawerDenomination(models.Model):
    """Denomination breakdown for cash drawer reconciliation."""
    cash_drawer = models.ForeignKey(
        CashDrawer, 
        on_delete=models.CASCADE, 
        related_name='denominations'
    )
    denomination = models.DecimalField(max_digits=10, decimal_places=2)  # e.g., 100.00, 50.00, 0.50
    count = models.PositiveIntegerField(default=0)
    is_opening = models.BooleanField(default=True)  # True for opening, False for closing
    
    class Meta:
        ordering = ['-denomination']
        verbose_name = 'Denomination'
        verbose_name_plural = 'Denominations'
    
    @property
    def total(self):
        return self.denomination * self.count
    
    def __str__(self):
        return f"₵{self.denomination} x {self.count} = ₵{self.total}"


class CheckDeposit(models.Model):
    """Check deposit processing and tracking."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cleared', 'Cleared'),
    ]
    
    account = models.ForeignKey(
        Account, 
        on_delete=models.CASCADE, 
        related_name='check_deposits'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    check_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=100)
    routing_number = models.CharField(max_length=20, blank=True)
    front_image = models.ImageField(upload_to='check_deposits/front/', null=True, blank=True)
    back_image = models.ImageField(upload_to='check_deposits/back/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='processed_check_deposits'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    cleared_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Check Deposit'
        verbose_name_plural = 'Check Deposits'
    
    def __str__(self):
        return f"Check #{self.check_number} - {self.amount} ({self.status})"


class Product(models.Model):
    """Bank products (savings accounts, loans, insurance, etc.)."""
    PRODUCT_TYPES = [
        ('savings', 'Savings Account'),
        ('loan', 'Loan'),
        ('insurance', 'Insurance'),
        ('investment', 'Investment'),
        ('susu', 'Susu Account'),
    ]
    
    name = models.CharField(max_length=100)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES)
    description = models.TextField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    minimum_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    maximum_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    features = models.JSONField(default=list, blank=True)  # List of product features
    terms_and_conditions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['product_type', 'name']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
    
    def __str__(self):
        return f"{self.name} ({self.get_product_type_display()})"


class Promotion(models.Model):
    """Special promotions and offers for customers."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bonus_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    eligible_products = models.ManyToManyField(Product, blank=True, related_name='promotions')
    terms_and_conditions = models.TextField(blank=True)
    max_enrollments = models.PositiveIntegerField(null=True, blank=True)
    current_enrollments = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Promotion'
        verbose_name_plural = 'Promotions'
    
    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"
    
    @property
    def is_currently_active(self):
        from django.utils import timezone
        today = timezone.now().date()
        return self.is_active and self.start_date <= today <= self.end_date


class ReportTemplate(models.Model):
    """Templates for generating reports."""
    REPORT_TYPES = [
        ('transaction', 'Transaction Report'),
        ('account', 'Account Report'),
        ('fraud', 'Fraud Report'),
        ('compliance', 'Compliance Report'),
        ('financial', 'Financial Report'),
        ('audit', 'Audit Report'),
        ('performance', 'Performance Report'),
    ]
    
    name = models.CharField(max_length=100)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    description = models.TextField(blank=True)
    default_parameters = models.JSONField(default=dict, blank=True)
    sql_template = models.TextField(blank=True)  # For complex custom reports
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['report_type', 'name']
        verbose_name = 'Report Template'
        verbose_name_plural = 'Report Templates'
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"


class Report(models.Model):
    """Generated reports from templates."""
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('csv', 'CSV'),
        ('docx', 'Word Document'),
        ('xlsx', 'Excel'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    template = models.ForeignKey(
        ReportTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='generated_reports'
    )
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_url = models.URLField(blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)  # In bytes
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='generated_reports'
    )
    parameters = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
    
    def __str__(self):
        return f"{self.title} ({self.status})"


class ReportSchedule(models.Model):
    """Scheduled report generation."""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]
    
    template = models.ForeignKey(
        ReportTemplate, 
        on_delete=models.CASCADE, 
        related_name='schedules'
    )
    name = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    day_of_week = models.PositiveSmallIntegerField(null=True, blank=True)  # 0=Monday, 6=Sunday
    day_of_month = models.PositiveSmallIntegerField(null=True, blank=True)
    time_of_day = models.TimeField()
    format = models.CharField(max_length=10, default='pdf')
    parameters = models.JSONField(default=dict, blank=True)
    email_recipients = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='report_schedules'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Report Schedule'
        verbose_name_plural = 'Report Schedules'
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"


class PerformanceMetric(models.Model):
    """System performance metrics for monitoring."""
    METRIC_TYPES = [
        ('response_time', 'Response Time'),
        ('cpu_usage', 'CPU Usage'),
        ('memory_usage', 'Memory Usage'),
        ('disk_usage', 'Disk Usage'),
        ('request_count', 'Request Count'),
        ('error_rate', 'Error Rate'),
        ('transaction_volume', 'Transaction Volume'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    value = models.DecimalField(max_digits=15, decimal_places=4)
    unit = models.CharField(max_length=20)  # ms, %, bytes, count, etc.
    endpoint = models.CharField(max_length=200, blank=True)  # For response time metrics
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-recorded_at']
        verbose_name = 'Performance Metric'
        verbose_name_plural = 'Performance Metrics'
        indexes = [
            models.Index(fields=['metric_type', 'recorded_at']),
        ]
    
    def __str__(self):
        return f"{self.get_metric_type_display()}: {self.value} {self.unit}"


class SystemHealth(models.Model):
    """System health status snapshots."""
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('degraded', 'Degraded'),
        ('unhealthy', 'Unhealthy'),
    ]
    
    service_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='healthy')
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-checked_at']
        verbose_name = 'System Health'
        verbose_name_plural = 'System Health Records'
    
    def __str__(self):
        return f"{self.service_name}: {self.status}"


class UserMessagePreferences(models.Model):
    """User preferences for messaging features."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_preferences')
    
    # Sound & Notifications
    sound_enabled = models.BooleanField(default=True)
    notification_sound = models.CharField(max_length=50, default='default', choices=[
        ('default', 'Default'),
        ('chime', 'Chime'),
        ('ding', 'Ding'),
        ('bell', 'Bell'),
        ('none', 'Silent')
    ])
    
    # Privacy Settings
    read_receipts_enabled = models.BooleanField(default=True)
    typing_indicators_enabled = models.BooleanField(default=True)
    last_seen_visible = models.BooleanField(default=True)
    
    # Auto-delete
    auto_delete_enabled = models.BooleanField(default=False)
    auto_delete_days = models.IntegerField(default=30, choices=[
        (1, '24 Hours'),
        (7, '7 Days'),
        (30, '30 Days'),
        (90, '90 Days'),
        (365, 'Never')
    ])
    
    # Message Formatting
    markdown_enabled = models.BooleanField(default=True)
    emoji_shortcuts_enabled = models.BooleanField(default=True)
    font_size = models.CharField(max_length=10, default='medium', choices=[
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large')
    ])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Message Preferences'
        verbose_name_plural = 'User Message Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.username}"


class BlockedUser(models.Model):
    """Blocked users in messaging system."""
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='blocked_users', on_delete=models.CASCADE)
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='blocked_by', on_delete=models.CASCADE)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('blocker', 'blocked')
        ordering = ['-created_at']
        verbose_name = 'Blocked User'
        verbose_name_plural = 'Blocked Users'
    
    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"

class Expense(models.Model):
    """Model for tracking operational expenses."""
    CATEGORY_CHOICES = [
        ('Operational', 'Operational'),
        ('Utilities', 'Utilities'),
        ('Payroll', 'Payroll'),
        ('Maintenance', 'Maintenance'),
        ('Marketing', 'Marketing'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Operational')
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='expense')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"

class VisitSchedule(models.Model):
    """Model for scheduling mobile banker visits."""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('missed', 'Missed'),
    ]

    mobile_banker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='visit_schedules')
    client_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visit to {self.client_name} by {self.mobile_banker.username} on {self.scheduled_time}"

class OperationsMessage(models.Model):
    """Model for messages between operations and staff."""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_ops_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_ops_messages', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.priority}"


class ClientAssignment(models.Model):
    """Track which clients are assigned to mobile bankers for field visits."""
    STATUS_CHOICES = [
        ('pending', 'Pending Visit'),
        ('due_payment', 'Due Payment'),
        ('overdue_payment', 'Overdue Payment'),
        ('loan_application', 'Loan Application'),
        ('account_opening', 'Account Opening'),
        ('follow_up', 'Follow Up'),
        ('completed', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    mobile_banker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='assigned_clients',
        limit_choices_to={'role': 'mobile_banker'}
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='assigned_to_bankers'
    )
    client_name = models.CharField(max_length=200, blank=True)  # Cached for display
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    amount_due = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    next_visit = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'next_visit']
        verbose_name = 'Client Assignment'
        verbose_name_plural = 'Client Assignments'
        unique_together = ['mobile_banker', 'client']

    def __str__(self):
        return f"{self.client_name or self.client.email} assigned to {self.mobile_banker.email}"
    
    def save(self, *args, **kwargs):
        if not self.client_name and self.client:
            self.client_name = f"{self.client.first_name} {self.client.last_name}".strip() or self.client.email
        super().save(*args, **kwargs)


class Payslip(models.Model):
    """Staff payslips stored in database with PDF attachments."""
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='payslips',
        limit_choices_to={'role__in': ['manager', 'operations_manager', 'cashier', 'mobile_banker']}
    )
    month = models.IntegerField()
    year = models.IntegerField()
    pay_period_start = models.DateField()
    pay_period_end = models.DateField()
    
    # Earnings
    base_pay = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    bonuses = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Deductions
    ssnit_contribution = models.DecimalField(max_digits=12, decimal_places=2)  # 5.5% employee
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Net
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # PDF storage
    pdf_file = models.FileField(upload_to='payslips/', null=True, blank=True)
    
    # Metadata
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='generated_payslips'
    )
    notes = models.TextField(blank=True)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['staff', 'month', 'year']
        ordering = ['-year', '-month']
        verbose_name = 'Payslip'
        verbose_name_plural = 'Payslips'
    
    def __str__(self):
        return f"Payslip for {self.staff.get_full_name()} - {self.month}/{self.year}"
    
    def get_month_display(self):
        """Return month name."""
        import calendar
        return calendar.month_name[self.month]
    
    def save(self, *args, **kwargs):
        # Calculate gross pay
        self.gross_pay = self.base_pay + self.allowances + self.overtime_pay + self.bonuses
        # Calculate SSNIT (13.5% contribution)
        self.ssnit_contribution = self.base_pay * Decimal('0.135')
        # Calculate total deductions
        self.total_deductions = self.ssnit_contribution + self.tax_deduction + self.other_deductions
        # Calculate net salary
        self.net_salary = self.gross_pay - self.total_deductions
        super().save(*args, **kwargs)


class AccountStatement(models.Model):
    """Auto-generated account statements for customers."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generated', 'Generated'),
        ('failed', 'Failed'),
    ]
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='statements')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='requested_statements'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pdf_file = models.FileField(upload_to='statements/', null=True, blank=True)
    transaction_count = models.IntegerField(default=0)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    closing_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Account Statement'
        verbose_name_plural = 'Account Statements'
    
    def __str__(self):
        return f"Statement for {self.account.account_number} ({self.start_date} to {self.end_date})"


# =============================================================================
# Simple Chat Models (WhatsApp-style messaging)
# =============================================================================

class ChatRoom(models.Model):
    """
    Represents a chat room - can be direct (2 users) or group (multiple users).
    """
    name = models.CharField(max_length=100, blank=True, null=True)  # Only for groups
    is_group = models.BooleanField(default=False)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.is_group:
            return f"Group: {self.name}"
        return f"Chat Room {self.id}"

    def get_display_name(self, for_user=None):
        """Get display name - group name or other member's name for DMs."""
        if self.is_group:
            return self.name or f"Group {self.id}"
        if for_user:
            other = self.members.exclude(id=for_user.id).first()
            if other:
                return f"{other.first_name} {other.last_name}".strip() or other.email
        return f"Chat {self.id}"


class ChatMessage(models.Model):
    """
    A single message in a chat room.
    """
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_chat_messages'
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"

