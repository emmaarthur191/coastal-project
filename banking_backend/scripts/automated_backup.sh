#!/bin/bash

# Automated Database Backup Script for Banking Backend
# This script creates encrypted, compressed backups and manages retention

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/database}"
LOG_FILE="${LOG_FILE:-$PROJECT_DIR/logs/backup.log}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Database configuration (from environment or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-banking_db}"
DB_USER="${DB_USER:-banking_user}"
DB_PASSWORD="${DB_PASSWORD}"

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Validate environment
validate_environment() {
    log "Validating backup environment..."

    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory: $BACKUP_DIR"
    fi

    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        error_exit "Cannot connect to database"
    fi

    # Check if encryption key is available
    if [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
        log "WARNING: BACKUP_ENCRYPTION_KEY not set. Backups will not be encrypted."
    fi

    log "Environment validation completed."
}

# Create backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_filename="backup_${timestamp}.sql"
    local backup_path="$BACKUP_DIR/$backup_filename"

    log "Creating database backup: $backup_filename"

    # Create pg_dump command
    local pg_dump_cmd=(
        pg_dump
        -h "$DB_HOST"
        -p "$DB_PORT"
        -U "$DB_USER"
        -d "$DB_NAME"
        --no-password
        --format=custom
        --compress=9
        --verbose
        --file="$backup_path"
    )

    # Set password environment variable
    export PGPASSWORD="$DB_PASSWORD"

    # Execute backup
    if "${pg_dump_cmd[@]}"; then
        log "Backup created successfully: $backup_path"

        # Get backup size
        local size=$(stat -f%z "$backup_path" 2>/dev/null || stat -c%s "$backup_path" 2>/dev/null || echo "unknown")
        log "Backup size: $size bytes"

        # Compress backup
        compress_backup "$backup_path"

        # Encrypt backup if key is available
        if [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
            encrypt_backup "$backup_path.gz"
        fi

        return 0
    else
        error_exit "Backup creation failed"
    fi
}

# Compress backup
compress_backup() {
    local input_file="$1"
    local output_file="${input_file}.gz"

    log "Compressing backup: $output_file"

    if gzip -9 "$input_file"; then
        log "Compression completed: $output_file"
        return 0
    else
        log "WARNING: Compression failed for $input_file"
        return 1
    fi
}

# Encrypt backup using openssl
encrypt_backup() {
    local input_file="$1"
    local output_file="${input_file}.enc"

    log "Encrypting backup: $output_file"

    if echo "$BACKUP_ENCRYPTION_KEY" | openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -pass stdin; then
        # Remove unencrypted file
        rm -f "$input_file"
        log "Encryption completed: $output_file"
        return 0
    else
        log "WARNING: Encryption failed for $input_file"
        return 1
    fi
}

# Decrypt backup
decrypt_backup() {
    local input_file="$1"
    local output_file="${1%.enc}"

    log "Decrypting backup: $output_file"

    if echo "$BACKUP_ENCRYPTION_KEY" | openssl enc -d -aes-256-cbc -in "$input_file" -out "$output_file" -pass stdin; then
        log "Decryption completed: $output_file"
        return 0
    else
        error_exit "Decryption failed for $input_file"
    fi
}

# Restore backup
restore_backup() {
    local backup_file="$1"
    local temp_file=""

    log "Restoring database from: $backup_file"

    # Handle encrypted backups
    if [[ "$backup_file" == *.enc ]]; then
        temp_file="/tmp/restore_temp_$(date +%s).gz"
        decrypt_backup "$backup_file"
        backup_file="${backup_file%.enc}"
    fi

    # Handle compressed backups
    if [[ "$backup_file" == *.gz ]]; then
        if [ -z "$temp_file" ]; then
            temp_file="/tmp/restore_temp_$(date +%s).sql"
        fi
        gunzip -c "$backup_file" > "$temp_file"
        backup_file="$temp_file"
    fi

    # Restore database
    export PGPASSWORD="$DB_PASSWORD"
    if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                  --no-password --clean --if-exists --create --verbose "$backup_file"; then
        log "Database restoration completed successfully"
    else
        error_exit "Database restoration failed"
    fi

    # Clean up temporary files
    if [ -n "$temp_file" ] && [ -f "$temp_file" ]; then
        rm -f "$temp_file"
    fi
}

# List backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"

    if [ ! -d "$BACKUP_DIR" ]; then
        log "Backup directory does not exist"
        return
    fi

    local count=0
    while IFS= read -r -d '' file; do
        local filename=$(basename "$file")
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown")
        local mtime=$(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c"%y" "$file" | cut -d'.' -f1 2>/dev/null || echo "unknown")
        echo "  $filename - $size bytes - $mtime"
        ((count++))
    done < <(find "$BACKUP_DIR" -name "backup_*.sql*" -print0 2>/dev/null | sort -z)

    if [ $count -eq 0 ]; then
        log "No backups found"
    else
        log "Total backups: $count"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    local days=${1:-$RETENTION_DAYS}

    log "Cleaning up backups older than $days days..."

    if [ ! -d "$BACKUP_DIR" ]; then
        log "Backup directory does not exist"
        return
    fi

    local count=0
    while IFS= read -r -d '' file; do
        # Check if file is older than retention period
        if [ $(find "$file" -mtime +$days 2>/dev/null | wc -l) -gt 0 ]; then
            log "Removing old backup: $(basename "$file")"
            rm -f "$file"
            ((count++))
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*.sql*" -print0 2>/dev/null)

    log "Cleaned up $count old backups"
}

# Send notification (placeholder for email/SMS notifications)
send_notification() {
    local subject="$1"
    local message="$2"

    log "NOTIFICATION: $subject - $message"

    # Add email notification logic here if needed
    # Example: sendmail or curl to notification service
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            validate_environment
            create_backup
            cleanup_old_backups
            send_notification "Backup Completed" "Database backup completed successfully"
            ;;
        "restore")
            if [ -z "$2" ]; then
                error_exit "Usage: $0 restore <backup_file>"
            fi
            validate_environment
            restore_backup "$2"
            send_notification "Restore Completed" "Database restore completed successfully"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups "${2:-$RETENTION_DAYS}"
            ;;
        "validate")
            validate_environment
            ;;
        *)
            echo "Usage: $0 {backup|restore <file>|list|cleanup [days]|validate}"
            echo "  backup     - Create a new database backup"
            echo "  restore    - Restore database from backup file"
            echo "  list       - List all available backups"
            echo "  cleanup    - Remove backups older than specified days (default: $RETENTION_DAYS)"
            echo "  validate   - Validate backup environment"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"