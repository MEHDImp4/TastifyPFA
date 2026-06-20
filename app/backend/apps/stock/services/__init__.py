from django.db import transaction
from apps.stock.models import Ingredient, PlatIngredient


class InsufficientStockError(Exception):
    """Erreur utilisée quand le stock ne suffit pas pour préparer un plat."""

    pass


class StockService:
    @staticmethod
    def check_stock_for_plat(plat, quantity):
        """
        Vérifie le stock sans rien modifier.
        Retourne (True, None) si tout va bien, sinon (False, message).
        """
        ingredients_du_plat = PlatIngredient.objects.filter(plat=plat).select_related('ingredient')

        for ingredient_du_plat in ingredients_du_plat:
            quantite_necessaire = ingredient_du_plat.quantite_requise * quantity
            stock_actuel = ingredient_du_plat.ingredient.stock_actuel

            if stock_actuel < quantite_necessaire:
                message = (
                    f"Stock insuffisant pour {ingredient_du_plat.ingredient.nom}: "
                    f"requis {quantite_necessaire}, actuel {stock_actuel}"
                )
                return False, message

        return True, None

    @staticmethod
    def deduct_ingredients_for_plat(plat, quantity):
        """
        Diminue le stock quand un plat part en préparation.
        transaction.atomic() évite de modifier seulement une partie des ingrédients.
        """
        ingredients_du_plat = list(
            PlatIngredient.objects.filter(plat=plat).order_by('ingredient_id')
        )

        if not ingredients_du_plat:
            return

        with transaction.atomic():
            ingredient_ids = []
            for ingredient_du_plat in ingredients_du_plat:
                ingredient_ids.append(ingredient_du_plat.ingredient_id)

            ingredients = Ingredient.objects.select_for_update().filter(id__in=ingredient_ids)
            ingredients_par_id = {}
            for ingredient in ingredients:
                ingredients_par_id[ingredient.id] = ingredient

            for ingredient_du_plat in ingredients_du_plat:
                ingredient = ingredients_par_id.get(ingredient_du_plat.ingredient_id)
                if ingredient is None:
                    continue

                quantite_a_retirer = ingredient_du_plat.quantite_requise * quantity
                if ingredient.stock_actuel < quantite_a_retirer:
                    raise InsufficientStockError(
                        f"Stock insuffisant pour {ingredient.nom}: "
                        f"requis {quantite_a_retirer}, actuel {ingredient.stock_actuel}"
                    )

                ingredient.stock_actuel -= quantite_a_retirer
                ingredient.save(update_fields=['stock_actuel', 'updated_at'])

            StockService.sync_availability_for_plats([plat.id])

    @staticmethod
    def queue_deduction(plat, quantity):
        """Lance la déduction en arrière-plan avec Celery."""
        from apps.stock.tasks import deduct_stock_async

        deduct_stock_async.delay(plat.id, quantity)

    @staticmethod
    def sync_availability_for_ingredient(ingredient_id):
        plat_ids = (
            PlatIngredient.objects.filter(ingredient_id=ingredient_id)
            .values_list('plat_id', flat=True)
            .distinct()
        )
        StockService.sync_availability_for_plats(plat_ids)

    @staticmethod
    def sync_availability_for_all_plats():
        from apps.menu.models import Plat

        StockService.sync_availability_for_plats(
            Plat.objects.filter(est_active=True).values_list('id', flat=True)
        )

    @staticmethod
    def sync_availability_for_plats(plat_ids):
        """
        Synchronise la disponibilité du menu avec les recettes.
        Un plat sans recette reste gérable manuellement; un plat avec recette devient
        indisponible dès qu'un ingrédient requis manque.
        """
        from apps.menu.models import Plat

        ids = list(dict.fromkeys(plat_ids))
        if not ids:
            return

        plats = Plat.objects.filter(id__in=ids, est_active=True).prefetch_related('plat_ingredients__ingredient')
        for plat in plats:
            recipe_rows = list(plat.plat_ingredients.all())
            if not recipe_rows:
                continue

            should_be_available = all(
                row.ingredient.est_active and row.ingredient.stock_actuel >= row.quantite_requise
                for row in recipe_rows
            )

            if plat.est_disponible != should_be_available:
                plat.est_disponible = should_be_available
                plat.save(update_fields=['est_disponible', 'updated_at'])

    @staticmethod
    def check_stock_for_lines(lines):
        """
        Vérifie plusieurs lignes avant une action de cuisine pour éviter une
        déduction partielle si un seul plat manque de stock.
        """
        for line in lines:
            ok, message = StockService.check_stock_for_plat(line.plat, line.quantite)
            if not ok:
                raise InsufficientStockError(message)
