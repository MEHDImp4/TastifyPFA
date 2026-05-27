from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, PlatIngredientViewSet, MouvementStockViewSet

app_name = 'stock'
router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'plat-ingredients', PlatIngredientViewSet, basename='platIngredient')
router.register(r'mouvements', MouvementStockViewSet, basename='mouvementStock')

urlpatterns = router.urls
