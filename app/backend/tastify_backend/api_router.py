from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.menu.views import CategorieViewSet, PlatViewSet
from apps.tables.views import TableViewSet
from apps.commandes.views import CommandeViewSet, CommandeLigneViewSet
from apps.hr.views import EmployeViewSet, ShiftViewSet, OffreEmploiViewSet, CandidatureViewSet
from apps.paiements.urls import urlpatterns as paiements_urlpatterns
from apps.reservations.views import ReservationViewSet
from apps.avis.views import AvisViewSet
from apps.loyalty.views import LoyaltyViewSet, RewardViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'plats', PlatViewSet, basename='plat')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'commandelignes', CommandeLigneViewSet, basename='commandeligne')
router.register(r'employes', EmployeViewSet, basename='employe')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'offres', OffreEmploiViewSet, basename='offre')
router.register(r'candidatures', CandidatureViewSet, basename='candidature')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'avis', AvisViewSet, basename='avis')
router.register(r'loyalty', LoyaltyViewSet, basename='loyalty')
router.register(r'rewards', RewardViewSet, basename='reward')

urlpatterns = router.urls + [
    path('paiements/', include((paiements_urlpatterns, 'paiements'), namespace='paiements')),
]
