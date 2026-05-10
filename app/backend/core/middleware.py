import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from apps.users.models import Utilisateur

logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_for_token(raw_token: str):
    try:
        token = AccessToken(raw_token)
        user_id = token.get("user_id")
        user = Utilisateur.objects.get(id=user_id)
        logger.info(f"WS Auth success for user: {user.username}")
        return user
    except (InvalidToken, TokenError) as e:
        logger.warning(f"WS Auth failed: Token error - {str(e)}")
        return AnonymousUser()
    except Utilisateur.DoesNotExist:
        logger.warning("WS Auth failed: User does not exist")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"WS Auth failed: Unexpected error - {str(e)}")
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        if token:
            scope["user"] = await get_user_for_token(token)
        else:
            logger.debug("WS connection attempt without token")
            scope["user"] = AnonymousUser()
            
        return await self.app(scope, receive, send)
