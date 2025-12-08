import uuid
from decimal import Decimal
from datetime import date
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils import timezone
from users.models import User
from banking_backend.utils.encryption import encrypt_field, decrypt_field


class Account(models.Model):
    """Member account (Savings, Shares, Checking)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name='accounts')
    account_number = models.CharField(max_length=20, unique=True)
    type = models.CharField(max_length=50)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, default='Active')

    def save(self, *args, **kwargs):
        # Only encrypt if not already encrypted
        if self.account_number and not self.account_number.startswith('encrypted:'):
            encrypted = encrypt_field(self.account_number)
            # Store only the encrypted content without prefix
            self.account_number = encrypted
        super().save(*args, **kwargs)

    def clean(self):
        """Validate model fields."""
        if self.balance < 0:
            raise ValidationError("Account balance cannot be negative.")

    def get_decrypted_account_number(self):
        """Get the decrypted account number."""
        if not self.account_number:
            return None
        # Check if it starts with encrypted: (legacy format)
        if self.account_number.startswith('encrypted:'):
            return decrypt_field(self.account_number[10:])  # Remove 'encrypted:' prefix
        # For new format, assume it's directly encrypted
        return decrypt_field(self.account_number)

    def __str__(self):
        try:
            decrypted_number = self.get_decrypted_account_number()
        except (ValueError, Exception):
            decrypted_number = "**** **** **** ****" if self.account_number else "unknown"
        return f"{decrypted_number} ({self.type}) - {self.owner.email if self.owner else 'no owner'}"


class Transaction(models.Model):
    """Financial transactions model."""
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
        ('loan_disbursement', 'Loan Disbursement'),
        ('loan_repayment', 'Loan Repayment'),
        ('fee', 'Fee'),
        ('interest', 'Interest'),
    ]

    TRANSACTION_CATEGORIES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
        ('loan', 'Loan'),
        ('fee', 'Fee'),
        ('other', 'Other'),
    ]

    TRANSACTION_STATUSES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    type = models.CharField(max_length=50, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    related_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='related_transactions')  # For transfers
    description = models.TextField(blank=True)

    # Enhanced fields for categorization and tracking
    category = models.CharField(max_length=20, choices=TRANSACTION_CATEGORIES, default='other')
    tags = models.JSONField(default=list, blank=True)  # List of tags for organization
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUSES, default='completed')
    reference_number = models.CharField(max_length=100, blank=True, unique=True)  # External reference

    def save(self, *args, **kwargs):
        # Auto-set category based on transaction type
        if not self.category or self.category == 'other':
            self.category = self._get_default_category()

        # Generate reference number if not provided
        if not self.reference_number:
            self.reference_number = f"TXN-{self.id.hex[:8].upper()}"

        super().save(*args, **kwargs)

    def _get_default_category(self):
        """Determine default category based on transaction type."""
        category_mapping = {
            'deposit': 'income',
            'withdrawal': 'expense',
            'transfer': 'transfer',
            'loan_disbursement': 'loan',
            'loan_repayment': 'loan',
            'fee': 'fee',
            'interest': 'income',
        }
        return category_mapping.get(self.type, 'other')

    def __str__(self):
        return f"{self.type} of {self.amount:.2f} on {self.timestamp.strftime('%Y-%m-%d')}"


class KYCApplication(models.Model):
    """KYC application for new members,  # submitted by Mobile Bankers."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Pending Review')
    # Stores URLs to uploaded KYC documents (in S3/Cloud Storage)
    documents = models.JSONField()
    geotag = models.CharField(max_length=100)  # e.g., "40.7128, -74.0060"
    submitted_by = models.ForeignKey(User, on_delete=models.PROTECT)

    def __str__(self):
        return f"KYC for {self.applicant_name} ({self.status})"


class AccountOpening(models.Model):
    """Account opening application with identity verification."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('identity_verification', 'Identity Verification'),
        ('document_review', 'Document Review'),
        ('compliance_check', 'Compliance Check'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    ACCOUNT_TYPES = [
        ('savings', 'Savings Account'),
        ('checking', 'Checking Account'),
        ('business', 'Business Account'),
        ('joint', 'Joint Account'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(User, on_delete=models.PROTECT, related_name='account_openings')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='draft')

    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=100)
    address = models.TextField()
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()

    # Identity Verification
    identity_verified = models.BooleanField(default=False)
    identity_verified_at = models.DateTimeField(null=True, blank=True)
    identity_verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='identity_verifications')

    # Documents
    documents = models.JSONField(default=dict)  # URLs to uploaded documents
    document_verified = models.BooleanField(default=False)
    document_verified_at = models.DateTimeField(null=True, blank=True)
    document_verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='document_verifications')

    # Compliance and Regulatory
    compliance_checked = models.BooleanField(default=False)
    compliance_checked_at = models.DateTimeField(null=True, blank=True)
    compliance_checked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='compliance_checks')
    risk_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    regulatory_flags = models.JSONField(default=dict)

    # Approval Workflow
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='account_reviews')
    approval_notes = models.TextField(blank=True)

    # Account Creation
    account_created = models.BooleanField(default=False)
    account = models.OneToOneField(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='opening_application')

    # Audit
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['applicant']),
            models.Index(fields=['identity_verified']),
            models.Index(fields=['compliance_checked']),
        ]

    def __str__(self):
        return f"Account Opening - {self.first_name} {self.last_name} ({self.status})"

    def submit_application(self):
        """Submit the application for review."""
        if self.status == 'draft':
            self.status = 'submitted'
            self.submitted_at = timezone.now()
            self.save()

    def start_identity_verification(self):
        """Move to identity verification stage."""
        if self.status in ['submitted', 'under_review']:
            self.status = 'identity_verification'
            self.save()

    def complete_identity_verification(self, verifier):
        """Complete identity verification."""
        self.identity_verified = True
        self.identity_verified_at = timezone.now()
        self.identity_verified_by = verifier
        self.status = 'document_review'
        self.save()

    def complete_document_review(self, reviewer):
        """Complete document review."""
        self.document_verified = True
        self.document_verified_at = timezone.now()
        self.document_verified_by = reviewer
        self.status = 'compliance_check'
        self.save()

    def complete_compliance_check(self, compliance_officer):
        """Complete compliance check."""
        self.compliance_checked = True
        self.compliance_checked_at = timezone.now()
        self.compliance_checked_by = compliance_officer
        # Determine next status based on risk score
        if self.risk_score and self.risk_score > 7.0:
            self.status = 'under_review'  # High risk needs manager review
        else:
            self.status = 'approved'
        self.save()

    def approve_application(self, approver, notes=''):
        """Approve the application."""
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = approver
        self.approval_notes = notes
        self.save()

    def reject_application(self, approver, notes=''):
        """Reject the application."""
        self.status = 'rejected'
        self.reviewed_at = timezone.now()
        self.reviewed_by = approver
        self.approval_notes = notes
        self.save()

    def create_account(self):
        """Create the actual account after approval."""
        if self.status == 'approved' and not self.account_created:
            account = Account.objects.create(
                owner=self.applicant,
                account_number=f"{self.account_type.upper()[:3]}{self.id.hex[:8]}",
                type=self.account_type,
            )
            self.account = account
            self.account_created = True
            self.save()
            return account
        return None


class IdentityVerification(models.Model):
    """Identity verification records for account opening and other operations."""
    VERIFICATION_TYPES = [
        ('account_opening', 'Account Opening'),
        ('account_update', 'Account Update'),
        ('transaction', 'High-Value Transaction'),
        ('loan_application', 'Loan Application'),
        ('manual', 'Manual Verification'),
    ]

    VERIFICATION_METHODS = [
        ('document', 'Document Verification'),
        ('biometric', 'Biometric Verification'),
        ('database', 'Database Check'),
        ('third_party', 'Third Party Verification'),
        ('manual', 'Manual Verification'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account_opening = models.ForeignKey(AccountOpening, on_delete=models.CASCADE, null=True, blank=True, related_name='identity_verifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='identity_verification_records')
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPES)
    verification_method = models.CharField(max_length=20, choices=VERIFICATION_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Verification Data
    identity_number = models.CharField(max_length=50, blank=True)  # ID number, SSN, etc.
    identity_type = models.CharField(max_length=50, blank=True)  # Passport, Driver's License, etc.
    verification_data = models.JSONField(default=dict)  # Additional verification details
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Results
    verified = models.BooleanField(default=False)
    verification_result = models.JSONField(default=dict)
    failure_reason = models.TextField(blank=True)

    # Process
    initiated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='initiated_verifications')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='performed_verifications')
    initiated_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Audit
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    geotag = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['verification_type']),
            models.Index(fields=['user']),
            models.Index(fields=['verified']),
        ]

    def __str__(self):
        return f"Identity Verification - {self.user.email} ({self.status})"

    def start_verification(self):
        """Start the verification process."""
        self.status = 'in_progress'
        self.save()

    def complete_verification(self, verifier, verified=True, result=None, failure_reason=''):
        """Complete the verification process."""
        self.status = 'completed'
        self.verified = verified
        self.verified_by = verifier
        self.completed_at = timezone.now()
        if result:
            self.verification_result = result
        if not verified:
            self.failure_reason = failure_reason
        self.save()

    def fail_verification(self, failure_reason=''):
        """Mark verification as failed."""
        self.status = 'failed'
        self.failure_reason = failure_reason
        self.completed_at = timezone.now()
        self.save()

    def is_expired(self):
        """Check if verification has expired."""
        return self.expires_at and timezone.now() > self.expires_at


class AccountClosure(models.Model):
    """Account closure requests and processing."""
    CLOSURE_REASONS = [
        ('customer_request', 'Customer Request'),
        ('fraud_suspected', 'Fraud Suspected'),
        ('deceased', 'Account Holder Deceased'),
        ('compliance', 'Compliance Violation'),
        ('inactive', 'Account Inactive'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('under_review', 'Under Review'),
        ('balance_check', 'Balance Check'),
        ('pending_settlement', 'Pending Settlement'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='closure_requests')
    requested_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='closure_requests')
    closure_reason = models.CharField(max_length=20, choices=CLOSURE_REASONS)
    other_reason = models.TextField(blank=True)  # For 'other' reason

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')

    # Balance and Settlement
    balance_at_closure = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    outstanding_loans = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    pending_transactions = models.IntegerField(default=0)
    settlement_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    settlement_method = models.CharField(max_length=50, blank=True)  # Check, transfer, cash, etc.

    # Verification and Approval
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_closures')
    verified_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_closures')
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)

    # Processing
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_closures')
    processed_at = models.DateTimeField(null=True, blank=True)
    closure_date = models.DateField(null=True, blank=True)

    # Documents
    documents = models.JSONField(default=dict)  # Supporting documents

    # Audit
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['account']),
            models.Index(fields=['requested_by']),
            models.Index(fields=['closure_reason']),
        ]

    def __str__(self):
        return f"Account Closure - {self.account.get_decrypted_account_number()} ({self.status})"

    def check_balance_and_loans(self):
        """Check account balance and outstanding loans."""
        self.balance_at_closure = self.account.balance

        # Check for outstanding loans
        outstanding_loans = Loan.objects.filter(
            account=self.account,
            status__in=['active', 'defaulted']
        ).aggregate(total=models.Sum('outstanding_balance'))['total'] or Decimal('0.00')
        self.outstanding_loans = outstanding_loans

        # Check for pending transactions
        pending_count = Transaction.objects.filter(
            account=self.account,
            status='pending'
        ).count()
        self.pending_transactions = pending_count

        # Calculate settlement amount
        if self.balance_at_closure > 0:
            self.settlement_amount = self.balance_at_closure
        else:
            self.settlement_amount = Decimal('0.00')

        self.status = 'balance_check'
        self.save()

    def approve_closure(self, approver, notes=''):
        """Approve the account closure."""
        if self.status in ['balance_check', 'under_review']:
            self.status = 'approved'
            self.approved_by = approver
            self.approved_at = timezone.now()
            self.approval_notes = notes
            self.save()

    def reject_closure(self, approver, notes=''):
        """Reject the account closure."""
        self.status = 'rejected'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.approval_notes = notes
        self.save()

    def process_closure(self, processor):
        """Process the account closure."""
        if self.status == 'approved':
            # Mark account as closed
            self.account.status = 'Closed'
            self.account.save()

            # Update closure record
            self.status = 'completed'
            self.processed_by = processor
            self.processed_at = timezone.now()
            self.closure_date = timezone.now().date()
            self.save()

            # Create audit trail
            AccountClosureAudit.objects.create(
                closure=self,
                action='closed',
                performed_by=processor,
                details={
                    'balance_at_closure': str(self.balance_at_closure),
                    'settlement_amount': str(self.settlement_amount),
                    'closure_reason': self.closure_reason
                }
            )

    def can_close_account(self):
        """Check if account can be closed."""
        # Cannot close if there are outstanding loans
        if self.outstanding_loans > 0:
            return False, "Outstanding loans must be settled first"

        # Cannot close if there are pending transactions
        if self.pending_transactions > 0:
            return False, "Pending transactions must be completed first"

        return True, "Account can be closed"


class AccountClosureAudit(models.Model):
    """Audit trail for account closure actions."""
    ACTION_CHOICES = [
        ('requested', 'Closure Requested'),
        ('verified', 'Closure Verified'),
        ('approved', 'Closure Approved'),
        ('rejected', 'Closure Rejected'),
        ('processed', 'Closure Processed'),
        ('closed', 'Account Closed'),
        ('cancelled', 'Closure Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    closure = models.ForeignKey(AccountClosure, on_delete=models.CASCADE, related_name='audit_trail')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    performed_at = models.DateTimeField(default=timezone.now)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['closure']),
            models.Index(fields=['action']),
            models.Index(fields=['performed_by']),
        ]

    def __str__(self):
        return f"Audit: {self.closure.account.get_decrypted_account_number()} - {self.action}"


class ComplianceReport(models.Model):
    """Compliance reports for regulatory requirements and account operations."""
    REPORT_TYPES = [
        ('account_opening', 'Account Opening Report'),
        ('account_closure', 'Account Closure Report'),
        ('transaction_monitoring', 'Transaction Monitoring Report'),
        ('kyc_update', 'KYC Update Report'),
        ('sanctions_check', 'Sanctions Check Report'),
        ('aml_risk', 'AML Risk Assessment Report'),
        ('regulatory_filing', 'Regulatory Filing Report'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('escalated', 'Escalated'),
        ('submitted', 'Submitted to Regulator'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(max_length=25, choices=REPORT_TYPES)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending')

    # Associated entities
    account_opening = models.ForeignKey(AccountOpening, on_delete=models.CASCADE, null=True, blank=True, related_name='compliance_reports')
    account_closure = models.ForeignKey(AccountClosure, on_delete=models.CASCADE, null=True, blank=True, related_name='compliance_reports')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True, related_name='compliance_reports')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='compliance_reports')

    # Report content
    report_data = models.JSONField(default=dict)  # Detailed report information
    risk_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    risk_level = models.CharField(max_length=20, default='low')  # low, medium, high, critical

    # Regulatory requirements
    regulatory_flags = models.JSONField(default=dict)  # Flags for regulatory attention
    sanctions_check_passed = models.BooleanField(default=False)
    pep_check_passed = models.BooleanField(default=False)  # Politically Exposed Person check
    adverse_media_check = models.BooleanField(default=False)

    # Processing
    generated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='generated_banking_reports')
    generated_at = models.DateTimeField(default=timezone.now)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reports')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    # Submission tracking
    submitted_to_regulator = models.BooleanField(default=False)
    submission_reference = models.CharField(max_length=100, blank=True)
    submission_date = models.DateTimeField(null=True, blank=True)

    # Audit
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['report_type']),
            models.Index(fields=['status']),
            models.Index(fields=['risk_level']),
            models.Index(fields=['generated_at']),
            models.Index(fields=['account_opening']),
            models.Index(fields=['account_closure']),
            models.Index(fields=['account']),
        ]

    def __str__(self):
        return f"{self.report_type} - {self.status} ({self.generated_at.date()})"

    def calculate_risk_score(self):
        """Calculate overall risk score based on various factors."""
        score = 0.0

        # Base risk factors
        if self.report_data.get('high_value_transaction', False):
            score += 2.0
        if self.report_data.get('unusual_activity', False):
            score += 1.5
        if not self.sanctions_check_passed:
            score += 3.0
        if not self.pep_check_passed:
            score += 2.5
        if self.adverse_media_check:
            score += 1.0

        # Geographic risk
        high_risk_countries = ['AF', 'KP', 'IR', 'SY', 'VE']  # Example high-risk countries
        if self.report_data.get('country_code') in high_risk_countries:
            score += 1.5

        # Transaction pattern risk
        if self.report_data.get('rapid_transactions', False):
            score += 1.0

        self.risk_score = min(score, 10.0)  # Cap at 10.0

        # Determine risk level
        if self.risk_score >= 7.0:
            self.risk_level = 'critical'
        elif self.risk_score >= 5.0:
            self.risk_level = 'high'
        elif self.risk_score >= 3.0:
            self.risk_level = 'medium'
        else:
            self.risk_level = 'low'

        self.save()

    def approve_report(self, reviewer, notes=''):
        """Approve the compliance report."""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()

    def reject_report(self, reviewer, notes=''):
        """Reject the compliance report."""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()

    def submit_to_regulator(self, submission_ref=''):
        """Mark report as submitted to regulatory authority."""
        self.status = 'submitted'
        self.submitted_to_regulator = True
        self.submission_date = timezone.now()
        if submission_ref:
            self.submission_reference = submission_ref
        self.save()

    def requires_escalation(self):
        """Check if report requires escalation based on risk level."""
        return self.risk_level in ['high', 'critical'] or len(self.regulatory_flags) > 0


class RegulatoryFiling(models.Model):
    """Regulatory filings and submissions tracking."""
    FILING_TYPES = [
        ('sar', 'Suspicious Activity Report'),
        ('ctr', 'Currency Transaction Report'),
        ('kyc_update', 'KYC Update Filing'),
        ('account_closure', 'Account Closure Filing'),
        ('annual_report', 'Annual Regulatory Report'),
        ('adverse_event', 'Adverse Event Report'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('acknowledged', 'Acknowledged'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    filing_type = models.CharField(max_length=20, choices=FILING_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Filing content
    filing_data = models.JSONField(default=dict)
    filing_reference = models.CharField(max_length=100, unique=True)
    description = models.TextField()

    # Associated records
    compliance_reports = models.ManyToManyField(ComplianceReport, related_name='regulatory_filings')
    accounts = models.ManyToManyField(Account, related_name='regulatory_filings')
    users = models.ManyToManyField(User, related_name='regulatory_filings')

    # Processing
    prepared_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='prepared_filings')
    prepared_at = models.DateTimeField(default=timezone.now)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_filings')
    submitted_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    # Regulatory response
    regulatory_reference = models.CharField(max_length=100, blank=True)
    regulatory_response = models.TextField(blank=True)
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)

    # Audit
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-prepared_at']
        indexes = [
            models.Index(fields=['filing_type']),
            models.Index(fields=['status']),
            models.Index(fields=['filing_reference']),
            models.Index(fields=['prepared_at']),
        ]

    def __str__(self):
        return f"{self.filing_type} - {self.filing_reference} ({self.status})"

    def submit_filing(self, submitter):
        """Submit the regulatory filing."""
        self.status = 'submitted'
        self.submitted_by = submitter
        self.submitted_at = timezone.now()
        self.save()

    def acknowledge_filing(self, regulatory_ref='', response=''):
        """Acknowledge receipt of filing from regulator."""
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        if regulatory_ref:
            self.regulatory_reference = regulatory_ref
        if response:
            self.regulatory_response = response
        self.save()


class Document(models.Model):
    """Document storage and management for account operations."""
    DOCUMENT_TYPES = [
        ('id_card', 'ID Card'),
        ('passport', 'Passport'),
        ('drivers_license', 'Driver\'s License'),
        ('proof_of_address', 'Proof of Address'),
        ('utility_bill', 'Utility Bill'),
        ('bank_statement', 'Bank Statement'),
        ('tax_certificate', 'Tax Certificate'),
        ('business_license', 'Business License'),
        ('signature_card', 'Signature Card'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('pending_review', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    account_opening = models.ForeignKey(AccountOpening, on_delete=models.CASCADE, null=True, blank=True, related_name='uploaded_documents')
    account_closure = models.ForeignKey(AccountClosure, on_delete=models.CASCADE, null=True, blank=True, related_name='uploaded_documents')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')

    # File information
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()  # Size in bytes
    mime_type = models.CharField(max_length=100)
    file_path = models.CharField(max_length=500)  # Path to stored file
    checksum = models.CharField(max_length=128, blank=True)  # SHA-256 checksum

    # Document metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    expiry_date = models.DateField(null=True, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    document_number = models.CharField(max_length=100, blank=True)  # ID number, etc.

    # OCR and verification data
    extracted_data = models.JSONField(default=dict, blank=True)
    verification_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fraud_flags = models.JSONField(default=dict, blank=True)

    # Review process
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='documents_uploaded')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents_reviewed')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    # Audit
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['document_type']),
            models.Index(fields=['user']),
            models.Index(fields=['account_opening']),
            models.Index(fields=['account_closure']),
            models.Index(fields=['expiry_date']),
        ]

    def __str__(self):
        return f"{self.document_type} - {self.file_name} ({self.status})"

    def is_expired(self):
        """Check if document has expired."""
        return self.expiry_date and self.expiry_date < date.today()

    def approve_document(self, reviewer, notes=''):
        """Approve the document."""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()

    def reject_document(self, reviewer, notes=''):
        """Reject the document."""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()

    def mark_for_review(self):
        """Mark document for review."""
        self.status = 'pending_review'
        self.save()


class DocumentVerification(models.Model):
    """Document verification attempts and results."""
    VERIFICATION_TYPES = [
        ('ocr', 'OCR Processing'),
        ('manual', 'Manual Verification'),
        ('third_party', 'Third Party Verification'),
        ('ai_analysis', 'AI Analysis'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='verifications')
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Verification results
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    verification_result = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)

    # Process tracking
    initiated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='verification_initiated')
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verification_completed')
    initiated_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['verification_type']),
            models.Index(fields=['document']),
        ]

    def __str__(self):
        return f"{self.verification_type} for {self.document.file_name} ({self.status})"

    def start_verification(self):
        """Start the verification process."""
        self.status = 'processing'
        self.save()

    def complete_verification(self, completer, result=None, confidence=None, error=''):
        """Complete the verification process."""
        self.status = 'completed'
        self.completed_by = completer
        self.completed_at = timezone.now()
        if result:
            self.verification_result = result
        if confidence is not None:
            self.confidence_score = confidence
        if error:
            self.error_message = error
        self.save()

    def fail_verification(self, completer, error_message=''):
        """Mark verification as failed."""
        self.status = 'failed'
        self.completed_by = completer
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.save()


class LoanApplication(models.Model):
    """Loan application submitted by members."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('under_review', 'Under Review'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(User, on_delete=models.PROTECT, related_name='loan_applications')
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    term_months = models.PositiveIntegerField()  # Loan term in months
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Annual interest rate
    purpose = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(default=timezone.now)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_loans')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)

    def __str__(self):
        return f"Loan Application by {self.applicant.email} - {self.amount_requested:.2f} ({self.status})"


class Loan(models.Model):
    """Approved loan with repayment tracking."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paid_off', 'Paid Off'),
        ('defaulted', 'Defaulted'),
        ('written_off', 'Written Off'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(LoanApplication, on_delete=models.PROTECT, related_name='loan')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='loans')
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.PositiveIntegerField()
    disbursement_date = models.DateField()
    maturity_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2)
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        if not self.maturity_date:
            # Calculate maturity date based on term
            from dateutil.relativedelta import relativedelta
            self.maturity_date = self.disbursement_date + relativedelta(months=self.term_months)
        if not self.outstanding_balance:
            self.outstanding_balance = self.principal_amount
        super().save(*args, **kwargs)

    def calculate_monthly_payment(self):
        """Calculate monthly payment using loan amortization formula."""
        if self.interest_rate == 0:
            return self.principal_amount / self.term_months

        monthly_rate = self.interest_rate / 12 / 100
        num_payments = self.term_months

        monthly_payment = (self.principal_amount * monthly_rate * (1 + monthly_rate) ** num_payments) / \
                         ((1 + monthly_rate) ** num_payments - 1)
        return monthly_payment

    def __str__(self):
        return f"Loan {self.id} - {self.principal_amount} ({self.status})"


class LoanRepayment(models.Model):
    """Individual loan repayment transactions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.PROTECT, related_name='repayments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    principal_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    interest_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    payment_date = models.DateField(default=date.today)
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True)

    def save(self, *args, **kwargs):
        from django.db import transaction as db_transaction
        
        with db_transaction.atomic():
            # Always lock the loan row for update to prevent race conditions
            loan = Loan.objects.select_for_update().get(pk=self.loan.pk)
            
            # Re-check balance in transaction context to prevent race conditions
            if self.amount > 0:
                # For positive amounts (payments),  # check account balance
                if loan.account.balance < self.amount:
                    raise ValidationError("Insufficient funds for transaction")
            
            # Calculate principal and interest portions
            if not self.principal_paid and not self.interest_paid:
                # Simple interest calculation - in production, use more sophisticated method
                accrued_interest = loan.outstanding_balance * (loan.interest_rate / 100 / 12)
                if self.amount <= accrued_interest:
                    self.interest_paid = self.amount
                    self.principal_paid = Decimal('0.00')
                else:
                    self.interest_paid = accrued_interest
                    self.principal_paid = self.amount - accrued_interest

            # Update loan outstanding balance
            loan.outstanding_balance -= self.principal_paid
            loan.total_paid += self.amount
            loan.save()
            
            # Update self.loan reference to the locked instance
            self.loan = loan

            super().save(*args, **kwargs)

    def __str__(self):
        return f"Repayment of {self.amount} on {self.payment_date}"


class InterestAccrual(models.Model):
    """Tracks interest accrual for loans."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='interest_accruals')
    accrual_date = models.DateField()
    amount_accrued = models.DecimalField(max_digits=12, decimal_places=2)
    balance_at_accrual = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ['loan', 'accrual_date']

    def __str__(self):
        return f"Interest accrual for loan {self.loan.id} on {self.accrual_date}"


class FeeStructure(models.Model):
    """Defines fee structures for different transaction types."""
    FEE_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage of Transaction'),
        ('tiered', 'Tiered Structure'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    transaction_type = models.CharField(max_length=50)  # e.g., 'withdrawal', 'transfer', 'loan_disbursement'
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    fixed_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # e.g., 0.50 for 0.5%
    min_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def calculate_fee(self, transaction_amount):
        """Calculate fee based on transaction amount."""
        if self.fee_type == 'fixed':
            return self.fixed_amount or Decimal('0.00')
        elif self.fee_type == 'percentage':
            fee = transaction_amount * (self.percentage / 100)
            if self.min_fee and fee < self.min_fee:
                return self.min_fee
            if self.max_fee and fee > self.max_fee:
                return self.max_fee
            return fee
        elif self.fee_type == 'tiered':
            # Implement tiered logic here if needed
            return Decimal('0.00')
        return Decimal('0.00')

    def __str__(self):
        return f"{self.name} - {self.transaction_type}"


class FeeTransaction(models.Model):
    """Records fee charges on transactions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    charged_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Fee of {self.amount} for transaction {self.transaction.id}"


class Branch(models.Model):
    """Branch locations for the banking system."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)  # Short code like 'MB', 'NB', etc.
    location = models.CharField(max_length=255)  # Address or location description
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_branches')
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ['name']


class CheckDeposit(models.Model):
    """Electronic check deposit processing."""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('processing', 'Processing'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='check_deposit')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # OCR extracted data
    extracted_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    extracted_account_number = models.CharField(max_length=50, blank=True)
    extracted_routing_number = models.CharField(max_length=20, blank=True)
    extracted_payee = models.CharField(max_length=255, blank=True)
    extracted_date = models.DateField(null=True, blank=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Validation and fraud detection
    fraud_flags = models.JSONField(default=dict, blank=True)
    validation_errors = models.JSONField(default=dict, blank=True)
    manual_override = models.BooleanField(default=False)

    # Processing metadata
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_check_deposits')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Check Deposit {self.id} - {self.status}"

    def is_amount_match(self):
        """Check if extracted amount matches transaction amount."""
        if self.extracted_amount and self.transaction:
            return abs(self.extracted_amount - self.transaction.amount) < 0.01
        return False

    def has_fraud_risks(self):
        """Check if deposit has fraud flags."""
        return bool(self.fraud_flags)


class CheckImage(models.Model):
    """Images associated with check deposits."""
    IMAGE_TYPES = [
        ('front', 'Front of Check'),
        ('back', 'Back of Check'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    check_deposit = models.ForeignKey(CheckDeposit, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='check_images/%Y/%m/%d/')
    image_type = models.CharField(max_length=10, choices=IMAGE_TYPES, default='front')

    # OCR processing
    ocr_data = models.JSONField(default=dict, blank=True)
    ocr_processed = models.BooleanField(default=False)
    ocr_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['check_deposit', 'image_type']

    def __str__(self):
        return f"{self.image_type} image for {self.check_deposit.id}"


class CashDrawer(models.Model):
    """Cash drawer management with denomination tracking and session control."""

    STATUS_CHOICES = [
        ('closed', 'Closed'),
        ('open', 'Open'),
        ('reconciled', 'Reconciled'),
        ('discrepancy', 'Discrepancy'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='cash_drawers')
    assigned_cashier = models.ForeignKey(User, on_delete=models.PROTECT, related_name='cash_drawers')

    # Session management
    session_start = models.DateTimeField(null=True, blank=True)
    session_end = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='closed')

    # Opening balances
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    opening_denominations = models.JSONField(default=dict, blank=True)  # e.g., {'100': 10, '50': 20, ...}

    # Current balances (calculated from transactions)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Closing balances
    closing_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    closing_denominations = models.JSONField(default=dict, blank=True)

    # Variance tracking
    expected_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    actual_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    variance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['branch', 'assigned_cashier', 'session_start']  # One drawer per cashier per session
        ordering = ['-session_start']

    def __str__(self):
        return f"Cash Drawer - {self.branch.code} - {self.assigned_cashier.email} ({self.status})"

    def open_drawer(self, opening_balance, denominations=None):
        """Open the cash drawer for a new session."""
        if self.status != 'closed':
            raise ValidationError("Cash drawer must be closed before opening.")

        self.session_start = timezone.now()
        self.opening_balance = opening_balance
        self.current_balance = opening_balance
        self.expected_balance = opening_balance
        if denominations:
            self.opening_denominations = denominations
        self.status = 'open'
        self.save()

    def close_drawer(self, closing_balance, denominations=None):
        """Close the cash drawer and calculate variance."""
        if self.status != 'open':
            raise ValidationError("Cash drawer must be open before closing.")

        self.session_end = timezone.now()
        self.closing_balance = closing_balance
        self.actual_balance = closing_balance
        if denominations:
            self.closing_denominations = denominations

        # Calculate variance
        self.variance = self.actual_balance - self.expected_balance

        # Determine status based on variance
        if abs(self.variance) < Decimal('0.01'):  # Allow for small rounding differences
            self.status = 'reconciled'
        else:
            self.status = 'discrepancy'

        self.save()

    def update_balance(self, amount):
        """Update current and expected balance after a transaction."""
        self.current_balance += amount
        self.expected_balance += amount
        self.save()

    def get_denominations_total(self, denominations):
        """Calculate total value from denomination counts."""
        total = Decimal('0.00')
        for denom, count in denominations.items():
            total += Decimal(str(denom)) * Decimal(str(count))
        return total


class CashTransaction(models.Model):
    """Cash transactions for inflows and outflows in cash drawer."""

    TRANSACTION_TYPES = [
        ('deposit', 'Cash Deposit'),
        ('withdrawal', 'Cash Withdrawal'),
        ('transfer_in', 'Transfer In'),
        ('transfer_out', 'Transfer Out'),
        ('fee_collection', 'Fee Collection'),
        ('change_fund', 'Change Fund'),
        ('opening_balance', 'Opening Balance'),
        ('closing_balance', 'Closing Balance'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cash_drawer = models.ForeignKey(CashDrawer, on_delete=models.PROTECT, related_name='transactions')
    transaction = models.OneToOneField(Transaction, on_delete=models.PROTECT, related_name='cash_transaction', null=True, blank=True)

    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)

    # Denomination breakdown for cash transactions
    denominations = models.JSONField(default=dict, blank=True)

    # Audit trail
    processed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    processed_at = models.DateTimeField(default=timezone.now)

    # Reference numbers
    reference_number = models.CharField(max_length=100, blank=True)
    external_reference = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-processed_at']

    def __str__(self):
        return f"{self.type} - {self.amount:.2f} ({self.processed_at.strftime('%Y-%m-%d %H:%M')})"

    def save(self, *args, **kwargs):
        from django.db import transaction as db_transaction

        with db_transaction.atomic():
            # Generate reference number if not provided
            if not self.reference_number:
                self.reference_number = f"CD-{self.id.hex[:8].upper()}"

            # Update cash drawer balance with race condition protection
            if self.cash_drawer.status == 'open':
                # Lock the cash drawer row to prevent race conditions
                cash_drawer = CashDrawer.objects.select_for_update().get(pk=self.cash_drawer.pk)

                # For inflows (positive impact on drawer)
                if self.type in ['deposit', 'transfer_in', 'fee_collection', 'opening_balance']:
                    cash_drawer.update_balance(self.amount)
                # For outflows (negative impact on drawer)
                elif self.type in ['withdrawal', 'transfer_out', 'closing_balance']:
                    cash_drawer.update_balance(-self.amount)
                # Change fund is neutral
                elif self.type == 'change_fund':
                    pass  # No balance impact

                # Update self reference to locked instance
                self.cash_drawer = cash_drawer

            super().save(*args, **kwargs)


class CashReconciliation(models.Model):
    """Daily cash reconciliation reports with variance analysis."""

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('escalated', 'Escalated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cash_drawer = models.OneToOneField(CashDrawer, on_delete=models.PROTECT, related_name='reconciliation')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT)

    # Reconciliation period
    reconciliation_date = models.DateField(default=date.today)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Balance summary
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2)
    expected_closing_balance = models.DecimalField(max_digits=12, decimal_places=2)
    actual_closing_balance = models.DecimalField(max_digits=12, decimal_places=2)
    variance = models.DecimalField(max_digits=12, decimal_places=2)

    # Transaction summary
    total_deposits = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_withdrawals = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_transfers_in = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_transfers_out = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_fees = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Variance analysis
    variance_reason = models.TextField(blank=True)
    variance_category = models.CharField(max_length=50, blank=True)  # e.g., 'cash_shortage', 'cash_overage', 'counting_error'
    adjustment_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Approval workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reconciliations')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    # Audit trail
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_reconciliations')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['cash_drawer', 'reconciliation_date']
        ordering = ['-reconciliation_date', '-created_at']

    def __str__(self):
        return f"Reconciliation - {self.branch.code} - {self.reconciliation_date} ({self.status})"

    def calculate_variance_percentage(self):
        """Calculate variance as a percentage of expected balance."""
        if self.expected_closing_balance == 0:
            return Decimal('0.00')
        return (self.variance / self.expected_closing_balance) * 100

    def is_within_tolerance(self, tolerance=Decimal('1.00')):
        """Check if variance is within acceptable tolerance."""
        return abs(self.variance) <= tolerance

    def approve(self, reviewer, notes=''):
        """Approve the reconciliation."""
        self.status = 'approved'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()

    def reject(self, reviewer, notes=''):
        """Reject the reconciliation."""
        self.status = 'rejected'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()

    def escalate(self, reviewer, notes=''):
        """Escalate the reconciliation for further review."""
        self.status = 'escalated'
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = notes
        self.save()


class CashAdvance(models.Model):
    """Cash advance requests and processing with approval workflows."""

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
        ('repaid', 'Repaid'),
        ('overdue', 'Overdue'),
        ('written_off', 'Written Off'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='cash_advances')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    purpose = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    # Status and workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Request details
    requested_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='cash_advance_requests')
    requested_at = models.DateTimeField(default=timezone.now)
    request_notes = models.TextField(blank=True)

    # Approval workflow
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_banking_cash_advances')
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)

    # Disbursement
    disbursed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='disbursed_cash_advances')
    disbursed_at = models.DateTimeField(null=True, blank=True)
    disbursement_transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='cash_advance')

    # Repayment terms
    repayment_due_date = models.DateField(null=True, blank=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))  # Annual rate
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Limits and controls
    daily_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    monthly_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Audit and tracking
    audit_trail = models.JSONField(default=list, blank=True)  # List of status changes with timestamps
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['account']),
            models.Index(fields=['requested_by']),
            models.Index(fields=['approved_by']),
            models.Index(fields=['repayment_due_date']),
        ]

    def __str__(self):
        return f"Cash Advance - {self.account.get_decrypted_account_number()} - {self.amount:.2f} ({self.status})"

    def approve(self, approver, notes=''):
        """Approve the cash advance request."""
        if self.status != 'pending':
            raise ValidationError("Only pending requests can be approved.")

        # Security Fix: Enforce role check
        if approver.role not in ['manager', 'operations_manager', 'administrator', 'superuser']:
             raise ValidationError("Insufficient privileges to approve cash advance.")

        self.status = 'approved'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.approval_notes = notes
        self._add_audit_entry('approved', approver, notes)
        self.save()

    def reject(self, approver, notes=''):
        """Reject the cash advance request."""
        if self.status != 'pending':
            raise ValidationError("Only pending requests can be rejected.")

        self.status = 'rejected'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.approval_notes = notes
        self._add_audit_entry('rejected', approver, notes)
        self.save()

    def disburse(self, disbursing_officer, transaction=None):
        """Disburse the approved cash advance."""
        if self.status != 'approved':
            raise ValidationError("Only approved advances can be disbursed.")

        self.status = 'disbursed'
        self.disbursed_by = disbursing_officer
        self.disbursed_at = timezone.now()
        if transaction:
            self.disbursement_transaction = transaction
        self.outstanding_balance = self.amount
        self._add_audit_entry('disbursed', disbursing_officer)
        self.save()

    def record_repayment(self, amount, transaction=None):
        """Record a repayment against the cash advance."""
        if self.status not in ['disbursed', 'overdue']:
            raise ValidationError("Cannot record repayment for non-disbursed advance.")

        self.outstanding_balance -= amount
        if self.outstanding_balance <= 0:
            self.status = 'repaid'
            self.outstanding_balance = Decimal('0.00')

        self._add_audit_entry('repayment', transaction.cashier if transaction else None, f"Repayment of {amount}")
        self.save()

    def _add_audit_entry(self, action, user, notes=''):
        """Add an entry to the audit trail."""
        entry = {
            'action': action,
            'timestamp': timezone.now().isoformat(),
            'user': str(user) if user else None,
            'notes': notes
        }
        self.audit_trail.append(entry)

    def is_overdue(self):
        """Check if the cash advance is overdue."""
        if self.repayment_due_date and self.status in ['disbursed', 'overdue']:
            return timezone.now().date() > self.repayment_due_date
        return False

    def calculate_interest(self):
        """Calculate accrued interest (simplified daily calculation)."""
        if self.interest_rate > 0 and self.outstanding_balance > 0:
            daily_rate = self.interest_rate / 365 / 100
            days_elapsed = (timezone.now().date() - (self.disbursed_at.date() if self.disbursed_at else self.requested_at.date())).days
            return self.outstanding_balance * daily_rate * days_elapsed
        return Decimal('0.00')


class Refund(models.Model):
    """Refund requests and processing with validation and approval."""

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
        ('cancelled', 'Cancelled'),
    ]

    REFUND_TYPES = [
        ('full', 'Full Refund'),
        ('partial', 'Partial Refund'),
        ('adjustment', 'Amount Adjustment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name='refunds')
    refund_type = models.CharField(max_length=10, choices=REFUND_TYPES, default='full')
    requested_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Reason and details
    reason = models.TextField()
    refund_notes = models.TextField(blank=True)

    # Status and workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Request details
    requested_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='refund_requests')
    requested_at = models.DateTimeField(default=timezone.now)

    # Approval workflow
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_refunds')
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)

    # Processing
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    processed_at = models.DateTimeField(null=True, blank=True)
    refund_transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='refund_transaction')

    # Validation and compliance
    requires_supervisor_approval = models.BooleanField(default=False)
    compliance_flags = models.JSONField(default=dict, blank=True)
    risk_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Audit and tracking
    audit_trail = models.JSONField(default=list, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['original_transaction']),
            models.Index(fields=['requested_by']),
            models.Index(fields=['approved_by']),
            models.Index(fields=['processed_by']),
        ]

    def __str__(self):
        return f"Refund Request - {self.original_transaction.reference_number} - {self.requested_amount:.2f} ({self.status})"

    def approve(self, approver, approved_amount=None, notes=''):
        """Approve the refund request."""
        if self.status != 'pending':
            raise ValidationError("Only pending requests can be approved.")

        self.status = 'approved'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.approval_notes = notes
        if approved_amount is not None:
            self.approved_amount = approved_amount
        else:
            self.approved_amount = self.requested_amount
        self._add_audit_entry('approved', approver, notes)
        self.save()

    def reject(self, approver, notes=''):
        """Reject the refund request."""
        if self.status != 'pending':
            raise ValidationError("Only pending requests can be rejected.")

        self.status = 'rejected'
        self.approved_by = approver
        self.approved_at = timezone.now()
        self.approval_notes = notes
        self._add_audit_entry('rejected', approver, notes)
        self.save()

    def process_refund(self, processor, refund_transaction=None):
        """Process the approved refund."""
        if self.status != 'approved':
            raise ValidationError("Only approved refunds can be processed.")

        self.status = 'processed'
        self.processed_by = processor
        self.processed_at = timezone.now()
        if refund_transaction:
            self.refund_transaction = refund_transaction
        self._add_audit_entry('processed', processor)
        self.save()

    def cancel(self, canceller, notes=''):
        """Cancel the refund request."""
        if self.status in ['processed', 'cancelled']:
            raise ValidationError("Cannot cancel processed or already cancelled refunds.")

        self.status = 'cancelled'
        self.approval_notes = notes
        self._add_audit_entry('cancelled', canceller, notes)
        self.save()

    def _add_audit_entry(self, action, user, notes=''):
        """Add an entry to the audit trail."""
        entry = {
            'action': action,
            'timestamp': timezone.now().isoformat(),
            'user': str(user) if user else None,
            'notes': notes
        }
        self.audit_trail.append(entry)

    def requires_high_approval(self):
        """Check if refund requires higher level approval."""
        # High-value refunds or refunds on certain transaction types
        high_value_threshold = Decimal('1000.00')  # Configurable threshold
        return (self.requested_amount >= high_value_threshold or
                self.original_transaction.type in ['loan_disbursement', 'large_deposit'] or
                self.risk_score and self.risk_score > 7.0)


class Complaint(models.Model):
    """Customer complaints logging and management with escalation procedures."""

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('pending_response', 'Pending Response'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('escalated', 'Escalated'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    COMPLAINT_TYPES = [
        ('service', 'Service Quality'),
        ('transaction_error', 'Transaction Error'),
        ('account_issue', 'Account Issue'),
        ('fraud', 'Fraud/Security'),
        ('billing', 'Billing/Fees'),
        ('technical', 'Technical Issue'),
        ('other', 'Other'),
    ]

    ESCALATION_LEVELS = [
        ('tier1', 'Tier 1 Support'),
        ('tier2', 'Tier 2 Support'),
        ('supervisor', 'Supervisor'),
        ('manager', 'Manager'),
        ('executive', 'Executive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='complaints')
    related_transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')

    # Complaint details
    complaint_type = models.CharField(max_length=20, choices=COMPLAINT_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    subject = models.CharField(max_length=200)
    description = models.TextField()

    # Status and workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    escalation_level = models.CharField(max_length=15, choices=ESCALATION_LEVELS, default='tier1')

    # Assignment and handling
    submitted_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='submitted_complaints')
    submitted_at = models.DateTimeField(default=timezone.now)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    assigned_at = models.DateTimeField(null=True, blank=True)

    # Resolution
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_complaints')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution = models.TextField(blank=True)
    resolution_satisfaction = models.CharField(max_length=20, blank=True)  # satisfied, neutral, dissatisfied

    # Escalation tracking
    escalated_at = models.DateTimeField(null=True, blank=True)
    escalated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_complaints')
    escalation_reason = models.TextField(blank=True)

    # Follow-up and communication
    customer_contacted = models.BooleanField(default=False)
    contact_attempts = models.PositiveIntegerField(default=0)
    last_contact_date = models.DateTimeField(null=True, blank=True)
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)

    # Supporting documents and evidence
    attachments = models.JSONField(default=list, blank=True)  # List of file URLs
    evidence = models.JSONField(default=dict, blank=True)  # Additional evidence data

    # Audit and tracking
    audit_trail = models.JSONField(default=list, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['complaint_type']),
            models.Index(fields=['account']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['escalation_level']),
            models.Index(fields=['submitted_at']),
        ]

    def __str__(self):
        return f"Complaint - {self.subject} ({self.status})"

    def assign(self, assignee, assigner):
        """Assign the complaint to a handler."""
        self.assigned_to = assignee
        self.assigned_at = timezone.now()
        self.status = 'investigating'
        self._add_audit_entry('assigned', assigner, f"Assigned to {assignee}")
        self.save()

    def escalate(self, escalator, new_level, reason=''):
        """Escalate the complaint to a higher level."""
        if self.escalation_level == new_level:
            raise ValidationError("Cannot escalate to the same level.")

        old_level = self.escalation_level
        self.escalation_level = new_level
        self.escalated_at = timezone.now()
        self.escalated_by = escalator
        self.escalation_reason = reason
        self.status = 'escalated'
        self._add_audit_entry('escalated', escalator, f"Escalated from {old_level} to {new_level}: {reason}")
        self.save()

    def resolve(self, resolver, resolution_text, satisfaction=''):
        """Resolve the complaint."""
        if self.status in ['resolved', 'closed']:
            raise ValidationError("Complaint is already resolved or closed.")

        self.status = 'resolved'
        self.resolved_by = resolver
        self.resolved_at = timezone.now()
        self.resolution = resolution_text
        if satisfaction:
            self.resolution_satisfaction = satisfaction
        self._add_audit_entry('resolved', resolver, resolution_text)
        self.save()

    def close(self, closer, notes=''):
        """Close the complaint."""
        if self.status not in ['resolved', 'escalated']:
            raise ValidationError("Only resolved or escalated complaints can be closed.")

        self.status = 'closed'
        self._add_audit_entry('closed', closer, notes)
        self.save()

    def add_contact_attempt(self):
        """Record a contact attempt with the customer."""
        self.contact_attempts += 1
        self.last_contact_date = timezone.now()
        self.customer_contacted = True
        self.save()

    def _add_audit_entry(self, action, user, notes=''):
        """Add an entry to the audit trail."""
        entry = {
            'action': action,
            'timestamp': timezone.now().isoformat(),
            'user': str(user) if user else None,
            'notes': notes
        }
        self.audit_trail.append(entry)

    def is_overdue(self):
        """Check if complaint response is overdue based on priority."""
        if self.status in ['resolved', 'closed']:
            return False

        days_open = (timezone.now().date() - self.submitted_at.date()).days
        if self.priority == 'critical':
            return days_open > 1
        elif self.priority == 'high':
            return days_open > 3
        elif self.priority == 'medium':
            return days_open > 7
        else:  # low
            return days_open > 14

    def requires_follow_up(self):
        """Check if follow-up is required."""
        return self.follow_up_required and self.follow_up_date and timezone.now().date() >= self.follow_up_date


class Notification(models.Model):
    """System notifications for status updates and important events."""

    NOTIFICATION_TYPES = [
        ('cash_advance_status', 'Cash Advance Status Update'),
        ('refund_status', 'Refund Status Update'),
        ('complaint_status', 'Complaint Status Update'),
        ('transaction_status', 'Transaction Status Update'),
        ('system_alert', 'System Alert'),
        ('approval_required', 'Approval Required'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification_type = models.CharField(max_length=25, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unread')

    # Recipients
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')

    # Content
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_url = models.URLField(blank=True)  # URL to take action on the notification

    # Related objects
    cash_advance = models.ForeignKey(CashAdvance, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    refund = models.ForeignKey(Refund, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # Auto-archive old notifications

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['priority']),
            models.Index(fields=['recipient']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type} - {self.title} ({self.status})"

    def mark_as_read(self):
        """Mark notification as read."""
        if self.status == 'unread':
            self.status = 'read'
            self.read_at = timezone.now()
            self.save()

    def archive(self):
        """Archive the notification."""
        self.status = 'archived'
        self.save()

    def is_expired(self):
        """Check if notification has expired."""
        return self.expires_at and timezone.now() > self.expires_at

    @classmethod
    def create_notification(cls, notification_type, recipient, title, message, priority='medium',
                          sender=None, action_url='', related_object=None):
        """Create a new notification."""
        notification = cls.objects.create(
            notification_type=notification_type,
            recipient=recipient,
            sender=sender,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
        )

        # Set related object
        if isinstance(related_object, CashAdvance):
            notification.cash_advance = related_object
        elif isinstance(related_object, Refund):
            notification.refund = related_object
        elif isinstance(related_object, Complaint):
            notification.complaint = related_object
        elif isinstance(related_object, Transaction):
            notification.transaction = related_object

        notification.save()
        return notification

    @classmethod
    def cleanup_expired(cls):
        """Clean up expired notifications."""
        expired = cls.objects.filter(expires_at__lt=timezone.now(), status__in=['read', 'unread'])
        count = expired.update(status='archived')
        return count


# Additional models needed by views.py
class NextOfKin(models.Model):
    """Next of kin information for account holders."""
    # Using the structure from the existing database migration
    name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=20, choices=[
        ('spouse', 'Spouse'), ('parent', 'Parent'), ('child', 'Child'),
        ('sibling', 'Sibling'), ('friend', 'Friend'), ('other', 'Other')
    ])
    address = models.TextField()
    stake_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MinValueValidator(100)])
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.relationship})"


class UserEncryptionKey(models.Model):
    """User encryption keys for banking communications."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='banking_encryption_key')
    public_key = models.TextField()
    private_key_encrypted = models.TextField(blank=True, null=True)
    key_salt = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Encryption key for {self.user}"


class ClientRegistration(models.Model):
    """Client registration applications."""
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('otp_pending', 'OTP Pending'), ('otp_verified', 'OTP Verified'),
        ('under_review', 'Under Review'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('completed', 'Completed')
    ]
    
    ID_TYPE_CHOICES = [
        ('passport', 'Passport'), ('national_id', 'National ID'), 
        ('drivers_license', "Driver's License"), ('other', 'Other')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    id_type = models.CharField(max_length=20, choices=ID_TYPE_CHOICES)
    id_number = models.CharField(max_length=50)
    occupation = models.CharField(max_length=100)
    work_address = models.TextField()
    position = models.CharField(max_length=100)
    passport_picture = models.ImageField(upload_to='client_registration/passport_pictures/%Y/%m/%d/', blank=True, null=True)
    id_document = models.FileField(upload_to='client_registration/id_documents/%Y/%m/%d/', blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_sent_at = models.DateTimeField(blank=True, null=True)
    otp_verified_at = models.DateTimeField(blank=True, null=True)
    otp_attempts = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    approval_notes = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Foreign keys to existing models
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_client_registrations')
    user_account = models.OneToOneField(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='client_registration')
    bank_account = models.OneToOneField(Account, on_delete=models.SET_NULL, blank=True, null=True, related_name='client_registration')
    
    # Many-to-many relationship with NextOfKin
    next_of_kin = models.ManyToManyField(NextOfKin, blank=True, related_name='client_registrations')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['submitted_at']),
        ]
    
    def __str__(self):
        return f"Registration - {self.first_name} {self.last_name} ({self.status})"


# Banking-specific messaging models
class MessageThread(models.Model):
    """Message threads for banking communication."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.CharField(max_length=255, blank=True, null=True)
    participants = models.ManyToManyField(User, related_name='banking_messaging_threads')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_banking_threads')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(default=timezone.now)
    shared_secret = models.TextField(blank=True)
    public_keys = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Banking Thread - {self.subject or 'No Subject'} - {self.participants.count()} participants"
    
    def update_last_message(self):
        """Update the thread's timestamp when a new message is added."""
        self.updated_at = timezone.now()
        self.last_message_at = timezone.now()
        self.save()

    def get_unread_count(self, user):
        """Get the count of unread messages for a specific user."""
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    """Messages within banking threads."""
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('file', 'File'),
        ('image', 'Image'),
        ('system', 'System Message'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_banking_messages')
    content = models.TextField(blank=True, null=True)
    encrypted_content = models.TextField(blank=True, null=True)
    iv = models.CharField(max_length=255, blank=True, null=True)
    auth_tag = models.CharField(max_length=255, blank=True, null=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_by = models.ManyToManyField(User, related_name='read_banking_messages', blank=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"Banking Message from {self.sender} in {self.thread.subject or 'No Subject'}"
    
    def mark_as_read(self, user):
        """Mark message as read by a specific user."""
        if user not in self.read_by.all():
            self.read_by.add(user)
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class MessageReaction(models.Model):
    """Model for message reactions (like WhatsApp reactions)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='banking_message_reactions')
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['user', 'message', 'emoji']  # One reaction per user per message per emoji

    def __str__(self):
        return f"{self.user.email} reacted with {self.emoji} to message {self.message.id}"