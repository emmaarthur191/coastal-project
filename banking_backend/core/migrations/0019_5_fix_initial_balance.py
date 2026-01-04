# Generated manually to fix production database schema mismatch
# This migration adds the initial_balance column IF it doesn't exist
# and ensures we can safely fake 0020 afterwards

from decimal import Decimal
from django.db import migrations, models


def add_initial_balance_if_missing(apps, schema_editor):
    """
    Adds the initial_balance column to core_account if it doesn't exist.
    This is a defensive operation to handle the case where migration 0020
    was partially applied or the database is in an inconsistent state.
    """
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Check if the column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'core_account' 
            AND column_name = 'initial_balance';
        """)
        result = cursor.fetchone()
        
        if not result:
            # Column doesn't exist, add it
            cursor.execute("""
                ALTER TABLE core_account 
                ADD COLUMN initial_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL;
            """)
            print("  Added initial_balance column to core_account")
        else:
            print("  initial_balance column already exists, skipping")


def noop(apps, schema_editor):
    """Reverse operation - do nothing."""
    pass


class Migration(migrations.Migration):
    """
    Emergency fix migration to add the initial_balance column.
    This should run BEFORE 0020 is faked.
    """

    dependencies = [
        ("core", "0019_remove_old_messaging"),
    ]

    operations = [
        migrations.RunPython(add_initial_balance_if_missing, noop),
    ]
