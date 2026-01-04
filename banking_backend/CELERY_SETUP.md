# Celery Asynchronous Processing Setup

This document describes the Celery configuration and background task implementation for the Banking Backend system.

## Overview

The system uses Celery with Redis as the message broker and result backend for handling asynchronous background tasks. This enables non-blocking execution of time-consuming operations like report generation, fraud analysis, and email notifications.

## Architecture

- **Message Broker**: Redis (default: redis://127.0.0.1:6379/0)
- **Result Backend**: Redis (default: redis://127.0.0.1:6379/0)
- **Task Serialization**: JSON
- **Timezone**: UTC

## Installation

1. Install required packages:
```bash
pip install -r requirements.txt
```

The following packages are included:
- `celery`: Core Celery library
- `redis`: Redis client
- `flower`: Celery monitoring web interface

## Configuration

### Django Settings

Celery settings are configured in `config/settings.py`:

```python
# Celery Configuration
CELERY_BROKER_URL = env('REDIS_URL', default='redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://127.0.0.1:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = ['json']
CELERY_RESULT_SERIALIZER = ['json']
CELERY_TIMEZONE = TIME_ZONE

# Flower Configuration
FLOWER_PORT = env.int('FLOWER_PORT', default=5555)
FLOWER_BASIC_AUTH = env('FLOWER_BASIC_AUTH', default='admin:admin')
```

### Environment Variables

Set the following environment variables in your `.env` file:

```bash
REDIS_URL=redis://127.0.0.1:6379/0
FLOWER_PORT=5555
FLOWER_BASIC_AUTH=admin:admin
ADMIN_EMAIL=admin@banking.com
DEFAULT_FROM_EMAIL=noreply@banking.com
```

## Tasks

### Available Tasks

1. **generate_daily_reports**
   - Generates daily financial reports
   - Sends email summaries to administrators
   - Scheduled to run daily at midnight

2. **analyze_fraud_patterns**
   - Analyzes transactions for suspicious patterns
   - Creates fraud alerts for large transactions (> $10,000)
   - Detects unusual transaction frequency (> 10 transactions/hour)

3. **send_email_notification**
   - Sends email notifications to users
   - Supports HTML and plain text emails

4. **export_transaction_data**
   - Exports user transaction data in CSV format
   - Supports date range filtering

5. **system_health_check**
   - Performs system health checks
   - Monitors database connectivity
   - Checks for pending transactions and unresolved alerts
   - Scheduled to run every 30 minutes

### Task Usage Examples

```python
from core.tasks import generate_daily_reports, send_email_notification

# Generate daily reports
result = generate_daily_reports.delay()

# Send email notification
send_email_notification.delay(
    user_id=1,
    subject="Account Update",
    message="Your account has been updated successfully."
)

# Export transaction data
export_transaction_data.delay(
    user_id=1,
    start_date="2024-01-01",
    end_date="2024-01-31",
    export_format="csv"
)
```

## Running Celery

### Start Celery Worker

```bash
# From the banking_backend directory
celery -A config worker --loglevel=info
```

### Start Celery Beat (Scheduler)

```bash
# From the banking_backend directory
celery -A config beat --loglevel=info
```

### Start Flower (Monitoring)

```bash
# From the banking_backend directory
celery -A config flower
```

Access Flower at: http://localhost:5555 (default credentials: admin/admin)

## Scheduled Tasks

Celery Beat is configured to run the following scheduled tasks:

- **Daily Reports**: Runs at 00:00 UTC every day
- **System Health Check**: Runs every 30 minutes

Schedule configuration is in `celery.py`:

```python
app.conf.beat_schedule = {
    'generate-daily-reports': {
        'task': 'core.tasks.generate_daily_reports',
        'schedule': crontab(hour=0, minute=0),
    },
    'system-health-check': {
        'task': 'core.tasks.system_health_check',
        'schedule': crontab(minute='*/30'),
    },
}
```

## Error Handling and Retries

All tasks include comprehensive error handling:

- **Retry Logic**: Tasks automatically retry on failure with exponential backoff
- **Max Retries**: Configured per task (3-5 retries typically)
- **Logging**: All errors are logged with appropriate severity levels
- **Graceful Degradation**: Tasks fail gracefully without affecting main application

### Retry Configuration Examples

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def example_task(self):
    try:
        # Task logic here
        pass
    except Exception as exc:
        logger.error(f"Task failed: {exc}")
        self.retry(countdown=60 * (2 ** self.request.retries))
```

## Testing

Run Celery task tests:

```bash
python manage.py test core.tests_celery
```

Test coverage includes:
- Successful task execution
- Error handling and retries
- Edge cases (user not found, invalid formats)
- Mocked external dependencies (email sending, database queries)

## Monitoring and Debugging

### Flower Dashboard

Flower provides real-time monitoring of:
- Active tasks
- Task history
- Worker status
- Queue lengths
- Failed tasks

### Logging

Celery logs are configured through Django's logging system. Check logs for:
- Task execution status
- Error details
- Performance metrics

### Health Checks

The `system_health_check` task monitors:
- Database connectivity
- Pending transactions (>24 hours old)
- Unresolved fraud alerts (>7 days old)

## Production Deployment

### Redis Setup

Ensure Redis is running and accessible:

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### Environment Configuration

Set production environment variables:

```bash
REDIS_URL=redis://your-redis-host:6379/0
FLOWER_BASIC_AUTH=prod-user:secure-password
```

### Process Management

Use process managers like Supervisor or systemd to manage Celery processes:

```ini
# supervisor.conf
[program:celery-worker]
command=celery -A config worker --loglevel=info
directory=/path/to/banking_backend
user=www-data
autostart=true
autorestart=true

[program:celery-beat]
command=celery -A config beat --loglevel=info
directory=/path/to/banking_backend
user=www-data
autostart=true
autorestart=true
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check Redis is running and accessible
2. **Import Errors**: Ensure DJANGO_SETTINGS_MODULE is set correctly
3. **Tasks Not Running**: Verify worker processes are active
4. **Email Not Sending**: Check SMTP configuration in Django settings

### Debug Commands

```bash
# Check Celery configuration
celery -A config inspect active

# List registered tasks
celery -A config inspect registered

# Check worker stats
celery -A config inspect stats
```

## Security Considerations

- Use strong passwords for Flower dashboard
- Restrict Redis access in production
- Monitor task execution for anomalies
- Implement rate limiting for task submission
- Use HTTPS for Flower in production

## Performance Optimization

- **Task Chunking**: Break large tasks into smaller chunks
- **Result Expiration**: Configure result backend cleanup
- **Worker Scaling**: Scale workers based on load
- **Queue Partitioning**: Use separate queues for different task types

## Future Enhancements

- Implement task prioritization
- Add task result caching
- Integrate with monitoring systems (Prometheus, Grafana)
- Implement task chaining and workflows
- Add task execution time monitoring
