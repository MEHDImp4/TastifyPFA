from django.db import transaction
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.commandes.models import Commande, CommandeLigne
from apps.commandes.services.orchestrator import KdsOrchestrator
from apps.tables.models import Table
from core.realtime import broadcast_staff_event

# On garde l'ancien statut en mémoire pendant la sauvegarde.
# Cela permet de détecter le passage "EN_COURS -> EN_CUISINE".
_PREVIOUS_COMMANDE_STATUT = {}


@receiver(pre_save, sender=Commande)
def capture_commande_statut_before_save(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        ancien_statut = Commande.objects.values_list('statut', flat=True).get(pk=instance.pk)
        _PREVIOUS_COMMANDE_STATUT[instance.pk] = ancien_statut
    except Commande.DoesNotExist:
        pass


@receiver(post_save, sender=Commande)
def trigger_orchestration_on_en_cuisine(sender, instance, created, **kwargs):
    if created:
        _PREVIOUS_COMMANDE_STATUT.pop(instance.pk, None)
        return

    ancien_statut = _PREVIOUS_COMMANDE_STATUT.pop(instance.pk, None)
    if ancien_statut == Commande.Statut.EN_COURS and instance.statut == Commande.Statut.EN_CUISINE:
        KdsOrchestrator.schedule_reorchestration_after_commit(instance.pk)


def recalcul_montant_total(commande):
    """Recalcule le total d'une commande à partir de ses lignes non annulées."""
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
    champs_kds = {
        'heure_lancement',
        'heure_fin_estimee',
        'temps_preparation_snapshot',
        'celery_task_id',
        'updated_at',
    }

    # Si seul le KDS met à jour ses champs techniques, on évite une boucle infinie.
    if update_fields and set(update_fields).issubset(champs_kds):
        return

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
    """Synchronise le statut de la table et notifie le backoffice."""
    table = instance.table

    if table is not None:
        if instance.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            _set_table_status(table, Table.Statut.LIBRE)
        else:
            _set_table_status(table, Table.Statut.OCCUPEE)

    event_type = 'order_created' if created else 'order_updated'
    _schedule_after_commit(lambda: _broadcast_order_snapshot(instance.pk, event_type))


def _set_table_status(table, statut):
    if table.statut != statut:
        table.statut = statut
        table.save(update_fields=['statut', 'updated_at'])


def _broadcast_order_snapshot(commande_id, event_type):
    from .serializers import CommandeSerializer

    try:
        commande = (
            Commande.objects.select_related('serveur', 'table')
            .prefetch_related('lignes__plat')
            .get(pk=commande_id)
        )
    except Commande.DoesNotExist:
        return

    serializer = CommandeSerializer(commande)
    broadcast_staff_event(event_type, {'order': serializer.data})


def _schedule_after_commit(callback):
    transaction.on_commit(callback)
