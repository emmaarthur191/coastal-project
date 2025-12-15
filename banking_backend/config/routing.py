from django.urls import re_path
from core.consumers import SimpleMessagingConsumer

websocket_urlpatterns = [
    re_path(r'ws/messaging/global/$', SimpleMessagingConsumer.as_asgi()),
]