from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MessageThreadViewSet, MessageViewSet, EncryptionKeyViewSet,
    CallLogViewSet, DeviceViewSet, MessageReadStatusViewSet, MessageBackupViewSet, StaffUsersView
)

router = DefaultRouter()
router.register(r'threads', MessageThreadViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'encryption-keys', EncryptionKeyViewSet)
router.register(r'call-logs', CallLogViewSet)
router.register(r'devices', DeviceViewSet)
router.register(r'read-statuses', MessageReadStatusViewSet)
router.register(r'backups', MessageBackupViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('staff-users/', StaffUsersView.as_view({'get': 'list'}), name='staff-users'),
]