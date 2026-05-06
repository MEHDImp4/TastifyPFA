from rest_framework import viewsets

from apps.reservations.models import Reservation
from apps.reservations.permissions import IsStaffOrOwnReservation, STAFF_ROLES
from apps.reservations.serializers import ReservationSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsStaffOrOwnReservation]

    def get_queryset(self):
        user = self.request.user
        base_qs = Reservation.objects.select_related('client', 'table')
        if user.role in STAFF_ROLES:
            return base_qs.all()
        return base_qs.filter(client=user)
