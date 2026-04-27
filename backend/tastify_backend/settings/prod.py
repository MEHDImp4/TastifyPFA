from .base import *  # noqa: F401,F403

DEBUG = False

CORS_ALLOWED_ORIGINS = [
    # Populate with real prod origins before deploy
]
CORS_ALLOW_CREDENTIALS = True

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
