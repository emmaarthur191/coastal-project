#!/usr/bin/env python
"""Smart Migration Script v4 - Exhaustive Production Schema Sync.

This script ensures the production database has all required tables and columns,
even if the migration history is corrupted or out of sync.
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
    """Check if a table exists in the database (cross-database compatible)."""
    return table_name in connection.introspection.table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table (cross-database compatible)."""
    with connection.cursor() as cursor:
        columns = [c.name for c in connection.introspection.get_table_description(cursor, table_name)]
        return column_name in columns


def add_column_if_not_exists(table_name: str, column_name: str, column_def: str) -> bool:
    """Add a column if it doesn't already exist."""
    if not table_exists(table_name):
        return False
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


def create_table_if_not_exists(table_name: str, create_sql: str) -> bool:
    """Create a table if it doesn't exist."""
    if table_exists(table_name):
        return False

    with connection.cursor() as cursor:
        try:
            cursor.execute(create_sql)
            print(f"    + Created table {table_name}")
            return True
        except Exception as e:
            print(f"    ! Error creating {table_name}: {e}")
            return False


def sync_missing_tables():
    """Create any tables that should exist but don't."""
    print("\n→ Creating missing tables (Messaging, Junctions, Logs)...")

    # ==========================================================================
    # CORE MODELS (MESSAGING & FRAUD)
    # ==========================================================================

    # BankingMessage
    create_table_if_not_exists(
        "core_bankingmessage",
        """CREATE TABLE "core_bankingmessage" (
            "id" BIGSERIAL PRIMARY KEY,
            "subject" VARCHAR(255) NOT NULL,
            "body" TEXT NOT NULL,
            "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
            "read_at" TIMESTAMP WITH TIME ZONE NULL,
            "thread_id" VARCHAR(100) NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "parent_message_id" BIGINT NULL REFERENCES "core_bankingmessage" ("id") ON DELETE CASCADE,
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # MessageThread
    create_table_if_not_exists(
        "core_messagethread",
        """CREATE TABLE "core_messagethread" (
            "id" BIGSERIAL PRIMARY KEY,
            "subject" VARCHAR(255) NOT NULL,
            "thread_type" VARCHAR(20) NOT NULL DEFAULT 'staff_to_staff',
            "is_archived" BOOLEAN NOT NULL DEFAULT FALSE,
            "is_pinned" BOOLEAN NOT NULL DEFAULT FALSE,
            "last_message_at" TIMESTAMP WITH TIME ZONE NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "created_by_id" BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL
        )""",
    )

    # Junction: MessageThread <-> User
    create_table_if_not_exists(
        "core_messagethread_participants",
        """CREATE TABLE "core_messagethread_participants" (
            "id" BIGSERIAL PRIMARY KEY,
            "messagethread_id" BIGINT NOT NULL REFERENCES "core_messagethread" ("id") ON DELETE CASCADE,
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("messagethread_id", "user_id")
        )""",
    )

    # Message
    create_table_if_not_exists(
        "core_message",
        """CREATE TABLE "core_message" (
            "id" BIGSERIAL PRIMARY KEY,
            "content" TEXT NULL,
            "encrypted_content" TEXT NULL,
            "iv" VARCHAR(255) NULL,
            "auth_tag" VARCHAR(255) NULL,
            "message_type" VARCHAR(50) NOT NULL DEFAULT 'text',
            "is_system_message" BOOLEAN NOT NULL DEFAULT FALSE,
            "attachment_url" VARCHAR(200) NULL,
            "attachment_name" VARCHAR(255) NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "edited_at" TIMESTAMP WITH TIME ZONE NULL,
            "reactions" JSONB NOT NULL DEFAULT '{}',
            "sender_id" BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL,
            "thread_id" BIGINT NOT NULL REFERENCES "core_messagethread" ("id") ON DELETE CASCADE
        )""",
    )

    # Junction: Message <-> User (read_by)
    create_table_if_not_exists(
        "core_message_read_by",
        """CREATE TABLE "core_message_read_by" (
            "id" BIGSERIAL PRIMARY KEY,
            "message_id" BIGINT NOT NULL REFERENCES "core_message" ("id") ON DELETE CASCADE,
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("message_id", "user_id")
        )""",
    )

    # BlockedUser
    create_table_if_not_exists(
        "core_blockeduser",
        """CREATE TABLE "core_blockeduser" (
            "id" BIGSERIAL PRIMARY KEY,
            "reason" TEXT NOT NULL DEFAULT '',
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "blocked_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            "blocker_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("blocker_id", "blocked_id")
        )""",
    )

    # FraudRule
    create_table_if_not_exists(
        "core_fraudrule",
        """CREATE TABLE "core_fraudrule" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" VARCHAR(100) NOT NULL UNIQUE,
            "description" TEXT NOT NULL DEFAULT '',
            "rule_type" VARCHAR(50) NOT NULL DEFAULT 'threshold',
            "threshold_value" NUMERIC(15,2) NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )""",
    )

    # ==========================================================================
    # USER APP MODELS (LOGS & NOTIFICATIONS)
    # ==========================================================================

    # UserActivity
    create_table_if_not_exists(
        "users_useractivity",
        """CREATE TABLE "users_useractivity" (
            "id" BIGSERIAL PRIMARY KEY,
            "activity_type" VARCHAR(100) NOT NULL,
            "description" TEXT NOT NULL,
            "ip_address" INET NULL,
            "user_agent" TEXT NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # AuditLog
    create_table_if_not_exists(
        "users_auditlog",
        """CREATE TABLE "users_auditlog" (
            "id" BIGSERIAL PRIMARY KEY,
            "action" VARCHAR(100) NOT NULL,
            "resource_type" VARCHAR(100) NOT NULL,
            "resource_id" VARCHAR(100) NULL,
            "changes" JSONB NOT NULL DEFAULT '{}',
            "ip_address" INET NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "user_id" BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL
        )""",
    )

    # AdminNotification
    create_table_if_not_exists(
        "users_adminnotification",
        """CREATE TABLE "users_adminnotification" (
            "id" BIGSERIAL PRIMARY KEY,
            "title" VARCHAR(255) NOT NULL,
            "message" TEXT NOT NULL,
            "notification_type" VARCHAR(50) NOT NULL DEFAULT 'system',
            "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
            "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
            "read_at" TIMESTAMP WITH TIME ZONE NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )""",
    )

    # Junction: AdminNotification <-> User
    create_table_if_not_exists(
        "users_adminnotification_target_users",
        """CREATE TABLE "users_adminnotification_target_users" (
            "id" BIGSERIAL PRIMARY KEY,
            "adminnotification_id" BIGINT NOT NULL REFERENCES "users_adminnotification" ("id") ON DELETE CASCADE,
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("adminnotification_id", "user_id")
        )""",
    )

    # ==========================================================================
    # LEGACY / MISSING CORE TABLES
    # ==========================================================================

    # UserMessagePreference
    create_table_if_not_exists(
        "user_message_preference",
        """CREATE TABLE "user_message_preference" (
            "id" BIGSERIAL PRIMARY KEY,
            "sound_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
            "notification_sound" VARCHAR(50) NOT NULL DEFAULT 'default',
            "read_receipts_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
            "typing_indicators_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
            "last_seen_visible" BOOLEAN NOT NULL DEFAULT TRUE,
            "auto_delete_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
            "auto_delete_days" INTEGER NOT NULL DEFAULT 30,
            "markdown_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
            "emoji_shortcuts_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
            "font_size" VARCHAR(10) NOT NULL DEFAULT 'medium',
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "user_id" BIGINT NOT NULL UNIQUE REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # Product
    create_table_if_not_exists(
        "core_product",
        """CREATE TABLE "core_product" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" VARCHAR(100) NOT NULL,
            "product_type" VARCHAR(20) NOT NULL,
            "description" TEXT NOT NULL,
            "interest_rate" NUMERIC(5,2) NULL,
            "minimum_balance" NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
            "maximum_balance" NUMERIC(12,2) NULL,
            "features" JSONB NOT NULL DEFAULT '[]',
            "terms_and_conditions" TEXT NOT NULL DEFAULT '',
            "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )""",
    )

    # Promotion
    create_table_if_not_exists(
        "core_promotion",
        """CREATE TABLE "core_promotion" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" VARCHAR(100) NOT NULL,
            "description" TEXT NOT NULL,
            "discount_percentage" NUMERIC(5,2) NULL,
            "bonus_amount" NUMERIC(12,2) NULL,
            "start_date" DATE NOT NULL,
            "end_date" DATE NOT NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
            "terms_and_conditions" TEXT NOT NULL DEFAULT '',
            "max_enrollments" INTEGER NULL,
            "current_enrollments" INTEGER NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )""",
    )

    # Junction: Promotion <-> Product
    create_table_if_not_exists(
        "core_promotion_eligible_products",
        """CREATE TABLE "core_promotion_eligible_products" (
            "id" BIGSERIAL PRIMARY KEY,
            "promotion_id" BIGINT NOT NULL REFERENCES "core_promotion" ("id") ON DELETE CASCADE,
            "product_id" BIGINT NOT NULL REFERENCES "core_product" ("id") ON DELETE CASCADE,
            UNIQUE ("promotion_id", "product_id")
        )""",
    )

    # ServiceCharge
    create_table_if_not_exists(
        "core_servicecharge",
        """CREATE TABLE "core_servicecharge" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" VARCHAR(100) NOT NULL,
            "charge_type" VARCHAR(20) NOT NULL,
            "amount" NUMERIC(12,2) NOT NULL,
            "frequency" VARCHAR(20) NOT NULL DEFAULT 'one_time',
            "description" TEXT NOT NULL DEFAULT '',
            "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )""",
    )

    # ChatRoom
    create_table_if_not_exists(
        "core_chatroom",
        """CREATE TABLE "core_chatroom" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" VARCHAR(100) NULL,
            "is_group" BOOLEAN NOT NULL DEFAULT FALSE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "created_by_id" BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL
        )""",
    )

    # Junction: ChatRoom <-> User
    create_table_if_not_exists(
        "core_chatroom_members",
        """CREATE TABLE "core_chatroom_members" (
            "id" BIGSERIAL PRIMARY KEY,
            "chatroom_id" BIGINT NOT NULL REFERENCES "core_chatroom" ("id") ON DELETE CASCADE,
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("chatroom_id", "user_id")
        )""",
    )

    # ChatMessage
    create_table_if_not_exists(
        "core_chatmessage",
        """CREATE TABLE "core_chatmessage" (
            "id" BIGSERIAL PRIMARY KEY,
            "content" TEXT NOT NULL,
            "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "room_id" BIGINT NOT NULL REFERENCES "core_chatroom" ("id") ON DELETE CASCADE,
            "sender_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # VisitSchedule
    create_table_if_not_exists(
        "visit_schedule",
        """CREATE TABLE "visit_schedule" (
            "id" BIGSERIAL PRIMARY KEY,
            "client_name" VARCHAR(255) NOT NULL,
            "location" VARCHAR(255) NOT NULL,
            "scheduled_time" TIMESTAMP WITH TIME ZONE NOT NULL,
            "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
            "notes" TEXT NOT NULL DEFAULT '',
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "mobile_banker_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # OperationsMessage
    create_table_if_not_exists(
        "operations_message",
        """CREATE TABLE "operations_message" (
            "id" BIGSERIAL PRIMARY KEY,
            "title" VARCHAR(255) NOT NULL,
            "message" TEXT NOT NULL,
            "priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
            "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "recipient_id" BIGINT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            "sender_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # ClientAssignment
    create_table_if_not_exists(
        "client_assignment",
        """CREATE TABLE "client_assignment" (
            "id" BIGSERIAL PRIMARY KEY,
            "client_name" VARCHAR(200) NOT NULL DEFAULT '',
            "location" VARCHAR(255) NOT NULL DEFAULT '',
            "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
            "amount_due" NUMERIC(15,2) NULL,
            "next_visit" TIMESTAMP WITH TIME ZONE NULL,
            "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
            "notes" TEXT NOT NULL DEFAULT '',
            "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "client_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            "mobile_banker_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("mobile_banker_id", "client_id")
        )""",
    )

    # ClientRegistration
    create_table_if_not_exists(
        "client_registration",
        """CREATE TABLE "client_registration" (
            "id" BIGSERIAL PRIMARY KEY,
            "registration_id" VARCHAR(20) NOT NULL UNIQUE,
            "first_name" VARCHAR(100) NOT NULL,
            "last_name" VARCHAR(100) NOT NULL,
            "date_of_birth" DATE NULL,
            "email" VARCHAR(254) NOT NULL DEFAULT '',
            "phone_number" VARCHAR(20) NOT NULL,
            "id_type" VARCHAR(20) NOT NULL DEFAULT 'ghana_card',
            "id_number" VARCHAR(50) NOT NULL DEFAULT '',
            "occupation" VARCHAR(100) NOT NULL DEFAULT '',
            "work_address" TEXT NOT NULL DEFAULT '',
            "position" VARCHAR(100) NOT NULL DEFAULT '',
            "account_type" VARCHAR(25) NOT NULL DEFAULT 'daily_susu',
            "digital_address" VARCHAR(50) NOT NULL DEFAULT '',
            "location" VARCHAR(255) NOT NULL DEFAULT '',
            "next_of_kin_data" JSONB NULL,
            "id_document" VARCHAR(100) NULL,
            "passport_picture" VARCHAR(100) NULL,
            "status" VARCHAR(25) NOT NULL DEFAULT 'pending_verification',
            "notes" TEXT NOT NULL DEFAULT '',
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "created_user_id" BIGINT NULL UNIQUE REFERENCES "users_user" ("id") ON DELETE SET NULL,
            "submitted_by_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE
        )""",
    )

    # IdempotencyKey
    create_table_if_not_exists(
        "core_idempotencykey",
        """CREATE TABLE "core_idempotencykey" (
            "id" BIGSERIAL PRIMARY KEY,
            "guid" UUID NOT NULL UNIQUE,
            "method" VARCHAR(10) NOT NULL,
            "path" VARCHAR(255) NOT NULL,
            "request_body_hash" VARCHAR(64) NOT NULL,
            "response_status" INTEGER NULL,
            "response_body" TEXT NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "locked_at" TIMESTAMP WITH TIME ZONE NULL,
            "user_id" BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL
        )""",
    )

    print("  Table creation complete!\n")


def sync_missing_columns():
    """Add any columns that exist in models but not in the database."""
    print("→ Syncing missing columns...")

    # Users
    add_column_if_not_exists("users_user", "id_type", "VARCHAR(50) NULL")
    add_column_if_not_exists("users_user", "id_number", "VARCHAR(50) NULL")
    # PII Encryption (GDPR/Compliance)
    add_column_if_not_exists("users_user", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "ssnit_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "staff_id_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "first_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "last_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    # PII Search Hashes (Zero-Plaintext)
    add_column_if_not_exists("users_user", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "ssnit_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "staff_id_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "first_name_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "last_name_hash", "VARCHAR(64) DEFAULT '' NOT NULL")

    # Accounts & Registration
    add_column_if_not_exists("core_account", "initial_balance", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "initial_deposit", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "digital_address", "VARCHAR(100) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "occupation", "VARCHAR(255) NULL")
    add_column_if_not_exists("core_accountopeningrequest", "next_of_kin_data", "JSONB DEFAULT '{}' NOT NULL")
    # AccountOpeningRequest Encrypted PII
    add_column_if_not_exists("core_accountopeningrequest", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "first_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "last_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "date_of_birth_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "occupation_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "work_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "position_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "digital_address_encrypted_val", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "location_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "next_of_kin_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "photo_encrypted", "TEXT DEFAULT ''")
    # AccountOpeningRequest PII Hashes
    add_column_if_not_exists("core_accountopeningrequest", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_accountopeningrequest", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")

    # Loans
    add_column_if_not_exists("core_loan", "id_number", "VARCHAR(50) DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_loan", "monthly_income", "NUMERIC(12,2) DEFAULT 0.00 NOT NULL")

    print("  Column sync complete!\n")


def main():
    """Run the smart migration sync."""
    print("=" * 60)
    print("  Smart Migration Script v4 (Exhaustive Sync)")
    print("=" * 60)

    core_tables = ["core_account", "core_transaction", "users_user", "core_loan"]
    existing_tables = [t for t in core_tables if table_exists(t)]

    if len(existing_tables) >= 3:
        print(f"\n✓ Detected existing database schema ({len(existing_tables)}/{len(core_tables)} core tables)")
        print("\n→ Strategy: FAKE migrations, then sync exhaustive schema\n")

        print("Step 1: Faking migrations...")
        try:
            call_command("migrate", "--fake", "--noinput", verbosity=1)
        except Exception as e:
            print(f"  ! Warning during fake: {e}")

        print("\nStep 2: Creating missing tables & junctions...")
        sync_missing_tables()

        print("Step 3: Syncing missing columns...")
        sync_missing_columns()
    else:
        print("\n→ Fresh database detected. Running migrations normally...")
        call_command("migrate", "--noinput", verbosity=1)

    print("=" * 60)
    print("  Migration sync complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
