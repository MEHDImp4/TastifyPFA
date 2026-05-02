from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.commandes.models import CommandeLigne
from apps.commandes.services.orchestrator import KdsOrchestrator


@pytest.mark.django_db
def test_jit_calculation(commande_with_lines, mocker):
    commande, line_short, line_long = commande_with_lines
    fake_result = mocker.Mock()
    fake_result.id = 'fake-task-uuid'
    mocker.patch(
        'apps.commandes.tasks.launch_item_task.apply_async',
        return_value=fake_result,
    )
    before = timezone.now()
    KdsOrchestrator.reorchestrate_order(commande)
    line_short.refresh_from_db()
    line_long.refresh_from_db()

    assert line_long.temps_preparation_snapshot == 30
    assert line_short.temps_preparation_snapshot == 10
    assert abs((line_long.heure_lancement - before).total_seconds()) < 5
    assert abs((line_short.heure_lancement - (before + timedelta(minutes=20))).total_seconds()) < 5
    assert abs((line_long.heure_fin_estimee - line_short.heure_fin_estimee).total_seconds()) < 1
    assert line_short.celery_task_id == 'fake-task-uuid'
    assert line_long.celery_task_id == 'fake-task-uuid'


@pytest.mark.django_db
def test_task_revocation(commande_with_lines, mocker):
    commande, line_short, line_long = commande_with_lines
    CommandeLigne.objects.filter(pk=line_short.pk).update(celery_task_id='old-task-id-xyz')
    revoke_mock = mocker.patch('apps.commandes.services.orchestrator.current_app.control.revoke')
    fake_result = mocker.Mock()
    fake_result.id = 'new-task-id-abc'
    mocker.patch(
        'apps.commandes.tasks.launch_item_task.apply_async',
        return_value=fake_result,
    )

    KdsOrchestrator.reorchestrate_order(commande)

    revoke_mock.assert_any_call('old-task-id-xyz')
    line_short.refresh_from_db()
    assert line_short.celery_task_id == 'new-task-id-abc'


@pytest.mark.django_db
def test_idempotency_skips_running_lines(commande_with_lines, mocker):
    commande, line_short, line_long = commande_with_lines
    future = timezone.now() + timedelta(minutes=25)
    CommandeLigne.objects.filter(pk=line_long.pk).update(
        statut=CommandeLigne.Statut.EN_PREPARATION,
        heure_fin_estimee=future,
    )
    fake_result = mocker.Mock()
    fake_result.id = 'task-id'
    mocker.patch(
        'apps.commandes.tasks.launch_item_task.apply_async',
        return_value=fake_result,
    )

    KdsOrchestrator.reorchestrate_order(commande)

    line_long.refresh_from_db()
    line_short.refresh_from_db()
    assert line_long.heure_lancement is None
    assert line_short.heure_fin_estimee >= future - timedelta(seconds=1)


@pytest.mark.django_db
def test_ws_broadcast(commande_with_lines, mocker):
    """REQ-15.3: pending — wired in Plan 03."""
    pytest.skip("Plan 03 will implement WS broadcast on launch")
