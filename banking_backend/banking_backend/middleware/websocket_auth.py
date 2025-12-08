import logging
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class WebSocketJWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for WebSocket JWT authentication.
    Extracts JWT token from query parameters and authenticates the user.
    """

    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        # Extract token from query parameters
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                # Validate the JWT token
                access_token = AccessToken(token)
                user_id = access_token.payload.get('user_id')

                if user_id:
                    # Get user from database
                    user = await self.get_user(user_id)
                    if user:
                        scope['user'] = user
                        logger.info(f"WebSocket authenticated user: {user.email}")
                    else:
                        scope['user'] = AnonymousUser()
                        logger.warning(f"WebSocket authentication failed: user {user_id} not found")
                else:
                    scope['user'] = AnonymousUser()
                    logger.warning("WebSocket authentication failed: no user_id in token")
            except (InvalidToken, TokenError) as e:
                scope['user'] = AnonymousUser()
                logger.warning(f"WebSocket authentication failed: {str(e)}")
            except Exception as e:
                scope['user'] = AnonymousUser()
                logger.error(f"WebSocket authentication error: {str(e)}")
        else:
            scope['user'] = AnonymousUser()
            logger.warning("WebSocket authentication failed: no token provided")

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        """Get user from database."""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None