from django.db import transaction
from apps.stock.models import Ingredient, PlatIngredient

import logging

logger = logging.getLogger(__name__)

class InsufficientStockError(Exception):
    """Raised when an ingredient doesn't have enough stock for a deduction."""
    pass

class StockService:
    @staticmethod
    def check_stock_for_plat(plat, quantity):
        """
        Non-mutating check to see if enough stock exists for a given plat and quantity.
        Returns (True, None) if stock is sufficient, or (False, error_message) if not.
        """
        plat_ingredients = PlatIngredient.objects.filter(plat=plat).select_related('ingredient')
        
        for pi in plat_ingredients:
            total_required = pi.quantite_requise * quantity
            if pi.ingredient.stock_actuel < total_required:
                return False, f"Stock insuffisant pour {pi.ingredient.nom}: requis {total_required}, actuel {pi.ingredient.stock_actuel}"
        
        return True, None

    @staticmethod
    def deduct_ingredients_for_plat(plat, quantity):
        """
        Deducts ingredients for a given plat and quantity atomically.
        Uses select_for_update and orders by ingredient_id to prevent deadlocks.
        Raises InsufficientStockError if any ingredient would fall below zero.
        """
        # Get all required ingredients for this plat
        plat_ingredients = list(PlatIngredient.objects.filter(plat=plat).order_by('ingredient_id'))

        if not plat_ingredients:
            return

        with transaction.atomic():
            ingredient_ids = [pi.ingredient_id for pi in plat_ingredients]
            ingredients_qs = Ingredient.objects.select_for_update().filter(id__in=ingredient_ids)
            ingredients_dict = {i.id: i for i in ingredients_qs}

            for pi in plat_ingredients:
                ingredient = ingredients_dict.get(pi.ingredient_id)
                if ingredient:
                    total_deduction = pi.quantite_requise * quantity

                    if ingredient.stock_actuel < total_deduction:
                        raise InsufficientStockError(
                            f"Stock insuffisant pour {ingredient.nom}: "
                            f"requis {total_deduction}, actuel {ingredient.stock_actuel}"
                        )

                    ingredient.stock_actuel -= total_deduction

            Ingredient.objects.bulk_update(list(ingredients_dict.values()), ['stock_actuel'])

    @staticmethod
    def queue_deduction(plat, quantity):
        from apps.stock.tasks import deduct_stock_async

        deduct_stock_async.delay(plat.id, quantity)
