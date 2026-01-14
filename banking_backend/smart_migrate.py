#!/usr/bin/env python
"""
Smart Migration Script for Production Database Sync

This script solves the common problem of migration history being out of sync
with the actual database schema. It:
1. Checks if core tables already exist in the database
2. If tables exist: Fakes all migrations (marks as applied without running)
3. If tables don't exist: Runs migrations normally

Usage:
    python smart_migrate.py
"""

import os
import sys

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.management import call_command
from django.db import connection


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = %s
            )
            """,
            [table_name],
        )
        return cursor.fetchone()[0]


def get_applied_migrations() -> set:
    """Get set of already applied migrations from django_migrations table."""
    if not table_exists("django_migrations"):
        return set()

    with connection.cursor() as cursor:
        cursor.execute("SELECT app, name FROM django_migrations")
        return {(row[0], row[1]) for row in cursor.fetchall()}


def main():
    print("=" * 60)
    print("  Smart Migration Script")
    print("=" * 60)

    # Key tables that indicate the database has the schema
    core_tables = ["core_account", "core_transaction", "users_user", "core_loan"]

    # Check if database already has schema
    existing_tables = [t for t in core_tables if table_exists(t)]

    if len(existing_tables) >= 3:
        # Database has schema - likely a production database with sync issues
        print(f"\n✓ Detected existing database schema ({len(existing_tables)}/{len(core_tables)} core tables)")
        print("  Tables found:", ", ".join(existing_tables))
        print("\n→ Strategy: FAKE all migrations to sync history\n")

        # Fake all migrations to mark them as applied
        print("Faking migrations...")
        try:
            call_command("migrate", "--fake", "--noinput", verbosity=1)
            print("\n✓ All migrations marked as applied (faked)")
        except Exception as e:
            print(f"\n! Warning during fake: {e}")
            # Try faking each app individually
            print("  Trying individual app fakes...")
            for app in ["contenttypes", "auth", "users", "core", "admin", "sessions", "token_blacklist"]:
                try:
                    call_command("migrate", app, "--fake", "--noinput", verbosity=0)
                    print(f"    ✓ {app}")
                except Exception as app_e:
                    print(f"    ! {app}: {app_e}")

    else:
        # Fresh database - run migrations normally
        print(f"\n→ Fresh database detected ({len(existing_tables)} core tables found)")
        print("  Strategy: RUN migrations normally\n")

        print("Running migrations...")
        call_command("migrate", "--noinput", verbosity=1)
        print("\n✓ All migrations applied successfully")

    print("\n" + "=" * 60)
    print("  Migration sync complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
