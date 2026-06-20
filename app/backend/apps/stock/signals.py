from django.db.models.signals import post_delete, pre_save, post_save
from django.dispatch import receiver

from apps.stock.models import Ingredient, PlatIngredient
from apps.stock.services import StockService


@receiver(pre_save, sender=Ingredient)
def capture_previous_stock(sender, instance, **kwargs):
    """Cache the pre-save stock level to prevent alert spam on subsequent deductions."""
    if instance.pk:
        try:
            instance._old_stock = sender.objects.get(pk=instance.pk).stock_actuel
        except sender.DoesNotExist:
            instance._old_stock = None


@receiver(post_save, sender=Ingredient)
def alert_low_stock(sender, instance, created, **kwargs):
    """Broadcast a stock.alert WebSocket event only when the threshold is newly crossed (D-05, D-06)."""
    from core.realtime import broadcast_staff_event

    StockService.sync_availability_for_ingredient(instance.id)

    old_stock = getattr(instance, '_old_stock', None)
    is_now_low = instance.stock_actuel <= instance.seuil_alerte
    was_low = old_stock is not None and old_stock <= instance.seuil_alerte

    if instance.seuil_alerte <= 0:
        return

    if is_now_low and not was_low:
        broadcast_staff_event(
            event_type='stock.alert',
            payload={
                'ingredient_id': instance.id,
                'nom': instance.nom,
                'stock_actuel': str(instance.stock_actuel),
                'seuil_alerte': str(instance.seuil_alerte),
                'unite_mesure': instance.unite_mesure,
            },
        )


@receiver(post_save, sender=PlatIngredient)
def sync_availability_on_recipe_save(sender, instance, **kwargs):
    StockService.sync_availability_for_plats([instance.plat_id])


@receiver(post_delete, sender=PlatIngredient)
def sync_availability_on_recipe_delete(sender, instance, **kwargs):
    StockService.sync_availability_for_plats([instance.plat_id])
