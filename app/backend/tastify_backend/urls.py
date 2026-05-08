from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from core.views import health

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/health/', health, name='health'),
    path('api/stock/', include('apps.stock.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/', include('tastify_backend.api_router')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
