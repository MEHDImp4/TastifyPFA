from .base import *

SECRET_KEY = 'tastify-pfa-test-secret-key-long-enough-for-hs256'
SIMPLE_JWT = {
    **SIMPLE_JWT,
    'SIGNING_KEY': SECRET_KEY,
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

# Use in-memory channel layer for tests
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Celery test configuration
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
FRONTEND_BASE_URL = 'http://127.0.0.1:3003'
