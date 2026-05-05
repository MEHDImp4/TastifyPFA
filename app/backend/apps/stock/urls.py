from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, PlatIngredientViewSet

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'plat-ingredients', PlatIngredientViewSet, basename='platIngredient')

urlpatterns = router.urls
