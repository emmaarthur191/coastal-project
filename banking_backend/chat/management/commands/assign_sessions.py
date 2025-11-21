from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count, Q
from chat.models import ChatSession
from users.models import User
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Automatically assign waiting chat sessions to available cashiers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--max-sessions',
            type=int,
            default=5,
            help='Maximum sessions per cashier (default: 5)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        max_sessions = options['max_sessions']

        self.stdout.write('Starting automatic chat session assignment...')

        # Get all waiting sessions
        waiting_sessions = ChatSession.objects.filter(
            status='waiting'
        ).order_by('-priority', 'started_at')

        if not waiting_sessions.exists():
            self.stdout.write('No waiting sessions found.')
            return

        self.stdout.write(f'Found {waiting_sessions.count()} waiting sessions.')

        # Get available cashiers (not at max capacity)
        available_cashiers = self.get_available_cashiers(max_sessions)

        if not available_cashiers:
            self.stdout.write('No available cashiers found.')
            return

        self.stdout.write(f'Found {len(available_cashiers)} available cashiers.')

        # Assign sessions to cashiers
        assignments_made = 0

        for session in waiting_sessions:
            assigned = False

            for cashier in available_cashiers:
                if self.can_assign_to_cashier(cashier, max_sessions):
                    if dry_run:
                        self.stdout.write(
                            f'Would assign session {session.id} to cashier {cashier.email}'
                        )
                    else:
                        try:
                            session.assign_cashier(cashier)
                            self.stdout.write(
                                f'Assigned session {session.id} to cashier {cashier.email}'
                            )
                            assignments_made += 1
                        except Exception as e:
                            logger.error(f'Failed to assign session {session.id}: {str(e)}')
                            continue

                    assigned = True
                    break

            if not assigned:
                self.stdout.write(
                    f'Could not assign session {session.id} - no suitable cashier available'
                )

        if dry_run:
            self.stdout.write(f'Would make {assignments_made} assignments.')
        else:
            self.stdout.write(f'Made {assignments_made} assignments.')

    def get_available_cashiers(self, max_sessions):
        """Get cashiers who are not at maximum capacity."""
        # Get all cashiers
        cashiers = User.objects.filter(role='cashier')

        available_cashiers = []

        for cashier in cashiers:
            # Count current active sessions for this cashier
            active_sessions = ChatSession.objects.filter(
                assigned_cashier=cashier,
                status__in=['active', 'waiting']
            ).count()

            if active_sessions < max_sessions:
                available_cashiers.append(cashier)

        return available_cashiers

    def can_assign_to_cashier(self, cashier, max_sessions):
        """Check if a cashier can take another session."""
        active_sessions = ChatSession.objects.filter(
            assigned_cashier=cashier,
            status__in=['active', 'waiting']
        ).count()

        return active_sessions < max_sessions