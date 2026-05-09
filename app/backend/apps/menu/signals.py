from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Plat
from core.realtime import broadcast_staff_event

@receiver(post_save, sender=Plat)
def plat_availability_changed(sender, instance, created, **kwargs):
    if not created:
        # Check if est_disponible was changed in this update
        # We broadcast regardless if it's False, to ensure real-time grey-out
        if not instance.est_disponible:
            broadcast_staff_event(
                event_type='menu_item_unavailable',
                payload={
                    'plat_id': instance.id,
                    'plat_nom': instance.nom,
                },
            )
        else:
            broadcast_staff_event(
                event_type='menu_item_available',
                payload={
                    'plat_id': instance.id,
                    'plat_nom': instance.nom,
                },
            )
