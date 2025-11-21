from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for the ViewSets
router = DefaultRouter()
router.register(r'requests', views.ServiceRequestViewSet, basename='servicerequest')
router.register(r'checkbook-requests', views.CheckbookRequestViewSet, basename='checkbookrequest')
router.register(r'statement-requests', views.StatementRequestViewSet, basename='statementrequest')
router.register(r'loan-info-requests', views.LoanInfoRequestViewSet, basename='loaninforequest')
router.register(r'stats', views.ServiceRequestStatsView, basename='servicerequeststats')

urlpatterns = [
    path('', include(router.urls)),
]