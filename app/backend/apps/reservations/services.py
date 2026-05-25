from django.db import transaction

from apps.reservations.constants import RESERVATION_CLEANUP_BUFFER
from apps.reservations.models import Reservation
from apps.tables.models import Table


def get_cleanup_buffer():
    return RESERVATION_CLEANUP_BUFFER


def get_table_day_reservations(*, table_id, date_reservation, exclude_reservation_id=None):
    queryset = Reservation.objects.active().for_table_day(
        table_id=table_id,
        date_reservation=date_reservation,
    )
    if exclude_reservation_id is not None:
        queryset = queryset.exclude(pk=exclude_reservation_id)
    return queryset


# Ce fichier contient la logique "métier" des réservations (Services)

# Vérifie si une table est libre sur un créneau horaire précis
def is_table_available(
    *,
    table_id,
    date_reservation,
    heure_debut,
    heure_fin,
    exclude_reservation_id=None,
):
    # On crée une "fausse" réservation pour tester si elle entre en conflit avec les vraies
    probe = Reservation(
        table_id=table_id,
        date_reservation=date_reservation,
        heure_debut=heure_debut,
        heure_fin=heure_fin,
        nombre_personnes=1,
    )
    if exclude_reservation_id is not None:
        probe.pk = exclude_reservation_id
    
    # has_active_conflict() est une méthode interne qui compare les heures
    return not probe.has_active_conflict()


# Crée une nouvelle réservation en s'assurant que personne d'autre ne prend la table en même temps
def create_reservation(
    *,
    client,
    table,
    date_reservation,
    heure_debut,
    heure_fin,
    nombre_personnes,
    statut=Reservation.Statut.CONFIRMEE,
    notes='',
):
    # transaction.atomic() : "Tout ou rien". Si une erreur arrive au milieu, 
    # la base de données revient à l'état initial.
    with transaction.atomic():
        # select_for_update() : On "verrouille" la ligne de la table dans la base.
        # Personne d'autre ne peut modifier CETTE table tant qu'on n'a pas fini (on évite les doublons).
        locked_table = Table.objects.select_for_update().get(pk=table.pk)
        
        reservation = Reservation(
            client=client,
            table=locked_table,
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
    with transaction.atomic():
        old_table_pk = reservation.table_id
        new_table_pk = changes['table'].pk if 'table' in changes else old_table_pk

        # Lock both table rows in ascending PK order to prevent deadlock inversion
        # when two concurrent transactions swap tables in opposite directions (CR-03).
        pks_to_lock = sorted({old_table_pk, new_table_pk})
        list(Table.objects.select_for_update().filter(pk__in=pks_to_lock))

        locked_reservation = Reservation.objects.select_for_update().get(pk=reservation.pk)
        for field, value in changes.items():
            setattr(locked_reservation, field, value)
        locked_reservation.save()
        return locked_reservation

