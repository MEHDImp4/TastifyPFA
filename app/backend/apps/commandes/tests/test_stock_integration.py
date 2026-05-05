import pytest
from unittest.mock import patch
from decimal import Decimal
from django.utils import timezone
from apps.commandes.models import Commande, CommandeLigne
from apps.stock.models import Ingredient, PlatIngredient
from apps.commandes.tasks import launch_item_task
from apps.stock.services import InsufficientStockError
from apps.tables.models import Table

@pytest.mark.django_db
class TestStockIntegration:
    def test_launch_item_deducts_stock_success(self, plat_short):
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
        
        # Verify Stock Deduction: 10.0 - (0.5 * 2) = 9.0
        ingredient.refresh_from_db()
        assert ingredient.stock_actuel == Decimal('9.0')
        
        # Verify Status Change
        line.refresh_from_db()
        assert line.statut == CommandeLigne.Statut.EN_PREPARATION

    def test_launch_item_fails_on_insufficient_stock(self, plat_short):
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
        
        # Execute Task - should raise InsufficientStockError
        with pytest.raises(InsufficientStockError):
            launch_item_task(line.id)
            
        # Verify Rollback: status should still be EN_ATTENTE
        line.refresh_from_db()
        assert line.statut == CommandeLigne.Statut.EN_ATTENTE
        
        # Verify Stock remains 0.2
        ingredient.refresh_from_db()
        assert ingredient.stock_actuel == Decimal('0.2')

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

    def test_launch_item_no_ingredients_deduction(self, plat_short):
        # Plat with NO ingredients defined
        table = Table.objects.create(numero=104, capacite=4)
        commande = Commande.objects.create(table=table)
        line = CommandeLigne.objects.create(
            commande=commande, 
            plat=plat_short, 
            quantite=5,
            statut=CommandeLigne.Statut.EN_ATTENTE
        )
        
        with patch('apps.commandes.tasks.broadcast_staff_event'):
            result = launch_item_task(line.id)
            
        assert result['launched'] is True
        line.refresh_from_db()
        assert line.statut == CommandeLigne.Statut.EN_PREPARATION
        # Just verifying it doesn't crash if no ingredients are mapped
