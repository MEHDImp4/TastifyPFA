from rest_framework.routers import DefaultRouter
from apps.menu.views import CategorieViewSet, PlatViewSet
from apps.tables.views import TableViewSet
from apps.commandes.views import CommandeViewSet, CommandeLigneViewSet
from apps.hr.views import EmployeViewSet
from apps.reservations.views import ReservationViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'plats', PlatViewSet, basename='plat')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'commandelignes', CommandeLigneViewSet, basename='commandeligne')
router.register(r'employes', EmployeViewSet, basename='employe')
router.register(r'reservations', ReservationViewSet, basename='reservation')

urlpatterns = router.urls
