from celery import shared_task
from django.utils import timezone

from apps.commandes.models import CommandeLigne


@shared_task(name='commandes.launch_item')
def launch_item_task(ligne_id):
    """Executed at heure_lancement; flips line to EN_PREPARATION and broadcasts launch.

    Plan 03 wires the WebSocket broadcast. This task only handles state transition.
    """
    try:
        line = CommandeLigne.objects.select_related('plat', 'commande').get(pk=ligne_id)
    except CommandeLigne.DoesNotExist:
        return {'skipped': 'line_deleted', 'ligne_id': ligne_id}

    if line.statut != CommandeLigne.Statut.EN_ATTENTE:
        return {'skipped': 'line_not_pending', 'ligne_id': ligne_id, 'statut': line.statut}

    CommandeLigne.objects.filter(pk=ligne_id).update(
        statut=CommandeLigne.Statut.EN_PREPARATION,
        updated_at=timezone.now(),
    )
    return {'launched': True, 'ligne_id': ligne_id}
