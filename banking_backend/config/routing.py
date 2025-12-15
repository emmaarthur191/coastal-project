from .consumers import SimpleMessagingConsumer

websocket_urlpatterns = [
    re_path(r'ws/messaging/global/$', SimpleMessagingConsumer.as_asgi()),
]