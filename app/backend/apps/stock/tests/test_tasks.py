from decimal import Decimal
from unittest.mock import patch

import pytest

from apps.menu.models import Categorie, Plat
from apps.stock.models import Ingredient, PlatIngredient
from apps.stock.services import StockService
from apps.stock.tasks import deduct_stock_async


@pytest.mark.django_db
class TestStockTasks:
    @pytest.fixture
    def plat(self):
        category = Categorie.objects.create(nom='Async Stock')
        return Plat.objects.create(nom='Burger Async', prix=10.00, categorie=category)

    @pytest.fixture
    def ingredient(self):
        return Ingredient.objects.create(
            nom='Pain',
            unite_mesure='pcs',
            stock_actuel=Decimal('10.00'),
            seuil_alerte=Decimal('2.00'),
        )

    def test_deduct_stock_async_reduces_stock(self, plat, ingredient):
        PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('2.00'),
        )

        result = deduct_stock_async(plat.id, 3)

        ingredient.refresh_from_db()

        assert result == {'deducted': True, 'plat_id': plat.id, 'quantity': 3}
        assert ingredient.stock_actuel == Decimal('4.00')

    def test_deduct_stock_async_logs_insufficient_stock(self, plat, ingredient):
        PlatIngredient.objects.create(
            plat=plat,
            ingredient=ingredient,
            quantite_requise=Decimal('20.00'),
        )

        with patch('apps.stock.tasks.logger.critical') as critical_mock:
            result = deduct_stock_async(plat.id, 1)

        ingredient.refresh_from_db()

        assert result['deducted'] is False
        assert result['plat_id'] == plat.id
        assert ingredient.stock_actuel == Decimal('10.00')
        critical_mock.assert_called_once()

    def test_queue_deduction_dispatches_task(self, plat):
        with patch('apps.stock.tasks.deduct_stock_async.delay') as delay_mock:
            StockService.queue_deduction(plat, 4)

        delay_mock.assert_called_once_with(plat.id, 4)
