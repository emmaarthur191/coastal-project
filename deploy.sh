#!/bin/bash

# Coastal Banking Production Deployment Script
# This script deploys the application to production using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting Coastal Banking Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking deployment requirements..."

    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create it with production environment variables."
        exit 1
    fi

    # Check if SSL certificates exist
    if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
        print_warning "SSL certificates not found. Make sure to place them in nginx/ssl/"
        print_warning "Expected files: nginx/ssl/fullchain.pem and nginx/ssl/privkey.pem"
    fi

    print_success "Requirements check passed"
}

# Backup current database (if running)
backup_database() {
    print_status "Checking for existing database to backup..."

    if docker-compose -f docker-compose.prod.yml ps db | grep -q "Up"; then
        print_status "Backing up existing database..."
        docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U coastal_user coastal_banking > backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || print_warning "Database backup failed, but continuing deployment"
    else
        print_status "No existing database to backup"
    fi
}

# Stop existing containers
stop_services() {
    print_status "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down || print_warning "No existing services to stop"
}

# Build and start services
deploy_services() {
    print_status "Building and starting production services..."

    # Build all services
    docker-compose -f docker-compose.prod.yml build --no-cache

    # Start services in correct order
    print_status "Starting database..."
    docker-compose -f docker-compose.prod.yml up -d db

    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U coastal_user -d coastal_banking >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done

    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within expected time"
        exit 1
    fi

    print_success "Database is ready"

    # Start backend
    print_status "Starting backend services..."
    docker-compose -f docker-compose.prod.yml up -d backend

    # Start frontend build
    print_status "Building frontend..."
    docker-compose -f docker-compose.prod.yml up -d frontend

    # Wait for frontend build to complete
    print_status "Waiting for frontend build to complete..."
    sleep 30

    # Start nginx
    print_status "Starting nginx reverse proxy..."
    docker-compose -f docker-compose.prod.yml up -d nginx
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
    print_success "Database migrations completed"
}

# Collect static files
collect_static() {
    print_status "Collecting static files..."
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput --clear
    print_success "Static files collected"
}

# Create superuser if needed
create_superuser() {
    print_status "Checking if superuser exists..."
    if ! docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell -c "from users.models import User; print(User.objects.filter(is_superuser=True).exists())" 2>/dev/null | grep -q "True"; then
        print_warning "No superuser found. Creating one..."
        docker-compose -f docker-compose.prod.yml exec -T backend python manage.py createsuperuser --noinput --username admin --email admin@coastal-banking.com 2>/dev/null || print_warning "Superuser creation failed. You may need to create it manually."
    else
        print_success "Superuser already exists"
    fi
}

# Health check
health_check() {
    print_status "Performing health checks..."

    # Check if services are running
    services=("db" "backend" "nginx")
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service failed to start"
            exit 1
        fi
    done

    # Test nginx
    if curl -f -k https://localhost/health/ >/dev/null 2>&1; then
        print_success "Nginx health check passed"
    else
        print_warning "Nginx health check failed - this may be normal if SSL certificates are not properly configured"
    fi
}

# Show deployment summary
show_summary() {
    echo
    print_success "🎉 Deployment completed successfully!"
    echo
    echo "Service Status:"
    docker-compose -f docker-compose.prod.yml ps

    echo
    echo "Useful commands:"
    echo "  • View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  • Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  • Restart service: docker-compose -f docker-compose.prod.yml restart <service>"
    echo "  • Access backend: docker-compose -f docker-compose.prod.yml exec backend bash"
    echo
    echo "Application URLs:"
    echo "  • Frontend: https://yourdomain.com"
    echo "  • API: https://yourdomain.com/api/"
    echo "  • Admin: https://yourdomain.com/admin/"
    echo
    print_warning "Remember to:"
    print_warning "  1. Update nginx/ssl/ with your SSL certificates"
    print_warning "  2. Update 'yourdomain.com' in nginx configuration to your actual domain"
    print_warning "  3. Configure DNS to point to your server"
    print_warning "  4. Set up monitoring and backups"
}

# Main deployment process
main() {
    echo "🐳 Coastal Banking Production Deployment"
    echo "========================================"

    check_requirements
    backup_database
    stop_services
    deploy_services
    run_migrations
    collect_static
    create_superuser
    health_check
    show_summary

    print_success "Deployment script completed!"
}

# Run main function
main "$@"