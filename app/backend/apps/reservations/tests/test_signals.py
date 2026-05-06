import datetime
import pytest
from unittest.mock import patch
from django.db import transaction

from apps.reservations.models import Reservation
from apps.tables.models import Table
from apps.users.models import Utilisateur

@pytest.fixture
def client_user(db):
    return Utilisateur.objects.create_user(
        username="signal-client",
        password="password123",
        role=Utilisateur.Role.CLIENT,
    )

@pytest.fixture
def table(db):
    return Table.objects.create(numero=90, capacite=4)

@pytest.mark.django_db(transaction=True)
@patch('apps.reservations.signals.broadcast_staff_event')
def test_reservation_create_broadcasts_event(mock_broadcast, client_user, table):
    with transaction.atomic():
        Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2030, 6, 1),
            heure_debut=datetime.time(18, 0),
            heure_fin=datetime.time(19, 0),
            nombre_personnes=2,
            statut=Reservation.Statut.CONFIRMEE,
        )
    
    assert mock_broadcast.called
    args, _ = mock_broadcast.call_args
    assert args[0] == 'reservation_created'
    assert 'client_details' in args[1]
    assert 'table_details' in args[1]

@pytest.mark.django_db(transaction=True)
@patch('apps.reservations.signals.broadcast_staff_event')
def test_reservation_update_broadcasts_event(mock_broadcast, client_user, table):
    reservation = Reservation.objects.create(
        client=client_user,
        table=table,
        date_reservation=datetime.date(2030, 6, 1),
        heure_debut=datetime.time(18, 0),
        heure_fin=datetime.time(19, 0),
        nombre_personnes=2,
        statut=Reservation.Statut.CONFIRMEE,
    )
    
    mock_broadcast.reset_mock()

    with transaction.atomic():
        reservation.statut = Reservation.Statut.ANNULEE
        reservation.save()
    
    assert mock_broadcast.called
    args, _ = mock_broadcast.call_args
    assert args[0] == 'reservation_updated'
    assert args[1]['statut'] == Reservation.Statut.ANNULEE

@pytest.mark.django_db(transaction=True)
@patch('apps.reservations.signals.broadcast_staff_event')
def test_reservation_delete_broadcasts_event(mock_broadcast, client_user, table):
    reservation = Reservation.objects.create(
        client=client_user,
        table=table,
        date_reservation=datetime.date(2030, 6, 1),
        heure_debut=datetime.time(18, 0),
        heure_fin=datetime.time(19, 0),
        nombre_personnes=2,
        statut=Reservation.Statut.CONFIRMEE,
    )
    
    mock_broadcast.reset_mock()

    with transaction.atomic():
        reservation_id = reservation.id
        reservation.delete()
    
    assert mock_broadcast.called
    args, _ = mock_broadcast.call_args
    assert args[0] == 'reservation_deleted'
    assert args[1]['id'] == reservation_id
