import datetime

import pytest
from django.core.exceptions import ValidationError

from apps.tables.models import Table
from apps.users.models import Utilisateur


@pytest.mark.django_db
class TestReservationServices:
    @pytest.fixture
    def client_user(self):
        return Utilisateur.objects.create_user(
            username="reservation-service-client",
            password="password123",
            role=Utilisateur.Role.CLIENT,
        )

    @pytest.fixture
    def other_client(self):
        return Utilisateur.objects.create_user(
            username="reservation-service-client-2",
            password="password123",
            role=Utilisateur.Role.CLIENT,
        )

    @pytest.fixture
    def table(self):
        return Table.objects.create(numero=92, capacite=4)

    def test_is_table_available_false_for_blocked_slot(self, client_user, table):
        from apps.reservations.services import create_reservation, is_table_available

        create_reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
        )

        assert is_table_available(
            table_id=table.id,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(20, 10),
            heure_fin=datetime.time(21, 0),
        ) is False

    def test_is_table_available_true_for_free_slot(self, client_user, table):
        from apps.reservations.services import create_reservation, is_table_available

        create_reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
        )

        assert is_table_available(
            table_id=table.id,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(20, 15),
            heure_fin=datetime.time(21, 0),
        ) is True

    def test_update_reservation_excludes_current_instance_from_overlap_check(
        self,
        client_user,
        table,
    ):
        from apps.reservations.services import create_reservation, update_reservation

        reservation = create_reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
        )

        updated = update_reservation(
            reservation,
            notes="Updated without moving the slot",
            nombre_personnes=3,
        )

        assert updated.notes == "Updated without moving the slot"
        assert updated.nombre_personnes == 3

    def test_create_reservation_prevents_double_booking_and_keeps_single_active_row(
        self,
        mocker,
        client_user,
        other_client,
        table,
    ):
        from apps.reservations.models import Reservation
        from apps.reservations.services import create_reservation

        lock_get = mocker.spy(Table.objects, "select_for_update")

        create_reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
        )

        with pytest.raises(ValidationError):
            create_reservation(
                client=other_client,
                table=table,
                date_reservation=datetime.date(2026, 5, 6),
                heure_debut=datetime.time(19, 30),
                heure_fin=datetime.time(20, 30),
                nombre_personnes=2,
            )

        assert lock_get.call_count == 2
        assert Reservation.objects.active().count() == 1
