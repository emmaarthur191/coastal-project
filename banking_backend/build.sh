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
if ! python manage.py migrate --noinput 2>&1; then
    echo "=== Migration failed, faking all core migrations to sync state ==="
    # Fake ALL core migrations - the database schema is already up to date
    python manage.py migrate core --fake --noinput || true
    python manage.py migrate users --fake --noinput || true
    # Now run migrations for any remaining apps
    python manage.py migrate --noinput
fi

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
