from decimal import Decimal
from apps.analytics.services.predictor import DemandPredictor
from ..models import PlatIngredient, Ingredient

class ProcurementService:
    @classmethod
    def get_forecasted_needs(cls):
        """
        Calculates ingredient needs based on dish demand prediction.
        Returns: {ingredient_id: {
            'nom': str,
            'current_stock': float,
            'predicted_usage': float,
            'suggested_purchase': float
        }}
        """
        dish_predictions = DemandPredictor.predict_next_week()
        ingredient_needs = {}
        
        # Aggregate predicted usage per ingredient
        for plat_id, predictions in dish_predictions.items():
            # Total predicted portions for this dish in the next 7 days
            total_portions = sum(predictions.values())
            
            # Get ingredients for this plat
            plat_ingredients = PlatIngredient.objects.filter(plat_id=plat_id).select_related('ingredient')
            for pi in plat_ingredients:
                ing_id = pi.ingredient_id
                usage = Decimal(str(total_portions)) * pi.quantite_requise
                
                if ing_id not in ingredient_needs:
                    ingredient_needs[ing_id] = {
                        'nom': pi.ingredient.nom,
                        'unite': pi.ingredient.unite_mesure,
                        'current_stock': float(pi.ingredient.stock_actuel),
                        'predicted_usage': 0.0,
                    }
                
                ingredient_needs[ing_id]['predicted_usage'] += float(usage)
        
        # Calculate suggested purchases
        for ing_id, data in ingredient_needs.items():
            predicted_usage = data['predicted_usage']
            current_stock = data['current_stock']
            
            # Suggest purchase if (stock - usage) < threshold
            # For simplicity, we just suggest the difference if it's negative
            balance = current_stock - predicted_usage
            if balance < 0:
                data['suggested_purchase'] = abs(balance)
            else:
                data['suggested_purchase'] = 0.0
                
        return ingredient_needs
