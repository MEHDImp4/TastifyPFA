from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.paiements.models import Paiement
from apps.tables.models import Table
from apps.commandes.models import Commande, CommandeLigne

def trigger_dashboard_update():
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'staff_updates',
        {
            'type': 'staff_event',
            'event_type': 'dashboard_update',
            'payload': {}
        }
    )

@receiver(post_save, sender=Paiement)
def paiement_post_save(sender, instance, created, **kwargs):
    if instance.statut == Paiement.Statut.COMPLETE:
        trigger_dashboard_update()

@receiver(post_save, sender=Table)
def table_post_save(sender, instance, created, **kwargs):
    trigger_dashboard_update()

@receiver(post_save, sender=Commande)
def commande_post_save(sender, instance, created, **kwargs):
    trigger_dashboard_update()

@receiver(post_save, sender=CommandeLigne)
def commandeligne_post_save(sender, instance, created, **kwargs):
    trigger_dashboard_update()
