"""
Settings app views - TEMPORARILY DISABLED

This file has been temporarily disabled because it references models that don't exist yet.
The only model that exists is SystemSetting (singular).

TODO: Create the following models:
- UserSettings
- APIUsage  
- APIRateLimit
- HealthCheck

Once these models are created, uncomment the views below and update the imports.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

# Temporary simple health check endpoint
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_health_check(request):
    """Simple API health check endpoint."""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now(),
        'version': '1.0.0',
        'service': 'banking-api'
    })