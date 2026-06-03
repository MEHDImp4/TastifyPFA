from django.db import transaction

from apps.reservations.constants import RESERVATION_CLEANUP_BUFFER
from apps.reservations.models import Reservation
from apps.tables.models import Table


def get_cleanup_buffer():
    return RESERVATION_CLEANUP_BUFFER


def get_table_day_reservations(table_id, date_reservation, exclude_reservation_id=None):
    reservations = Reservation.objects.active().for_table_day(
        table_id=table_id,
        date_reservation=date_reservation,
    )

    if exclude_reservation_id is not None:
        reservations = reservations.exclude(pk=exclude_reservation_id)

    return reservations


def is_table_available(
    table_id,
    date_reservation,
    heure_debut,
    heure_fin,
    exclude_reservation_id=None,
):
    """
    Vérifie si une table est disponible.
    On crée une réservation temporaire en mémoire, puis on réutilise la validation du modèle.
    """
    reservation_test = Reservation(
        table_id=table_id,
        date_reservation=date_reservation,
        heure_debut=heure_debut,
        heure_fin=heure_fin,
        nombre_personnes=1,
    )

    if exclude_reservation_id is not None:
        reservation_test.pk = exclude_reservation_id

    return not reservation_test.has_active_conflict()


def create_reservation(
    client,
    table,
    date_reservation,
    heure_debut,
    heure_fin,
    nombre_personnes,
    statut=Reservation.Statut.CONFIRMEE,
    notes='',
):
    """
    Crée une réservation.
    Le verrou sur la table évite que deux clients prennent la même table au même moment.
    """
    with transaction.atomic():
        table_verrouillee = Table.objects.select_for_update().get(pk=table.pk)

        reservation = Reservation(
            client=client,
            table=table_verrouillee,
            date_reservation=date_reservation,
            heure_debut=heure_debut,
            heure_fin=heure_fin,
            nombre_personnes=nombre_personnes,
            statut=statut,
            notes=notes,
        )
        reservation.save()
        return reservation


def update_reservation(reservation, **changes):
    """Modifie une réservation existante en gardant la même protection contre les conflits."""
    with transaction.atomic():
        ancienne_table_id = reservation.table_id
        nouvelle_table_id = ancienne_table_id

        if 'table' in changes:
            nouvelle_table_id = changes['table'].pk

        table_ids = sorted({ancienne_table_id, nouvelle_table_id})
        list(Table.objects.select_for_update().filter(pk__in=table_ids))

        reservation_verrouillee = Reservation.objects.select_for_update().get(pk=reservation.pk)
        for champ, valeur in changes.items():
            setattr(reservation_verrouillee, champ, valeur)

        reservation_verrouillee.save()
        return reservation_verrouillee
