#!/bin/bash
# Entrypoint script for Coastal Banking Backend Container
# This script provides "self-healing" infrastructure logic.

set -e

# Print startup info
echo "=============================================="
echo "  Coastal Banking Backend - Startup Script"
echo "=============================================="

# Wait for database to be ready
echo "[1/3] Waiting for database..."
python manage.py wait_for_db --timeout 60

# Run migrations
echo "[2/3] Applying database migrations..."
python manage.py migrate --noinput

# Collect static files (for production)
echo "[2.5/3] Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create superuser if it doesn't exist (optional - for first-time setup)
# Uncomment and set env vars: DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD, DJANGO_SUPERUSER_USERNAME
# echo "Creating superuser if not exists..."
# python manage.py createsuperuser --noinput || true

# Start the server
echo "[3/3] Starting server..."
exec "$@"
