from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/messaging/(?P<room_id>\w+)/$', consumers.MessagingConsumer.as_asgi()),
]