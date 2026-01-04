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
# FIX: Sync Django migration state with existing production database schema
# The 'core_message' table already exists in production, but Django thinks
# migration 0020 hasn't been applied. We fake it to mark as applied.
# =========================================================================
echo "=== Synchronizing migration state for core app ==="

# Fake 0020 (Message/BankingMessage/etc tables already exist in production)
python manage.py migrate core 0020_add_initial_balance_and_quantize --fake --noinput || echo "Already applied or fake failed (continuing...)"

# Now apply remaining migrations normally
echo "=== Running all migrations ==="
python manage.py migrate --noinput

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
