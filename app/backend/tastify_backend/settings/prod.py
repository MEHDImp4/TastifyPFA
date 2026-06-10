from .base import *  # noqa: F401,F403

DEBUG = False

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config('CORS_ALLOWED_ORIGINS', default='').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in config('CSRF_TRUSTED_ORIGINS', default='').split(',')
    if origin.strip()
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('DJANGO_SECURE_SSL_REDIRECT', cast=bool, default=False)
SESSION_COOKIE_SECURE = config('DJANGO_COOKIE_SECURE', cast=bool, default=False)
CSRF_COOKIE_SECURE = config('DJANGO_COOKIE_SECURE', cast=bool, default=False)
