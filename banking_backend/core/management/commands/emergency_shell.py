import logging
import sys
from django.core.management.commands.shell import Command as ShellCommand

logger = logging.getLogger(__name__)


class Command(ShellCommand):
    help = "Disaster Recovery Emergency Shell with local KEK fallback capability."

    def handle(self, *args, **options):
        sys.stderr.write("\n" + "!" * 80 + "\n")
        sys.stderr.write("!!! WARNING: DISASTER RECOVERY EMERGENCY SHELL ACTIVE !!!\n")
        sys.stderr.write("!!! Local KEK fallback is enabled. This session bypasses normal KMS gates. !!!\n")
        sys.stderr.write("!!! All actions in this shell are highly sensitive and must be audited. !!!\n")
        sys.stderr.write("!" * 80 + "\n\n")

        logger.critical("EMERGENCY SHELL SESSION INITIALIZED BY USER WITH LOCAL KEK FALLBACK.")
        super().handle(*args, **options)
