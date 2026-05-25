import datetime

from django.db import models
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

        date_reservation = self.request.query_params.get('date_reservation')
        if date_reservation:
            base_qs = base_qs.filter(date_reservation=date_reservation)
            
        statut = self.request.query_params.get('statut')
        if statut:
            base_qs = base_qs.filter(statut=statut)
            
        search = self.request.query_params.get('search')
        if search:
            base_qs = base_qs.filter(
                models.Q(client__username__icontains=search) |
                models.Q(client__first_name__icontains=search) |
                models.Q(client__last_name__icontains=search)
            )

        if user.role in STAFF_ROLES:
            return base_qs
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

        tables = list(Table.objects.active().filter(capacite__gte=nombre_personnes))
        availability_by_id = {
            table.pk: is_table_available(
                table_id=table.pk,
                date_reservation=date_reservation,
                heure_debut=heure_debut,
                heure_fin=heure_fin,
            )
            for table in tables
        }
        serialized_tables = TableSerializer(tables, many=True).data

        for table_data in serialized_tables:
            est_disponible = availability_by_id[table_data['id']]
            table_data['est_disponible'] = est_disponible
            if not est_disponible:
                table_data['statut'] = Table.Statut.RESERVEE
                table_data['statut_effectif'] = Table.Statut.RESERVEE

        return Response(serialized_tables)

    @action(detail=True, methods=['patch'], url_path='confirmer')
    def confirmer(self, request, pk=None):
        reservation = self.get_object()
        serializer = self.get_serializer(
            reservation,
            data={'statut': Reservation.Statut.CONFIRMEE},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='annuler')
    def annuler(self, request, pk=None):
        reservation = self.get_object()
        serializer = self.get_serializer(
            reservation,
            data={'statut': Reservation.Statut.ANNULEE},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
