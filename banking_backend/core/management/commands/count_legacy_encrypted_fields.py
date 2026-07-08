import logging
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db.models import Q

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Count the number of database records still encrypted using the legacy Fernet format."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Scanning all models for legacy Fernet ('gAAAAA') encrypted fields..."))
        
        total_legacy_rows = 0
        total_fields_checked = 0
        
        for model in apps.get_models():
            # Exclude models that are django built-ins or migrations
            if model._meta.app_label in ('admin', 'contenttypes', 'sessions', 'migrations'):
                continue
                
            # Identify all fields that store encrypted values
            encrypted_fields = [
                f for f in model._meta.get_fields() 
                if getattr(f, 'name', '').endswith('_encrypted') or getattr(f, 'name', '').endswith('_encrypted_val')
            ]
            
            if not encrypted_fields:
                continue
                
            # Build Q query to check if any of these fields start with the legacy prefix
            q_filter = Q()
            for field in encrypted_fields:
                q_filter |= Q(**{f"{field.name}__startswith": "gAAAAA"})
                
            try:
                legacy_count = model.objects.filter(q_filter).count()
                total_fields_checked += len(encrypted_fields)
                if legacy_count > 0:
                    total_legacy_rows += legacy_count
                    self.stdout.write(
                        self.style.WARNING(
                            f"  - Model '{model._meta.app_label}.{model.__name__}': "
                            f"{legacy_count} rows containing legacy Fernet keys (fields: {[f.name for f in encrypted_fields]})"
                        )
                    )
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"  - Failed to query model '{model._meta.app_label}.{model.__name__}': {e}"
                    )
                )

        if total_legacy_rows == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nSUCCESS: Zero legacy Fernet rows remaining in the database (scanned {total_fields_checked} fields)."
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"\nWARNING: Found a total of {total_legacy_rows} rows still using legacy Fernet encryption."
                )
            )
