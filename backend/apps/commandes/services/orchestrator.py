from datetime import timedelta

from celery import current_app
from django.utils import timezone

from apps.commandes.models import CommandeLigne


class KdsOrchestrator:
    """JIT orchestration: synchronize line completion times so all items finish together.

    Algorithm (locked per Phase 15 CONTEXT.md, section 2.1):
        MaxPrepTime    = max(plat.temps_preparation) over EN_ATTENTE lines
        TargetReadyTime = now + MaxPrepTime, raised to max(heure_fin_estimee)
                          of any EN_PREPARATION line still running
        line.heure_lancement = TargetReadyTime - line.plat.temps_preparation
    """

    IDLE_STATUSES = {CommandeLigne.Statut.EN_ATTENTE}
    RUNNING_STATUSES = {CommandeLigne.Statut.EN_PREPARATION}

    @classmethod
    def reorchestrate_order(cls, commande):
        from apps.commandes.tasks import launch_item_task

        now = timezone.now()
        lines = list(
            commande.lignes.select_related('plat').filter(
                statut__in=list(cls.IDLE_STATUSES | cls.RUNNING_STATUSES)
            )
        )
        idle_lines = [l for l in lines if l.statut in cls.IDLE_STATUSES]
        running_lines = [l for l in lines if l.statut in cls.RUNNING_STATUSES]

        if not idle_lines:
            return

        max_prep_minutes = max(l.plat.temps_preparation for l in idle_lines)
        target_ready = now + timedelta(minutes=max_prep_minutes)

        for running in running_lines:
            if running.heure_fin_estimee and running.heure_fin_estimee > target_ready:
                target_ready = running.heure_fin_estimee

        for line in idle_lines:
            if line.celery_task_id:
                current_app.control.revoke(line.celery_task_id)

            launch_time = target_ready - timedelta(minutes=line.plat.temps_preparation)
            async_result = launch_item_task.apply_async(args=[line.id], eta=launch_time)

            CommandeLigne.objects.filter(pk=line.pk).update(
                heure_lancement=launch_time,
                heure_fin_estimee=target_ready,
                temps_preparation_snapshot=line.plat.temps_preparation,
                celery_task_id=async_result.id,
            )
