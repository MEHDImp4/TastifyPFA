import os
import django
from django.urls import get_resolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.base')
django.setup()

def show_urls(resolver, prefix=''):
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            show_urls(pattern, prefix + str(pattern.pattern))
        else:
            print(f"{prefix}{str(pattern.pattern)}")

show_urls(get_resolver())
