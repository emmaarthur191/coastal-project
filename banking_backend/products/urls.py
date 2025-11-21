from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ProductCategoryViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'promotions', views.PromotionViewSet)
router.register(r'recommendations', views.ProductRecommendationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('enroll/', views.enroll_product, name='enroll_product'),
    path('compare/', views.compare_products, name='compare_products'),
    path('analytics/promotions/', views.PromotionAnalyticsView.as_view(), name='promotion_analytics'),
]