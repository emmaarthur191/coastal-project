from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Create the main router
router = DefaultRouter()
router.register(r'sessions', views.ChatSessionViewSet, basename='chatsession')
router.register(r'tickets', views.SupportTicketViewSet, basename='supportticket')
router.register(r'analytics', views.ChatAnalyticsViewSet, basename='chatanalytics')

# Create nested routers for messages and tickets under sessions
session_router = routers.NestedDefaultRouter(router, r'sessions', lookup='session')
session_router.register(r'messages', views.ChatMessageViewSet, basename='chatmessage')
session_router.register(r'tickets', views.SupportTicketViewSet, basename='session-ticket')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(session_router.urls)),
    path('sessions/<uuid:session_id>/messages/read/', views.mark_messages_read, name='mark-messages-read'),
]