import datetime

import pytest
from django.apps import apps
from django.core.exceptions import ValidationError

from apps.tables.models import Table
from apps.users.models import Utilisateur


@pytest.mark.django_db
class TestReservationModel:
    @pytest.fixture
    def client_user(self):
        return Utilisateur.objects.create_user(
            username="reservation-client",
            password="password123",
            role=Utilisateur.Role.CLIENT,
        )

    @pytest.fixture
    def table(self):
        return Table.objects.create(numero=91, capacite=4)

    def test_app_is_installed(self):
        app_config = apps.get_app_config("reservations")

        assert app_config.name == "apps.reservations"

    def test_clean_rejects_invalid_time_window(self, client_user, table):
        from apps.reservations.models import Reservation

        reservation = Reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(20, 0),
            heure_fin=datetime.time(19, 30),
            nombre_personnes=2,
        )

        with pytest.raises(ValidationError) as exc:
            reservation.full_clean()

        assert "heure_fin" in exc.value.message_dict

    def test_clean_rejects_party_size_above_capacity(self, client_user, table):
        from apps.reservations.models import Reservation

        reservation = Reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(20, 0),
            heure_fin=datetime.time(21, 0),
            nombre_personnes=5,
        )

        with pytest.raises(ValidationError) as exc:
            reservation.full_clean()

        assert "nombre_personnes" in exc.value.message_dict

    def test_active_overlap_checks_ignore_cancelled_and_absent(self, client_user, table):
        from apps.reservations.models import Reservation

        cancelled = Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
            statut=Reservation.Statut.ANNULEE,
        )
        absent = Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(20, 15),
            heure_fin=datetime.time(21, 15),
            nombre_personnes=2,
            statut=Reservation.Statut.ABSENTE,
        )

        active_ids = list(Reservation.objects.active().values_list("id", flat=True))

        assert cancelled.id not in active_ids
        assert absent.id not in active_ids

    def test_clean_rejects_direct_overlap_with_active_reservation(self, client_user, table):
        from apps.reservations.models import Reservation

        Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
        )
        reservation = Reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 30),
            heure_fin=datetime.time(20, 30),
            nombre_personnes=2,
        )

        with pytest.raises(ValidationError) as exc:
            reservation.full_clean()

        assert "__all__" in exc.value.message_dict

    def test_clean_rejects_start_inside_cleanup_buffer_boundary(self, client_user, table):
        from apps.reservations.models import Reservation

        Reservation.objects.create(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 0),
            nombre_personnes=2,
        )
        reservation = Reservation(
            client=client_user,
            table=table,
            date_reservation=datetime.date(2026, 5, 6),
            heure_debut=datetime.time(20, 14),
            heure_fin=datetime.time(21, 0),
            nombre_personnes=2,
        )

        with pytest.raises(ValidationError) as exc:
            reservation.full_clean()

        assert "__all__" in exc.value.message_dict
