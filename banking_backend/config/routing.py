from django.urls import re_path
from core.consumers import BankingMessageConsumer, FraudAlertConsumer, NotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/messaging/(?P<user_id>\d+)/$', BankingMessageConsumer.as_asgi()),
    re_path(r'ws/fraud-alerts/(?P<user_id>\d+)/$', FraudAlertConsumer.as_asgi()),
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', NotificationConsumer.as_asgi()),
]