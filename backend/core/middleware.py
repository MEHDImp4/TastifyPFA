from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from apps.users.models import Utilisateur


@database_sync_to_async
def get_user_for_token(raw_token: str):
    try:
        token = AccessToken(raw_token)
        user_id = token.get("user_id")
        return Utilisateur.objects.get(id=user_id)
    except (InvalidToken, TokenError, Utilisateur.DoesNotExist, TypeError, ValueError):
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = parse_qs(query_string).get("token", [None])[0]
        scope["user"] = await get_user_for_token(token) if token else AnonymousUser()
        return await self.app(scope, receive, send)
