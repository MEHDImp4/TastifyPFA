from rest_framework.routers import DefaultRouter
from apps.menu.views import CategorieViewSet, PlatViewSet
from apps.tables.views import TableViewSet
from apps.commandes.views import CommandeViewSet, CommandeLigneViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'plats', PlatViewSet, basename='plat')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'commandelignes', CommandeLigneViewSet, basename='commandeligne')

urlpatterns = router.urls
