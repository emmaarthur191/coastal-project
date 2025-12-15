from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token):
    try:
        UntypedToken(token)
        decoded_data = UntypedToken(token)
        user_id = decoded_data['user_id']
        User = get_user_model()
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope['headers'])
        token = None
        
        # Try to get token from header
        if b'sec-websocket-protocol' in headers:
            token = headers[b'sec-websocket-protocol'].decode().split(',')[0].strip()
            
        # Fallback to query string
        elif b'query_string' in scope:
            query_string = scope['query_string'].decode()
            query_params = parse_qs(query_string)
            if 'token' in query_params:
                token = query_params['token'][0]

        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)
