"""Health check endpoints for system monitoring."""

import platform
import time

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET


@csrf_exempt
@require_GET
def health_check(request):
    """Comprehensive health check endpoint.
    Returns system status including database, cache, and system info.
    """
    start_time = time.time()

    health_status = {
        "status": "healthy",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "checks": {},
        "system": {},
    }

    # Database check
    db_status = check_database()
    health_status["checks"]["database"] = db_status

    # Cache check
    cache_status = check_cache()
    health_status["checks"]["cache"] = cache_status

    # System info
    health_status["system"] = get_system_info()

    # Overall status
    all_healthy = all(check.get("status") == "healthy" for check in health_status["checks"].values())
    health_status["status"] = "healthy" if all_healthy else "degraded"

    # Response time
    health_status["response_time_ms"] = round((time.time() - start_time) * 1000, 2)

    status_code = 200 if health_status["status"] == "healthy" else 503
    return JsonResponse(health_status, status=status_code)


def check_database():
    """Check database connectivity."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return {
            "status": "healthy",
            "message": "Database connection successful",
            "backend": connection.vendor,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": str(e),
        }


def check_cache():
    """Check cache connectivity."""
    try:
        test_key = "_health_check_test_"
        test_value = "healthy"

        # Try to set and get a value
        cache.set(test_key, test_value, timeout=10)
        result = cache.get(test_key)
        cache.delete(test_key)

        if result == test_value:
            return {
                "status": "healthy",
                "message": "Cache connection successful",
            }
        else:
            return {
                "status": "degraded",
                "message": "Cache read/write mismatch",
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": str(e),
        }


def get_system_info():
    """Get basic system information."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.system(),
        "platform_release": platform.release(),
        "processor": platform.processor() or "Unknown",
        "hostname": platform.node(),
    }


@csrf_exempt
@require_GET
def health_check_simple(request):
    """Simple health check for load balancers (just returns OK)."""
    return JsonResponse({"status": "ok"})
