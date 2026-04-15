from django.urls import re_path

from core.consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r"ws/messaging/(?P<room_id>\d+)/$", ChatConsumer.as_asgi()),
]
