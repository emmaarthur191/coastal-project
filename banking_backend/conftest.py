import os
import django
from django.conf import settings
from unittest.mock import patch, MagicMock, AsyncMock

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Mock channel layer to avoid Redis dependency in tests
mock_channel_layer = MagicMock()
mock_channel_layer.group_send = AsyncMock()
patch('channels.layers.get_channel_layer', return_value=mock_channel_layer).start()

django.setup()