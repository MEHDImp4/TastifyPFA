from .base import *  # noqa: F401,F403

DEBUG = False

CORS_ALLOWED_ORIGINS = [
    # À remplir avec les domaines de production réels avant le déploiement
]
CORS_ALLOW_CREDENTIALS = True

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
