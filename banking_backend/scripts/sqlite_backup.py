#!/usr/bin/env python3
"""
SQLite Database Backup Script for Banking Backend
Creates automated backups of the SQLite database with encryption and compression.
"""

import os
import sys
import gzip
import shutil
import sqlite3
import argparse
from datetime import datetime
from pathlib import Path
from cryptography.fernet import Fernet
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()


class SQLiteBackup:
    """Handles SQLite database backup operations with encryption and compression."""

    def __init__(self, backup_dir=None, encryption_key=None):
        self.backup_dir = Path(backup_dir or getattr(settings, 'BACKUP_DIR', 'backups/sqlite'))
        self.encryption_key = encryption_key or getattr(settings, 'BACKUP_ENCRYPTION_KEY', None)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        # Get database path from settings
        db_settings = settings.DATABASES['default']
        self.db_path = Path(db_settings['NAME'])

    def create_backup(self, filename=None):
        """Create a SQLite database backup."""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'sqlite_backup_{timestamp}.db'

        backup_path = self.backup_dir / filename

        print(f"Creating SQLite database backup: {backup_path}")

        try:
            # Connect to source database
            source_conn = sqlite3.connect(str(self.db_path))
            source_conn.execute("PRAGMA wal_checkpoint;")  # Ensure WAL is checkpointed

            # Create backup
            backup_conn = sqlite3.connect(str(backup_path))
            source_conn.backup(backup_conn)

            # Close connections
            backup_conn.close()
            source_conn.close()

            print(f"Backup created successfully: {backup_path}")
            return backup_path

        except Exception as e:
            raise CommandError(f"Failed to create backup: {str(e)}")

    def compress_backup(self, backup_path):
        """Compress the backup file using gzip."""
        compressed_path = backup_path.with_suffix('.db.gz')

        print(f"Compressing backup: {compressed_path}")

        with open(backup_path, 'rb') as f_in:
            with gzip.open(compressed_path, 'wb', compresslevel=9) as f_out:
                shutil.copyfileobj(f_in, f_out)

        # Remove original uncompressed file
        backup_path.unlink()

        print(f"Backup compressed successfully: {compressed_path}")
        return compressed_path

    def encrypt_backup(self, backup_path):
        """Encrypt the backup file using Fernet encryption."""
        if not self.encryption_key:
            print("No encryption key provided. Skipping encryption.")
            return backup_path

        encrypted_path = backup_path.with_suffix('.enc')

        print(f"Encrypting backup: {encrypted_path}")

        cipher = Fernet(self.encryption_key.encode())

        with open(backup_path, 'rb') as f:
            data = f.read()

        encrypted_data = cipher.encrypt(data)

        with open(encrypted_path, 'wb') as f:
            f.write(encrypted_data)

        # Remove original unencrypted file
        backup_path.unlink()

        print(f"Backup encrypted successfully: {encrypted_path}")
        return encrypted_path

    def decrypt_backup(self, encrypted_path, output_path=None):
        """Decrypt a backup file."""
        if not self.encryption_key:
            raise CommandError("Encryption key required for decryption.")

        if not output_path:
            output_path = encrypted_path.with_suffix('')
            if output_path.suffix == '.gz':
                output_path = output_path.with_suffix('')

        print(f"Decrypting backup: {output_path}")

        cipher = Fernet(self.encryption_key.encode())

        with open(encrypted_path, 'rb') as f:
            encrypted_data = f.read()

        decrypted_data = cipher.decrypt(encrypted_data)

        with open(output_path, 'wb') as f:
            f.write(decrypted_data)

        print(f"Backup decrypted successfully: {output_path}")
        return output_path

    def restore_backup(self, backup_path, confirm=True):
        """Restore SQLite database from backup."""
        if confirm:
            response = input(f"Are you sure you want to restore database from {backup_path}? (yes/no): ")
            if response.lower() != 'yes':
                print("Restore cancelled.")
                return

        print(f"Restoring SQLite database from: {backup_path}")

        # Handle encrypted backups
        temp_path = None
        if backup_path.suffix == '.enc':
            temp_path = backup_path.with_suffix('.tmp')
            self.decrypt_backup(backup_path, temp_path)
            backup_path = temp_path

        # Handle compressed backups
        if backup_path.suffix == '.gz':
            temp_path = backup_path.with_suffix('')
            with gzip.open(backup_path, 'rb') as f_in:
                with open(temp_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            backup_path = temp_path

        try:
            # Backup current database
            current_backup = self.db_path.with_suffix('.bak')
            if self.db_path.exists():
                shutil.copy2(self.db_path, current_backup)
                print(f"Current database backed up to: {current_backup}")

            # Restore from backup
            backup_conn = sqlite3.connect(str(backup_path))
            restore_conn = sqlite3.connect(str(self.db_path))

            backup_conn.backup(restore_conn)

            backup_conn.close()
            restore_conn.close()

            print("SQLite database restored successfully.")

        except Exception as e:
            raise CommandError(f"Failed to restore backup: {str(e)}")

        finally:
            # Clean up temporary files
            if temp_path and temp_path.exists():
                temp_path.unlink()

    def list_backups(self):
        """List all available backups."""
        backups = []
        for file_path in self.backup_dir.glob('*'):
            if file_path.is_file() and ('sqlite_backup' in file_path.name or file_path.suffix in ['.db', '.gz', '.enc']):
                stat = file_path.stat()
                backups.append({
                    'name': file_path.name,
                    'path': file_path,
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime)
                })

        # Sort by modification time (newest first)
        backups.sort(key=lambda x: x['modified'], reverse=True)

        return backups

    def cleanup_old_backups(self, keep_days=30):
        """Remove backups older than specified days."""
        from datetime import timedelta

        cutoff_date = datetime.now() - timedelta(days=keep_days)
        removed_count = 0

        for file_path in self.backup_dir.glob('*'):
            if file_path.is_file() and file_path.stat().st_mtime < cutoff_date.timestamp():
                file_path.unlink()
                removed_count += 1
                print(f"Removed old backup: {file_path.name}")

        print(f"Cleaned up {removed_count} old backups.")

    def get_database_stats(self):
        """Get SQLite database statistics."""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            # Get table count and sizes
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()

            stats = {
                'database_size': self.db_path.stat().st_size if self.db_path.exists() else 0,
                'table_count': len(tables),
                'tables': []
            }

            for table_name, in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                row_count = cursor.fetchone()[0]
                stats['tables'].append({
                    'name': table_name,
                    'row_count': row_count
                })

            conn.close()
            return stats

        except Exception as e:
            return {'error': str(e)}


class Command(BaseCommand):
    help = 'SQLite database backup and restore operations'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=['create', 'restore', 'list', 'cleanup', 'stats'],
            help='Action to perform'
        )
        parser.add_argument(
            '--backup-dir',
            help='Directory to store backups'
        )
        parser.add_argument(
            '--filename',
            help='Backup filename (for create action)'
        )
        parser.add_argument(
            '--backup-file',
            help='Backup file to restore (for restore action)'
        )
        parser.add_argument(
            '--encrypt',
            action='store_true',
            help='Encrypt the backup'
        )
        parser.add_argument(
            '--compress',
            action='store_true',
            default=True,
            help='Compress the backup (default: True)'
        )
        parser.add_argument(
            '--keep-days',
            type=int,
            default=30,
            help='Days to keep backups during cleanup (default: 30)'
        )
        parser.add_argument(
            '--no-confirm',
            action='store_true',
            help='Skip confirmation prompts'
        )

    def handle(self, *args, **options):
        backup_manager = SQLiteBackup(
            backup_dir=options.get('backup_dir'),
            encryption_key=getattr(settings, 'BACKUP_ENCRYPTION_KEY', None)
        )

        action = options['action']

        if action == 'create':
            # Create backup
            backup_path = backup_manager.create_backup(options.get('filename'))

            # Compress
            if options['compress']:
                backup_path = backup_manager.compress_backup(backup_path)

            # Encrypt
            if options['encrypt'] or backup_manager.encryption_key:
                backup_path = backup_manager.encrypt_backup(backup_path)

            self.stdout.write(
                self.style.SUCCESS(f'SQLite backup created successfully: {backup_path}')
            )

        elif action == 'restore':
            if not options.get('backup_file'):
                raise CommandError('--backup-file is required for restore action')

            backup_path = Path(options['backup_file'])
            if not backup_path.exists():
                raise CommandError(f'Backup file does not exist: {backup_path}')

            backup_manager.restore_backup(
                backup_path,
                confirm=not options['no_confirm']
            )

            self.stdout.write(
                self.style.SUCCESS('SQLite database restored successfully')
            )

        elif action == 'list':
            backups = backup_manager.list_backups()

            if not backups:
                self.stdout.write('No backups found.')
                return

            self.stdout.write('Available SQLite backups:')
            for backup in backups:
                size_mb = backup['size'] / (1024 * 1024)
                self.stdout.write(
                    f"  {backup['name']} - {size_mb:.2f} MB - {backup['modified']}"
                )

        elif action == 'cleanup':
            backup_manager.cleanup_old_backups(options['keep_days'])
            self.stdout.write(
                self.style.SUCCESS('Cleanup completed')
            )

        elif action == 'stats':
            stats = backup_manager.get_database_stats()
            if 'error' in stats:
                self.stdout.write(
                    self.style.ERROR(f'Failed to get database stats: {stats["error"]}')
                )
            else:
                self.stdout.write('SQLite Database Statistics:')
                self.stdout.write(f"  Database size: {stats['database_size'] / (1024*1024):.2f} MB")
                self.stdout.write(f"  Tables: {stats['table_count']}")
                for table in stats['tables']:
                    self.stdout.write(f"    {table['name']}: {table['row_count']} rows")


if __name__ == '__main__':
    # Allow running as standalone script
    command = Command()
    parser = argparse.ArgumentParser(description='SQLite database backup operations')
    command.add_arguments(parser)
    args = parser.parse_args()

    # Convert args to options dict
    options = vars(args)
    command.handle(**options)