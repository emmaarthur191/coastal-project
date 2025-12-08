from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import UserProfile
from banking.models import (
    Account, Transaction, KYCApplication, AccountOpening, IdentityVerification,
    AccountClosure, AccountClosureAudit, ComplianceReport, RegulatoryFiling,
    Document, DocumentVerification, LoanApplication, Loan, LoanRepayment,
    InterestAccrual, FeeTransaction, Branch, CheckDeposit, CheckImage,
    CashDrawer, CashTransaction, CashReconciliation, CashAdvance, Refund,
    Complaint, Notification
)
from operations.models import Commission
import secrets
import string
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Delete all existing users and recreate them from scratch based on priority rankings with dynamically generated credentials'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password-length',
            type=int,
            default=16,
            help='Length of generated passwords (default: 16)'
        )
        parser.add_argument(
            '--email-domain',
            type=str,
            default='banking.test',
            help='Domain for generated emails (default: banking.test)'
        )

    def generate_secure_password(self, length=16):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password

    def generate_unique_username(self, role):
        """Generate a unique username for a role."""
        # Use environment variable if available, otherwise generate random
        env_username = os.environ.get(f'BANKING_{role.upper()}_USERNAME')
        if env_username:
            return env_username

        # Generate random username
        random_suffix = secrets.token_hex(4)
        return f"{role}_{random_suffix}"

    def generate_unique_email(self, role, domain):
        """Generate a unique email for a role."""
        # Use environment variable if available, otherwise generate random
        env_email = os.environ.get(f'BANKING_{role.upper()}_EMAIL')
        if env_email:
            return env_email

        # Generate random email
        random_suffix = secrets.token_hex(4)
        return f"{role}_{random_suffix}@{domain}"

    def get_password_for_role(self, role, default_length):
        """Get password for a role from environment or generate."""
        env_password = os.environ.get(f'BANKING_{role.upper()}_PASSWORD')
        if env_password:
            return env_password
        return self.generate_secure_password(default_length)

    def handle(self, *args, **options):
        password_length = options['password_length']
        email_domain = options['email_domain']

        self.stdout.write(self.style.WARNING('Starting user reset process...'))

        # Step 1: Delete all related data that references users with PROTECT
        self.stdout.write('Deleting all user-related data...')
        self.delete_related_data()
        self.stdout.write(self.style.SUCCESS('Deleted all related data.'))

        # Step 2: Delete all existing users
        self.stdout.write('Deleting all existing users...')
        deleted_count = User.objects.all().delete()[0]  # Returns (count, details)
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} users.'))

        # Step 3: Recreate users in priority order with dynamic credentials
        self.stdout.write('\nRecreating users based on priority rankings with dynamic credentials...')

        # Priority rankings (highest to lowest)
        roles = [
            'superuser',
            'administrator',
            'operations_manager',
            'manager',
            'cashier',
            'mobile_banker',
            'customer'
        ]

        created_users = []

        for role in roles:
            self.stdout.write(f'Creating {role} user...')

            # Generate dynamic credentials
            email = self.generate_unique_email(role, email_domain)
            password = self.get_password_for_role(role, password_length)

            # Create user
            if role == 'superuser':
                user = User.objects.create_superuser(
                    email=email,
                    password=password,
                    first_name=role.replace('_', ' ').title(),
                    last_name='User',
                    role=role,
                    is_staff=True,
                    is_superuser=True
                )
            else:
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=role.replace('_', ' ').title(),
                    last_name='User',
                    role=role,
                    is_staff=role != 'customer',
                    is_active=True
                )

            # Create user profile
            UserProfile.objects.create(
                user=user,
                phone=f"+{secrets.randbelow(9000000000) + 1000000000}",  # Random 10-digit phone
                notify_email=True,
                notify_sms=secrets.choice([True, False]),
                notify_push=True
            )

            # Create default account for superuser
            if role == 'superuser':
                Account.objects.create(
                    owner=user,
                    account_number=f"SUP{user.id.hex[:8]}",
                    type='savings'
                )

            # Verify the user can authenticate
            from django.contrib.auth import authenticate
            test_user = authenticate(username=email, password=password)
            if test_user:
                self.stdout.write(self.style.SUCCESS(f'Created: {email} (Role: {role}) - Authentication verified'))
                created_users.append({
                    'role': role,
                    'email': email,
                    'password': password
                })
            else:
                self.stdout.write(self.style.ERROR(f'Created: {email} (Role: {role}) - Authentication failed!'))

        self.stdout.write(self.style.SUCCESS('\nUser reset completed successfully!'))
        self.stdout.write('\nCreated users with credentials:')
        for user_info in created_users:
            self.stdout.write(f"  {user_info['role']}: {user_info['email']} / {user_info['password']}")

    def delete_related_data(self):
        """Delete all data that has foreign keys to User with PROTECT."""
        # Delete in reverse dependency order
        Notification.objects.all().delete()
        Complaint.objects.all().delete()
        Refund.objects.all().delete()
        CashAdvance.objects.all().delete()
        CashReconciliation.objects.all().delete()
        CashTransaction.objects.all().delete()
        CashDrawer.objects.all().delete()
        CheckImage.objects.all().delete()
        CheckDeposit.objects.all().delete()
        Branch.objects.all().delete()
        Commission.objects.all().delete()
        FeeTransaction.objects.all().delete()
        InterestAccrual.objects.all().delete()
        LoanRepayment.objects.all().delete()
        Loan.objects.all().delete()
        LoanApplication.objects.all().delete()
        DocumentVerification.objects.all().delete()
        Document.objects.all().delete()
        RegulatoryFiling.objects.all().delete()
        ComplianceReport.objects.all().delete()
        AccountClosureAudit.objects.all().delete()
        AccountClosure.objects.all().delete()
        IdentityVerification.objects.all().delete()
        AccountOpening.objects.all().delete()
        KYCApplication.objects.all().delete()
        Transaction.objects.all().delete()
        Account.objects.all().delete()