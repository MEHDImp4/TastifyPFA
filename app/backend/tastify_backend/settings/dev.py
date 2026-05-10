from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ['*']

# CORS configuration for development
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
]
CORS_ALLOW_CREDENTIALS = True
