import pytest
from decimal import Decimal
from django.db import transaction, IntegrityError
from apps.stock.models import Ingredient, PlatIngredient
from apps.stock.services import StockService, InsufficientStockError
from apps.menu.models import Plat, Categorie

@pytest.mark.django_db
class TestStockService:
    @pytest.fixture
    def category(self):
        return Categorie.objects.create(nom="Main")

    @pytest.fixture
    def plat(self, category):
        return Plat.objects.create(nom="Burger", prix=10.00, categorie=category)

    @pytest.fixture
    def ingredients(self):
        i1 = Ingredient.objects.create(nom="Pain", unite_mesure="pcs", stock_actuel=Decimal("10.00"), seuil_alerte=Decimal("2.00"))
        i2 = Ingredient.objects.create(nom="Viande", unite_mesure="g", stock_actuel=Decimal("1000.00"), seuil_alerte=Decimal("200.00"))
        return [i1, i2]

    @pytest.fixture
    def plat_ingredients(self, plat, ingredients):
        pi1 = PlatIngredient.objects.create(plat=plat, ingredient=ingredients[0], quantite_requise=Decimal("1.00"))
        pi2 = PlatIngredient.objects.create(plat=plat, ingredient=ingredients[1], quantite_requise=Decimal("150.00"))
        return [pi1, pi2]

    def test_deduct_ingredients_for_plat_success(self, plat, plat_ingredients, ingredients):
        """Test that ingredients are correctly deducted for a given plat and quantity."""
        StockService.deduct_ingredients_for_plat(plat, 2)
        
        ingredients[0].refresh_from_db()
        ingredients[1].refresh_from_db()
        
        # 10 - (1 * 2) = 8
        assert ingredients[0].stock_actuel == Decimal("8.00")
        # 1000 - (150 * 2) = 700
        assert ingredients[1].stock_actuel == Decimal("700.00")

    def test_deduct_ingredients_insufficient_stock(self, plat, plat_ingredients, ingredients):
        """Test that deduction fails if stock would become negative."""
        # Ingredient[0] has 10.00. Requiring 11 * 1.00 should fail.
        
        with pytest.raises(InsufficientStockError):
            StockService.deduct_ingredients_for_plat(plat, 11)

    def test_deduct_ingredients_no_ingredients(self, plat):
        """Test that calling deduction for a plat with no ingredients does nothing."""
        # Should not raise any error
        StockService.deduct_ingredients_for_plat(plat, 1)
