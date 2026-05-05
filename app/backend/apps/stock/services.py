from django.db import transaction
from apps.stock.models import Ingredient, PlatIngredient

class InsufficientStockError(Exception):
    """Raised when an ingredient doesn't have enough stock for a deduction."""
    pass

class StockService:
    @staticmethod
    def deduct_ingredients_for_plat(plat, quantity):
        """
        Deducts ingredients for a given plat and quantity atomically.
        Uses select_for_update and orders by ingredient_id to prevent deadlocks.
        Raises InsufficientStockError if any ingredient would fall below zero.
        """
        # Get all required ingredients for this plat
        plat_ingredients = PlatIngredient.objects.filter(plat=plat).order_by('ingredient_id')
        
        if not plat_ingredients.exists():
            return

        with transaction.atomic():
            # Lock ingredients in a consistent order to avoid deadlocks
            ingredient_ids = [pi.ingredient_id for pi in plat_ingredients]
            # Fetch and lock rows
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
                    
                    # Update in Python to ensure signals (which check stock_actuel) work correctly
                    ingredient.stock_actuel -= total_deduction
                    ingredient.save()
