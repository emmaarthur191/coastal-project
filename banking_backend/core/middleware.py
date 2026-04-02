import contextvars
import uuid
from urllib.parse import parse_qs

# Deferred imports inside functions to avoid AppRegistryNotReady during logging setup
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user(token_key):
    from django.contrib.auth import get_user_model
    from django.contrib.auth.models import AnonymousUser

    User = get_user_model()
    try:
        access_token = AccessToken(token_key)
        user_id = access_token.payload.get("user_id")
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Custom middleware that takes a JWT token from the query string
    and authenticates the user.
    """

    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        from django.conf import settings

        # 1. Try to get token from Cookies (Secure Method)
        token = None
        headers = dict(scope["headers"])
        if b"cookie" in headers:
            from http.cookies import SimpleCookie

            cookies = SimpleCookie(headers[b"cookie"].decode())
            cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
            if cookie_name in cookies:
                token = cookies[cookie_name].value

        # 2. Fallback: Query String (Legacy/Dev - Not recommended for Prod but kept for transition if needed)
        # In strict production, we might want to disable this, but risk breaking existing clients relying on it.
        if not token:
            query_string = scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            token_list = query_params.get("token")
            if token_list:
                token = token_list[0]

        if token:
            scope["user"] = await get_user(token)
        else:
            from django.contrib.auth.models import AnonymousUser

            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


# ContextVar for correlation IDs (Async-safe alternative to threading.local)
_correlation_id_ctx = contextvars.ContextVar("correlation_id", default="NO_ID")


def get_correlation_id():
    """Retrieve the correlation ID for the current context (Sync or Async)."""
    return _correlation_id_ctx.get()


class LogCorrelationMiddleware:
    """Middleware that adds a unique correlation ID to each request.
    This ID is stored in thread-local storage and can be picked up by logging formatters.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Generate a new correlation ID or use one from the header
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        token = _correlation_id_ctx.set(correlation_id)

        try:
            response = self.get_response(request)
        finally:
            # We don't strictly need to reset in standard Django, but it's good practice
            # for contextvars to avoid leaks if this runs in a nested context.
            _correlation_id_ctx.reset(token)

        # Include the correlation ID in the response headers for debugging
        response["X-Correlation-ID"] = correlation_id
        return response
