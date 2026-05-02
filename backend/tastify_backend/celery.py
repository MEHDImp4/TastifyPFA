import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.dev')

app = Celery('tastify_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
