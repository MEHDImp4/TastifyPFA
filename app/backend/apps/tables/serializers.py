import datetime

from rest_framework import serializers
from .models import Table, PlanText


def _compute_statut_effectif(table):
    """
    Derives reservation-aware table status at read time (T-23-06).

    A table is treated as RESERVEE when it has an active reservation whose
    buffered window (heure_fin + RESERVATION_CLEANUP_BUFFER) overlaps with now.
    The stored Table.statut is never mutated; this is a pure derived field.

    Reads from the prefetch attribute _today_reservations when available (WR-03)
    to avoid N+1 queries on the list endpoint. Falls back to a DB query only
    when the attribute is absent (e.g., retrieve endpoint without prefetch).

    Compares full datetime objects to handle midnight-straddling windows
    correctly (e.g., heure_fin=23:55 + 15 min buffer = 00:10 next day) — CR-02.
    """
    from apps.reservations.constants import RESERVATION_CLEANUP_BUFFER
    from apps.reservations.models import Reservation

    now = datetime.datetime.now()
    today = now.date()

    if hasattr(table, '_today_reservations'):
        active_today = table._today_reservations
    else:
        active_today = (
            Reservation.objects.active()
            .filter(table_id=table.pk, date_reservation=today)
        )

    for reservation in active_today:
        start_dt = datetime.datetime.combine(today, reservation.heure_debut)
        end_dt = (
            datetime.datetime.combine(today, reservation.heure_fin)
            + RESERVATION_CLEANUP_BUFFER
        )
        if start_dt <= now < end_dt:
            return Table.Statut.RESERVEE

    return table.statut


def _compute_prochaine_reservation(table):
    from apps.reservations.constants import RESERVATION_CLEANUP_BUFFER
    from apps.reservations.models import Reservation

    now = datetime.datetime.now()
    today = now.date()

    if hasattr(table, '_today_reservations'):
        active_today = table._today_reservations
    else:
        active_today = (
            Reservation.objects.active()
            .filter(table_id=table.pk, date_reservation=today)
        )

    active_today = sorted(active_today, key=lambda r: r.heure_debut)

    current = None
    upcoming = None

    for reservation in active_today:
        start_dt = datetime.datetime.combine(today, reservation.heure_debut)
        end_dt = (
            datetime.datetime.combine(today, reservation.heure_fin)
            + RESERVATION_CLEANUP_BUFFER
        )
        if start_dt <= now < end_dt:
            current = reservation
            break
        elif start_dt > now and not upcoming:
            upcoming = reservation
            
    res = current or upcoming
    if not res:
        return None
        
    client_name = f"{res.client.first_name} {res.client.last_name}".strip() or res.client.username
    return {
        'id': res.id,
        'heure_debut': res.heure_debut.strftime('%H:%M'),
        'heure_fin': res.heure_fin.strftime('%H:%M'),
        'client_name': client_name,
        'statut': res.statut,
        'nombre_personnes': res.nombre_personnes,
        'is_current': bool(current)
    }


class TableSerializer(serializers.ModelSerializer):

    est_active = serializers.BooleanField(default=True)
    statut_effectif = serializers.SerializerMethodField(read_only=True)
    prochaine_reservation = serializers.SerializerMethodField(read_only=True)
    has_payable_order = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Table
        fields = [
            'id',
            'numero',
            'capacite',
            'statut',
            'statut_effectif',
            'prochaine_reservation',
            'has_payable_order',
            'pos_x',
            'pos_y',
            'est_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'statut_effectif', 'prochaine_reservation', 'created_at', 'updated_at']

    def get_statut_effectif(self, obj):
        return _compute_statut_effectif(obj)

    def get_prochaine_reservation(self, obj):
        return _compute_prochaine_reservation(obj)

    def get_has_payable_order(self, obj):
        from apps.paiements.constants import PAYABLE_COMMANDE_STATUSES

        return obj.commandes.filter(
            est_active=True,
            statut__in=PAYABLE_COMMANDE_STATUSES,
        ).exists()

class PlanTextSerializer(serializers.ModelSerializer):
    est_active = serializers.BooleanField(default=True)

    class Meta:
        model = PlanText
        fields = [
            'id',
            'texte',
            'pos_x',
            'pos_y',
            'est_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
