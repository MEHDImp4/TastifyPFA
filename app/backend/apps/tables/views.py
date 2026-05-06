import datetime

from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsGerant
from .models import Table
from .serializers import TableSerializer


def _today_reservations_prefetch():
    """Prefetch only today's active reservations to keep statut_effectif O(1) per table."""
    from apps.reservations.models import Reservation
    today = datetime.date.today()
    return Prefetch(
        'reservations',
        queryset=Reservation.objects.active().filter(date_reservation=today),
        to_attr='_today_reservations',
    )


class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        prefetch = _today_reservations_prefetch()
        if user.is_authenticated and user.role == 'GERANT':
            return Table.objects.all().prefetch_related(prefetch).order_by('numero')
        return Table.objects.active().prefetch_related(prefetch).order_by('numero')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
