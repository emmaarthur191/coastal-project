from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from core.health import health_check, health_check_simple

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/users/", include("users.urls")),
    # Health checks
    path("api/health/", health_check, name="health-check"),
    path("api/health/simple/", health_check_simple, name="health-check-simple"),
    # OpenAPI schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Favicon
    path("favicon.ico", RedirectView.as_view(url="/static/core/favicon.ico", permanent=True)),
    # Root path
    path("", health_check_simple, name="root"),
]
