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
# Run database migrations using --fake-initial to handle existing tables
echo "=== Running database migrations (--fake-initial) ==="
python manage.py migrate --fake-initial --noinput

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
