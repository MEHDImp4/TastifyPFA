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
    line_long.refresh_from_db()
    original_launch = line_long.heure_lancement
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
    assert line_long.heure_lancement == original_launch
    assert line_short.heure_fin_estimee >= future - timedelta(seconds=1)


@pytest.mark.django_db
def test_ws_broadcast(commande_with_lines, mocker):
    commande, line_short, _ = commande_with_lines
    future = timezone.now() + timedelta(minutes=5)
    CommandeLigne.objects.filter(pk=line_short.pk).update(
        heure_lancement=future,
        heure_fin_estimee=future + timedelta(minutes=10),
    )
    broadcast_mock = mocker.patch('apps.commandes.tasks.broadcast_staff_event')

    from apps.commandes.tasks import launch_item_task
    result = launch_item_task(line_short.id)

    assert result == {'launched': True, 'ligne_id': line_short.id}
    broadcast_mock.assert_called_once()
    args, _ = broadcast_mock.call_args
    assert args[0] == 'line_launched'
    payload = args[1]
    assert payload['ligne_id'] == line_short.id
    assert payload['commande_id'] == commande.id
    assert payload['plat_nom'] == 'Salade'
    assert payload['heure_lancement'] is not None


@pytest.mark.django_db
def test_ws_broadcast_skipped_when_line_already_launched(commande_with_lines, mocker):
    commande, line_short, _ = commande_with_lines
    CommandeLigne.objects.filter(pk=line_short.pk).update(
        statut=CommandeLigne.Statut.EN_PREPARATION,
    )
    broadcast_mock = mocker.patch('apps.commandes.tasks.broadcast_staff_event')

    from apps.commandes.tasks import launch_item_task
    result = launch_item_task(line_short.id)

    assert result['skipped'] == 'line_not_pending'
    broadcast_mock.assert_not_called()


@pytest.mark.django_db
def test_ws_broadcast_skipped_when_line_deleted(mocker):
    broadcast_mock = mocker.patch('apps.commandes.tasks.broadcast_staff_event')

    from apps.commandes.tasks import launch_item_task
    result = launch_item_task(999_999)

    assert result == {'skipped': 'line_deleted', 'ligne_id': 999_999}
    broadcast_mock.assert_not_called()


@pytest.mark.django_db
def test_signal_triggers_orchestrator_on_line_create(table_obj, plat_short, mocker):
    from apps.commandes.models import Commande, CommandeLigne
    commande = Commande.objects.create(table=table_obj)
    spy = mocker.patch(
        'apps.commandes.signals.KdsOrchestrator.reorchestrate_order'
    )
    on_commit_mock = mocker.patch(
        'apps.commandes.signals.transaction.on_commit'
    )
    CommandeLigne.objects.create(commande=commande, plat=plat_short, quantite=1)
    spy.assert_not_called()
    assert on_commit_mock.call_count >= 1
    for call in on_commit_mock.call_args_list:
        call.args[0]()
    spy.assert_called_once()


@pytest.mark.django_db
def test_signal_no_recursion_on_orchestrator_update(commande_with_lines, mocker):
    commande, line_short, _ = commande_with_lines
    spy = mocker.patch(
        'apps.commandes.signals.KdsOrchestrator.reorchestrate_order'
    )
    CommandeLigne.objects.filter(pk=line_short.pk).update(
        celery_task_id='test-id-no-recursion'
    )
    spy.assert_not_called()


@pytest.mark.django_db
def test_signal_delete_defers_revocation_until_commit(commande_with_lines, mocker):
    _, line_short, _ = commande_with_lines
    CommandeLigne.objects.filter(pk=line_short.pk).update(celery_task_id='stale-task-id')
    revoke_mock = mocker.patch('celery.current_app.control.revoke')
    spy = mocker.patch('apps.commandes.signals.KdsOrchestrator.reorchestrate_order')
    on_commit_mock = mocker.patch('apps.commandes.signals.transaction.on_commit')

    line_short.refresh_from_db()
    commande_id = line_short.commande_id
    line_short.delete()

    assert on_commit_mock.call_count >= 1
    revoke_mock.assert_not_called()
    for call in on_commit_mock.call_args_list:
        call.args[0]()
    revoke_mock.assert_called_once_with('stale-task-id')
    spy.assert_called_once()
    assert spy.call_args.args[0].pk == commande_id


@pytest.mark.django_db
def test_reorchestrate_skips_when_not_en_cuisine(commande_with_lines, mocker):
    """P16-BE-03: Orchestrator must early-return for orders not in EN_CUISINE."""
    from apps.commandes.models import Commande
    commande, line_short, line_long = commande_with_lines
    commande.statut = Commande.Statut.EN_COURS
    commande.save(update_fields=['statut', 'updated_at'])

    apply_async_mock = mocker.patch(
        'apps.commandes.tasks.launch_item_task.apply_async'
    )

    KdsOrchestrator.reorchestrate_order(commande)

    apply_async_mock.assert_not_called()


@pytest.mark.django_db
def test_reorchestrate_skips_when_prete(commande_with_lines, mocker):
    """P16-BE-03: Once an order is PRETE, re-running orchestration must be a no-op."""
    from apps.commandes.models import Commande
    commande, line_short, line_long = commande_with_lines
    commande.statut = Commande.Statut.PRETE
    commande.save(update_fields=['statut', 'updated_at'])

    apply_async_mock = mocker.patch(
        'apps.commandes.tasks.launch_item_task.apply_async'
    )

    KdsOrchestrator.reorchestrate_order(commande)

    apply_async_mock.assert_not_called()
