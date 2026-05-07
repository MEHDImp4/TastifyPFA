from django.apps import AppConfig


class ChecklistsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.checklists'

    def ready(self):
        from apps.checklists import signals  # noqa: F401

