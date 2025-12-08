from django.urls import re_path
from .consumers import MessagingConsumer

websocket_urlpatterns = [
    re_path(r'ws/messaging/(?P<thread_id>[^/]+)/$', MessagingConsumer.as_asgi()),
]