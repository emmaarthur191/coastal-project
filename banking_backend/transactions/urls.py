from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, FastTransferViewSet, CheckDepositViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'transfers', FastTransferViewSet, basename='transfers')
router.register(r'check-deposits', CheckDepositViewSet, basename='check-deposits')

urlpatterns = router.urls