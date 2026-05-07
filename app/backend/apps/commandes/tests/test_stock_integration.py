from decimal import Decimal
from unittest.mock import patch

import pytest

from apps.commandes.models import Commande, CommandeLigne
from apps.commandes.tasks import launch_item_task
from apps.stock.models import Ingredient, PlatIngredient
from apps.stock.tasks import deduct_stock_async
from apps.tables.models import Table

@pytest.mark.django_db
class TestStockIntegration:
    def test_launch_item_updates_status_without_deducting_stock(self, plat_short):
        # Setup Ingredient
        ingredient = Ingredient.objects.create(
            nom="Tomate",
            stock_actuel=Decimal('10.0'),
            unite_mesure="g",
            seuil_alerte=Decimal('1.0')
        )
        # Link to Plat
        PlatIngredient.objects.create(
            plat=plat_short,
            ingredient=ingredient,
            quantite_requise=Decimal('0.5')
        )
        
        # Setup Commande and Line
        table = Table.objects.create(numero=101, capacite=4)
        commande = Commande.objects.create(table=table)
        line = CommandeLigne.objects.create(
            commande=commande, 
            plat=plat_short, 
            quantite=2,
            statut=CommandeLigne.Statut.EN_ATTENTE
        )
        
        # Execute Task (Mocking broadcast to avoid dependency on WebSocket/Redis)
        with patch('apps.commandes.tasks.broadcast_staff_event'):
            result = launch_item_task(line.id)
            
        assert result['launched'] is True
        
        # Stock is now deducted asynchronously from the firing path, not launch_item_task.
        ingredient.refresh_from_db()
        assert ingredient.stock_actuel == Decimal('10.0')
        
        # Verify Status Change
        line.refresh_from_db()
        assert line.statut == CommandeLigne.Statut.EN_PREPARATION

    def test_deduct_stock_async_logs_and_keeps_stock_on_insufficient_stock(self, plat_short):
        # Setup Ingredient with low stock
        ingredient = Ingredient.objects.create(
            nom="Fromage",
            stock_actuel=Decimal('0.2'),
            unite_mesure="g",
            seuil_alerte=Decimal('1.0')
        )
        # Link to Plat
        PlatIngredient.objects.create(
            plat=plat_short,
            ingredient=ingredient,
            quantite_requise=Decimal('0.5')
        )
        
        table = Table.objects.create(numero=102, capacite=4)
        commande = Commande.objects.create(table=table)
        line = CommandeLigne.objects.create(
            commande=commande, 
            plat=plat_short, 
            quantite=1,
            statut=CommandeLigne.Statut.EN_ATTENTE
        )
        
        with patch('apps.stock.tasks.logger.critical') as critical_mock:
            result = deduct_stock_async(plat_short.id, line.quantite)
            
        ingredient.refresh_from_db()
        assert ingredient.stock_actuel == Decimal('0.2')
        assert result['deducted'] is False
        critical_mock.assert_called_once()

    def test_launch_item_idempotency(self, plat_short):
        # Already launched line
        table = Table.objects.create(numero=103, capacite=4)
        commande = Commande.objects.create(table=table)
        line = CommandeLigne.objects.create(
            commande=commande, 
            plat=plat_short, 
            quantite=1,
            statut=CommandeLigne.Statut.EN_PREPARATION
        )
        
        result = launch_item_task(line.id)
        assert result['skipped'] == 'line_not_pending'

    def test_deduct_stock_async_no_ingredients_is_noop(self, plat_short):
        # Plat with NO ingredients defined
        result = deduct_stock_async(plat_short.id, 5)
            
        assert result == {'deducted': True, 'plat_id': plat_short.id, 'quantity': 5}
