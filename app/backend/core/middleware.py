# Ce fichier contient un Middleware pour les WebSockets (Django Channels)
# Un Middleware est comme un garde à l'entrée d'un tunnel : il vérifie qui entre.

import logging
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from apps.users.models import Utilisateur

logger = logging.getLogger(__name__)

# Cette fonction transforme une action de base de données (lente) en action asynchrone (rapide)
# Elle permet de retrouver l'utilisateur à partir de son badge de sécurité (le Token JWT)
@database_sync_to_async
def get_user_for_token(raw_token: str):
    try:
        # On décode le token pour voir ce qu'il contient
        token = AccessToken(raw_token)
        user_id = token.get("user_id")
        
        # On cherche l'utilisateur dans la base de données par son ID
        user = Utilisateur.objects.get(id=user_id)
        logger.info(f"Connexion WebSocket réussie pour : {user.username}")
        return user
    except (InvalidToken, TokenError) as e:
        # Si le token est expiré ou faux, on considère l'utilisateur comme "Anonyme"
        logger.warning(f"Échec Auth WebSocket : Erreur de token - {str(e)}")
        return AnonymousUser()
    except Utilisateur.DoesNotExist:
        logger.warning("Échec Auth WebSocket : L'utilisateur n'existe plus")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Échec Auth WebSocket : Erreur inattendue - {str(e)}")
        return AnonymousUser()


# C'est la classe principale qui intercepte la demande de connexion WebSocket
class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # On regarde dans l'adresse URL si un token est présent (ex: ?token=abc...)
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        if token:
            # Si on a un token, on essaye d'identifier l'utilisateur
            scope["user"] = await get_user_for_token(token)
        else:
            # Sinon, on le marque comme non-connecté (AnonymousUser)
            logger.debug("Tentative de connexion WebSocket sans token")
            scope["user"] = AnonymousUser()
            
        # On laisse ensuite la connexion continuer son chemin
        return await self.app(scope, receive, send)
