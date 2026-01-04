"""Core models package for Coastal Banking.

This package provides backward compatibility with existing imports from core.models.
The modular structure (accounts.py, transactions.py, etc.) is prepared for future
gradual migration but currently all models are served from models_legacy.py.

Usage:
    from core.models import Account, Transaction  # Works as before
"""

# Import everything from the legacy models file for full backward compatibility
# This ensures all existing code continues to work without changes
from core.models_legacy import *  # noqa: F403

# Note: The modular files (accounts.py, transactions.py, etc.) contain the same
# models but are not imported here to avoid duplicate model registration.
# They are provided as reference for future gradual migration where:
# 1. Models would be moved one-by-one to the new modules
# 2. Migrations would be generated and applied
# 3. Legacy file would be deprecated
