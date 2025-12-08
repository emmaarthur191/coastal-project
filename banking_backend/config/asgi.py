"""
ASGI config for banking_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from banking_backend.middleware.websocket_auth import WebSocketJWTAuthMiddleware
from operations.routing import websocket_urlpatterns as operations_websocket_urlpatterns
from messaging.routing import websocket_urlpatterns as messaging_websocket_urlpatterns

websocket_urlpatterns = operations_websocket_urlpatterns + messaging_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": WebSocketJWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})