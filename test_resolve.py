import os
import django
from django.urls import resolve, Resolver404

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.base')
django.setup()

paths_to_test = [
    '/api/plats/',
    '/api/plats',
    '/api/categories/',
    '/api/health',
    '/api/',
]

for path in paths_to_test:
    try:
        match = resolve(path)
        print(f"Path: {path} -> Match: {match.url_name} (View: {match.func})")
    except Resolver404:
        print(f"Path: {path} -> 404")
