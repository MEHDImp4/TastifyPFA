import datetime
import threading

import pytest
from django.db import connection
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.reservations.models import Reservation
from apps.tables.models import Table
from apps.users.models import Utilisateur


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def client_user(db):
    return Utilisateur.objects.create_user(
        username="api-client-user",
        password="password123",
        role=Utilisateur.Role.CLIENT,
    )


@pytest.fixture
def other_client(db):
    return Utilisateur.objects.create_user(
        username="api-other-client",
        password="password123",
        role=Utilisateur.Role.CLIENT,
    )


@pytest.fixture
def gerant_user(db):
    return Utilisateur.objects.create_user(
        username="api-gerant-user",
        password="password123",
        role=Utilisateur.Role.GERANT,
    )


@pytest.fixture
def serveur_user(db):
    return Utilisateur.objects.create_user(
        username="api-serveur-user",
        password="password123",
        role=Utilisateur.Role.SERVEUR,
    )


@pytest.fixture
def table(db):
    return Table.objects.create(numero=80, capacite=4)


@pytest.fixture
def another_table(db):
    return Table.objects.create(numero=81, capacite=6)


def make_reservation(client_user, table, **kwargs):
    defaults = dict(
        date_reservation=datetime.date(2030, 6, 1),
        heure_debut=datetime.time(18, 0),
        heure_fin=datetime.time(19, 0),
        nombre_personnes=2,
        statut=Reservation.Statut.CONFIRMEE,
    )
    defaults.update(kwargs)
    return Reservation.objects.create(client=client_user, table=table, **defaults)


@pytest.mark.django_db
class TestReservationOwnershipScoping:
    def test_client_sees_only_own_reservations(self, api_client, client_user, other_client, table):
        own = make_reservation(client_user, table)
        other = make_reservation(
            other_client, table,
            heure_debut=datetime.time(20, 0),
            heure_fin=datetime.time(21, 0),
        )

        api_client.force_authenticate(user=client_user)
        response = api_client.get(reverse("reservation-list"))

        assert response.status_code == status.HTTP_200_OK
        ids = [r["id"] for r in response.data]
        assert own.id in ids
        assert other.id not in ids

    def test_client_retrieve_own_reservation(self, api_client, client_user, table):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=client_user)

        response = api_client.get(reverse("reservation-detail", args=[reservation.id]))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == reservation.id

    def test_client_cannot_retrieve_other_clients_reservation(
        self, api_client, client_user, other_client, table
    ):
        other_reservation = make_reservation(
            other_client, table,
            heure_debut=datetime.time(20, 0),
            heure_fin=datetime.time(21, 0),
        )
        api_client.force_authenticate(user=client_user)

        response = api_client.get(reverse("reservation-detail", args=[other_reservation.id]))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_response_payload_includes_enriched_details(
        self, api_client, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=client_user)

        response = api_client.get(reverse("reservation-detail", args=[reservation.id]))

        assert response.status_code == status.HTTP_200_OK
        assert "client_details" in response.data
        assert response.data["client_details"]["id"] == client_user.id
        assert response.data["client_details"]["username"] == client_user.username
        assert "table_details" in response.data
        assert response.data["table_details"]["id"] == table.id
        assert response.data["table_details"]["numero"] == table.numero
        assert response.data["table_details"]["capacite"] == table.capacite


@pytest.mark.django_db
class TestStaffVisibility:
    def test_gerant_sees_all_reservations(
        self, api_client, gerant_user, client_user, other_client, table
    ):
        r1 = make_reservation(client_user, table)
        r2 = make_reservation(
            other_client, table,
            heure_debut=datetime.time(20, 0),
            heure_fin=datetime.time(21, 0),
        )
        api_client.force_authenticate(user=gerant_user)

        response = api_client.get(reverse("reservation-list"))

        assert response.status_code == status.HTTP_200_OK
        ids = [r["id"] for r in response.data]
        assert r1.id in ids
        assert r2.id in ids

    def test_serveur_sees_all_reservations(
        self, api_client, serveur_user, client_user, other_client, table
    ):
        r1 = make_reservation(client_user, table)
        r2 = make_reservation(
            other_client, table,
            heure_debut=datetime.time(20, 0),
            heure_fin=datetime.time(21, 0),
        )
        api_client.force_authenticate(user=serveur_user)

        response = api_client.get(reverse("reservation-list"))

        assert response.status_code == status.HTTP_200_OK
        ids = [r["id"] for r in response.data]
        assert r1.id in ids
        assert r2.id in ids

    def test_staff_can_update_any_reservation(
        self, api_client, gerant_user, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=gerant_user)

        response = api_client.patch(
            reverse("reservation-detail", args=[reservation.id]),
            {"statut": Reservation.Statut.PRESENTE},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        reservation.refresh_from_db()
        assert reservation.statut == Reservation.Statut.PRESENTE


@pytest.mark.django_db
class TestClientCreate:
    def test_client_create_binds_to_request_user(
        self, api_client, client_user, other_client, table
    ):
        api_client.force_authenticate(user=client_user)

        response = api_client.post(
            reverse("reservation-list"),
            {
                "table": table.id,
                "client": other_client.id,
                "date_reservation": "2030-07-01",
                "heure_debut": "10:00",
                "heure_fin": "11:00",
                "nombre_personnes": 2,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        reservation = Reservation.objects.get(id=response.data["id"])
        assert reservation.client_id == client_user.id

    def test_unauthenticated_create_rejected(self, api_client, table):
        response = api_client.post(
            reverse("reservation-list"),
            {
                "table": table.id,
                "date_reservation": "2030-07-01",
                "heure_debut": "10:00",
                "heure_fin": "11:00",
                "nombre_personnes": 2,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestClientStatusTransition:
    def test_client_can_cancel_own_reservation(
        self, api_client, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=client_user)

        response = api_client.patch(
            reverse("reservation-detail", args=[reservation.id]),
            {"statut": Reservation.Statut.ANNULEE},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        reservation.refresh_from_db()
        assert reservation.statut == Reservation.Statut.ANNULEE

    def test_client_cannot_set_presente(
        self, api_client, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=client_user)

        response = api_client.patch(
            reverse("reservation-detail", args=[reservation.id]),
            {"statut": Reservation.Statut.PRESENTE},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_client_cannot_set_absente(
        self, api_client, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=client_user)

        response = api_client.patch(
            reverse("reservation-detail", args=[reservation.id]),
            {"statut": Reservation.Statut.ABSENTE},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_staff_can_set_any_status(
        self, api_client, gerant_user, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=gerant_user)

        for statut in [
            Reservation.Statut.PRESENTE,
            Reservation.Statut.ABSENTE,
            Reservation.Statut.CONFIRMEE,
        ]:
            response = api_client.patch(
                reverse("reservation-detail", args=[reservation.id]),
                {"statut": statut},
                format="json",
            )
            assert response.status_code == status.HTTP_200_OK

    def test_staff_can_cancel_via_dedicated_route(
        self, api_client, gerant_user, client_user, table
    ):
        reservation = make_reservation(client_user, table)
        api_client.force_authenticate(user=gerant_user)

        response = api_client.patch(
            reverse("reservation-annuler", args=[reservation.id]),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        reservation.refresh_from_db()
        assert reservation.statut == Reservation.Statut.ANNULEE

    def test_staff_can_confirm_via_dedicated_route(
        self, api_client, gerant_user, client_user, table
    ):
        reservation = make_reservation(
            client_user,
            table,
            statut=Reservation.Statut.ABSENTE,
        )
        api_client.force_authenticate(user=gerant_user)

        response = api_client.patch(
            reverse("reservation-confirmer", args=[reservation.id]),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        reservation.refresh_from_db()
        assert reservation.statut == Reservation.Statut.CONFIRMEE


@pytest.mark.django_db
class TestOverlapEnforcement:
    def test_overlap_returns_400(self, api_client, client_user, table):
        make_reservation(
            client_user, table,
            date_reservation=datetime.date(2030, 8, 1),
            heure_debut=datetime.time(14, 0),
            heure_fin=datetime.time(15, 0),
        )
        api_client.force_authenticate(user=client_user)

        response = api_client.post(
            reverse("reservation-list"),
            {
                "table": table.id,
                "date_reservation": "2030-08-01",
                "heure_debut": "14:30",
                "heure_fin": "15:30",
                "nombre_personnes": 2,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_inactive_reservations_do_not_block_new_booking(
        self, api_client, client_user, table
    ):
        make_reservation(
            client_user, table,
            date_reservation=datetime.date(2030, 8, 15),
            heure_debut=datetime.time(14, 0),
            heure_fin=datetime.time(15, 0),
            statut=Reservation.Statut.ANNULEE,
        )
        api_client.force_authenticate(user=client_user)

        response = api_client.post(
            reverse("reservation-list"),
            {
                "table": table.id,
                "date_reservation": "2030-08-15",
                "heure_debut": "14:30",
                "heure_fin": "15:30",
                "nombre_personnes": 2,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db(transaction=True)
class TestConcurrentCreateConflict:
    def test_concurrent_conflicting_creates_result_in_exactly_one_success(
        self, client_user, other_client
    ):
        if connection.vendor == "sqlite":
            pytest.skip("Concurrent reservation conflict coverage requires a database with row-level locking.")

        table = Table.objects.create(numero=85, capacite=4)
        results = []
        errors = []

        def attempt_create(user, idx):
            c = APIClient()
            c.force_authenticate(user=user)
            try:
                resp = c.post(
                    reverse("reservation-list"),
                    {
                        "table": table.id,
                        "date_reservation": "2030-09-01",
                        "heure_debut": "19:00",
                        "heure_fin": "20:00",
                        "nombre_personnes": 2,
                    },
                    format="json",
                )
                results.append(resp.status_code)
            except Exception as exc:
                errors.append(str(exc))

        t1 = threading.Thread(target=attempt_create, args=(client_user, 1))
        t2 = threading.Thread(target=attempt_create, args=(other_client, 2))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        assert not errors, f"Unexpected errors: {errors}"
        success_count = results.count(status.HTTP_201_CREATED)
        failure_count = results.count(status.HTTP_400_BAD_REQUEST)
        assert success_count == 1
        assert failure_count == 1
        assert Reservation.objects.active().filter(
            table=table,
            date_reservation=datetime.date(2030, 9, 1),
        ).count() == 1


@pytest.mark.django_db
class TestTableDerivedStatus:
    def test_table_with_active_reservation_exposes_derived_reserved_status(
        self, api_client, gerant_user, client_user, table
    ):
        today = datetime.date.today()

        make_reservation(
            client_user, table,
            date_reservation=today,
            heure_debut=datetime.time(0, 0),
            heure_fin=datetime.time(23, 59),
        )
        api_client.force_authenticate(user=gerant_user)

        response = api_client.get(reverse("table-detail", args=[table.id]))

        assert response.status_code == status.HTTP_200_OK
        assert "statut_effectif" in response.data
        assert response.data["statut_effectif"] == Table.Statut.RESERVEE

    def test_stored_table_statut_unchanged_by_reservation(
        self, api_client, gerant_user, client_user, table
    ):
        today = datetime.date.today()
        start = datetime.time(12, 0)
        end = datetime.time(13, 0)

        make_reservation(
            client_user, table,
            date_reservation=today,
            heure_debut=start,
            heure_fin=end,
        )
        table.refresh_from_db()
        assert table.statut == Table.Statut.LIBRE

    def test_table_without_active_reservation_shows_stored_statut(
        self, api_client, gerant_user, table
    ):
        api_client.force_authenticate(user=gerant_user)

        response = api_client.get(reverse("table-detail", args=[table.id]))

        assert response.status_code == status.HTTP_200_OK
        assert "statut_effectif" in response.data
        assert response.data["statut_effectif"] == table.statut
