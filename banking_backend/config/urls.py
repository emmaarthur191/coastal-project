"""
URL configuration for banking_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include,  # path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from authentication.views import frontend_login
from monitoring.views import BankingHealthCheckView, prometheus_metrics_view, system_health_view, banking_metrics_view

urlpatterns = [
    # Root URL redirects to web interface
    path('', RedirectView.as_view(url='/users/web/dashboard/', permanent=False), name='root'),

    # Frontend login (blocks superusers)
    path('login/', frontend_login, name='frontend_login'),

    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/banking/', include('banking.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/fraud/', include('fraud_detection.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/settings/', include('settings.urls')),
    # path('api/products/', include('products.urls')),
    # path('api/services/', include('services.urls')),
    path('api/performance/', include('performance.urls')),
    # path('api/security/', include('banking_backend.views.urls')),
    # path('api/audit/', include('banking_backend.utils.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Health and monitoring endpoints
    path('health/', BankingHealthCheckView.as_view(), name='health_check'),
    path('health/system/', system_health_view, name='system_health'),
    path('health/banking/', banking_metrics_view, name='banking_metrics'),
    path('metrics/', prometheus_metrics_view, name='prometheus_metrics'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)