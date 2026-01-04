#!/bin/bash
# ==============================================================================
# Coastal Banking - Production Deployment Script
# ==============================================================================
# This script prepares the Django application for production deployment
# Based on Django best practices and OWASP security guidelines
# ==============================================================================

set -e  # Exit on any error

echo "======================================================================"
echo "Coastal Banking - Production Deployment"
echo "======================================================================"

# ==============================================================================
# 1. Environment Check
# ==============================================================================
echo ""
echo "Step 1: Checking environment configuration..."

if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure your production settings."
    exit 1
fi

# Check DEBUG is False
if grep -q "DEBUG=True" .env; then
    echo "⚠️  WARNING: DEBUG=True in .env file!"
    echo "Production deployments MUST have DEBUG=False"
    read -p "Continue anyway? (not recommended) [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Environment configuration found"

# ==============================================================================
# 2. Dependencies Check
# ==============================================================================
echo ""
echo "Step 2: Installing production dependencies..."

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate || source venv/Scripts/activate  # Windows support
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Dependencies installed"

# ==============================================================================
# 3. Database Migrations
# ==============================================================================
echo ""
echo "Step 3: Running database migrations..."

python manage.py migrate --noinput

echo "✅ Database migrations complete"

# ==============================================================================
# 4. Collect Static Files
# ==============================================================================
echo ""
echo "Step 4: Collecting static files..."

python manage.py collectstatic --noinput --clear

echo "✅ Static files collected"

# ==============================================================================
# 5. Security Check
# ==============================================================================
echo ""
echo "Step 5: Running Django security checks..."

python manage.py check --deploy

echo "✅ Security checks passed"

# ==============================================================================
# 6. Create Superuser (if needed)
# ==============================================================================
echo ""
read -p "Create superuser account? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

# ==============================================================================
# 7. Log Directory Setup
# ==============================================================================
echo ""
echo "Step 7: Setting up log directory..."

LOG_DIR=$(python -c "import environ; env = environ.Env(); environ.Env.read_env('.env'); print(env('LOG_DIR', default='/var/log/coastal-banking'))")

if [ ! -d "$LOG_DIR" ]; then
    echo "Creating log directory: $LOG_DIR"
    sudo mkdir -p "$LOG_DIR" || mkdir -p "$LOG_DIR"
    sudo chmod 755 "$LOG_DIR" || chmod 755 "$LOG_DIR"
fi

echo "✅ Log directory ready: $LOG_DIR"

# ==============================================================================
# 8. Production Server Recommendations
# ==============================================================================
echo ""
echo "======================================================================"
echo "Deployment Complete!"
echo "======================================================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Start the production server:"
echo "   Using Gunicorn (WSGI):"
echo "   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4"
echo ""
echo "   Using Daphne (ASGI - for WebSockets):"
echo "   daphne -b 0.0.0.0 -p 8000 config.asgi:application"
echo ""
echo "2. Configure Nginx reverse proxy (recommended)"
echo ""
echo "3. Set up SSL/TLS certificates (Let's Encrypt recommended)"
echo ""
echo "4. Configure process manager (systemd or supervisor)"
echo ""
echo "5. Set up monitoring and log aggregation (Sentry already configured)"
echo ""
echo "======================================================================"
