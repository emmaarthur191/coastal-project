from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<session_id>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/support/(?P<session_id>[^/]+)/$', consumers.SupportChatConsumer.as_asgi()),
]