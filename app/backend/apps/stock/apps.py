from django.apps import AppConfig


class StockConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.stock'
    verbose_name = 'Stock'

    def ready(self):
        import apps.stock.signals  # noqa: F401
