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
# Run database migrations - Fail build if migration fails
echo "=== REPAIRING MIGRATION STATE (One-time Fix) ==="
# Force Django to think we are at 0019, then allow it to apply 0020+ really
python manage.py migrate core 0019 --fake --noinput
python manage.py migrate core --noinput

echo "=== Running remaining migrations ==="
python manage.py migrate --noinput

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
