from django.db import transaction
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.commandes.models import Commande, CommandeLigne
from apps.commandes.services.orchestrator import KdsOrchestrator
from apps.tables.models import Table
from core.realtime import broadcast_staff_event

# Phase 16: Detect EN_COURS -> EN_CUISINE transition to trigger JIT orchestration
# exactly once at the moment of dispatch. Stored per-pk in module dict because
# post_save fires AFTER the DB write, so the previous value must be captured in
# pre_save. Django handles each request synchronously per worker, making this
# pattern safe; the dict is bounded by concurrent in-flight saves.
_PREVIOUS_COMMANDE_STATUT: dict[int, str] = {}


@receiver(pre_save, sender=Commande)
def capture_commande_statut_before_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            _PREVIOUS_COMMANDE_STATUT[instance.pk] = (
                Commande.objects.values_list('statut', flat=True).get(pk=instance.pk)
            )
        except Commande.DoesNotExist:
            pass


@receiver(post_save, sender=Commande)
def trigger_orchestration_on_en_cuisine(sender, instance, created, **kwargs):
    if created:
        _PREVIOUS_COMMANDE_STATUT.pop(instance.pk, None)
        return
    prev = _PREVIOUS_COMMANDE_STATUT.pop(instance.pk, None)
    if prev == Commande.Statut.EN_COURS and instance.statut == Commande.Statut.EN_CUISINE:
        KdsOrchestrator.schedule_reorchestration_after_commit(instance.pk)


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
