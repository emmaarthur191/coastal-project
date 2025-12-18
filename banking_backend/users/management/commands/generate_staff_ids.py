"""
Management command to generate staff IDs for existing staff members who don't have one.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
import datetime
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate staff IDs for existing staff members who do not have one'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        staff_roles = ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'admin']
        
        # Find staff without staff_id
        staff_without_id = User.objects.filter(
            role__in=staff_roles,
            staff_id__isnull=True
        ) | User.objects.filter(
            role__in=staff_roles,
            staff_id=''
        )
        
        count = staff_without_id.count()
        self.stdout.write(f"Found {count} staff members without staff IDs")
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No staff members need staff IDs!"))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes will be made"))
            for user in staff_without_id:
                self.stdout.write(f"  Would generate ID for: {user.email} (role: {user.role})")
            return
        
        # Generate IDs
        now = datetime.datetime.now()
        prefix = f"CA-{now.strftime('%m')}{now.strftime('%y')}"
        
        generated_count = 0
        errors = []
        
        for user in staff_without_id:
            try:
                with transaction.atomic():
                    # Find the latest sequence number
                    latest = User.objects.select_for_update().filter(
                        staff_id__startswith=prefix
                    ).order_by('staff_id').last()
                    
                    if latest and latest.staff_id:
                        try:
                            current_seq = int(latest.staff_id.split('-')[-1])
                            new_seq = current_seq + 1
                        except ValueError:
                            new_seq = 1
                    else:
                        new_seq = 1
                    
                    if new_seq > 99:
                        staff_id = f"{prefix}-{new_seq:03d}"
                    else:
                        staff_id = f"{prefix}-{new_seq:02d}"
                    
                    user.staff_id = staff_id
                    user.save(update_fields=['staff_id'])
                    
                    generated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"Generated {staff_id} for {user.email}")
                    )
                    
            except Exception as e:
                errors.append(f"{user.email}: {str(e)}")
                self.stdout.write(
                    self.style.ERROR(f"Failed to generate ID for {user.email}: {e}")
                )
        
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Successfully generated {generated_count} staff IDs"))
        
        if errors:
            self.stdout.write(self.style.ERROR(f"Errors: {len(errors)}"))
            for error in errors:
                self.stdout.write(self.style.ERROR(f"  {error}"))
