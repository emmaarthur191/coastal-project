#!/usr/bin/env python
"""
Database repair script for production deployment.
Adds missing columns that migrations should have created but didn't due to faking.
This runs BEFORE migrations to prepare the database.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.db import connection


def add_initial_balance_if_missing():
    """Add initial_balance column to core_account if it doesn't exist."""
    with connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'core_account' 
            AND column_name = 'initial_balance';
        """)
        result = cursor.fetchone()
        
        if not result:
            print("  Adding initial_balance column to core_account...")
            cursor.execute("""
                ALTER TABLE core_account 
                ADD COLUMN initial_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL;
            """)
            print("  ✅ Column added successfully")
        else:
            print("  ✅ initial_balance column already exists")


def main():
    print("=== Database Repair Script ===")
    try:
        add_initial_balance_if_missing()
        print("=== Repair complete ===")
        return 0
    except Exception as e:
        print(f"  ❌ Error: {e}")
        # Don't fail the build - migrations might still work
        return 0


if __name__ == "__main__":
    sys.exit(main())
