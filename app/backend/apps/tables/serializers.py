import datetime

from rest_framework import serializers
from .models import Table


def _compute_statut_effectif(table):
    """
    Derives reservation-aware table status at read time (T-23-06).

    A table is treated as RESERVEE when it has an active reservation whose
    buffered window (heure_fin + 15 min cleanup) overlaps with now.
    The stored Table.statut is never mutated; this is a pure derived field.
    """
    from apps.reservations.constants import RESERVATION_CLEANUP_BUFFER
    from apps.reservations.models import Reservation

    now = datetime.datetime.now()
    today = now.date()
    current_time = now.time()

    active_today = (
        Reservation.objects.active()
        .filter(table_id=table.pk, date_reservation=today)
    )

    for reservation in active_today:
        buffered_end = (
            datetime.datetime.combine(today, reservation.heure_fin)
            + RESERVATION_CLEANUP_BUFFER
        ).time()
        if reservation.heure_debut <= current_time < buffered_end:
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
