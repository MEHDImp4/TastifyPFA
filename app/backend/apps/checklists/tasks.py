import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from apps.checklists.models import (
    Checklist,
    ChecklistExecution,
    ChecklistItemResponse,
)
from apps.users.models import Utilisateur

logger = logging.getLogger(__name__)


def get_default_checklist_executor():
    gerant = (
        Utilisateur.objects.filter(role=Utilisateur.Role.GERANT)
        .order_by('id')
        .first()
    )
    if gerant:
        return gerant

    return (
        Utilisateur.objects.filter(
            role__in=[
                Utilisateur.Role.SERVEUR,
                Utilisateur.Role.CUISINIER,
            ]
        )
        .order_by('id')
        .first()
    )


@shared_task(name='apps.checklists.tasks.generate_daily_checklists')
def generate_daily_checklists():
    today = timezone.localdate()
    executor = get_default_checklist_executor()

    if executor is None:
        logger.warning(
            'Skipping daily checklist generation for %s: no staff user is available.',
            today,
        )
        return {
            'date': today.isoformat(),
            'created': 0,
            'skipped': Checklist.objects.filter(active=True).count(),
            'reason': 'no_executor',
        }

    created_count = 0
    skipped_count = 0

    for checklist in Checklist.objects.filter(active=True).prefetch_related('tasks'):
        with transaction.atomic():
            execution, created = ChecklistExecution.objects.get_or_create(
                checklist=checklist,
                date=today,
                defaults={'execute_par': executor},
            )
            if not created:
                skipped_count += 1
                continue

            ChecklistItemResponse.objects.bulk_create(
                [
                    ChecklistItemResponse(execution=execution, task=task)
                    for task in checklist.tasks.all()
                ]
            )
            execution.refresh_status()
            created_count += 1

    logger.info(
        'Daily checklist generation finished for %s: %s created, %s skipped.',
        today,
        created_count,
        skipped_count,
    )
    return {
        'date': today.isoformat(),
        'created': created_count,
        'skipped': skipped_count,
    }

