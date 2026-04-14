#!/usr/bin/env python
"""Smart Migration Script v9 - Exhaustive Production Schema Sync & Cleanup.

This script ensures the production database has all required tables and columns,
aligns naming with actual db_table definitions, and cleans up redundant duplicates.
"""

import os
import sys

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

import time

from django.core.management import call_command
from django.db import OperationalError, connection


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


def drop_column_if_exists(table_name: str, column_name: str) -> bool:
    """Drop a column if it exists — used to clean up removed fields on existing DBs."""
    if not table_exists(table_name):
        return False
    if not column_exists(table_name, column_name):
        return False

    with connection.cursor() as cursor:
        sql = f'ALTER TABLE "{table_name}" DROP COLUMN "{column_name}"'
        try:
            cursor.execute(sql)
            print(f"    - Dropped {table_name}.{column_name}")
            return True
        except Exception as e:
            print(f"    ! Error dropping {table_name}.{column_name}: {e}")
            return False


def set_column_nullable(table_name: str, column_name: str, nullable: bool = True) -> bool:
    """Set a column to be nullable or NOT NULL (PostgreSQL/standard SQL)."""
    if not table_exists(table_name):
        return False
    if not column_exists(table_name, column_name):
        return False

    with connection.cursor() as cursor:
        action = "DROP NOT NULL" if nullable else "SET NOT NULL"
        sql = f'ALTER TABLE "{table_name}" ALTER COLUMN "{column_name}" {action}'
        try:
            cursor.execute(sql)
            print(f"    * Set {table_name}.{column_name} nullable={nullable}")
            return True
        except Exception as e:
            # Fallback for SQLite which doesn't support ALTER COLUMN DROP NOT NULL
            if "syntax error" in str(e).lower() or "sqlite" in str(connection.vendor):
                # SQLite doesn't strictly enforce NOT NULL if we don't want it to, 
                # but standard ALTER table doesn't support this. We ignore for SQLite.
                return True
            print(f"    ! Error changing nullability for {table_name}.{column_name}: {e}")
            return False


def rescue_identity_data():
    """Data Rescue: Rename existing 'user' table to 'users_user' if present."""
    if table_exists("user") and not table_exists("users_user"):
        print("\n[RESCUE] Detected existing 'user' table. Attempting to rename to 'users_user'...")
        with connection.cursor() as cursor:
            try:
                # Rename the main table
                cursor.execute('ALTER TABLE "user" RENAME TO "users_user"')
                print("    + Renamed identity table: user -> users_user")
                
                # Also rename the primary key sequence if possible (PostgreSQL specific)
                try:
                    cursor.execute('ALTER SEQUENCE "user_id_seq" RENAME TO "users_user_id_seq"')
                    print("    + Renamed ID sequence: user_id_seq -> users_user_id_seq")
                except Exception:
                    pass
                
                return True
            except Exception as e:
                print(f"    ! Failed to rename table: {e}")
                return False
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
    print("\n--> Creating missing tables (Messaging, Junctions, Logs, Audit)...")

    # ==========================================================================
    # AUDIT LOGS
    # ==========================================================================
    # Audit Log
    create_table_if_not_exists(
        "audit_log",
        """CREATE TABLE "audit_log" (
            "id" BIGSERIAL PRIMARY KEY,
            "action" VARCHAR(20) NOT NULL,
            "model_name" VARCHAR(100) NOT NULL,
            "object_id" VARCHAR(100) NOT NULL,
            "object_repr" VARCHAR(255) NOT NULL,
            "changes" JSONB NOT NULL DEFAULT '{}',
            "ip_address" INET NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "user_id" INTEGER REFERENCES "users_user" ("id") ON DELETE SET NULL
        )""",
    )

    # ==========================================================================
    # CORE MODELS (MESSAGING & FRAUD)
    # ==========================================================================

    # BankingMessage
    create_table_if_not_exists(
        "core_bankingmessage",
        """CREATE TABLE "core_bankingmessage" (
            "id" BIGSERIAL PRIMARY KEY,
            "subject" VARCHAR(255) NOT NULL,
            "body_encrypted" TEXT NOT NULL DEFAULT '',
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
        "user_activity",
        """CREATE TABLE "user_activity" (
            "id" BIGSERIAL PRIMARY KEY,
            "action" VARCHAR(50) NOT NULL,
            "ip_address" INET NULL,
            "user_agent" TEXT NOT NULL DEFAULT '',
            "details" JSONB NOT NULL DEFAULT '{}',
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
        "admin_notification",
        """CREATE TABLE "admin_notification" (
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
        "admin_notification_target_users",
        """CREATE TABLE "admin_notification_target_users" (
            "id" BIGSERIAL PRIMARY KEY,
            "adminnotification_id" BIGINT NOT NULL REFERENCES "admin_notification" ("id") ON DELETE CASCADE,
            "user_id" BIGINT NOT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE,
            UNIQUE ("adminnotification_id", "user_id")
        )""",
    )

    # OTPVerification (Hardened SMS Integration)
    create_table_if_not_exists(
        "otp_verification",
        """CREATE TABLE "otp_verification" (
            "id" BIGSERIAL PRIMARY KEY,
            "phone_number_hash" VARCHAR(64) NOT NULL,
            "otp_code_hash" VARCHAR(64) NOT NULL,
            "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
            "attempts" INTEGER NOT NULL DEFAULT 0,
            "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            "ip_address" INET NULL,
            "user_agent" TEXT NOT NULL DEFAULT ''
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
    # NOTE: client_name_encrypted was removed in migration 0048.
    # client_name is now derived from the client FK at runtime.
    create_table_if_not_exists(
        "client_assignment",
        """CREATE TABLE "client_assignment" (
            "id" BIGSERIAL PRIMARY KEY,
            "location_encrypted" TEXT NOT NULL DEFAULT '',
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
        "idempotency_key",
        """CREATE TABLE "idempotency_key" (
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
    print("--> Syncing missing columns...")

    # Users: Core Alignment
    set_column_nullable("users_user", "email", True)
    add_column_if_not_exists("users_user", "id_type", "VARCHAR(50) NULL")
    add_column_if_not_exists("users_user", "id_number", "VARCHAR(50) NULL")
    add_column_if_not_exists("users_user", "staff_number", "INTEGER DEFAULT 0 NOT NULL")
    add_column_if_not_exists("users_user", "id_type", "VARCHAR(50) NULL")
    add_column_if_not_exists("users_user", "member_number", "VARCHAR(20) UNIQUE NULL")
    # PII Encryption (GDPR/Compliance)
    add_column_if_not_exists("users_user", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "ssnit_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "staff_id_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "first_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "last_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "profile_photo_encrypted", "TEXT NULL")
    # PII Search Hashes (Zero-Plaintext)
    add_column_if_not_exists("users_user", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "ssnit_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "staff_id_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "first_name_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "last_name_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    # New Profile Fields (Encrypted)
    add_column_if_not_exists("users_user", "date_of_birth_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "digital_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "occupation_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "work_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "position_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("users_user", "key_version", "INTEGER DEFAULT 1 NOT NULL")
    # Security/Lockout
    add_column_if_not_exists("users_user", "failed_login_attempts", "INTEGER DEFAULT 0 NOT NULL")
    add_column_if_not_exists("users_user", "locked_until", "TIMESTAMP WITH TIME ZONE NULL")
    add_column_if_not_exists("users_user", "last_failed_login", "TIMESTAMP WITH TIME ZONE NULL")
    # Transaction Limits
    add_column_if_not_exists("users_user", "daily_transaction_limit", "NUMERIC(12,2) DEFAULT 10000.00 NOT NULL")
    add_column_if_not_exists("users_user", "daily_transaction_total", "NUMERIC(12,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("users_user", "daily_limit_reset_date", "DATE NULL")
    add_column_if_not_exists("users_user", "is_approved", "BOOLEAN DEFAULT FALSE NOT NULL")
    add_column_if_not_exists("users_user", "assigned_banker_id", "BIGINT NULL REFERENCES \"users_user\" (\"id\") ON DELETE SET NULL")

    # Accounts & Registration
    add_column_if_not_exists("account", "initial_balance", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("account", "key_version", "INTEGER DEFAULT 1 NOT NULL")
    add_column_if_not_exists("account_opening_request", "initial_deposit", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("account_opening_request", "digital_address", "VARCHAR(100) NULL")
    add_column_if_not_exists("account_opening_request", "occupation", "VARCHAR(255) NULL")
    add_column_if_not_exists("account_opening_request", "next_of_kin_data", "JSONB DEFAULT '{}' NOT NULL")
    add_column_if_not_exists("account_opening_request", "key_version", "INTEGER DEFAULT 1 NOT NULL")
    # AccountOpeningRequest Encrypted PII
    add_column_if_not_exists("account_opening_request", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "first_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "last_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "date_of_birth_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "occupation_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "work_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "position_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "digital_address_encrypted_val", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "location_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "next_of_kin_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "photo_encrypted", "TEXT DEFAULT ''")
    # AccountOpeningRequest PII Hashes
    add_column_if_not_exists("account_opening_request", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")

    # Loans
    add_column_if_not_exists("loan", "id_number", "VARCHAR(50) DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "monthly_income", "NUMERIC(12,2) DEFAULT 0.00 NOT NULL")

    # Banking & Operations Messages
    add_column_if_not_exists("core_bankingmessage", "body_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("operations_message", "message_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_chatmessage", "content_encrypted", "TEXT DEFAULT '' NOT NULL")

    # Visits & Assignments
    add_column_if_not_exists("visit_schedule", "client_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("visit_schedule", "location_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("visit_schedule", "check_in_at", "TIMESTAMP WITH TIME ZONE NULL")
    add_column_if_not_exists("visit_schedule", "check_in_latitude", "NUMERIC(9,6) NULL")
    add_column_if_not_exists("visit_schedule", "check_in_longitude", "NUMERIC(9,6) NULL")
    # NOTE: client_assignment.client_name_encrypted removed in migration 0048 — do NOT re-add it.
    add_column_if_not_exists("client_assignment", "location_encrypted", "TEXT DEFAULT '' NOT NULL")

    # Client Registration (Exhaustive PII)
    add_column_if_not_exists("client_registration", "first_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "last_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "date_of_birth_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "occupation_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "work_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "position_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "digital_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "location_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("client_registration", "next_of_kin_encrypted", "TEXT DEFAULT '' NOT NULL")

    # ── Schema Cleanup (DROP removed columns on existing production DBs) ──────
    # Migration 0048: client_name_encrypted removed from client_assignment
    drop_column_if_exists("client_assignment", "client_name_encrypted")
    # Migration 0048: old plaintext location column (superseded by location_encrypted)
    drop_column_if_exists("client_assignment", "location")
    # Migration 0047: old plaintext message column on sms_outbox
    drop_column_if_exists("sms_outbox", "message")
    drop_column_if_exists("sms_outbox", "phone_number")

    # [CLEANUP] Legacy Plaintext PII Columns in AccountOpeningRequest
    # These were replaced by properties mapping to encrypted fields.
    # We must drop them because they are NOT NULL in the DB, causing IntegrityErrors on new inserts.
    drop_column_if_exists("core_accountopeningrequest", "first_name")
    drop_column_if_exists("core_accountopeningrequest", "last_name")
    drop_column_if_exists("core_accountopeningrequest", "date_of_birth")
    drop_column_if_exists("core_accountopeningrequest", "phone_number")
    drop_column_if_exists("core_accountopeningrequest", "id_number")
    drop_column_if_exists("core_accountopeningrequest", "address")
    drop_column_if_exists("core_accountopeningrequest", "occupation")
    drop_column_if_exists("core_accountopeningrequest", "work_address")
    drop_column_if_exists("core_accountopeningrequest", "position")
    drop_column_if_exists("core_accountopeningrequest", "digital_address")
    drop_column_if_exists("core_accountopeningrequest", "location")
    drop_column_if_exists("core_accountopeningrequest", "nationality")

    # SMS Reliability (migration 0047: message field encrypted)
    add_column_if_not_exists("sms_outbox", "message_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("sms_outbox", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("sms_outbox", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")

    # Loans Intensive PII
    add_column_if_not_exists("loan", "date_of_birth_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "digital_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "next_of_kin_1_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "next_of_kin_1_phone_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "next_of_kin_1_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "next_of_kin_2_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "next_of_kin_2_phone_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "next_of_kin_2_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_1_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_1_id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_1_id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_1_phone_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_1_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_2_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_2_id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_2_id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_2_phone_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "guarantor_2_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("loan", "approved_at", "TIMESTAMP WITH TIME ZONE NULL")

    # Maker-Checker & Processing (Transactions, Checks, Refunds)
    add_column_if_not_exists("transaction", "processed_at", "TIMESTAMP WITH TIME ZONE NULL")
    add_column_if_not_exists(
        "transaction", "approved_by_id", 'BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL'
    )
    add_column_if_not_exists("transaction", "approval_date", "TIMESTAMP WITH TIME ZONE NULL")

    add_column_if_not_exists(
        "check_deposit", "submitted_by_id", 'BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL'
    )
    add_column_if_not_exists(
        "check_deposit", "processed_by_id", 'BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL'
    )
    add_column_if_not_exists("check_deposit", "processed_at", "TIMESTAMP WITH TIME ZONE NULL")
    add_column_if_not_exists("check_deposit", "cleared_at", "TIMESTAMP WITH TIME ZONE NULL")

    add_column_if_not_exists(
        "refund", "processed_by_id", 'BIGINT NULL REFERENCES "users_user" ("id") ON DELETE SET NULL'
    )
    add_column_if_not_exists("refund", "processed_at", "TIMESTAMP WITH TIME ZONE NULL")

    add_column_if_not_exists(
        "account_statement", "requested_by_id", 'BIGINT NULL REFERENCES "users_user" ("id") ON DELETE CASCADE'
    )

    # UserActivity Alignment
    add_column_if_not_exists("user_activity", "action", "VARCHAR(50) DEFAULT 'unspecified' NOT NULL")
    add_column_if_not_exists("user_activity", "details", "JSONB DEFAULT '{}' NOT NULL")
    # Clean up legacy names if they exist
    drop_column_if_exists("user_activity", "activity_type")
    drop_column_if_exists("user_activity", "description")
    add_column_if_not_exists("account_statement", "transaction_count", "INTEGER DEFAULT 0 NOT NULL")
    add_column_if_not_exists("account_statement", "opening_balance", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("account_statement", "closing_balance", "NUMERIC(15,2) DEFAULT 0.00 NOT NULL")
    add_column_if_not_exists("account_statement", "generated_at", "TIMESTAMP WITH TIME ZONE NULL")

    # Account Requests PII
    add_column_if_not_exists("account_opening_request", "first_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "last_name_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "date_of_birth_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "occupation_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "work_address_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "position_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "digital_address_encrypted_val", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "location_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "next_of_kin_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "photo_encrypted", "TEXT NULL")
    add_column_if_not_exists("account_opening_request", "id_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "id_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "phone_number_hash", "VARCHAR(64) DEFAULT '' NOT NULL")
    add_column_if_not_exists("account_opening_request", "credentials_sent_at", "TIMESTAMP WITH TIME ZONE NULL")

    add_column_if_not_exists("account_closure_request", "phone_number_encrypted", "TEXT DEFAULT '' NOT NULL")

    # Fraud & Audit
    add_column_if_not_exists("core_fraudalert", "resolved_at", "TIMESTAMP WITH TIME ZONE NULL")
    add_column_if_not_exists("core_fraudalert", "risk_score", "DOUBLE PRECISION NULL")
    add_column_if_not_exists("core_fraudalert", "risk_level", "VARCHAR(20) DEFAULT 'low' NOT NULL")
    add_column_if_not_exists("core_fraudalert", "reason", "TEXT DEFAULT '' NOT NULL")
    add_column_if_not_exists("core_fraudalert", "status", "VARCHAR(20) DEFAULT 'pending' NOT NULL")

    # AuditLog alignment (actor -> user)
    add_column_if_not_exists("audit_log", "user_id", "INTEGER REFERENCES user(id) ON DELETE SET NULL")
    drop_column_if_exists("audit_log", "actor_id")

    print("  Column sync complete!\n")


def drop_redundant_duplicates():
    """Identify and drop tables following app_model naming if custom naming is used.

    Example: Drop 'users_user' if 'user' is the authoritative table.
    """
    print("--> Checking for redundant duplicate tables...")
    redundant_map = {
        "users_useractivity": "user_activity",
        "users_auditlog": "audit_log",
        "users_adminnotification": "admin_notification",
        "users_adminnotification_target_users": "admin_notification_target_users",
        "core_account": "account",
        "core_transaction": "transaction",
        "core_loan": "loan",
        "core_checkdeposit": "check_deposit",
        "core_refund": "refund",
        "core_accountstatement": "account_statement",
        "core_accountopeningrequest": "account_opening_request",
        "core_accountclosurerequest": "account_closure_request",
        "core_idempotencykey": "idempotency_key",
        "core_servicecharge": "service_charge",
        "core_visit_schedule": "visit_schedule",
        "core_clientassignment": "client_assignment",
        "core_useractivity": "user_activity",
        "core_usermessagepreference": "user_message_preference",
        "core_operationsmessage": "operations_message",
        "core_otpverification": "otp_verification",
    }

    with connection.cursor() as cursor:
        for redundant, authoritative in redundant_map.items():
            if table_exists(redundant) and table_exists(authoritative):
                # Safe check: if the redundant table is empty, drop it.
                cursor.execute(f'SELECT count(*) FROM "{redundant}"')
                count = cursor.fetchone()[0]
                if count == 0:
                    print(f"    - Dropping empty redundant table: {redundant}")
                    cursor.execute(f'DROP TABLE "{redundant}" CASCADE')
                else:
                    print(f"    ! CAUTION: {redundant} is not empty but duplicate of {authoritative}. Manual review required.")


def backfill_existing_user_approvals():
    """Approve all existing users in the database.

    This ensures that 'old' users are grandfathered in, while new registrations still require manual approval.
    """
    from users.models import User

    print("--> Backfilling approvals for existing users...")
    try:
        # We approve everyone who is currently unapproved to recover from the migration lockout
        count = User.objects.filter(is_approved=False).update(is_approved=True)
        print(f"    + Approved {count} existing users. Access restored.")
    except Exception as e:
        print(f"    ! Error backfilling approvals: {e}")


def main():
    """Run the smart migration sync v8."""
    print("=" * 60)
    print("  Smart Migration Script v9 (Exhaustive Sync & Cleanup)")
    print("=" * 60)

    core_tables = ["account", "transaction", "users_user", "loan"]

    # RETRY LOGIC: Handle connection exhaustion during deployment overlaps
    max_retries = 5
    retry_delay = 5
    existing_tables = []

    for attempt in range(max_retries):
        try:
            existing_tables = [t for t in core_tables if table_exists(t)]
            break
        except Exception as e:
            print(f"  ! Connection attempt {attempt + 1} failed: {e}")
            time.sleep(retry_delay)
            retry_delay *= 2
    else:
        print("  !! Failed to connect. Aborting.")
        sys.exit(1)

    # Phase 0: Try Standard Migration First (Proper way)
    print("\nStep 0: Attempting standard migrations...")
    try:
        call_command("migrate", "--noinput", verbosity=1)
        print("[OK] Standard migrations succeeded.")
    except Exception as e:
        print(f"[WARN] Standard migrations failed, falling back to smart sync: {e}")

    # Phase 0.5: Rescue Identity Data if it exists under the old name
    rescue_identity_data()

    # Refresh core tables list after potential rescue
    existing_tables = [t for t in core_tables if table_exists(t)]

    # Phase 1: Smart Sync
    if len(existing_tables) >= 3:
        print(f"\n[OK] Detected existing database schema ({len(existing_tables)}/{len(core_tables)} core tables)")
        print("\n--> Strategy: FAKE migrations (if needed) & Sync Exhaustive Schema\n")

        print("Step 1: Faking migrations to align state...")
        try:
            call_command("migrate", "--fake", "--noinput", verbosity=1)
        except Exception as e:
            print(f"  ! Warning during fake: {e}")

        print("\nStep 2: Syncing missing tables & junctions...")
        sync_missing_tables()

        print("Step 3: Syncing missing columns...")
        sync_missing_columns()

        print("Step 4: Cleaning up redundant duplicate tables...")
        drop_redundant_duplicates()

        print("\nStep 5: Restoring access for existing users (Backfill)...")
        backfill_existing_user_approvals()

    else:
        print("\n--> Fresh database detected. Standard migrate was already attempted.")

    print("=" * 60)
    print("  Migration sync complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
