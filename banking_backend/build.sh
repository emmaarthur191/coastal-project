#!/usr/bin/env bash
# Build script for Render deployment
# This script is executed during the build phase

set -o errexit  # Exit on error

echo "=== Upgrading pip ==="
pip install --upgrade pip

echo "=== Installing dependencies ==="
pip install -r requirements.txt

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Running database migrations ==="
# Try normal migration first, if it fails due to existing tables/columns, fake ALL core migrations
# =========================================================================
# FIX: Database Schema Repair Strategy
# Problem: Migration 0020 contains both AddField(initial_balance) AND 
# CreateModel(Message). The core_message table exists but initial_balance
# column doesn't. We can't simply fake 0020 because that skips AddField too.
#
# Solution:
# 1. Apply fix migration 0019_5 which adds initial_balance column defensively
# 2. Fake 0020 (Message tables already exist, initial_balance now exists)
# 3. Run all remaining migrations normally
# =========================================================================
echo "=== Step 1: Apply fix migration to add initial_balance column ==="
python manage.py migrate core 0019_5_fix_initial_balance --noinput || echo "Fix migration may have already been applied"

echo "=== Step 2: Fake migration 0020 (Message tables + initial_balance already exist) ==="
python manage.py migrate core 0020_add_initial_balance_and_quantize --fake --noinput || echo "0020 may already be marked as applied"

echo "=== Step 3: Run all remaining migrations ==="
python manage.py migrate --noinput

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
