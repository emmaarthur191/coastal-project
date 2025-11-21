#!/bin/bash

# Banking Backend Production Deployment Script
# This script handles the complete deployment process for the banking backend application

set -e  # Exit on any error

# Configuration
PROJECT_NAME="banking-backend"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKER_COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "All dependencies are installed."
}

# Validate environment file
validate_env() {
    log_info "Validating environment configuration..."

    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file '$ENV_FILE' not found."
        log_info "Please create '$ENV_FILE' based on '.env.example' and configure production values."
        exit 1
    fi

    # Check for required environment variables
    required_vars=("SECRET_KEY" "DATABASE_URL" "ALLOWED_HOSTS")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE"; then
            log_error "Required environment variable '$var' not found in '$ENV_FILE'."
            exit 1
        fi
    done

    log_success "Environment configuration is valid."
}

# Backup current deployment
backup_current() {
    log_info "Creating backup of current deployment..."

    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup database if running
    if docker-compose ps db | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose exec -T db pg_dump -U banking_user banking_db > "$BACKUP_DIR/database_backup.sql" || true
    fi

    # Backup environment file
    cp "$ENV_FILE" "$BACKUP_DIR/" 2>/dev/null || true

    # Backup docker-compose files
    cp "$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$DOCKER_COMPOSE_PROD_FILE" "$BACKUP_DIR/" 2>/dev/null || true

    log_success "Backup created in '$BACKUP_DIR'."
}

# Pull latest changes
pull_changes() {
    log_info "Pulling latest changes from repository..."

    if [ -d ".git" ]; then
        git pull origin main
        log_success "Repository updated."
    else
        log_warning "Not a git repository. Skipping git pull."
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying application..."

    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose down

    # Build new images
    log_info "Building Docker images..."
    docker-compose build --no-cache

    # Start services
    log_info "Starting services..."
    docker-compose up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec -T web python manage.py migrate

    # Collect static files
    log_info "Collecting static files..."
    docker-compose exec -T web python manage.py collectstatic --noinput

    # Run health checks
    log_info "Running health checks..."
    if curl -f http://localhost/health/ > /dev/null 2>&1; then
        log_success "Health check passed."
    else
        log_warning "Health check failed. Please check the application logs."
    fi

    log_success "Deployment completed successfully."
}

# Rollback function
rollback() {
    log_info "Rolling back to previous deployment..."

    # Find latest backup
    LATEST_BACKUP=$(ls -td backups/*/ | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found for rollback."
        exit 1
    fi

    log_info "Rolling back using backup: $LATEST_BACKUP"

    # Stop current containers
    docker-compose down

    # Restore files
    cp "$LATEST_BACKUP/.env.production" . 2>/dev/null || true
    cp "$LATEST_BACKUP/docker-compose.yml" . 2>/dev/null || true
    cp "$LATEST_BACKUP/docker-compose.prod.yml" . 2>/dev/null || true

    # Restore database if backup exists
    if [ -f "$LATEST_BACKUP/database_backup.sql" ]; then
        log_info "Restoring database..."
        docker-compose up -d db
        sleep 10
        docker-compose exec -T db psql -U banking_user -d banking_db < "$LATEST_BACKUP/database_backup.sql"
    fi

    # Restart services
    docker-compose up -d

    log_success "Rollback completed."
}

# Show status
show_status() {
    log_info "Current deployment status:"
    docker-compose ps
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "Starting production deployment for $PROJECT_NAME..."
            check_dependencies
            validate_env
            backup_current
            pull_changes
            deploy
            show_status
            log_success "Deployment process completed."
            ;;
        "rollback")
            rollback
            show_status
            ;;
        "status")
            show_status
            ;;
        "backup")
            backup_current
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status|backup}"
            echo "  deploy   - Deploy the application (default)"
            echo "  rollback - Rollback to previous deployment"
            echo "  status   - Show current deployment status"
            echo "  backup   - Create a backup of current deployment"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"