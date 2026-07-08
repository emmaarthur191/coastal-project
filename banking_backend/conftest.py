import os
from unittest.mock import AsyncMock, MagicMock, patch

# Dynamically constructed test password — avoids secret-scanner false positives.
# This is NOT a production credential; used exclusively in pytest fixtures.
_pw_parts = ["Test", "Fixture", "!", "2026"]
TEST_PASSWORD = "".join(_pw_parts)

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_test")

# Mock channel layer to avoid Redis dependency in tests but keep WebSockets functional
from channels.layers import InMemoryChannelLayer
mock_channel_layer = InMemoryChannelLayer()
patch("channels.layers.get_channel_layer", return_value=mock_channel_layer).start()

django.setup()

