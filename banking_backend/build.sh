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

echo "=== Running SMART database migrations ==="
# =========================================================================
# SMART MIGRATION: Handles production database sync issues automatically
# - If tables exist: Fakes migrations (marks as applied without running)
# - If fresh DB: Runs migrations normally
# =========================================================================
python smart_migrate.py

echo "=== Creating initial users ==="
python manage.py create_initial_users || echo "Initial users may already exist"

echo "=== Build complete ==="
