"""Management command to wait for the database to be ready.

This command is used in containerized deployments to ensure the database
is available before running migrations or starting the server.
"""

import sys
import time

from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    """Django command to pause execution until the database is available."""

    help = "Waits for the database to be available."

    def add_arguments(self, parser):
        """Define command arguments."""
        parser.add_argument(
            "--timeout",
            type=int,
            default=30,
            help="Maximum time to wait for the database in seconds (default: 30)",
        )
        parser.add_argument(
            "--interval",
            type=float,
            default=1.0,
            help="Time between connection attempts in seconds (default: 1.0)",
        )

    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write("Waiting for database...")
        timeout = options["timeout"]
        interval = options["interval"]
        start_time = time.time()

        db_conn = None
        while not db_conn:
            try:
                db_conn = connections["default"]
                # Force a connection check
                db_conn.ensure_connection()
                self.stdout.write(self.style.SUCCESS("Database available!"))
            except OperationalError:
                elapsed = time.time() - start_time
                if elapsed >= timeout:
                    self.stdout.write(self.style.ERROR(f"Database not available after {timeout} seconds. Giving up."))
                    sys.exit(1)
                self.stdout.write(f"Database unavailable, waiting {interval}s... ({int(elapsed)}/{timeout}s)")
                time.sleep(interval)
                db_conn = None
