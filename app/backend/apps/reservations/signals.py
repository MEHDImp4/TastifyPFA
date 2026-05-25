from django.db import transaction
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from core.realtime import broadcast_staff_event
from core.notifications import send_reservation_confirmation_email
from apps.reservations.models import Reservation
from apps.reservations.serializers import ReservationSerializer


@receiver(post_save, sender=Reservation)
def broadcast_reservation_save(sender, instance, created, **kwargs):
    event_type = 'reservation_created' if created else 'reservation_updated'
    
    def _broadcast():
        serializer = ReservationSerializer(instance)
        broadcast_staff_event(event_type, serializer.data)
        if created:
            send_reservation_confirmation_email(reservation=instance)

    transaction.on_commit(_broadcast)


@receiver(pre_delete, sender=Reservation)
def broadcast_reservation_delete(sender, instance, **kwargs):
    reservation_id = instance.id
    def _broadcast():
        broadcast_staff_event('reservation_deleted', {'id': reservation_id})

    transaction.on_commit(_broadcast)
