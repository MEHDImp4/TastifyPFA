import datetime

from rest_framework import serializers
from .models import Table


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


class TableSerializer(serializers.ModelSerializer):

    est_active = serializers.BooleanField(default=True)
    statut_effectif = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Table
        fields = [
            'id',
            'numero',
            'capacite',
            'statut',
            'statut_effectif',
            'pos_x',
            'pos_y',
            'est_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'statut_effectif', 'created_at', 'updated_at']

    def get_statut_effectif(self, obj):
        return _compute_statut_effectif(obj)
