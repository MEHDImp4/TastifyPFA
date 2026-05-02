from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.commandes.models import Commande, CommandeLigne
from apps.tables.models import Table
from core.realtime import STAFF_GROUP


def broadcast_staff_event(event_type, payload):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            STAFF_GROUP,
            {
                "type": "staff.event",
                "event_type": event_type,
                "payload": payload,
            }
        )


def recalcul_montant_total(commande):
    total = commande.lignes.exclude(statut=CommandeLigne.Statut.ANNULE).aggregate(
        total=Sum(
            ExpressionWrapper(
                F('quantite') * F('prix_unitaire'),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        )
    )['total'] or 0
    commande.montant_total = total
    commande.save(update_fields=['montant_total', 'updated_at'])


@receiver(post_save, sender=CommandeLigne)
def update_total_on_ligne_save(sender, instance, created, **kwargs):
    recalcul_montant_total(instance.commande)
    
    # Broadcast update to KDS
    from .serializers import CommandeSerializer
    serializer = CommandeSerializer(instance.commande)
    broadcast_staff_event("order_updated", {"order": serializer.data})


@receiver(post_delete, sender=CommandeLigne)
def update_total_on_ligne_delete(sender, instance, **kwargs):
    recalcul_montant_total(instance.commande)
    
    # Broadcast update to KDS
    from .serializers import CommandeSerializer
    serializer = CommandeSerializer(instance.commande)
    broadcast_staff_event("order_updated", {"order": serializer.data})


@receiver(post_save, sender=Commande)
def sync_table_status_and_broadcast(sender, instance, created, **kwargs):
    """
    Automate table status transitions and broadcast to staff.
    """
    table = instance.table
    
    # Handle Table Sync
    if created:
        if instance.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            if table.statut != Table.Statut.LIBRE:
                table.statut = Table.Statut.LIBRE
                table.save(update_fields=['statut', 'updated_at'])
        else:
            if table.statut != Table.Statut.OCCUPEE:
                table.statut = Table.Statut.OCCUPEE
                table.save(update_fields=['statut', 'updated_at'])
    else:
        if instance.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            if table.statut != Table.Statut.LIBRE:
                table.statut = Table.Statut.LIBRE
                table.save(update_fields=['statut', 'updated_at'])
        elif instance.statut in [Commande.Statut.EN_COURS, Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]:
            if table.statut != Table.Statut.OCCUPEE:
                table.statut = Table.Statut.OCCUPEE
                table.save(update_fields=['statut', 'updated_at'])

    # Handle WebSocket Broadcast
    from .serializers import CommandeSerializer
    serializer = CommandeSerializer(instance)
    event_type = "order_created" if created else "order_updated"
    broadcast_staff_event(event_type, {"order": serializer.data})
