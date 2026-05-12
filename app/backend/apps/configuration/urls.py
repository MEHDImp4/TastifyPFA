from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.settings import RestaurantConfigurationViewSet

router = DefaultRouter()
router.register(r'settings', RestaurantConfigurationViewSet, basename='restaurant-settings')

urlpatterns = [
    path('', include(router.urls)),
]
