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
# Try normal migration first, if it fails due to existing tables, fake the problematic migrations
if ! python manage.py migrate --noinput 2>&1; then
    echo "=== Migration failed, attempting to fix sync issues ==="
    # Fake migrations up to 0008 if core_message already exists
    python manage.py migrate core 0007 --fake --noinput || true
    python manage.py migrate core 0008 --fake --noinput || true
    # Now run remaining migrations
    python manage.py migrate --noinput
fi

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
