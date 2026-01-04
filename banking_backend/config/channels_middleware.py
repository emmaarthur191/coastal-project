from urllib.parse import parse_qs

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.http import parse_cookie

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken


@database_sync_to_async
def get_user(token):
    try:
        UntypedToken(token)
        decoded_data = UntypedToken(token)
        user_id = decoded_data["user_id"]
        User = get_user_model()
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope["headers"])
        token = None

        # 1. Try to get from Cookie (Primary method for this app)
        if b"cookie" in headers:
            cookies = parse_cookie(headers[b"cookie"].decode())
            cookie_name = getattr(settings, "SIMPLE_JWT", {}).get("AUTH_COOKIE", "access")
            token = cookies.get(cookie_name)

        # 2. Try to get token from header (Secondary)
        if not token and b"sec-websocket-protocol" in headers:
            token = headers[b"sec-websocket-protocol"].decode().split(",")[0].strip()

        # 3. Fallback to query string
        elif not token and b"query_string" in scope:
            query_string = scope["query_string"].decode()
            query_params = parse_qs(query_string)
            if "token" in query_params:
                token_param = query_params["token"][0]
                # Handle 'null' string from frontend bug
                if token_param and token_param != "null":
                    token = token_param

        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
