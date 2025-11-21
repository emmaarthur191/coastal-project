#!/usr/bin/env python3
"""
Automated Daily Backup Script for Banking Backend
Runs automated SQLite database backups with encryption and compression.
"""

import os
import sys
import schedule
import time
import logging
from datetime import datetime
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from scripts.sqlite_backup import SQLiteBackup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/daily_backup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DailyBackupManager:
    """Manages automated daily backups."""

    def __init__(self):
        self.backup_manager = SQLiteBackup(
            backup_dir=getattr(settings, 'DAILY_BACKUP_DIR', 'backups/daily'),
            encryption_key=getattr(settings, 'BACKUP_ENCRYPTION_KEY', None)
        )
        self.backup_time = getattr(settings, 'DAILY_BACKUP_TIME', '02:00')  # 2 AM default

    def run_daily_backup(self):
        """Run the daily backup process."""
        try:
            logger.info("Starting daily backup process")

            # Create backup with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'daily_backup_{timestamp}.db'

            backup_path = self.backup_manager.create_backup(filename)
            logger.info(f"Database backup created: {backup_path}")

            # Compress the backup
            backup_path = self.backup_manager.compress_backup(backup_path)
            logger.info(f"Backup compressed: {backup_path}")

            # Encrypt if key is available
            if self.backup_manager.encryption_key:
                backup_path = self.backup_manager.encrypt_backup(backup_path)
                logger.info(f"Backup encrypted: {backup_path}")

            # Cleanup old backups (keep last 30 days)
            self.backup_manager.cleanup_old_backups(keep_days=30)

            logger.info("Daily backup process completed successfully")

        except Exception as e:
            logger.error(f"Daily backup failed: {str(e)}")
            raise

    def start_scheduler(self):
        """Start the backup scheduler."""
        logger.info(f"Scheduling daily backups at {self.backup_time}")

        # Schedule the backup
        schedule.every().day.at(self.backup_time).do(self.run_daily_backup)

        logger.info("Backup scheduler started. Press Ctrl+C to stop.")

        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Backup scheduler stopped by user")
        except Exception as e:
            logger.error(f"Scheduler error: {str(e)}")
            raise

    def run_once(self):
        """Run backup once (for manual execution)."""
        logger.info("Running manual backup")
        self.run_daily_backup()


def main():
    """Main function."""
    import argparse

    parser = argparse.ArgumentParser(description='Daily backup automation')
    parser.add_argument('--run-once', action='store_true', help='Run backup once and exit')
    parser.add_argument('--time', help='Backup time in HH:MM format (default: 02:00)')

    args = parser.parse_args()

    manager = DailyBackupManager()

    if args.time:
        manager.backup_time = args.time

    if args.run_once:
        manager.run_once()
    else:
        manager.start_scheduler()


if __name__ == '__main__':
    main()