#!/usr/bin/env python
"""
Smart Migration Script for Production Database Sync

This script solves the common problem of migration history being out of sync
with the actual database schema. It:
1. Checks if core tables already exist in the database
2. If tables exist: Fakes all migrations, then adds any missing columns
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


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = %s
                AND column_name = %s
            )
            """,
            [table_name, column_name],
        )
        return cursor.fetchone()[0]


def add_column_if_not_exists(table_name: str, column_name: str, column_def: str) -> bool:
    """Add a column if it doesn't already exist."""
    if column_exists(table_name, column_name):
        return False

    with connection.cursor() as cursor:
        sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{column_name}" {column_def}'
        try:
            cursor.execute(sql)
            print(f"    + Added {table_name}.{column_name}")
            return True
        except Exception as e:
            print(f"    ! Error adding {table_name}.{column_name}: {e}")
            return False


def sync_missing_columns():
    """Add any columns that exist in models but not in the database."""
    print("\n→ Syncing missing columns...")

    # ==========================================================================
    # Users App - Missing columns from various migrations
    # ==========================================================================
    # From users.0008_user_id_number_user_id_type
    add_column_if_not_exists("users_user", "id_type", "VARCHAR(50) NULL")
    add_column_if_not_exists("users_user", "id_number", "VARCHAR(50) NULL")

    # ==========================================================================
    # Core App - Account columns
    # ==========================================================================
    # From core.0020_add_initial_balance_and_quantize
    add_column_if_not_exists("core_account", "initial_balance", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")

    # ==========================================================================
    # Core App - AccountOpeningRequest columns
    # ==========================================================================
    # From core.0022
    add_column_if_not_exists("core_accountopeningrequest", "initial_deposit", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    # From core.0026
    add_column_if_not_exists("core_accountopeningrequest", "credential_dispatch_method", "VARCHAR(20) DEFAULT 'pickup' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "credential_delivery_address", "TEXT NULL")
    # From core.0032
    add_column_if_not_exists("core_accountopeningrequest", "digital_address", "VARCHAR(100) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "employer_name", "VARCHAR(255) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "location", "VARCHAR(255) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "next_of_kin_data", "JSONB DEFAULT '{}' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "occupation", "VARCHAR(255) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "position", "VARCHAR(100) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "work_address", "TEXT NULL")

    # ==========================================================================
    # Core App - Loan columns (from core.0030)
    # ==========================================================================
    add_column_if_not_exists("core_loan", "city", "VARCHAR(100) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "date_of_birth", "DATE NULL")
    add_column_if_not_exists("core_loan", "digital_address", "VARCHAR(100) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "employment_status", "VARCHAR(50) DEFAULT 'employed' NOT NULL")
    add_column_if_not_exists("core_loan", "id_number", "VARCHAR(50) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "id_type", "VARCHAR(50) DEFAULT 'ghana_card' NOT NULL")
    add_column_if_not_exists("core_loan", "monthly_income", "NUMERIC(12,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("core_loan", "town", "VARCHAR(100) DEFAULT '' NOT NULL")
    # Guarantor 1 fields
    add_column_if_not_exists("core_loan", "guarantor_1_name", "VARCHAR(255) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_1_phone", "VARCHAR(20) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_1_address", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_1_id_type", "VARCHAR(50) DEFAULT 'ghana_card' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_1_id_number", "VARCHAR(50) DEFAULT '' NOT NULL")
    # Guarantor 2 fields
    add_column_if_not_exists("core_loan", "guarantor_2_name", "VARCHAR(255) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_2_phone", "VARCHAR(20) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_2_address", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_2_id_type", "VARCHAR(50) DEFAULT 'ghana_card' NOT NULL")
    add_column_if_not_exists("core_loan", "guarantor_2_id_number", "VARCHAR(50) DEFAULT '' NOT NULL")
    # Next of Kin 1 fields
    add_column_if_not_exists("core_loan", "next_of_kin_1_name", "VARCHAR(255) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "next_of_kin_1_phone", "VARCHAR(20) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "next_of_kin_1_address", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "next_of_kin_1_relationship", "VARCHAR(100) DEFAULT '' NOT NULL")
    # Next of Kin 2 fields
    add_column_if_not_exists("core_loan", "next_of_kin_2_name", "VARCHAR(255) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "next_of_kin_2_phone", "VARCHAR(20) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "next_of_kin_2_address", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "next_of_kin_2_relationship", "VARCHAR(100) DEFAULT '' NOT NULL")

    # ==========================================================================
    # Core App - FraudAlert columns (from core.0027)
    # ==========================================================================
    add_column_if_not_exists("core_fraudalert", "transaction_id", "BIGINT NULL")
    add_column_if_not_exists("core_fraudalert", "alert_type", "VARCHAR(50) DEFAULT 'suspicious_activity' NOT NULL")
    add_column_if_not_exists("core_fraudalert", "risk_score", "NUMERIC(5,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("core_fraudalert", "metadata", "JSONB DEFAULT '{}' NOT NULL")

    # ==========================================================================
    # Core App - Message columns (from various migrations)
    # ==========================================================================
    if table_exists("core_message"):
        add_column_if_not_exists("core_message", "encrypted_content", "TEXT NULL")
        add_column_if_not_exists("core_message", "iv", "VARCHAR(255) NULL")
        add_column_if_not_exists("core_message", "auth_tag", "VARCHAR(255) NULL")
        add_column_if_not_exists("core_message", "message_type", "VARCHAR(50) DEFAULT 'text' NOT NULL")
        add_column_if_not_exists("core_message", "reactions", "JSONB DEFAULT '{}' NOT NULL")

    # ==========================================================================
    # Core App - FraudRule columns (from core.0033)
    # ==========================================================================
    if table_exists("core_fraudrule"):
        add_column_if_not_exists("core_fraudrule", "rule_type", "VARCHAR(50) DEFAULT 'threshold' NOT NULL")
        add_column_if_not_exists("core_fraudrule", "threshold_value", "NUMERIC(15,2) NULL")
        add_column_if_not_exists("core_fraudrule", "is_active", "BOOLEAN DEFAULT TRUE NOT NULL")

    print("  Column sync complete!\n")


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
        print("\n→ Strategy: FAKE migrations, then add missing columns\n")

        # Step 1: Fake all migrations to mark them as applied
        print("Step 1: Faking migrations...")
        try:
            call_command("migrate", "--fake", "--noinput", verbosity=1)
            print("  ✓ All migrations marked as applied (faked)\n")
        except Exception as e:
            print(f"  ! Warning during fake: {e}")
            for app in ["contenttypes", "auth", "users", "core", "admin", "sessions", "token_blacklist"]:
                try:
                    call_command("migrate", app, "--fake", "--noinput", verbosity=0)
                    print(f"    ✓ {app}")
                except Exception as app_e:
                    print(f"    ! {app}: {app_e}")

        # Step 2: Add any missing columns via raw SQL
        print("\nStep 2: Adding missing columns...")
        sync_missing_columns()

    else:
        # Fresh database - run migrations normally
        print(f"\n→ Fresh database detected ({len(existing_tables)} core tables found)")
        print("  Strategy: RUN migrations normally\n")

        print("Running migrations...")
        call_command("migrate", "--noinput", verbosity=1)
        print("\n✓ All migrations applied successfully")

    print("=" * 60)
    print("  Migration sync complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
