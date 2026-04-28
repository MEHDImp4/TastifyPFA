import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.base')
django.setup()

# Override ALLOWED_HOSTS for testing
settings.ALLOWED_HOSTS = ['*']

from django.test import Client
client = Client()

paths = [
    '/api/plats/',
    '/api/categories/',
    '/api/tables/',
    '/api/health/',
    '/api/',
]

for path in paths:
    response = client.get(path)
    print(f"GET {path} -> {response.status_code}")
