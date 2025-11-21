# Superuser Integration Documentation

## Overview

This document describes the integration of superuser functionalities into the banking backend system. The superuser role provides elevated access controls, administrative overrides, and privileged operations for system management and emergency situations.

## Features Implemented

### 1. Superuser Role
- Added 'superuser' role to the user hierarchy (highest level)
- Superuser has access to all system functions and can bypass normal restrictions
- Role hierarchy: customer (0) < cashier (1) < mobile_banker (2) < manager (3) < operations_manager (4) < administrator (5) < superuser (6)

### 2. Superuser Operations API
The `/users/superuser-operations/` endpoint provides the following operations:

#### Core Operations
- **bypass_security**: Temporarily bypass security checks
- **emergency_access**: Grant emergency system access
- **system_reset**: Initiate system reset procedures
- **audit_bypass**: Temporarily bypass audit logging

#### User Management
- **create_user**: Create new user accounts with any role
- **modify_user_role**: Change user roles (including to superuser)
- **activate_user**: Activate deactivated user accounts
- **deactivate_user**: Deactivate user accounts

#### System Management
- **create_branch**: Create new bank branches
- **system_health**: Check database and system health
- **backup_database**: Trigger database backup
- **monitor_activity**: Monitor user activities and system logs

#### System Configuration
- **update_system_setting**: Update system configuration settings
- **get_system_settings**: Retrieve all system settings
- **reset_system_setting**: Reset a system setting to its default value

### 3. Automated Backup System
- SQLite-specific backup script with compression and encryption
- Daily automated backups at configurable time (default: 2:00 AM)
- Backup retention policy (30 days by default)
- Encrypted backups using Fernet encryption

### 4. Enhanced Permissions
- `IsSuperuser` permission class for superuser-only access
- Updated existing permission classes to include superuser access
- Hierarchical permission system maintained

### 5. Security Features
- All superuser operations are logged with audit trails
- Operation IDs generated for tracking
- Reason required for all operations
- Comprehensive error handling and validation

## API Usage

### Authentication
Superuser operations require JWT authentication with a user having 'superuser' role.

### Request Format
```json
{
  "operation": "operation_name",
  "reason": "Justification for the operation",
  "target": "target_identifier",  // Optional, operation-specific
  // Additional operation-specific fields
}
```

### Response Format
```json
{
  "message": "Operation completed successfully",
  "operation_id": "op_20251120_120000_123",
  "data": {
    // Operation-specific response data
  }
}
```

## Operation Details

### create_user
Creates a new user account with specified role.

**Request:**
```json
{
  "operation": "create_user",
  "reason": "Creating new manager account",
  "email": "newmanager@bank.com",
  "first_name": "John",
  "last_name": "Manager",
  "role": "manager"
}
```

**Response:**
```json
{
  "message": "Operation completed successfully",
  "operation_id": "op_20251120_120000_123",
  "data": {
    "user_id": "uuid-string",
    "email": "newmanager@bank.com",
    "role": "manager",
    "status": "created"
  }
}
```

### modify_user_role
Changes a user's role.

**Request:**
```json
{
  "operation": "modify_user_role",
  "reason": "Promoting to operations manager",
  "target": "user-uuid",
  "role": "operations_manager"
}
```

### system_health
Checks system and database health.

**Response:**
```json
{
  "data": {
    "database": {
      "healthy": true,
      "stats": {"user_count": 150}
    },
    "system": {
      "cpu_percent": 45.5,
      "memory_percent": 60.0,
      "memory_used": 6144000000,
      "memory_total": 10240000000,
      "disk_free_percent": 25.0,
      "uptime": 1609459200.0
    },
    "timestamp": "2025-11-20T12:00:00.000Z"
  }
}
```

### backup_database
Triggers immediate database backup.

**Response:**
```json
{
  "data": {
    "status": "success",
    "output": "Backup completed successfully: backups/sqlite/daily_backup_20251120_120000.db.gz"
  }
}
```

### monitor_activity
Returns recent system activity.

**Response:**
```json
{
  "data": {
    "active_users_24h": 45,
    "recent_logs": [
      {
        "timestamp": "2025-11-20T11:45:00.000Z",
        "user": "admin@bank.com",
        "action": "user_created",
        "description": "User created: newuser@bank.com"
      }
    ],
    "recent_security_events": [],
    "timestamp": "2025-11-20T12:00:00.000Z"
  }
}
```

### update_system_setting
Updates a system configuration setting.

**Request:**
```json
{
  "operation": "update_system_setting",
  "reason": "Adjusting transaction limits",
  "setting_key": "max_daily_transactions",
  "setting_value": "1000"
}
```

**Response:**
```json
{
  "message": "Operation completed successfully",
  "operation_id": "op_20251120_120000_123",
  "data": {
    "setting_key": "max_daily_transactions",
    "old_value": "500",
    "new_value": "1000",
    "status": "updated"
  }
}
```

### get_system_settings
Retrieves all system configuration settings.

**Request:**
```json
{
  "operation": "get_system_settings",
  "reason": "Reviewing current configuration"
}
```

**Response:**
```json
{
  "message": "Operation completed successfully",
  "operation_id": "op_20251120_120000_123",
  "data": {
    "settings": [
      {
        "key": "max_daily_transactions",
        "value": "1000",
        "value_type": "integer",
        "description": "Maximum transactions per day",
        "is_public": false,
        "is_active": true,
        "category": "transactions"
      }
    ],
    "total_count": 25,
    "timestamp": "2025-11-20T12:00:00.000Z"
  }
}
```

### reset_system_setting
Resets a system setting to its default value.

**Request:**
```json
{
  "operation": "reset_system_setting",
  "reason": "Reverting to default configuration",
  "target": "max_daily_transactions"
}
```

**Response:**
```json
{
  "message": "Operation completed successfully",
  "operation_id": "op_20251120_120000_123",
  "data": {
    "setting_key": "max_daily_transactions",
    "old_value": "1000",
    "new_value": "500",
    "status": "reset"
  }
}
```

## Setup Instructions

### 1. Create Superuser Account
```bash
cd banking_backend
python manage.py create_superuser --email superuser@bank.com --first-name Super --last-name User
```

### 2. Configure Backup Settings
Add to settings.py or environment variables:
```python
BACKUP_ENCRYPTION_KEY = "your-encryption-key-here"
DAILY_BACKUP_DIR = "backups/daily"
DAILY_BACKUP_TIME = "02:00"  # 2 AM
```

### 3. Run Automated Backups
```bash
# Run once
python scripts/daily_backup.py --run-once

# Start scheduler
python scripts/daily_backup.py
```

### 4. Manual Database Backup
```bash
python manage.py sqlite_backup create --compress --encrypt
```

## Security Considerations

### Access Control
- Only users with 'superuser' role can perform superuser operations
- All operations require justification (reason field)
- Operations are logged with full audit trails

### Encryption
- Database backups are encrypted using Fernet encryption
- Encryption keys should be stored securely (environment variables recommended)
- Backup files are compressed before encryption

### Audit Logging
- All superuser operations are logged in the audit log
- Operation IDs allow tracking of related activities
- Failed operations are logged with error details

## Testing

### Unit Tests
Run superuser operation tests:
```bash
python manage.py test users.tests.test_superuser_operations
```

### Integration Tests
Test full system integration:
```bash
python manage.py test --pattern="*superuser*"
```

### Manual Testing
1. Create superuser account
2. Authenticate as superuser
3. Test each operation endpoint
4. Verify audit logs contain operation records
5. Test backup functionality

## Database Schema Changes

### User Model
- Added 'superuser' to ROLE_CHOICES
- Updated role hierarchy methods

### New Tables
- No new tables required (uses existing User, AuditLog, SecurityEvent tables)

### Migrations
Run migrations after code deployment:
```bash
python manage.py makemigrations
python manage.py migrate
```

## Monitoring and Maintenance

### Backup Monitoring
- Check backup directory regularly for successful backups
- Monitor backup script logs for errors
- Verify backup integrity periodically

### Audit Review
- Regularly review superuser operation logs
- Monitor for unusual patterns or unauthorized access attempts
- Set up alerts for critical operations

### Performance Impact
- Superuser operations are designed to be lightweight
- Database backups run asynchronously
- System health checks have minimal performance impact

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure user has 'superuser' role
   - Check JWT token is valid and not expired

2. **Backup Failures**
   - Check file system permissions on backup directory
   - Verify encryption key is properly configured
   - Check available disk space

3. **Database Connection Issues**
   - Verify database is accessible
   - Check database credentials
   - Review database server logs

### Logs and Debugging
- Superuser operations log to: `logs/banking_security.log`
- Backup operations log to: `logs/daily_backup.log`
- Database operations log to Django default logs

## Future Enhancements

### Planned Features
- Multi-factor authentication for superuser operations
- Approval workflows for critical operations
- Real-time monitoring dashboard
- Automated security incident response
- Advanced audit analytics

### Scalability Considerations
- Distributed backup systems for high-availability setups
- Load balancing for superuser operation endpoints
- Caching for frequently accessed system health data

## Support and Contact

For technical support or questions about superuser functionality:
- Review this documentation
- Check system logs for error details
- Contact system administrators
- Review audit logs for operation history

## Change Log

### Version 1.0.0
- Initial implementation of superuser role and operations
- SQLite backup system with encryption
- Comprehensive audit logging
- Unit and integration tests
- Automated daily backup scheduler