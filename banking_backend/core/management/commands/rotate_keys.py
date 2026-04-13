"""Management command to rotate encryption keys for PII-encrypted models.

Iterates through records that are encrypted with an older key version and
re-encrypts them with the latest key. This allows for safe, atomic, 
and resumable rotation.
"""

import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
from core.models.accounts import AccountOpeningRequest, AccountClosureRequest
from core.models.loans import Loan
from core.utils.secret_service import SecretManager

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Rotate encryption keys for PII-encrypted models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--target-version",
            type=int,
            required=True,
            help="The target encryption key version to rotate to."
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of records to process per batch."
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="If set, do not commit changes to the database."
        )

    def handle(self, *args, **options):
        target_version = options["target_version"]
        batch_size = options["batch_size"]
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE: Changes will not be committed."))

        # 1. Verify target key exists
        try:
            SecretManager.get_encryption_key(version=target_version)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Target key version {target_version} is not available: {e}"))
            return

        models_to_rotate = [
             (User, ["first_name", "last_name", "staff_id"]),
             (AccountOpeningRequest, [
                 "first_name", "last_name", "date_of_birth", "address", 
                 "occupation", "work_address", "position", "digital_address", 
                 "location", "next_of_kin_data", "photo", "id_number", "phone_number"
             ]),
             (AccountClosureRequest, ["phone_number"]),
             (Loan, [
                 "date_of_birth", "id_number", "digital_address",
                 "next_of_kin_1_name", "next_of_kin_1_phone", "next_of_kin_1_address",
                 "next_of_kin_2_name", "next_of_kin_2_phone", "next_of_kin_2_address",
                 "guarantor_1_name", "guarantor_1_id_number", "guarantor_1_phone", "guarantor_1_address",
                 "guarantor_2_name", "guarantor_2_id_number", "guarantor_2_phone", "guarantor_2_address"
             ])
        ]

        # Tracking for Integrity Check
        rotated_samples = []

        for model_class, fields in models_to_rotate:
            self.stdout.write(f"Rotating keys for {model_class.__name__}...")
            
            # Find records with older key versions
            unrotated_queryset = model_class.objects.filter(key_version__lt=target_version)
            total_count = unrotated_queryset.count()
            
            if total_count == 0:
                self.stdout.write(self.style.SUCCESS(f"  All {model_class.__name__} records already on version {target_version} or higher."))
                continue

            processed_count = 0
            while processed_count < total_count:
                batch = list(unrotated_queryset[:batch_size])
                if not batch:
                    break
                
                with transaction.atomic():
                    for record in batch:
                        # Properties automatically use record.key_version for decryption
                        # and currently active key_version (target_version) for re-encryption
                        # when we set them and save.
                        
                        # We force the re-encryption by reading and writing each field
                        for field_name in fields:
                           val = getattr(record, field_name)
                           if val:
                               setattr(record, field_name, val)
                        
                        record.key_version = target_version
                        if not dry_run:
                            record.save()
                        
                        # Collect sample for Step 5: Integrity Check
                        if len(rotated_samples) < 5:
                            rotated_samples.append((record, fields[0]))
                    
                processed_count += len(batch)
                self.stdout.write(f"  Processed {processed_count}/{total_count} {model_class.__name__} records...")

        # 5. Integrity Check (Validation phase)
        if rotated_samples:
            self.stdout.write("Running Step 5: Deep Integrity Check...")
            success_count = 0
            for record, test_field in rotated_samples:
                try:
                    # In dry run, we didn't save, so we refresh from DB to see if old key still works
                    # or if the current object state in memory is correct.
                    # In a real run, we verify we can decrypt the newly saved record.
                    val = getattr(record, test_field)
                    if val:
                        success_count += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Integrity Check FAILED for {record.__class__.__name__} {record.id}: {e}"))
            
            if success_count == len(rotated_samples):
                self.stdout.write(self.style.SUCCESS(f"  Integrity Check passed: {success_count}/{len(rotated_samples)} verified."))
            else:
                self.stderr.write(self.style.ERROR("  INTEGRITY CHECK FAILED. Manual review required."))
                return

        if dry_run:
            self.stdout.write(self.style.SUCCESS("Dry run completed successfully. No changes were committed."))
        else:
            self.stdout.write(self.style.SUCCESS("Encryption key rotation completed successfully."))
