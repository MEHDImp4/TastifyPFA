# Configuration des URLs principales du projet Tastify
# Ce fichier est le point d'entrée pour toutes les requêtes arrivant sur le serveur

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from core.views import health

urlpatterns = [
    # Interface d'administration de Django (accessible par le gérant)
    path('admin/', admin.site.urls),

    # Documentation automatique de l'API (Swagger/OpenAPI)
    # Très utile pour tester les routes sans avoir besoin du frontend
    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='api-docs'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='api-redoc'),

    # Routes spécifiques pour chaque module du projet
    # 'include' permet de déléguer la gestion des URLs aux fichiers urls.py de chaque application
    path('api/users/', include('apps.users.urls')),
    path('api/health/', health, name='health'), # Route simple pour vérifier si le serveur fonctionne
    path('api/stock/', include('apps.stock.urls')),
    path('api/analytics/', include('apps.analytics.urls')),

    # Le api_router regroupe les modèles principaux comme le Menu, les Tables et les Commandes
    path('api/', include('tastify_backend.api_router')),
]

# En mode développement (DEBUG=True), on demande à Django de servir les fichiers média (images)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
