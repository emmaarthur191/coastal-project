"""
Rate limiting middleware for the banking backend API.
Implements token bucket algorithm for rate limiting.
"""

import time
import logging
from collections import defaultdict, deque
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RateLimitingMiddleware(MiddlewareMixin):
    """
    Middleware that implements rate limiting for API endpoints.
    Uses token bucket algorithm for smooth rate limiting.
    """
    
    # Rate limits configuration (requests per hour per endpoint per role)
    RATE_LIMITS = {
        # Authentication endpoints - stricter limits
        'users_api:login': {
            'anonymous': 5,  # 5 attempts per hour for anonymous
            'authenticated': 10,
        },
        'users_api:password_reset': {
            'anonymous': 3,  # 3 password reset requests per hour
            'authenticated': 5,
        },
        'users_api:register': {
            'anonymous': 3,  # 3 registration attempts per hour
        },
        # Transaction endpoints
        'transactions:transactions-process': {
            'cashier': 100,
            'manager': 100,
            'operations_manager': 100,
            'member': 0  # Members cannot process transactions
        },
        'transactions:transactions-transfer': {
            'cashier': 50,
            'manager': 50,
            'operations_manager': 50,
            'member': 0
        },
        'transfers:transfers-fast-transfer': {
            'cashier': 30,
            'manager': 30,
            'operations_manager': 30,
            'member': 30
        },
        'transactions:transactions-list': {
            'cashier': 1000,
            'manager': 1000,
            'operations_manager': 1000,
            'member': 500
        }
    }
    
    # Default rate limits for endpoints not explicitly configured
    DEFAULT_RATE_LIMIT = 100
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Store rate limiting data in memory (in production, use Redis)
        self.rate_data = defaultdict(lambda: defaultdict(deque))
        
    def get_user_role(self, request):
        """Get the user's role from request."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            return getattr(request.user, 'role', 'anonymous')
        return 'anonymous'
    
    def get_rate_limit_key(self, request):
        """Generate rate limit key based on user and endpoint."""
        user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else 'anonymous'
        endpoint = self.get_endpoint_name(request)
        return f"{user_id}:{endpoint}"
    
    def get_endpoint_name(self, request):
        """Get the endpoint name for rate limiting."""
        # Extract view name from resolver match
        resolver_match = request.resolver_match
        if resolver_match:
            return resolver_match.view_name
        return 'unknown'
    
    def is_rate_limited(self, request):
        """Check if request should be rate limited."""
        # Skip rate limiting for superusers
        user_role = self.get_user_role(request)
        if user_role == 'superuser':
            return False

        # Skip rate limiting for certain paths
        if any(path in request.path for path in ['/admin/', '/health/', '/metrics/']):
            return False

        # Skip rate limiting for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return False
        
        endpoint_name = self.get_endpoint_name(request)
        user_role = self.get_user_role(request)
        
        # Get rate limit for this endpoint and role
        rate_limit = self.DEFAULT_RATE_LIMIT
        if endpoint_name in self.RATE_LIMITS:
            endpoint_limits = self.RATE_LIMITS[endpoint_name]
            if user_role in endpoint_limits:
                rate_limit = endpoint_limits[user_role]
        
        # If rate limit is 0, completely deny access
        if rate_limit == 0:
            return True
        
        # Calculate current time bucket (hourly)
        current_time = int(time.time() // 3600)  # Hourly buckets
        
        # Get rate limiting data for this user+endpoint
        rate_key = self.get_rate_limit_key(request)
        user_buckets = self.rate_data[rate_key]
        
        # Clean up old entries and get current count
        now_bucket = current_time
        if now_bucket in user_buckets:
            # Remove entries older than current bucket
            while user_buckets[now_bucket] and user_buckets[now_bucket][0] < now_bucket * 3600:
                user_buckets[now_bucket].popleft()
            
            # Check if limit exceeded
            if len(user_buckets[now_bucket]) >= rate_limit:
                return True
        
        return False
    
    def process_request(self, request):
        """Process request and check rate limits."""
        if not hasattr(request, 'resolver_match'):
            return None
        
        if self.is_rate_limited(request):
            # Log rate limit violation
            endpoint_name = self.get_endpoint_name(request)
            user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else 'anonymous'
            logger.warning(f"Rate limit exceeded for user {user_id} on endpoint {endpoint_name}")
            
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': 'Too many requests. Please try again later.',
                'retry_after': 3600  # 1 hour in seconds
            }, status=429)
        
        return None
    
    def process_response(self, request, response):
        """Add rate limiting headers to response."""
        # Handle async responses (coroutines)
        if hasattr(response, '__await__'):
            # For async responses, we can't modify headers here
            # The headers will be added by the async handler
            return response

        # Skip if response is not a proper HTTP response
        if not hasattr(response, 'status_code'):
            return response

        if hasattr(request, 'resolver_match') and response.status_code != 429:
            endpoint_name = self.get_endpoint_name(request)
            user_role = self.get_user_role(request)

            # Get rate limit for this endpoint and role
            rate_limit = self.DEFAULT_RATE_LIMIT
            if endpoint_name in self.RATE_LIMITS:
                endpoint_limits = self.RATE_LIMITS[endpoint_name]
                if user_role in endpoint_limits:
                    rate_limit = endpoint_limits[user_role]

            # Calculate remaining requests
            rate_key = self.get_rate_limit_key(request)
            user_buckets = self.rate_data[rate_key]
            current_time_bucket = int(time.time() // 3600)

            # Clean up old entries
            for bucket in list(user_buckets.keys()):
                if bucket < current_time_bucket:
                    del user_buckets[bucket]

            # Get current usage
            current_usage = len(user_buckets.get(current_time_bucket, []))
            remaining = max(0, rate_limit - current_usage)

            # Add rate limit headers
            response['X-RateLimit-Limit'] = str(rate_limit)
            response['X-RateLimit-Remaining'] = str(remaining)
            response['X-RateLimit-Reset'] = str((current_time_bucket + 1) * 3600)

        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """Add rate limit tracking for successful requests."""
        if hasattr(request, 'resolver_match') and self.is_rate_limited(request):
            # This will be handled by process_request, so we don't need to do anything here
            pass
        else:
            # Track successful requests for rate limiting
            if hasattr(request, 'resolver_match') and request.method in ['POST', 'PUT', 'PATCH']:
                rate_key = self.get_rate_limit_key(request)
                current_time = int(time.time())
                current_bucket = int(time.time() // 3600)
                
                user_buckets = self.rate_data[rate_key]
                if current_bucket not in user_buckets:
                    user_buckets[current_bucket] = deque()
                
                user_buckets[current_bucket].append(current_time)
        
        return None