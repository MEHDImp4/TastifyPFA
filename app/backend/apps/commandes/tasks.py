import logging
from celery import shared_task
from django.utils import timezone
from django.db import transaction

from apps.commandes.models import CommandeLigne
from apps.stock.services import StockService, InsufficientStockError
from core.realtime import broadcast_staff_event

logger = logging.getLogger(__name__)


@shared_task(name='commandes.launch_item')
def launch_item_task(ligne_id):
    """Executed at heure_lancement. Flips the line to EN_PREPARATION and pushes
    a `line_launched` frame to the staff WebSocket so the KDS surfaces the ticket.

    Idempotent: re-runs (e.g., from Redis redelivery) are no-ops if the line
    is no longer EN_ATTENTE or has been deleted.
    """
    with transaction.atomic():
        try:
            line = (
                CommandeLigne.objects
                .select_related('plat', 'commande')
                .select_for_update()
                .get(pk=ligne_id)
            )
        except CommandeLigne.DoesNotExist:
            return {'skipped': 'line_deleted', 'ligne_id': ligne_id}

        if line.statut != CommandeLigne.Statut.EN_ATTENTE:
            return {
                'skipped': 'line_not_pending',
                'ligne_id': ligne_id,
                'statut': line.statut,
            }

        now = timezone.now()
        CommandeLigne.objects.filter(pk=ligne_id).update(
            statut=CommandeLigne.Statut.EN_PREPARATION,
            updated_at=now,
        )

        line.refresh_from_db()
        broadcast_staff_event(
            'line_launched',
            {
                'ligne_id': line.id,
                'commande_id': line.commande_id,
                'plat_nom': line.plat.nom,
                'heure_lancement': line.heure_lancement.isoformat() if line.heure_lancement else None,
                'heure_fin_estimee': line.heure_fin_estimee.isoformat() if line.heure_fin_estimee else None,
            },
        )

        return {'launched': True, 'ligne_id': ligne_id}
