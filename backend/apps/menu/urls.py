from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, PlatViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'plats', PlatViewSet, basename='plat')

urlpatterns = router.urls
