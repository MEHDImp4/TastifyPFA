from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeViewSet, ShiftViewSet, OffreEmploiViewSet, CandidatureViewSet

router = DefaultRouter()
router.register(r'employes', EmployeViewSet, basename='employe')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'offres', OffreEmploiViewSet, basename='offre')
router.register(r'candidatures', CandidatureViewSet, basename='candidature')

urlpatterns = [
    path('', include(router.urls)),
]
