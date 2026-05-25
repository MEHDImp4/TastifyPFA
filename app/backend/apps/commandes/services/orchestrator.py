from datetime import timedelta

from celery import current_app
from django.db import transaction
from django.utils import timezone

from apps.commandes.models import CommandeLigne


# L'Orchestrateur KDS (Kitchen Display System)
# C'est le "cerveau" de la cuisine. Il décide quand lancer chaque plat.

class KdsOrchestrator:
    """
    Logique "Just-In-Time" (Juste à Temps) :
    L'objectif est que TOUS les plats d'une même commande finissent de cuire en même temps.
    Si une Pizza prend 15 min et une Salade 5 min, l'orchestrateur va attendre 10 min 
    avant de demander au cuisinier de préparer la salade.
    """

    IDLE_STATUSES = {CommandeLigne.Statut.EN_ATTENTE}
    RUNNING_STATUSES = {CommandeLigne.Statut.EN_PREPARATION}

    @classmethod
    def reorchestrate_order(cls, commande):
        # Cette méthode recalcule le planning de la cuisine pour une commande donnée
        from apps.commandes.tasks import launch_item_task
        from apps.commandes.models import Commande as _Commande

        # On n'orchestre que si la commande est officiellement "En Cuisine"
        if commande.statut != _Commande.Statut.EN_CUISINE:
            return

        now = timezone.now()

        # transaction.atomic() assure que si une erreur survient, rien n'est modifié en base
        with transaction.atomic():
            lines = list(
                commande.lignes.select_related('plat')
                .select_for_update()
                .filter(statut__in=list(cls.IDLE_STATUSES | cls.RUNNING_STATUSES))
            )

            idle_lines = [l for l in lines if l.statut in cls.IDLE_STATUSES]
            running_lines = [l for l in lines if l.statut in cls.RUNNING_STATUSES]

            if not idle_lines:
                return

            # On cherche le plat qui prend le plus de temps (le "goulot d'étranglement")
            max_prep_minutes = max(l.plat.temps_preparation for l in idle_lines)
            target_ready = now + timedelta(minutes=max_prep_minutes)

            # Si des plats sont déjà en cours de cuisson et finissent plus tard, on s'aligne sur eux
            for running in running_lines:
                if running.heure_fin_estimee and running.heure_fin_estimee > target_ready:
                    target_ready = running.heure_fin_estimee

            updates = []
            for line in idle_lines:
                # Si une tâche était déjà prévue, on l'annule pour la replanifier proprement
                if line.celery_task_id:
                    try:
                        current_app.control.revoke(line.celery_task_id)
                    except Exception:
                        pass

                # Calcul du moment idéal pour lancer la cuisson
                launch_time = target_ready - timedelta(minutes=line.plat.temps_preparation)
                
                try:
                    # On programme la tâche Celery pour s'exécuter à 'launch_time' (ETA)
                    async_result = launch_item_task.apply_async(args=[line.id], eta=launch_time)
                    updates.append({
                        'pk': line.pk,
                        'heure_lancement': launch_time,
                        'heure_fin_estimee': target_ready,
                        'temps_preparation_snapshot': line.plat.temps_preparation,
                        'celery_task_id': async_result.id,
                    })
                except Exception:
                    pass

            # Mise à jour finale de toutes les lignes en une seule fois
            for update in updates:
                CommandeLigne.objects.filter(pk=update['pk']).update(
                    heure_lancement=update['heure_lancement'],
                    heure_fin_estimee=update['heure_fin_estimee'],
                    temps_preparation_snapshot=update['temps_preparation_snapshot'],
                    celery_task_id=update['celery_task_id'],
                )
