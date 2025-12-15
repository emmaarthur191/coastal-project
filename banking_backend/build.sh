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
python manage.py migrate --noinput

echo "=== Creating initial users ==="
python manage.py create_initial_users

echo "=== Build complete ==="
