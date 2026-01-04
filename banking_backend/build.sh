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
# =========================================================================
# FIX: Sync Django migration history with production database schema
# Problem: Production DB has schema changes from 0020 and 0021 applied
# but Django's django_migrations table doesn't know about them.
# Solution: Fake 0020 and 0021, then run remaining migrations normally.
# =========================================================================
echo "=== Step 1: Run database repair script ==="
python repair_db.py || echo "Repair script completed (errors non-fatal)"

echo "=== Step 2: Fake migrations 0020 and 0021 (already in DB) ==="
python manage.py migrate core 0020_add_initial_balance_and_quantize --fake --noinput || echo "0020 may already be applied"
python manage.py migrate core 0021_add_maker_checker_fields --fake --noinput || echo "0021 may already be applied"

echo "=== Step 3: Run all remaining migrations ==="
python manage.py migrate --noinput

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
