import datetime

from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reservations.models import Reservation
from apps.reservations.permissions import IsStaffOrOwnReservation, STAFF_ROLES
from apps.reservations.serializers import ReservationSerializer
from apps.reservations.services import is_table_available
from apps.tables.models import Table
from apps.tables.serializers import TableSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsStaffOrOwnReservation]

    def get_queryset(self):
        user = self.request.user
        base_qs = Reservation.objects.select_related('client', 'table')
        if user.role in STAFF_ROLES:
            return base_qs.all()
        return base_qs.filter(client=user)

    @action(detail=False, methods=['get'], url_path='available_tables')
    def available_tables(self, request):
        date_str = request.query_params.get('date')
        heure_debut_str = request.query_params.get('heure_debut')
        heure_fin_str = request.query_params.get('heure_fin')
        nombre_personnes_str = request.query_params.get('nombre_personnes', '1')

        try:
            date_reservation = datetime.date.fromisoformat(date_str)
            heure_debut = datetime.time.fromisoformat(heure_debut_str)
            heure_fin = datetime.time.fromisoformat(heure_fin_str)
            nombre_personnes = int(nombre_personnes_str)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Parametres date/heure invalides ou manquants.'},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        tables = Table.objects.active().filter(capacite__gte=nombre_personnes)
        available_tables = [
            table for table in tables
            if is_table_available(
                table_id=table.pk,
                date_reservation=date_reservation,
                heure_debut=heure_debut,
                heure_fin=heure_fin,
            )
        ]

        return Response(TableSerializer(available_tables, many=True).data)
