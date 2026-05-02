from django.db import transaction
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.commandes.models import Commande, CommandeLigne
from apps.commandes.services.orchestrator import KdsOrchestrator
from apps.tables.models import Table
from core.realtime import broadcast_staff_event


def _broadcast_order_snapshot(commande_id, event_type):
    from .serializers import CommandeSerializer

    commande = (
        Commande.objects.active()
        .select_related('serveur', 'table')
        .prefetch_related('lignes__plat')
        .get(pk=commande_id)
    )
    serializer = CommandeSerializer(commande)
    broadcast_staff_event(event_type, {"order": serializer.data})


def _schedule_after_commit(callback):
    transaction.on_commit(callback)


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

    update_fields = kwargs.get('update_fields') or set()
    orchestrator_managed_fields = {
        'heure_lancement', 'heure_fin_estimee',
        'temps_preparation_snapshot', 'celery_task_id',
    }
    if not update_fields or not set(update_fields).issubset(orchestrator_managed_fields):
        commande_id = instance.commande_id
        _schedule_after_commit(
            lambda: KdsOrchestrator.reorchestrate_order(Commande.objects.get(pk=commande_id))
        )


@receiver(post_delete, sender=CommandeLigne)
def update_total_on_ligne_delete(sender, instance, **kwargs):
    recalcul_montant_total(instance.commande)
    commande_id = instance.commande_id
    celery_task_id = instance.celery_task_id

    def after_commit():
        if celery_task_id:
            from celery import current_app
            current_app.control.revoke(celery_task_id)
        KdsOrchestrator.reorchestrate_order(Commande.objects.get(pk=commande_id))

    _schedule_after_commit(after_commit)


@receiver(post_save, sender=Commande)
def sync_table_status_and_broadcast(sender, instance, created, **kwargs):
    """Automate table status transitions and broadcast to staff."""
    table = instance.table

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

    event_type = "order_created" if created else "order_updated"
    _schedule_after_commit(
        lambda: _broadcast_order_snapshot(instance.pk, event_type)
    )
