import pytest
from datetime import timedelta
from django.utils import timezone


@pytest.mark.django_db
def test_jit_calculation(commande_with_lines):
    """REQ-15.1: TargetReadyTime = now + max(prep_time); each line's heure_lancement
    rolls back from TargetReadyTime by its own prep_time."""
    commande, line_short, line_long = commande_with_lines
    pytest.fail("Wave 0 stub — KdsOrchestrator.reorchestrate_order pending in Plan 02")


@pytest.mark.django_db
def test_task_revocation(commande_with_lines, mocker):
    """REQ-15.2: Re-orchestrating an order with existing celery_task_id revokes the old task
    before scheduling a new one."""
    commande, line_short, line_long = commande_with_lines
    pytest.fail("Wave 0 stub — KdsOrchestrator revocation pending in Plan 02")


@pytest.mark.django_db
def test_ws_broadcast(commande_with_lines, mocker):
    """REQ-15.3: launch_item_task broadcasts 'line_launched' event with line payload."""
    commande, line_short, _ = commande_with_lines
    pytest.fail("Wave 0 stub — launch_item_task pending in Plan 03")
